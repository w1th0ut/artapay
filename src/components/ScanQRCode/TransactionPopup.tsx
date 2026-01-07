"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { Loader2, AlertTriangle } from "lucide-react";
import { useSmartAccount } from "@/hooks/useSmartAccount";
import { currencies, Currency } from "@/components/Currency";
import { CurrencyDropdown } from "@/components/Currency";
import {
  PAYMENT_PROCESSOR_ADDRESS,
  STABLE_SWAP_ADDRESS,
} from "@/config/constants";
import { createPublicClient, http, formatUnits } from "viem";
import { LISK_SEPOLIA } from "@/config/chains";
import {
  PAYMENT_PROCESSOR_ABI,
  ERC20_ABI,
  STABLE_SWAP_ABI,
} from "@/config/abi";

interface PaymentRequestPayload {
  version: string;
  processor: string;
  chainId: number;
  request: {
    recipient: string;
    requestedToken: string;
    requestedAmountRaw: string;
    deadline: number;
    nonce: string;
    merchantSigner: string;
  };
  signature: string;
}

interface TransactionPopupProps {
  payload: PaymentRequestPayload;
  onCancel: () => void;
}

interface PaymentQuote {
  baseAmount: bigint;
  platformFee: bigint;
  swapFee: bigint;
  totalRequired: bigint;
}

interface SwapPaymentQuote {
  amountIn: bigint;
  amountOut: bigint;
  fee: bigint;
  totalUserPays: bigint;
}

