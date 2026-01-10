"use client";

import { useState, useCallback, useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { CurrencyDropdown, Currency, currencies } from "@/components/Currency";
import Modal from "@/components/Modal";
import { useSmartAccount } from "@/hooks/useSmartAccount";
import { LISK_SEPOLIA } from "@/config/chains";
import {
  createPublicClient,
  http,
  formatUnits,
  getAddress,
  type Address,
} from "viem";
import { ERC20_ABI } from "@/config/abi";

const publicClient = createPublicClient({
  chain: LISK_SEPOLIA,
  transport: http(LISK_SEPOLIA.rpcUrls.default.http[0]),
});

interface SendFormData {
  currency: Currency;
  address: string;
  amount: number;
}

interface InputAddressContentProps {
  onSend?: (data: SendFormData) => void;
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

  // Error modal state
  const [errorModal, setErrorModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onRetry?: () => void;
  }>({ isOpen: false, title: "", message: "" });

  const {
    smartAccountAddress,
    isReady,
    sendGaslessTransfer,
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

  // Check balance
  const numBalance = parseFloat(balance) || 0;
  const numAmount = parseFloat(amountInput);

  // Estimate gas fee as 0.5% of amount (heuristic since actual fee depends on Paymaster)
  const estimatedFee = Number.isFinite(numAmount) ? numAmount * 0.005 : 0;
  const totalRequired = Number.isFinite(numAmount)
    ? numAmount + estimatedFee
    : 0;

  const hasInsufficientBalance =
    Number.isFinite(numAmount) && numAmount > 0 && totalRequired > numBalance;
  const hasNoBalance = numBalance === 0;

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

      setIsSubmitting(true);

      try {
        if (onSend) {
          await onSend({ currency, address, amount: amountValue });
        } else {
          const recipient = getAddress(address) as Address;
          const txHash = await sendGaslessTransfer({
            recipient,
            amount: amountValue.toString(),
            tokenAddress: currency.tokenAddress as Address,
            decimals: currency.decimals,
          });
          setErrorModal({
            isOpen: true,
            title: "Transfer Successful",
            message: `Transaction sent! TX: ${txHash}`,
          });
          await fetchBalance();
        }
      } catch (error) {
        console.error("Send error:", error);
        setErrorModal({
          isOpen: true,
          title: "Send Failed",
          message: error instanceof Error ? error.message : "Transaction failed",
        });
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
      fetchBalance,
    ]
  );

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, "");
    const sanitized = value.replace(/^(\d*\.\d*).*$/, "$1");
    setAmountInput(sanitized);
  };

  return (
    <div className="p-4">
      {/* Connect wallet message */}
      {isReady && !smartAccountAddress && (
        <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-500 rounded-lg text-yellow-400 text-sm text-center">
          Connect wallet to send tokens
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Send As (Currency Dropdown) */}
        <div className="space-y-2">
          <label className="text-white font-medium">Send as</label>
          <CurrencyDropdown value={currency} onChange={setCurrency} />
        </div>

        {/* Address Input */}
        <div className="space-y-2">
          <label className="text-white font-medium">Address</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter wallet address"
            className="w-full p-4 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* Amount Input */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-white font-medium">Amount</label>
            {smartAccountAddress && (
              <span className="text-xs text-zinc-400">
                Balance:{" "}
                {isLoadingBalance
                  ? "..."
                  : numBalance.toLocaleString(undefined, {
                    maximumFractionDigits: 4,
                  })}{" "}
                {currency.symbol}
              </span>
            )}
          </div>
          <input
            type="text"
            inputMode="decimal"
            value={amountInput}
            onChange={handleAmountChange}
            placeholder="0"
            className="w-full p-4 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-primary transition-colors"
          />
          {smartAccountAddress &&
            Number.isFinite(numAmount) &&
            numAmount > 0 && (
              <div className="text-xs text-right text-zinc-500">
                Est. Fee: ~
                {estimatedFee.toLocaleString(undefined, {
                  maximumFractionDigits: 6,
                })}{" "}
                {currency.symbol} (0.5%)
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
              {currency.symbol} (incl. fee)
            </span>
          </div>
        )}

        {/* No Balance Warning */}
        {smartAccountAddress && hasNoBalance && amountInput === "" && (
          <div className="flex items-center gap-2 p-3 bg-zinc-700/50 border border-zinc-600 rounded-lg text-zinc-400 text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>You don't have any {currency.symbol} tokens</span>
          </div>
        )}

        {/* Status Message */}
        {(isSubmitting || isLoading) && (
          <div className="flex items-center justify-center gap-2 text-primary text-sm">
            {status || "Sending..."}
          </div>
        )}

        {/* Send Button */}
        <button
          type="submit"
          disabled={
            isSubmitting ||
            isLoading ||
            !smartAccountAddress ||
            hasInsufficientBalance
          }
          className={`w-full py-4 font-bold text-xl rounded-full transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${hasInsufficientBalance
            ? "bg-orange-500/50 text-orange-200"
            : "bg-primary text-black hover:bg-primary/90"
            }`}
        >
          {isSubmitting || isLoading
            ? "SENDING..."
            : hasInsufficientBalance
              ? "INSUFFICIENT BALANCE"
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
    </div>
  );
}
