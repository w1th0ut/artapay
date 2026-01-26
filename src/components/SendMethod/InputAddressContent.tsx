"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { AlertTriangle, Plus, Trash2, ArrowRightLeft, Zap } from "lucide-react";
import { CurrencyDropdown, Currency, currencies } from "@/components/Currency";
import Modal from "@/components/Modal";
import { ReceiptPopUp, ReceiptData } from "@/components/ReceiptPopUp";
import { useSmartAccount } from "@/hooks/useSmartAccount";
import { BASE_SEPOLIA } from "@/config/chains";
import { env } from "@/config/env";
import { STABLE_SWAP_ADDRESS } from "@/config/constants";
import {
  createPublicClient,
  http,
  formatUnits,
  parseUnits,
  getAddress,
  isAddress,
  type Address,
} from "viem";
import { mainnet } from "viem/chains";
import { ERC20_ABI, STABLE_SWAP_ABI } from "@/config/abi";

const publicClient = createPublicClient({
  chain: BASE_SEPOLIA,
  transport: http(BASE_SEPOLIA.rpcUrls.default.http[0]),
});

const ensPublicClient = createPublicClient({
  chain: mainnet,
  transport: env.mainnetRpcUrl ? http(env.mainnetRpcUrl) : http(),
  ccipRead: {},
});

const isEnsName = (value: string) => {
  const trimmed = value.trim();
  return (
    trimmed.length > 0 && !trimmed.startsWith("0x") && trimmed.includes(".")
  );
};

const resolveRecipientAddress = async (value: string): Promise<Address> => {
  const trimmed = value.trim();
  if (isAddress(trimmed)) {
    return getAddress(trimmed) as Address;
  }
  if (!isEnsName(trimmed)) {
    throw new Error("Invalid address or ENS name");
  }
  const resolved = await ensPublicClient.getEnsAddress({
    name: trimmed.toLowerCase(),
    gatewayUrls: ["https://ccip-v3.ens.xyz"],
  });
  if (!resolved) {
    throw new Error(`ENS name not found: ${trimmed}`);
  }
  return resolved;
};

interface SendFormData {
  currency: Currency;
  address: string;
  amount: number;
}

interface InputAddressContentProps {
  onSend?: (data: SendFormData) => void;
}

interface BatchRecipient {
  id: string;
  address: string;
  amount: string;
}