export default function TransactionPopup({
  payload,
  onCancel,
}: TransactionPopupProps) {
  const [payToken, setPayToken] = useState<Currency>(currencies[0]);
  const [quote, setQuote] = useState<PaymentQuote | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>("0");
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [swapQuote, setSwapQuote] = useState<SwapPaymentQuote | null>(null);
  const [isLoadingSwapQuote, setIsLoadingSwapQuote] = useState(false);

  const {
    smartAccountAddress,
    payInvoice,
    swapTokens,
    isLoading,
    isReady,
    status,
    error,
  } = useSmartAccount();

  const publicClient = useMemo(
    () =>
      createPublicClient({
        chain: LISK_SEPOLIA,
        transport: http(LISK_SEPOLIA.rpcUrls.default.http[0]),
      }),
    []
  );

  const processorAddress =
    payload.processor && payload.processor !== "0x0"
      ? (payload.processor as `0x${string}`)
      : (PAYMENT_PROCESSOR_ADDRESS as `0x${string}`);

  const isDifferentToken =
    payToken.tokenAddress.toLowerCase() !==
    payload.request.requestedToken.toLowerCase();

  // Find requested currency
  const requestedCurrency = currencies.find(
    (c) =>
      c.tokenAddress.toLowerCase() ===
      payload.request.requestedToken.toLowerCase()
  );

  const requestedAmount = requestedCurrency
    ? Number(
        formatUnits(
          BigInt(payload.request.requestedAmountRaw),
          requestedCurrency.decimals
        )
      )
    : 0;

  const requiredRequestedToken = quote
    ? quote.baseAmount + quote.platformFee
    : 0n;

  // Fetch payment quote when payToken changes
  useEffect(() => {
    const fetchQuote = async () => {
      setIsLoadingQuote(true);
      setQuoteError(null);

      try {
        const breakdown = (await publicClient.readContract({
          address: processorAddress,
          abi: PAYMENT_PROCESSOR_ABI,
          functionName: "calculatePaymentCost",
          args: [
            payload.request.requestedToken as `0x${string}`,
            BigInt(payload.request.requestedAmountRaw),
            payToken.tokenAddress as `0x${string}`,
          ],
        })) as any;

        setQuote({
          baseAmount: BigInt(breakdown.baseAmount || breakdown[0] || 0),
          platformFee: BigInt(breakdown.platformFee || breakdown[1] || 0),
          swapFee: BigInt(breakdown.swapFee || breakdown[2] || 0),
          totalRequired: BigInt(breakdown.totalRequired || breakdown[3] || 0),
        });
      } catch (err) {
        console.error("Quote error:", err);
        setQuoteError("Failed to calculate payment cost");
      } finally {
        setIsLoadingQuote(false);
      }
    };

    fetchQuote();
  }, [payToken, payload, publicClient, processorAddress]);

  useEffect(() => {
    if (!quote || !isDifferentToken) {
      setSwapQuote(null);
      setIsLoadingSwapQuote(false);
      return;
    }

    const fetchSwapQuote = async () => {
      setIsLoadingSwapQuote(true);
      try {
        let amountIn = quote.totalRequired - quote.swapFee;
        if (amountIn < 0n) amountIn = 0n;

        const getQuote = async (amount: bigint) => {
          const breakdown = (await publicClient.readContract({
            address: STABLE_SWAP_ADDRESS,
            abi: STABLE_SWAP_ABI,
            functionName: "getSwapQuote",
            args: [
              payToken.tokenAddress as `0x${string}`,
              payload.request.requestedToken as `0x${string}`,
              amount,
            ],
          })) as any;

          return {
            amountOut: BigInt(breakdown.amountOut || breakdown[0] || 0),
            fee: BigInt(breakdown.fee || breakdown[1] || 0),
            totalUserPays: BigInt(breakdown.totalUserPays || breakdown[2] || 0),
          };
        };

        let quoteResult = await getQuote(amountIn);

        if (
          requiredRequestedToken > 0n &&
          quoteResult.amountOut < requiredRequestedToken &&
          amountIn > 0n
        ) {
          const perUnitOut = quoteResult.amountOut / amountIn;
          const deficit = requiredRequestedToken - quoteResult.amountOut;
          const extraIn =
            perUnitOut > 0n
              ? (deficit + perUnitOut - 1n) / perUnitOut
              : 1n;
          amountIn = amountIn + (extraIn > 0n ? extraIn : 1n);
          quoteResult = await getQuote(amountIn);
        }

        setSwapQuote({
          amountIn,
          amountOut: quoteResult.amountOut,
          fee: quoteResult.fee,
          totalUserPays: quoteResult.totalUserPays,
        });
      } catch (err) {
        console.error("Swap quote error:", err);
        setSwapQuote(null);
      } finally {
        setIsLoadingSwapQuote(false);
      }
    };

    fetchSwapQuote();
  }, [
    quote,
    isDifferentToken,
    payToken,
    payload,
    publicClient,
    requiredRequestedToken,
  ]);

  // Fetch balance of payToken
  useEffect(() => {
    const fetchBalance = async () => {
      if (!smartAccountAddress) {
        setBalance("0");
        return;
      }

      setIsLoadingBalance(true);
      try {
        const rawBalance = await publicClient.readContract({
          address: payToken.tokenAddress as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "balanceOf",
          args: [smartAccountAddress],
        });
        setBalance(formatUnits(rawBalance as bigint, payToken.decimals));
      } catch (err) {
        console.error("Failed to fetch balance:", err);
        setBalance("0");
      } finally {
        setIsLoadingBalance(false);
      }
    };

    fetchBalance();
  }, [smartAccountAddress, payToken, publicClient]);

  // Check if balance is sufficient
  const numBalance = parseFloat(balance) || 0;
  const effectiveTotalRequired =
    isDifferentToken && swapQuote
      ? swapQuote.totalUserPays
      : quote?.totalRequired || 0n;
  const requiredAmount = quote
    ? Number(formatUnits(effectiveTotalRequired, payToken.decimals))
    : 0;
  const hasInsufficientBalance = !!quote && requiredAmount > numBalance;
  const hasNoBalance = numBalance === 0;

  const handleSend = async () => {
    if (!quote || !smartAccountAddress) return;

    try {
      const slippageBps = 100; // 1% slippage buffer
      const request = {
        recipient: payload.request.recipient as `0x${string}`,
        requestedToken: payload.request.requestedToken as `0x${string}`,
        requestedAmount: BigInt(payload.request.requestedAmountRaw),
        deadline: BigInt(payload.request.deadline),
        nonce: payload.request.nonce as `0x${string}`,
        merchantSigner: payload.request.merchantSigner as `0x${string}`,
      };

      if (isDifferentToken) {
        if (!swapQuote) {
          setQuoteError("Failed to prepare swap for payment");
          return;
        }

        await swapTokens({
          tokenIn: payToken.tokenAddress as `0x${string}`,
          tokenOut: payload.request.requestedToken as `0x${string}`,
          amount: formatUnits(swapQuote.amountIn, payToken.decimals),
          tokenInDecimals: payToken.decimals,
          stableSwapAddress: STABLE_SWAP_ADDRESS,
          minAmountOut: requiredRequestedToken,
          totalUserPays: swapQuote.totalUserPays,
        });

        const maxAmountToPay =
          (requiredRequestedToken * BigInt(10000 + slippageBps)) / 10000n;

        const txHash = await payInvoice({
          request,
          merchantSignature: payload.signature as `0x${string}`,
          payToken: payload.request.requestedToken as `0x${string}`,
          totalRequired: requiredRequestedToken,
          maxAmountToPay,
          paymentProcessorAddress: processorAddress,
        });

        alert(`Payment successful! TX: ${txHash}`);
        onCancel();
        return;
      }

      const maxAmountToPay =
        (quote.totalRequired * BigInt(10000 + slippageBps)) / 10000n;

      const txHash = await payInvoice({
        request,
        merchantSignature: payload.signature as `0x${string}`,
        payToken: payToken.tokenAddress as `0x${string}`,
        totalRequired: quote.totalRequired,
        maxAmountToPay,
        paymentProcessorAddress: processorAddress,
      });

      alert(`Payment successful! TX: ${txHash}`);
      onCancel();
    } catch (err) {
      console.error("Payment error:", err);
    }
  };

  const shortenAddress = (addr: string) => {
    if (addr.length <= 10) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatQuoteAmount = (value: bigint) => {
    return Number(formatUnits(value, payToken.decimals)).toLocaleString(
      undefined,
      {
        maximumFractionDigits: 6,
      }
    );
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-md bg-zinc-800 rounded-2xl p-6 border-2 border-primary">
        <h2 className="text-white text-xl font-bold text-center mb-6">
          Payment Details
        </h2>

        {/* Connection Warning - only show after isReady */}
        {isReady && !smartAccountAddress && (
          <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-500 rounded-lg text-yellow-400 text-sm text-center">
            Connect wallet to make payment
          </div>
        )}

        <div className="space-y-4">
          <div className="flex justify-between">
            <span className="text-zinc-400">Transaction</span>
            <span className="text-white font-medium">Send Payment</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Send to</span>
            <span className="text-white font-mono">
              {shortenAddress(payload.request.recipient)}
            </span>
          </div>

          {/* Pay With Currency Selector */}
          <div className="space-y-2">
            <span className="text-zinc-400">Pay with</span>
            <CurrencyDropdown value={payToken} onChange={setPayToken} />
          </div>

          <div className="flex justify-between items-center">
            <span className="text-zinc-400">Requested currency</span>
            <div className="flex items-center gap-2">
              {requestedCurrency && (
                <Image
                  src={requestedCurrency.icon}
                  alt=""
                  width={20}
                  height={20}
                />
              )}
              <span className="text-white">
                {requestedCurrency?.symbol || "Token"}
              </span>
            </div>
          </div>

          <div className="flex justify-between">
            <span className="text-zinc-400">Requested Amount</span>
            <span>
              <span className="text-primary font-bold">
                {requestedAmount.toLocaleString()}
              </span>
              <span className="text-white ml-1">
                {requestedCurrency?.symbol}
              </span>
            </span>
          </div>

          {/* Quote Info */}
          {isLoadingQuote || (isDifferentToken && isLoadingSwapQuote) ? (
            <div className="flex items-center justify-center gap-2 text-zinc-400 py-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Calculating...
            </div>
          ) : quote ? (
            <div className="border-t border-zinc-700 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Swap Fee</span>
                <span className="text-zinc-300">
                  {formatQuoteAmount(
                    isDifferentToken && swapQuote
                      ? swapQuote.fee
                      : quote.swapFee
                  )}{" "}
                  {payToken.symbol}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">You Pay</span>
                <span>
                  <span className="text-primary font-bold">
                    {formatQuoteAmount(effectiveTotalRequired)}
                  </span>
                  <span className="text-white ml-1">{payToken.symbol}</span>
                </span>
              </div>
            </div>
          ) : quoteError ? (
            <div className="p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-400 text-sm text-center">
              {quoteError}
            </div>
          ) : null}
        </div>

        {/* Status Message */}
        {isLoading && (
          <div className="mt-4 flex items-center justify-center gap-2 text-primary text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            {status}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {/* Insufficient Balance Warning */}
        {smartAccountAddress && hasInsufficientBalance && (
          <div className="mt-4 flex items-center gap-2 p-3 bg-orange-500/20 border border-orange-500 rounded-lg text-orange-400 text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              Insufficient {payToken.symbol} balance. You have{" "}
              {numBalance.toLocaleString(undefined, {
                maximumFractionDigits: 4,
              })}{" "}
              {payToken.symbol}
            </span>
          </div>
        )}

        {/* Balance Info */}
        {smartAccountAddress && !hasNoBalance && quote && (
          <div className="mt-2 text-xs text-zinc-400 text-right">
            Balance:{" "}
            {isLoadingBalance
              ? "..."
              : numBalance.toLocaleString(undefined, {
                  maximumFractionDigits: 4,
                })}{" "}
            {payToken.symbol}
          </div>
        )}

        <div className="flex flex-col gap-3 mt-6">
          <button
            onClick={handleSend}
            disabled={
              !smartAccountAddress ||
              !quote ||
              isLoading ||
              isLoadingQuote ||
              (isDifferentToken && (isLoadingSwapQuote || !swapQuote)) ||
              hasInsufficientBalance
            }
            className="w-full py-4 bg-primary text-black font-bold text-xl rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading
              ? "PROCESSING..."
              : hasInsufficientBalance
              ? "INSUFFICIENT BALANCE"
              : "PAY NOW"}
          </button>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="w-full py-4 border-2 border-accent text-accent font-bold text-xl rounded-xl hover:bg-accent/10 transition-colors disabled:opacity-50"
          >
            CANCEL
          </button>
        </div>
      </div>
    </div>
  );
}
