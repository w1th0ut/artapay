"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Loader2, RefreshCw, ExternalLink } from "lucide-react";
import Image from "next/image";
import { useSmartAccount } from "@/hooks/useSmartAccount";
import Modal from "@/components/Modal";
import { Currency, currencies } from "@/components/Currency";
import {
  createPublicClient,
  formatUnits,
  http,
  parseUnits,
  type Address,
} from "viem";
import { LISK_SEPOLIA } from "@/config/chains";
import { STABLECOIN_REGISTRY_ADDRESS } from "@/config/constants";
import { STABLECOIN_REGISTRY_ABI } from "@/config/abi";

interface IdRxTransaction {
  reference: string;
  toBeMinted: string;
  paymentStatus?: string;
  userMintStatus?: string;
  createdAt?: string;
  requestType?: string;
}

export default function TopUpIDRX() {
  const { smartAccountAddress, isReady } = useSmartAccount();

  const TOPUP_LIMITS: Record<string, { min: number; max: number }> = {
    IDRX: { min: 20000, max: 1_000_000_000 },
    USDC: { min: 2, max: 5555 },
  };
  const HISTORY_TAKE = 5;

  const publicClient = useMemo(
    () =>
      createPublicClient({
        chain: LISK_SEPOLIA,
        transport: http(LISK_SEPOLIA.rpcUrls.default.http[0]),
      }),
    [],
  );

  const topUpTokens = useMemo(
    () =>
      currencies.filter(
        (token) => token.symbol === "IDRX" || token.symbol === "USDC",
      ),
    [],
  );
  const defaultToken =
    topUpTokens.find((token) => token.symbol === "IDRX") || topUpTokens[0];
  const [topUpToken, setTopUpToken] = useState<Currency>(defaultToken);
  const [isTokenMenuOpen, setIsTokenMenuOpen] = useState(false);
  const tokenMenuRef = useRef<HTMLDivElement>(null);

  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);

  const [history, setHistory] = useState<IdRxTransaction[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPageCount, setHistoryPageCount] = useState(0);

  const [errorModal, setErrorModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onRetry?: () => void;
  }>({ isOpen: false, title: "", message: "" });

  const formattedAmount = useMemo(() => {
    const value = Number(amount || 0);
    if (!Number.isFinite(value)) return "0";
    return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }, [amount]);
  const numericAmount = Number(amount);
  const hasValidAmount = Number.isFinite(numericAmount) && numericAmount > 0;
  const limits = TOPUP_LIMITS[topUpToken.symbol] || TOPUP_LIMITS.IDRX;
  const isBelowMin = hasValidAmount && numericAmount < limits.min;
  const isAboveMax = hasValidAmount && numericAmount > limits.max;
  const isOutOfRange = isBelowMin || isAboveMax;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        tokenMenuRef.current &&
        !tokenMenuRef.current.contains(event.target as Node)
      ) {
        setIsTokenMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setPaymentUrl(null);
    setReference(null);
  }, [topUpToken]);

  const loadHistory = useCallback(
    async (page: number = 1) => {
    if (!smartAccountAddress) {
      setHistory([]);
      setHistoryPage(1);
      setHistoryPageCount(0);
      return;
    }

    setIsLoadingHistory(true);
    try {
      const response = await fetch(
        `/api/idrx/transaction-history?transactionType=MINT&walletAddress=${smartAccountAddress}&page=${page}&take=${HISTORY_TAKE}&requestType=idrx`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch transaction history.");
      }
      const result = await response.json();
      const data = result?.data;
      const records = Array.isArray(data) ? data : data?.records || [];
      const metadata = !Array.isArray(data) ? data?.metadata : null;
      setHistory(records);
      setHistoryPage(page);
      setHistoryPageCount(metadata?.pageCount || 0);
    } catch (err) {
      setHistory([]);
      setErrorModal({
        isOpen: true,
        title: "History Error",
        message:
          err instanceof Error ? err.message : "Failed to load transaction history",
        onRetry: () => loadHistory(page),
      });
    } finally {
      setIsLoadingHistory(false);
    }
    },
    [smartAccountAddress],
  );

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const hasNextPage = historyPageCount
    ? historyPage < historyPageCount
    : history.length === HISTORY_TAKE;

  const handleCreatePayment = async () => {
    if (!smartAccountAddress) return;

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setErrorModal({
        isOpen: true,
        title: "Invalid Amount",
        message: "Please enter a valid top up amount.",
      });
      return;
    }
    if (numericAmount < limits.min || numericAmount > limits.max) {
      setErrorModal({
        isOpen: true,
        title: "Amount Out of Range",
        message: `Allowed range: ${limits.min.toLocaleString()} - ${limits.max.toLocaleString()} ${topUpToken.symbol}.`,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      let amountToMint = amount;
      if (topUpToken.symbol === "USDC") {
        const idrxToken = currencies.find((token) => token.symbol === "IDRX");
        if (!idrxToken) {
          throw new Error("IDRX token configuration is missing.");
        }
        const amountRaw = parseUnits(amount, topUpToken.decimals);
        const converted = (await publicClient.readContract({
          address: STABLECOIN_REGISTRY_ADDRESS,
          abi: STABLECOIN_REGISTRY_ABI,
          functionName: "convert",
          args: [
            topUpToken.tokenAddress as Address,
            idrxToken.tokenAddress as Address,
            amountRaw,
          ],
        })) as bigint;
        amountToMint = formatUnits(converted, idrxToken.decimals);
      }

      const response = await fetch("/api/idrx/mint-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountToMint,
          walletAddress: smartAccountAddress,
          token: topUpToken.symbol.toLowerCase(),
        }),
      });
      const result = await response.json();
      if (!response.ok || !result?.paymentUrl) {
        throw new Error(result?.error || "Failed to create payment request.");
      }

      setPaymentUrl(result.paymentUrl);
      setReference(result.reference || null);
      window.open(result.paymentUrl, "_blank", "noopener,noreferrer");
      setAmount("");
      await loadHistory();
    } catch (err) {
      setErrorModal({
        isOpen: true,
        title: "Top Up Error",
        message:
          err instanceof Error ? err.message : "Failed to create payment request",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isReady && !smartAccountAddress) {
    return (
      <div className="p-6 text-center">
        <p className="text-zinc-400">Connect wallet to top up IDRX</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <label className="text-zinc-400 text-sm">Receive as</label>
        <div ref={tokenMenuRef} className="relative">
          <button
            type="button"
            onClick={() => setIsTokenMenuOpen(!isTokenMenuOpen)}
            className="w-full flex items-center justify-between p-4 bg-zinc-800 rounded-xl border border-zinc-700 hover:border-zinc-600 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center overflow-hidden">
                <Image
                  src={topUpToken.icon}
                  alt={topUpToken.name}
                  width={40}
                  height={40}
                  className="object-cover"
                />
              </div>
              <div className="text-left">
                <p className="text-white font-medium">{topUpToken.name}</p>
                <p className="text-zinc-400 text-sm">{topUpToken.symbol}</p>
              </div>
            </div>
            <ChevronDown
              className={`text-zinc-400 transition-transform ${
                isTokenMenuOpen ? "rotate-180" : ""
              }`}
              size={20}
            />
          </button>
          {isTokenMenuOpen && (
            <div className="absolute z-50 w-full mt-2 bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden shadow-xl max-h-64 overflow-y-auto">
              {topUpTokens.map((token) => (
                <button
                  key={token.id}
                  type="button"
                  onClick={() => {
                    setTopUpToken(token);
                    setIsTokenMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 p-4 hover:bg-zinc-700 transition-colors cursor-pointer ${
                    topUpToken.id === token.id ? "bg-zinc-700" : ""
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-zinc-600 flex items-center justify-center overflow-hidden">
                    <Image
                      src={token.icon}
                      alt={token.name}
                      width={40}
                      height={40}
                      className="object-cover"
                    />
                  </div>
                  <div className="text-left">
                    <p className="text-white font-medium">{token.name}</p>
                    <p className="text-zinc-400 text-sm">{token.symbol}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-zinc-400 text-sm">
          Top Up Amount ({topUpToken.symbol})
        </label>
        <input
          type="text"
          inputMode="decimal"
          placeholder="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white text-xl outline-none focus:border-primary"
        />
        {amount && (
          <div className="text-xs text-zinc-400">
            {formattedAmount} {topUpToken.symbol}
          </div>
        )}
        {isBelowMin && (
          <div className="text-xs text-orange-400">
            Below minimum: {limits.min.toLocaleString()} {topUpToken.symbol}
          </div>
        )}
        {isAboveMax && (
          <div className="text-xs text-orange-400">
            Above maximum: {limits.max.toLocaleString()} {topUpToken.symbol}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <span className="text-zinc-400 text-sm">Destination Wallet</span>
        <div className="p-3 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-zinc-300 break-all font-mono">
          {smartAccountAddress || "-"}
        </div>
      </div>

      {paymentUrl && (
        <div className="p-4 bg-zinc-800/60 border border-zinc-700 rounded-xl space-y-2">
          <div className="text-sm text-zinc-200">Payment link created</div>
          {reference && (
            <div className="text-xs text-zinc-400">
              Reference: <span className="font-mono">{reference}</span>
            </div>
          )}
          <button
            onClick={() => window.open(paymentUrl, "_blank", "noopener,noreferrer")}
            className="inline-flex items-center gap-2 text-primary text-sm hover:text-primary/80"
          >
            Open payment page <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      )}

      <button
        onClick={handleCreatePayment}
        disabled={
          !smartAccountAddress || isSubmitting || !hasValidAmount || isOutOfRange
        }
        className="w-full py-4 bg-primary text-black font-bold text-xl rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "CREATING LINK..." : "TOP UP IDRX"}
      </button>

      <div className="border-t border-zinc-800 pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-zinc-400 text-sm">Recent top ups</span>
          <button
            onClick={() => loadHistory(historyPage)}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            title="Refresh"
            disabled={isLoadingHistory}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {isLoadingHistory ? (
          <div className="flex items-center gap-2 text-zinc-400 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading history...
          </div>
        ) : history.length === 0 ? (
          <div className="text-zinc-500 text-sm">No top ups yet</div>
        ) : (
          <>
            <div className="divide-y divide-zinc-800">
              {history.map((item) => {
                const status = item.paymentStatus || item.userMintStatus || "-";
                const createdAt = item.createdAt
                  ? new Date(item.createdAt).toLocaleString()
                  : "-";
                const amountValue = Number(item.toBeMinted || 0);
                const amountLabel = Number.isFinite(amountValue)
                  ? amountValue.toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })
                  : item.toBeMinted;
                const rawToken = (item.requestType || "idrx").toLowerCase();
                const recordToken =
                  rawToken === "usdt" ? "USDC" : rawToken.toUpperCase();

                return (
                  <div key={item.reference} className="py-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-white">
                        {amountLabel} {recordToken}
                      </span>
                      <span className="text-xs text-zinc-400">{status}</span>
                    </div>
                    <div className="text-xs text-zinc-500">
                      {item.reference} • {createdAt}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between pt-3 text-xs text-zinc-400">
              <button
                onClick={() => loadHistory(Math.max(1, historyPage - 1))}
                disabled={historyPage <= 1 || isLoadingHistory}
                className="px-3 py-1 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Prev
              </button>
              <span>
                Page {historyPage}
                {historyPageCount ? ` of ${historyPageCount}` : ""}
              </span>
              <button
                onClick={() => loadHistory(historyPage + 1)}
                disabled={!hasNextPage || isLoadingHistory}
                className="px-3 py-1 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>

      <Modal
        id="idrx-topup-error-modal"
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