export default function InputAddressContent({
  onSend,
}: InputAddressContentProps) {
  const [currency, setCurrency] = useState<Currency>(currencies[0]);
  const [address, setAddress] = useState("");
  const [amountInput, setAmountInput] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [balance, setBalance] = useState<string>("0");
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [batchRecipients, setBatchRecipients] = useState<BatchRecipient[]>([
    { id: "1", address: "", amount: "" },
  ]);

  // Cross-token transfer state (always visible Pay With dropdown)
  const [payToken, setPayToken] = useState<Currency>(currencies[0]);
  const [swapQuote, setSwapQuote] = useState<{
    amountOut: bigint;
    fee: bigint;
    totalUserPays: bigint;
  } | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);

  // Swap rate for batch mode (fetched separately from swapQuote)
  const [swapRate, setSwapRate] = useState<{
    ratePerUnit: number; // How much payToken per 1 unit of currency
    feeRatePerUnit: number; // Fee in payToken per 1 unit of currency
  } | null>(null);

  // Error modal state
  const [errorModal, setErrorModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onRetry?: () => void;
  }>({ isOpen: false, title: "", message: "" });

  // Receipt states
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  const {
    smartAccountAddress,
    isReady,
    sendGaslessTransfer,
    sendBatchTransfer,
    swapAndTransfer,
    swapAndBatchTransfer,
    isLoading,
    status,
    error,
  } = useSmartAccount();

  const fetchBalance = useCallback(async () => {
    if (!smartAccountAddress) {
      setBalance("0");
      return;
    }

    setIsLoadingBalance(true);
    try {
      const rawBalance = await publicClient.readContract({
        address: currency.tokenAddress as Address,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [smartAccountAddress],
      });
      setBalance(formatUnits(rawBalance as bigint, currency.decimals));
    } catch (err) {
      console.error("Failed to fetch balance:", err);
      setBalance("0");
      setErrorModal({
        isOpen: true,
        title: "Balance Error",
        message: err instanceof Error ? err.message : "Failed to fetch balance",
        onRetry: fetchBalance,
      });
    } finally {
      setIsLoadingBalance(false);
    }
  }, [smartAccountAddress, currency]);

  // Fetch balance when currency or address changes
  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  // Fetch pay token balance (always)
  const [payTokenBalance, setPayTokenBalance] = useState<string>("0");

  useEffect(() => {
    if (!smartAccountAddress) return;

    const fetchPayTokenBalance = async () => {
      try {
        const rawBalance = await publicClient.readContract({
          address: payToken.tokenAddress as Address,
          abi: ERC20_ABI,
          functionName: "balanceOf",
          args: [smartAccountAddress],
        });
        setPayTokenBalance(
          formatUnits(rawBalance as bigint, payToken.decimals),
        );
      } catch (err) {
        console.error("Failed to fetch pay token balance:", err);
        setPayTokenBalance("0");
      }
    };

    fetchPayTokenBalance();
  }, [smartAccountAddress, payToken]);

  // Fetch swap RATE for batch mode (independent of amountInput)
  // This is used for batch calculations when amountInput may be empty
  useEffect(() => {
    if (payToken.tokenAddress === currency.tokenAddress) {
      setSwapRate(null);
      return;
    }

    const fetchRate = async () => {
      try {
        // Query: if I put 1 unit of payToken, how much currency do I get?
        const oneUnit = parseUnits("1", payToken.decimals);
        const rateQuote = (await publicClient.readContract({
          address: STABLE_SWAP_ADDRESS,
          abi: STABLE_SWAP_ABI,
          functionName: "getSwapQuote",
          args: [
            payToken.tokenAddress as Address,
            currency.tokenAddress as Address,
            oneUnit,
          ],
        })) as [bigint, bigint, bigint];

        // amountOutPerUnit = how much currency for 1 payToken
        const amountOutPerUnit =
          parseFloat(formatUnits(rateQuote[0], currency.decimals)) || 0;
        const feePerUnit =
          parseFloat(formatUnits(rateQuote[1], payToken.decimals)) || 0;

        if (amountOutPerUnit > 0) {
          // ratePerUnit = how much payToken for 1 currency (inverse)
          const ratePerUnit = 1 / amountOutPerUnit;
          const feeRatePerUnit = feePerUnit / amountOutPerUnit;
          setSwapRate({ ratePerUnit, feeRatePerUnit });
        } else {
          setSwapRate(null);
        }
      } catch (err) {
        console.error("Failed to fetch swap rate:", err);
        setSwapRate(null);
      }
    };

    fetchRate();
  }, [payToken, currency]);

  // Fetch swap quote when pay token differs from send token
  // We need INVERSE quote: "To get X currency, how much payToken needed?"
  // Since getSwapQuote only does forward, we calculate rate and invert
  useEffect(() => {
    if (!amountInput || payToken.tokenAddress === currency.tokenAddress) {
      setSwapQuote(null);
      return;
    }

    const fetchQuote = async () => {
      setIsLoadingQuote(true);
      try {
        const desiredAmount = parseUnits(amountInput, currency.decimals);

        // Query: if I put 1 unit of payToken, how much currency do I get?
        const oneUnit = parseUnits("1", payToken.decimals);
        const rateQuote = (await publicClient.readContract({
          address: STABLE_SWAP_ADDRESS,
          abi: STABLE_SWAP_ABI,
          functionName: "getSwapQuote",
          args: [
            payToken.tokenAddress as Address,
            currency.tokenAddress as Address,
            oneUnit,
          ],
        })) as [bigint, bigint, bigint];

        // rateQuote[0] = amountOut (currency) for 1 payToken
        // rateQuote[2] = totalUserPays for 1 payToken (includes fee)
        const amountOutPerUnit = rateQuote[0]; // How much currency per 1 payToken

        if (amountOutPerUnit === 0n) {
          setSwapQuote(null);
          return;
        }

        // Calculate: to get desiredAmount of currency, need X payToken
        // X = desiredAmount / (amountOutPerUnit / oneUnit)
        // X = desiredAmount * oneUnit / amountOutPerUnit
        const neededPayToken = (desiredAmount * oneUnit) / amountOutPerUnit;

        // Get actual quote for this amount to get accurate fees
        const actualQuote = (await publicClient.readContract({
          address: STABLE_SWAP_ADDRESS,
          abi: STABLE_SWAP_ABI,
          functionName: "getSwapQuote",
          args: [
            payToken.tokenAddress as Address,
            currency.tokenAddress as Address,
            neededPayToken,
          ],
        })) as [bigint, bigint, bigint];

        // Adjust if amountOut is less than desired (due to rounding/fees)
        let adjustedNeededPayToken = neededPayToken;
        if (actualQuote[0] < desiredAmount) {
          // Need a bit more, add 0.5% buffer
          adjustedNeededPayToken = (neededPayToken * 1005n) / 1000n;
        }

        // Final quote with adjusted amount
        const finalQuote = (await publicClient.readContract({
          address: STABLE_SWAP_ADDRESS,
          abi: STABLE_SWAP_ABI,
          functionName: "getSwapQuote",
          args: [
            payToken.tokenAddress as Address,
            currency.tokenAddress as Address,
            adjustedNeededPayToken,
          ],
        })) as [bigint, bigint, bigint];

        setSwapQuote({
          amountOut: finalQuote[0], // currency amount out
          fee: finalQuote[1], // fee in payToken
          totalUserPays: finalQuote[2], // total payToken needed
        });
      } catch (err) {
        console.error("Failed to fetch swap quote:", err);
        setSwapQuote(null);
      } finally {
        setIsLoadingQuote(false);
      }
    };

    const timer = setTimeout(fetchQuote, 500);
    return () => clearTimeout(timer);
  }, [amountInput, payToken, currency]);

  // Check balance (cross-token aware)
  const numBalance = parseFloat(balance) || 0;
  const numPayTokenBalance = parseFloat(payTokenBalance) || 0;
  const numAmount = parseFloat(amountInput);
  const isCrossToken = payToken.tokenAddress !== currency.tokenAddress;

  // For cross-token: use swapQuote.fee, otherwise use amount * 0.5%
  const estimatedFee = useMemo(() => {
    if (isCrossToken && swapQuote) {
      // Use swap fee directly (already in payToken units)
      return parseFloat(formatUnits(swapQuote.fee, payToken.decimals)) || 0;
    }
    return Number.isFinite(numAmount) ? numAmount * 0.005 : 0;
  }, [isCrossToken, swapQuote, payToken.decimals, numAmount]);

  const totalRequired = useMemo(() => {
    if (isCrossToken && swapQuote) {
      return (
        parseFloat(formatUnits(swapQuote.totalUserPays, payToken.decimals)) || 0
      );
    }
    return Number.isFinite(numAmount) ? numAmount + numAmount * 0.005 : 0;
  }, [isCrossToken, swapQuote, payToken.decimals, numAmount]);

  // Effective balance to check against (payToken balance for cross-token, currency balance otherwise)
  const effectiveBalance = isCrossToken ? numPayTokenBalance : numBalance;
  const effectiveSymbol = isCrossToken ? payToken.symbol : currency.symbol;

  const hasInsufficientBalance =
    totalRequired > 0 && totalRequired > effectiveBalance;
  const hasNoBalance = effectiveBalance === 0;

  // Calculate batch total
  const batchTotal = useMemo(() => {
    return batchRecipients.reduce((sum, r) => {
      const amt = parseFloat(r.amount) || 0;
      return sum + amt;
    }, 0);
  }, [batchRecipients]);

  // Estimate batch fee (cross-token aware)
  // Use swapRate as fallback when swapQuote is null (batch mode)
  const batchEstimatedFee = useMemo(() => {
    if (isCrossToken) {
      // First try swapQuote
      if (swapQuote) {
        const amountOut =
          parseFloat(formatUnits(swapQuote.amountOut, currency.decimals)) || 0;
        if (amountOut > 0) {
          const feeRate =
            parseFloat(formatUnits(swapQuote.fee, payToken.decimals)) /
            amountOut || 0;
          return batchTotal * feeRate;
        }
      }
      // Fallback to swapRate for batch mode
      if (swapRate) {
        return batchTotal * swapRate.feeRatePerUnit;
      }
    }
    return batchTotal * 0.005;
  }, [
    isCrossToken,
    swapQuote,
    swapRate,
    payToken.decimals,
    currency.decimals,
    batchTotal,
  ]);

  // Batch total required (cross-token aware)
  // Use swapRate as fallback when swapQuote is null (batch mode)
  const batchTotalRequired = useMemo(() => {
    if (isCrossToken) {
      // First try swapQuote, then fall back to swapRate
      if (swapQuote) {
        const totalPay =
          parseFloat(formatUnits(swapQuote.totalUserPays, payToken.decimals)) ||
          0;
        const amountOut =
          parseFloat(formatUnits(swapQuote.amountOut, currency.decimals)) || 0;
        if (amountOut > 0) {
          const rate = totalPay / amountOut;
          return batchTotal * rate;
        }
      }
      // Fallback to swapRate for batch mode
      if (swapRate) {
        return batchTotal * swapRate.ratePerUnit;
      }
    }
    return batchTotal + batchEstimatedFee;
  }, [
    isCrossToken,
    swapQuote,
    swapRate,
    payToken.decimals,
    currency.decimals,
    batchTotal,
    batchEstimatedFee,
  ]);

  const hasBatchInsufficientBalance =
    batchTotal > 0 && batchTotalRequired > effectiveBalance;

  // Add recipient row
  const addRecipient = useCallback(() => {
    if (batchRecipients.length >= 20) return; // Max 20 recipients
    setBatchRecipients((prev) => [
      ...prev,
      { id: Date.now().toString(), address: "", amount: "" },
    ]);
  }, [batchRecipients.length]);

  // Remove recipient row
  const removeRecipient = useCallback((id: string) => {
    setBatchRecipients((prev) => prev.filter((r) => r.id !== id));
  }, []);

  // Update recipient field
  const updateRecipient = useCallback(
    (id: string, field: "address" | "amount", value: string) => {
      setBatchRecipients((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
              ...r,
              [field]:
                field === "amount" ? value.replace(/[^0-9.]/g, "") : value,
            }
            : r,
        ),
      );
    },
    [],
  );

  // Validate batch recipients
  const batchValidationErrors = useMemo(() => {
    const errors: string[] = [];
    const addresses: string[] = [];

    batchRecipients.forEach((r, idx) => {
      // Check address
      if (r.address.trim()) {
        const trimmed = r.address.trim();
        if (isAddress(trimmed)) {
          const normalized = trimmed.toLowerCase();
          if (addresses.includes(normalized)) {
            errors.push(`Duplicate address at row ${idx + 1}`);
          }
          addresses.push(normalized);
        } else if (!isEnsName(trimmed)) {
          errors.push(`Invalid address or ENS name at row ${idx + 1}`);
        }
      }

      // Check amount
      const amt = parseFloat(r.amount);
      if (r.amount && (!Number.isFinite(amt) || amt <= 0)) {
        errors.push(`Invalid amount at row ${idx + 1}`);
      }
    });

    return errors;
  }, [batchRecipients]);

  const hasBatchValidRecipients = batchRecipients.some(
    (r) => r.address.trim() && parseFloat(r.amount) > 0,
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!address.trim()) {
        setErrorModal({
          isOpen: true,
          title: "Validation Error",
          message: "Please enter an address",
        });
        return;
      }

      const amountValue = Number.isFinite(numAmount) ? numAmount : 0;
      if (amountValue <= 0) {
        setErrorModal({
          isOpen: true,
          title: "Validation Error",
          message: "Please enter a valid amount",
        });
        return;
      }

      if (hasInsufficientBalance) {
        return;
      }

      let recipient: Address;
      try {
        recipient = await resolveRecipientAddress(address);
      } catch (err) {
        setErrorModal({
          isOpen: true,
          title: "Validation Error",
          message: err instanceof Error ? err.message : "Invalid address",
        });
        return;
      }

      setIsSubmitting(true);

      try {
        if (onSend) {
          await onSend({ currency, address: recipient, amount: amountValue });
        } else if (
          payToken.tokenAddress !== currency.tokenAddress &&
          swapQuote
        ) {
          // Cross-token transfer: swap + transfer
          const result = await swapAndTransfer({
            tokenIn: payToken.tokenAddress as Address,
            tokenOut: currency.tokenAddress as Address,
            amountIn: formatUnits(swapQuote.totalUserPays, payToken.decimals),
            tokenInDecimals: payToken.decimals,
            tokenOutDecimals: currency.decimals,
            recipient,
            stableSwapAddress: STABLE_SWAP_ADDRESS,
            minAmountOut: parseUnits(amountValue.toString(), currency.decimals),
            totalUserPays: swapQuote.totalUserPays,
          });
          // Show success receipt
          setReceipt({
            id: result.txHash,
            type: "send",
            status: "success",
            timestamp: new Date(),
            amount: amountValue,
            currency: currency.symbol,
            currencyIcon: currency.icon,
            senderCurrency: payToken.symbol, // Sender paid with different token
            senderCurrencyIcon: payToken.icon,
            toAddress: recipient,
            txHash: result.txHash,
          });
          setShowReceipt(true);
          await fetchBalance();
          // Reset form
          setAddress("");
          setAmountInput("");
        } else {
          // Same token transfer
          const txHash = await sendGaslessTransfer({
            recipient,
            amount: amountValue.toString(),
            tokenAddress: currency.tokenAddress as Address,
            decimals: currency.decimals,
          });
          // Show success receipt
          setReceipt({
            id: txHash,
            type: "send",
            status: "success",
            timestamp: new Date(),
            amount: amountValue,
            currency: currency.symbol,
            currencyIcon: currency.icon,
            toAddress: recipient,
            txHash: txHash,
          });
          setShowReceipt(true);
          await fetchBalance();
          // Reset form
          setAddress("");
          setAmountInput("");
        }
      } catch (error) {
        console.error("Send error:", error);
        // Show failure receipt
        setReceipt({
          id: Date.now().toString(),
          type: "send",
          status: "failed",
          timestamp: new Date(),
          amount: amountValue,
          currency: currency.symbol,
          currencyIcon: currency.icon,
          toAddress: address,
          errorMessage:
            error instanceof Error ? error.message : "Transaction failed",
        });
        setShowReceipt(true);
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      currency,
      address,
      numAmount,
      onSend,
      hasInsufficientBalance,
      sendGaslessTransfer,
      swapAndTransfer,
      swapQuote,
      payToken,
      fetchBalance,
    ],
  );

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, "");
    const sanitized = value.replace(/^(\d*\.\d*).*$/, "$1");
    setAmountInput(sanitized);
  };

  const handleBatchSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (batchValidationErrors.length > 0) {
        setErrorModal({
          isOpen: true,
          title: "Validation Error",
          message: batchValidationErrors.join("\n"),
        });
        return;
      }

      if (!hasBatchValidRecipients) {
        setErrorModal({
          isOpen: true,
          title: "Validation Error",
          message: "Please add at least one recipient with address and amount",
        });
        return;
      }

      if (hasBatchInsufficientBalance) {
        return;
      }

      setIsSubmitting(true);

      try {
        const recipientInputs = batchRecipients
          .map((r, idx) => ({ ...r, index: idx }))
          .filter((r) => r.address.trim() && parseFloat(r.amount) > 0);

        const resolvedRecipients = await Promise.all(
          recipientInputs.map(async (r) => {
            try {
              const resolvedAddress = await resolveRecipientAddress(r.address);
              return { ...r, resolvedAddress };
            } catch (err) {
              const message =
                err instanceof Error ? err.message : "Invalid address";
              throw new Error(`Row ${r.index + 1}: ${message}`);
            }
          }),
        );

        const seen = new Set<string>();
        const duplicateErrors: string[] = [];
        resolvedRecipients.forEach((r) => {
          const key = r.resolvedAddress.toLowerCase();
          if (seen.has(key)) {
            duplicateErrors.push(`Duplicate address at row ${r.index + 1}`);
          } else {
            seen.add(key);
          }
        });

        if (duplicateErrors.length > 0) {
          setErrorModal({
            isOpen: true,
            title: "Validation Error",
            message: duplicateErrors.join("\n"),
          });
          return;
        }

        const validRecipients = resolvedRecipients.map((r) => ({
          address: r.resolvedAddress as Address,
          amount: r.amount,
        }));

        // Check if cross-token batch transfer
        const isBatchCrossToken =
          payToken.tokenAddress !== currency.tokenAddress;

        let result: { txHash: string; recipientCount: number };

        if (isBatchCrossToken && swapRate) {
          // Cross-token batch: swap payToken → currency, then batch transfer
          // Calculate total payToken needed
          const totalPayTokenNeeded = parseUnits(
            batchTotalRequired.toFixed(payToken.decimals),
            payToken.decimals,
          );
          const minTotalCurrencyOut = parseUnits(
            batchTotal.toFixed(currency.decimals),
            currency.decimals,
          );

          result = await swapAndBatchTransfer({
            tokenIn: payToken.tokenAddress as Address,
            tokenOut: currency.tokenAddress as Address,
            totalAmountIn: totalPayTokenNeeded,
            tokenInDecimals: payToken.decimals,
            tokenOutDecimals: currency.decimals,
            recipients: validRecipients,
            stableSwapAddress: STABLE_SWAP_ADDRESS,
            minTotalAmountOut: minTotalCurrencyOut,
          });
        } else {
          // Same token batch transfer
          result = await sendBatchTransfer({
            recipients: validRecipients,
            tokenAddress: currency.tokenAddress as Address,
            decimals: currency.decimals,
          });
        }

        // Show success receipt
        setReceipt({
          id: result.txHash,
          type: "send",
          status: "success",
          timestamp: new Date(),
          amount: batchTotal,
          currency: currency.symbol,
          currencyIcon: currency.icon,
          senderCurrency: isBatchCrossToken ? payToken.symbol : undefined,
          senderCurrencyIcon: isBatchCrossToken ? payToken.icon : undefined,
          toAddress: `${result.recipientCount} recipients`,
          txHash: result.txHash,
        });
        setShowReceipt(true);
        await fetchBalance();
        // Reset batch form
        setBatchRecipients([{ id: "1", address: "", amount: "" }]);
      } catch (error) {
        console.error("Batch send error:", error);
        setReceipt({
          id: Date.now().toString(),
          type: "send",
          status: "failed",
          timestamp: new Date(),
          amount: batchTotal,
          currency: currency.symbol,
          currencyIcon: currency.icon,
          toAddress: `${batchRecipients.length} recipients`,
          errorMessage:
            error instanceof Error ? error.message : "Batch transaction failed",
        });
        setShowReceipt(true);
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      batchRecipients,
      batchTotal,
      batchTotalRequired,
      batchValidationErrors,
      hasBatchValidRecipients,
      hasBatchInsufficientBalance,
      currency,
      payToken,
      swapRate,
      sendBatchTransfer,
      swapAndBatchTransfer,
      fetchBalance,
    ],
  );

  return (
    <div className="p-4">
      {/* Connect wallet message */}
      {isReady && !smartAccountAddress && (
        <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-500 rounded-lg text-yellow-400 text-sm text-center">
          Connect wallet to send tokens
        </div>
      )}

      <form
        onSubmit={isBatchMode ? handleBatchSubmit : handleSubmit}
        className="space-y-6"
      >
        {/* Send As (Currency Dropdown) */}
        <div className="space-y-2">
          <label className="text-white font-medium">Send as</label>
          <CurrencyDropdown value={currency} onChange={setCurrency} />
        </div>

        {/* Pay With (always visible) */}
        <div className="space-y-2">
          <label className="text-white font-medium flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-primary" />
            Pay with
          </label>
          <CurrencyDropdown value={payToken} onChange={setPayToken} />
          <div className="text-xs text-zinc-500">
            Balance:{" "}
            {parseFloat(payTokenBalance).toLocaleString(undefined, {
              maximumFractionDigits: 4,
            })}{" "}
            {payToken.symbol}
          </div>

          {/* Swap Quote Display (when pay token differs from send token) */}
          {payToken.tokenAddress !== currency.tokenAddress &&
            swapQuote &&
            amountInput && (
              <div className="p-3 bg-zinc-800/50 rounded-lg space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-400">You pay</span>
                  <span className="text-white font-medium">
                    {formatUnits(swapQuote.totalUserPays, payToken.decimals)}{" "}
                    {payToken.symbol}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Swap fee</span>
                  <span className="text-zinc-400">
                    ~{formatUnits(swapQuote.fee, payToken.decimals)}{" "}
                    {payToken.symbol}
                  </span>
                </div>
              </div>
            )}
          {payToken.tokenAddress !== currency.tokenAddress &&
            isLoadingQuote && (
              <div className="text-xs text-zinc-500 animate-pulse">
                Getting quote...
              </div>
            )}
        </div>

        {/* Batch Transfer Toggle */}
        <div className="flex items-center justify-between p-3 bg-zinc-800/50 border border-zinc-700 rounded-xl">
          <div className="text-sm">
            <span className="text-white font-medium">Batch Transfer</span>
            <span className="text-zinc-400 ml-2">
              (Send to multiple recipients)
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsBatchMode(!isBatchMode);
              if (!isBatchMode) {
                setAddress("");
                setAmountInput("");
              } else {
                setBatchRecipients([{ id: "1", address: "", amount: "" }]);
              }
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isBatchMode
              ? "bg-primary text-black"
              : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
              }`}
          >
            {isBatchMode ? "ON" : "OFF"}
          </button>
        </div>

        {isBatchMode ? (
          <div className="space-y-4">
            {/* Batch Recipients List */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-white font-medium">Recipients</label>
                <span className="text-xs text-zinc-400">
                  {batchRecipients.length}/20 recipients
                </span>
              </div>

              {batchRecipients.map((recipient, idx) => (
                <div
                  key={recipient.id}
                  className="p-3 bg-zinc-800/50 rounded-xl border border-zinc-700 space-y-2"
                >
                  {/* Row number + Address */}
                  <div className="flex gap-2 items-center">
                    <span className="text-zinc-500 text-sm w-6 shrink-0">
                      {idx + 1}.
                    </span>
                    <input
                      type="text"
                      value={recipient.address}
                      onChange={(e) =>
                        updateRecipient(
                          recipient.id,
                          "address",
                          e.target.value,
                        )
                      }
                      placeholder="0x... or name.base.eth"
                      className="flex-1 p-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-primary min-w-0"
                    />
                  </div>
                  {/* Amount field */}
                  <div className="ml-8">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={recipient.amount}
                      onChange={(e) =>
                        updateRecipient(
                          recipient.id,
                          "amount",
                          e.target.value,
                        )
                      }
                      placeholder="Amount"
                      className="w-full p-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white text-sm text-right placeholder-zinc-500 focus:outline-none focus:border-primary"
                    />
                  </div>
                  {/* Delete button - full width below amount */}
                  {batchRecipients.length > 1 && (
                    <div className="ml-8">
                      <button
                        type="button"
                        onClick={() => removeRecipient(recipient.id)}
                        className="w-full py-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/20 border border-red-500/30 rounded-lg transition-colors text-xs flex items-center justify-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {/* Add Recipient Button */}
              {batchRecipients.length < 20 && (
                <button
                  type="button"
                  onClick={addRecipient}
                  className="w-full py-3 border-2 border-dashed border-zinc-600 rounded-xl text-zinc-400 hover:text-primary hover:border-primary transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Recipient
                </button>
              )}
            </div>

            {/* Batch Summary */}
            <div className="p-4 bg-zinc-800/30 rounded-xl border border-zinc-700 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Total Amount</span>
                <span className="text-white font-medium">
                  {batchTotal.toLocaleString(undefined, {
                    maximumFractionDigits: 4,
                  })}{" "}
                  {currency.symbol}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">
                  Est. Fee {isCrossToken ? "(swap)" : "(0.5%)"}
                </span>
                <span className="text-zinc-300">
                  ~
                  {batchEstimatedFee.toLocaleString(undefined, {
                    maximumFractionDigits: 6,
                  })}{" "}
                  {effectiveSymbol}
                </span>
              </div>
              <div className="flex justify-between text-sm border-t border-zinc-700 pt-2">
                <span className="text-zinc-400">Total Required</span>
                <span className="text-primary font-bold">
                  {batchTotalRequired.toLocaleString(undefined, {
                    maximumFractionDigits: 4,
                  })}{" "}
                  {effectiveSymbol}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">
                  Your Balance ({effectiveSymbol})
                </span>
                <span
                  className={
                    hasBatchInsufficientBalance
                      ? "text-red-400"
                      : "text-green-400"
                  }
                >
                  {effectiveBalance.toLocaleString(undefined, {
                    maximumFractionDigits: 4,
                  })}{" "}
                  {effectiveSymbol}
                </span>
              </div>
            </div>

            {/* Validation Errors */}
            {batchValidationErrors.length > 0 && (
              <div className="p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-400 text-sm">
                <div className="flex items-center gap-2 font-medium mb-1">
                  <AlertTriangle className="w-4 h-4" />
                  Validation Errors:
                </div>
                {batchValidationErrors.map((err, idx) => (
                  <div key={idx}>• {err}</div>
                ))}
              </div>
            )}

            {/* Batch Insufficient Balance Warning */}
            {hasBatchInsufficientBalance && (
              <div className="flex items-center gap-2 p-3 bg-orange-500/20 border border-orange-500 rounded-lg text-orange-400 text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>
                  Insufficient balance. Need{" "}
                  {batchTotalRequired.toLocaleString(undefined, {
                    maximumFractionDigits: 4,
                  })}{" "}
                  {effectiveSymbol}, have{" "}
                  {effectiveBalance.toLocaleString(undefined, {
                    maximumFractionDigits: 4,
                  })}
                </span>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <label className="text-white font-medium">Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter wallet address or ENS"
                className="w-full p-3 sm:p-4 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-primary transition-colors text-sm sm:text-base"
              />
            </div>

            {/* Amount Input */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-white font-medium">Amount</label>
                {smartAccountAddress && (
                  <span className="text-xs text-zinc-400">
                    Balance ({effectiveSymbol}):{" "}
                    {isLoadingBalance
                      ? "..."
                      : effectiveBalance.toLocaleString(undefined, {
                        maximumFractionDigits: 4,
                      })}
                  </span>
                )}
              </div>
              <input
                type="text"
                inputMode="decimal"
                value={amountInput}
                onChange={handleAmountChange}
                placeholder="0"
                className="w-full p-3 sm:p-4 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-primary transition-colors text-sm sm:text-base"
              />
              {smartAccountAddress &&
                Number.isFinite(numAmount) &&
                numAmount > 0 && (
                  <div className="text-xs text-right text-zinc-500">
                    Est. Fee: ~
                    {estimatedFee.toLocaleString(undefined, {
                      maximumFractionDigits: 6,
                    })}{" "}
                    {effectiveSymbol} {isCrossToken ? "(swap)" : "(0.5%)"}
                  </div>
                )}
            </div>

            {/* Insufficient Balance Warning */}
            {smartAccountAddress && hasInsufficientBalance && (
              <div className="flex items-center gap-2 p-3 bg-orange-500/20 border border-orange-500 rounded-lg text-orange-400 text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>
                  Insufficient balance. Required:{" "}
                  {totalRequired.toLocaleString(undefined, {
                    maximumFractionDigits: 4,
                  })}{" "}
                  {effectiveSymbol} (incl. fee)
                </span>
              </div>
            )}

            {/* No Balance Warning */}
            {smartAccountAddress && hasNoBalance && amountInput === "" && (
              <div className="flex items-center gap-2 p-3 bg-zinc-700/50 border border-zinc-600 rounded-lg text-zinc-400 text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>You don&apos;t have any {effectiveSymbol} tokens</span>
              </div>
            )}

            {/* Status Message */}
            {(isSubmitting || isLoading) && (
              <div className="flex items-center justify-center gap-2 text-primary text-sm">
                {status || "Sending..."}
              </div>
            )}
          </>
        )}

        <button
          type="submit"
          disabled={
            isSubmitting ||
            isLoading ||
            !smartAccountAddress ||
            (isBatchMode
              ? hasBatchInsufficientBalance ||
              !hasBatchValidRecipients ||
              batchValidationErrors.length > 0
              : hasInsufficientBalance)
          }
          className={`w-full py-3 sm:py-4 font-bold text-base sm:text-lg md:text-xl rounded-full transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${(isBatchMode ? hasBatchInsufficientBalance : hasInsufficientBalance)
            ? "bg-orange-500/50 text-orange-200"
            : "bg-primary text-black hover:bg-primary/90"
            }`}
        >
          {isSubmitting || isLoading
            ? "SENDING..."
            : (
              isBatchMode
                ? hasBatchInsufficientBalance
                : hasInsufficientBalance
            )
              ? "INSUFFICIENT BALANCE"
              : isBatchMode
                ? `SEND TO ${batchRecipients.filter((r) => r.address.trim() && parseFloat(r.amount) > 0).length} RECIPIENTS`
                : "SEND NOW"}
        </button>
      </form>

      {/* Error Modal */}
      <Modal
        id="send-error-modal"
        className="modal-alert"
        role="alertdialog"
        aria-modal={true}
        aria-labelledby="alert-title"
        aria-describedby="alert-desc"
        tabIndex={-1}
        isOpen={errorModal.isOpen}
        onClose={() => setErrorModal({ ...errorModal, isOpen: false })}
        title={errorModal.title}
        message={errorModal.message}
      >
        {errorModal.onRetry && (
          <button
            onClick={() => {
              errorModal.onRetry?.();
              setErrorModal({ ...errorModal, isOpen: false });
            }}
            className="w-full py-4 bg-primary text-black font-bold text-lg rounded-xl hover:bg-primary/90 transition-colors cursor-pointer"
          >
            RETRY
          </button>
        )}
      </Modal>

      {/* Receipt Popup */}
      <ReceiptPopUp
        isOpen={showReceipt}
        data={receipt}
        onClose={() => setShowReceipt(false)}
      />
    </div>
  );
}
