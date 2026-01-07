"use client";
import { useState } from "react";
import ClosedCamera from "./ClosedCamera";
import OpenCamera from "./OpenCamera";
import ImportFromGallery from "./ImportFromGallery";
import TransactionPopup from "./TransactionPopup";
import { PAYMENT_PROCESSOR_ADDRESS } from "@/config/constants";
import { LISK_SEPOLIA } from "@/config/chains";

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

interface QRCodeProps {
  onScanResult?: (result: string) => void;
}

export default function QRCode({ onScanResult }: QRCodeProps) {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [scannedPayload, setScannedPayload] =
    useState<PaymentRequestPayload | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const handleScanNow = () => {
    setIsCameraOpen(true);
    setImportError(null);
  };

  const handleBack = () => {
    setIsCameraOpen(false);
  };

  const processQRData = (result: string) => {
    try {
      const data = JSON.parse(result);

      // Validate ArtaPay payment request format
      if (data.version !== "artapay-payment-v2") {
        throw new Error("Invalid QR format - not an ArtaPay payment request");
      }

      if (
        !data.request?.requestedToken ||
        !data.request?.recipient ||
        !data.signature
      ) {
        throw new Error("QR data incomplete");
      }

      // Validate chain and processor
      if (data.chainId !== LISK_SEPOLIA.id) {
        throw new Error(
          `Wrong network. Expected Lisk Sepolia (${LISK_SEPOLIA.id})`
        );
      }

      // Check deadline
      if (
        data.request.deadline &&
        data.request.deadline < Math.floor(Date.now() / 1000)
      ) {
        throw new Error("Payment request has expired");
      }

      const payload: PaymentRequestPayload = {
        version: data.version,
        processor: data.processor || PAYMENT_PROCESSOR_ADDRESS,
        chainId: data.chainId,
        request: {
          recipient: data.request.recipient,
          requestedToken: data.request.requestedToken,
          requestedAmountRaw: data.request.requestedAmountRaw,
          deadline: data.request.deadline,
          nonce: data.request.nonce,
          merchantSigner: data.request.merchantSigner,
        },
        signature: data.signature,
      };

      setScannedPayload(payload);
      setIsCameraOpen(false);
      setImportError(null);
      onScanResult?.(result);
    } catch (e) {
      console.error("Invalid QR data:", e);
      setImportError(e instanceof Error ? e.message : "Invalid QR Code format");
    }
  };

  const handleScan = (result: string) => {
    processQRData(result);
  };

  const handleImport = (result: string) => {
    processQRData(result);
  };

  const handleImportError = (error: string) => {
    setImportError(error);
  };

  const handleCancel = () => {
    setScannedPayload(null);
  };

  // Show transaction popup if data scanned
  if (scannedPayload) {
    return (
      <TransactionPopup payload={scannedPayload} onCancel={handleCancel} />
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 p-6">
      {isCameraOpen ? (
        <OpenCamera onScan={handleScan} onBack={handleBack} />
      ) : (
        <>
          <ClosedCamera onScanNow={handleScanNow} />

          <p className="text-accent">or</p>

          <ImportFromGallery
            onImport={handleImport}
            onError={handleImportError}
          />

          {/* Error Message */}
          {importError && (
            <div className="p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-400 text-sm text-center max-w-sm">
              {importError}
            </div>
          )}
        </>
      )}
    </div>
  );
}
