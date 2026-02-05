"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPublicClient, http, type Address } from "viem";
import { CheckCircle, Loader2 } from "lucide-react";
import { useSmartAccount } from "@/hooks/useSmartAccount";
import { BASE_SEPOLIA } from "@/config/chains";
import { DEFAULT_TOKEN_SYMBOL, QRIS_REGISTRY_ADDRESS } from "@/config/constants";
import { QRIS_REGISTRY_ABI } from "@/config/abi";
import { currencies } from "@/components/Currency";
import { parseQrisPayload, type QrisParseResult } from "@/lib/qris";
import Modal from "@/components/Modal";
import ClosedCamera from "@/components/ScanQRCode/ClosedCamera";
import OpenCamera from "@/components/ScanQRCode/OpenCamera";
import ImportFromGallery from "@/components/ScanQRCode/ImportFromGallery";

type QrisInfo = {
  qrisHash: string;
  sa: string;
  merchantName: string;
  merchantId: string;
  merchantCity: string;
  active: boolean;
};

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export default function ProfileContent() {
  const {
    smartAccountAddress,
    isReady,
    registerQris,
    isLoading,
    status,
  } = useSmartAccount();
  const publicClient = useMemo(
    () =>
      createPublicClient({
        chain: BASE_SEPOLIA,
        transport: http(BASE_SEPOLIA.rpcUrls.default.http[0]),
      }),
    [],
  );

  const defaultGasToken =
    currencies.find((c) => c.symbol === DEFAULT_TOKEN_SYMBOL) || currencies[0];

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [parsedQris, setParsedQris] = useState<QrisParseResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [qrisInfo, setQrisInfo] = useState<QrisInfo | null>(null);
  const [isWhitelisted, setIsWhitelisted] = useState<boolean | null>(null);
  const [isLoadingInfo, setIsLoadingInfo] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const [successTx, setSuccessTx] = useState<string | null>(null);
  const [errorModal, setErrorModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({ isOpen: false, title: "", message: "" });

  const handleParsed = useCallback((payload: string) => {
    try {
      const parsed = parseQrisPayload(payload);
      if (!parsed.merchantName || !parsed.merchantId) {
        throw new Error("QRIS merchant name/ID not found");
      }
      setParsedQris(parsed);
      setParseError(null);
      setIsCameraOpen(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Invalid QRIS payload";
      setParsedQris(null);
      setParseError(message);
      setErrorModal({
        isOpen: true,
        title: "Invalid QRIS",
        message,
      });
    }
  }, []);

  const handleScanNow = () => {
    setIsCameraOpen(true);
  };

  const handleBack = () => {
    setIsCameraOpen(false);
  };

  const loadRegistryInfo = useCallback(async () => {
    if (!smartAccountAddress) {
      setQrisInfo(null);
      setIsWhitelisted(null);
      return;
    }

    setIsLoadingInfo(true);
    try {
      const [info, whitelist] = await Promise.all([
        publicClient.readContract({
          address: QRIS_REGISTRY_ADDRESS,
          abi: QRIS_REGISTRY_ABI,
          functionName: "getQrisBySa",
          args: [smartAccountAddress],
        }) as Promise<QrisInfo>,
        publicClient.readContract({
          address: QRIS_REGISTRY_ADDRESS,
          abi: QRIS_REGISTRY_ABI,
          functionName: "isWhitelisted",
          args: [smartAccountAddress],
        }) as Promise<boolean>,
      ]);

      setQrisInfo(info);
      setIsWhitelisted(whitelist);
    } catch (err) {
      console.error("Failed to load QRIS registry:", err);
      setQrisInfo(null);
      setIsWhitelisted(null);
    } finally {
      setIsLoadingInfo(false);
    }
  }, [publicClient, smartAccountAddress]);

  useEffect(() => {
    loadRegistryInfo();
  }, [loadRegistryInfo]);

  const isRegistered = Boolean(qrisInfo?.active && qrisInfo.sa !== ZERO_ADDRESS);
  const isWhitelistReady = isWhitelisted === true;

  const canRegister =
    !!smartAccountAddress &&
    isWhitelistReady &&
    !isRegistered &&
    !!parsedQris &&
    !parseError;

  const handleRegister = async () => {
    if (!parsedQris || !smartAccountAddress) return;

    setIsRegistering(true);
    try {
      const txHash = await registerQris({
        qrisHash: parsedQris.hash,
        merchantName: parsedQris.merchantName,
        merchantId: parsedQris.merchantId,
        merchantCity: parsedQris.merchantCity,
        feeToken: defaultGasToken.tokenAddress as Address,
        feeTokenDecimals: defaultGasToken.decimals,
      });
      setSuccessTx(txHash);
      await loadRegistryInfo();
    } catch (err) {
      setErrorModal({
        isOpen: true,
        title: "QRIS Registration Failed",
        message:
          err instanceof Error ? err.message : "Failed to register QRIS",
      });
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl space-y-3">
        <h2 className="text-sm font-semibold text-white">Smart Account</h2>
        {isReady && !smartAccountAddress && (
          <div className="p-3 bg-yellow-500/20 border border-yellow-500 rounded-lg text-yellow-400 text-sm text-center">
            Connect wallet to view Smart Account
          </div>
        )}
        <div className="text-xs text-zinc-400">Address</div>
        <div className="p-3 bg-zinc-800/60 rounded-xl border border-zinc-700 font-mono text-xs text-zinc-200 break-all">
          {smartAccountAddress || "-"}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl space-y-3">
          <h3 className="text-sm font-semibold text-white">QRIS Registry</h3>
          {isLoadingInfo ? (
            <div className="flex items-center gap-2 text-zinc-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading registry...
            </div>
          ) : (
            <>
              <StatusRow label="Whitelist" value={isWhitelisted} />
              <StatusRow label="Registered" value={isRegistered} />
            </>
          )}
        </div>

        <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl space-y-3">
          <h3 className="text-sm font-semibold text-white">Registered QRIS</h3>
          {isRegistered ? (
            <div className="space-y-2 text-xs">
              <InfoRow label="Merchant" value={qrisInfo?.merchantName || "-"} />
              <InfoRow label="Merchant ID" value={qrisInfo?.merchantId || "-"} />
              <InfoRow
                label="City"
                value={qrisInfo?.merchantCity || "-"}
              />
              <InfoRow
                label="Hash"
                value={qrisInfo?.qrisHash || "-"}
                mono
              />
            </div>
          ) : (
            <div className="text-xs text-zinc-500">
              No QRIS registered yet.
            </div>
          )}
        </div>
      </div>

      <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Register QRIS</h3>
          {isWhitelisted === false && (
            <span className="text-[11px] text-orange-300 border border-orange-400/40 px-2 py-0.5 rounded-full">
              Require whitelist
            </span>
          )}
        </div>

        {isCameraOpen ? (
          <OpenCamera
            onScan={handleParsed}
            onBack={handleBack}
            onError={(err) =>
              setErrorModal({
                isOpen: true,
                title: "Camera Error",
                message: err.message,
              })
            }
          />
        ) : (
          <div className="space-y-3">
            <ClosedCamera onScanNow={handleScanNow} disabled={isRegistered} />
            <p className="text-accent text-sm text-center">or</p>
            <ImportFromGallery
              onImport={handleParsed}
              disabled={isRegistered}
              onError={(err) =>
                setErrorModal({
                  isOpen: true,
                  title: "Import Failed",
                  message: err,
                })
              }
            />
            {parseError && (
              <div className="text-xs text-red-400 text-center">
                {parseError}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <PreviewCard label="Merchant name" value={parsedQris?.merchantName} />
          <PreviewCard label="Merchant ID" value={parsedQris?.merchantId} />
          <PreviewCard label="Merchant city" value={parsedQris?.merchantCity} />
          <PreviewCard label="Hash" value={parsedQris?.hash} mono />
        </div>

        <div className="text-[11px] text-zinc-500">
          Only whitelisted Smart Accounts can register QRIS. Please submit your
          verification through internal process if needed.
        </div>

        <button
          type="button"
          onClick={handleRegister}
          disabled={!canRegister || isRegistering || isLoading}
          className="w-full py-3 rounded-xl bg-primary text-black font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRegistering || isLoading ? "REGISTERING..." : "REGISTER QRIS"}
        </button>

        {(isRegistering || isLoading) && status && (
          <div className="text-xs text-primary text-center">{status}</div>
        )}
      </div>

      <Modal
        id="qris-register-success"
        role="dialog"
        aria-modal={true}
        aria-labelledby="qris-success-title"
        aria-describedby="qris-success-desc"
        tabIndex={-1}
        isOpen={!!successTx}
        onClose={() => setSuccessTx(null)}
        title="QRIS Registered"
        message="Registration submitted."
        variant="success"
        icon={<CheckCircle className="w-8 h-8 text-emerald-400" />}
      />

      <Modal
        id="qris-register-error"
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
    </div>
  );
}

function StatusRow({ label, value }: { label: string; value: boolean | null }) {
  if (value === null) {
    return (
      <div className="text-xs text-zinc-500 flex items-center justify-between">
        <span>{label}</span>
        <span>-</span>
      </div>
    );
  }
  return (
    <div className="text-xs flex items-center justify-between">
      <span className="text-zinc-400">{label}</span>
      <span className={value ? "text-green-400" : "text-red-400"}>
        {value ? "Yes" : "No"}
      </span>
    </div>
  );
}

function InfoRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-zinc-400">{label}</span>
      <span
        className={`text-white text-right ${mono ? "font-mono break-all" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}

function PreviewCard({
  label,
  value,
  mono,
}: {
  label: string;
  value?: string;
  mono?: boolean;
}) {
  return (
    <div className="p-3 bg-zinc-800/60 border border-zinc-700 rounded-xl space-y-1">
      <div className="text-[11px] text-zinc-400">{label}</div>
      <div
        className={`text-xs text-zinc-100 ${
          mono ? "font-mono break-all whitespace-normal text-[10px]" : ""
        }`}
      >
        {value || "-"}
      </div>
    </div>
  );
}
