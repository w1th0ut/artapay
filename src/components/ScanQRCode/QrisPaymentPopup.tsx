"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { createPublicClient, formatUnits, http } from "viem";
import type { Address } from "viem";
import { BASE_SEPOLIA } from "@/config/chains";
import { ERC20_ABI } from "@/config/abi";
import { CurrencyDropdown, currencies, type Currency } from "@/components/Currency";
import { useSmartAccount } from "@/hooks/useSmartAccount";
import Modal from "@/components/Modal";
import { ReceiptPopUp, type ReceiptData } from "@/components/ReceiptPopUp";

interface QrisPaymentPopupProps {
  recipient: string;
  merchantName: string;
  merchantId: string;
  merchantCity: string;
  qrisHash: string;
  onCancel: () => void;
}

const publicClient = createPublicClient({
  chain: BASE_SEPOLIA,
  transport: http(BASE_SEPOLIA.rpcUrls.default.http[0]),
});

export default function QrisPaymentPopup({
  recipient,
  merchantName,
  merchantId,
  merchantCity,
  qrisHash,
  onCancel,
}: QrisPaymentPopupProps) {
  const [currency, setCurrency] = useState<Currency>(currencies[0]);
  const [amountInput, setAmountInput] = useState("");
  const [balance, setBalance] = useState("0");
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  const { smartAccountAddress, isReady, sendGaslessTransfer, isLoading, status } =
    useSmartAccount();

  const [errorModal, setErrorModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({ isOpen: false, title: "", message: "" });

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
    } finally {
      setIsLoadingBalance(false);
    }
  }, [smartAccountAddress, currency]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  const numBalance = parseFloat(balance) || 0;
  const numAmount = parseFloat(amountInput);
  const estimatedFee = useMemo(() => {
    return Number.isFinite(numAmount) ? numAmount * 0.005 : 0;
  }, [numAmount]);
  const totalRequired = useMemo(() => {
    return Number.isFinite(numAmount) ? numAmount + numAmount * 0.005 : 0;
  }, [numAmount]);
  const hasInsufficientBalance =
    totalRequired > 0 && totalRequired > numBalance;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, "");
    const sanitized = value.replace(/^(\d*\.\d*).*$/, "$1");
    setAmountInput(sanitized);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!smartAccountAddress) return;

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

    try {
      const txHash = await sendGaslessTransfer({
        recipient: recipient as Address,
        amount: amountValue.toString(),
        tokenAddress: currency.tokenAddress as Address,
        decimals: currency.decimals,
      });
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
      setAmountInput("");
      await fetchBalance();
    } catch (error) {
      console.error("QRIS send error:", error);
      setReceipt({
        id: Date.now().toString(),
        type: "send",
        status: "failed",
        timestamp: new Date(),
        amount: amountValue,
        currency: currency.symbol,
        currencyIcon: currency.icon,
        toAddress: recipient,
        errorMessage: error instanceof Error ? error.message : "Transfer failed",
      });
      setShowReceipt(true);
    }
  };

  const shortenAddress = (addr: string) => {
    if (addr.length <= 10) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-zinc-800 rounded-2xl p-4 sm:p-6 border-2 border-primary">
        <h2 className="text-white text-lg sm:text-xl font-bold text-center mb-4 sm:mb-6">
          QRIS Payment
        </h2>

        {isReady && !smartAccountAddress && (
          <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-500 rounded-lg text-yellow-400 text-sm text-center">
            Connect wallet to make payment
          </div>
        )}

        <div className="space-y-4">
          <div className="p-3 bg-zinc-900/60 border border-zinc-700 rounded-xl text-xs space-y-1">
            <div className="flex justify-between gap-4">
              <span className="text-zinc-400">Merchant</span>
              <span className="text-white text-right">{merchantName || "-"}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-zinc-400">Merchant ID</span>
              <span className="text-white text-right">{merchantId || "-"}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-zinc-400">City</span>
              <span className="text-white text-right">{merchantCity || "-"}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-zinc-400">Recipient</span>
              <span className="text-white font-mono text-right">
                {shortenAddress(recipient)}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-zinc-400">QRIS Hash</span>
              <span className="text-white font-mono text-right">
                {shortenAddress(qrisHash)}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-white text-sm font-medium">Send as</label>
              <CurrencyDropdown value={currency} onChange={setCurrency} />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-white text-sm font-medium">Amount</label>
                {smartAccountAddress && (
                  <span className="text-xs text-zinc-400">
                    Balance ({currency.symbol}):{" "}
                    {isLoadingBalance
                      ? "..."
                      : numBalance.toLocaleString(undefined, {
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
                className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-primary transition-colors text-sm"
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

            {(isLoading || isLoadingBalance) && status && (
              <div className="flex items-center justify-center gap-2 text-primary text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                {status}
              </div>
            )}

            <div className="flex flex-col gap-3 pt-2">
              <button
                type="submit"
                disabled={
                  isLoading ||
                  !smartAccountAddress ||
                  hasInsufficientBalance ||
                  !amountInput
                }
                className="w-full py-3 bg-primary text-black font-bold text-base rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "PROCESSING..." : "PAY NOW"}
              </button>
              <button
                type="button"
                onClick={onCancel}
                disabled={isLoading}
                className="w-full py-3 border-2 border-primary text-primary font-bold text-base rounded-xl hover:bg-primary/10 transition-colors disabled:opacity-50"
              >
                CANCEL
              </button>
            </div>
          </form>
        </div>
      </div>

      <Modal
        id="qris-payment-error-modal"
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
      />

      <ReceiptPopUp
        isOpen={showReceipt}
        data={receipt}
        onClose={() => {
          setShowReceipt(false);
          onCancel();
        }}
      />
    </div>
  );
}
