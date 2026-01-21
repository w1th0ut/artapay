"use client";
import { useState, useEffect } from "react";
import ClosedCamera from "./ClosedCamera";
import OpenCamera from "./OpenCamera";
import ImportFromGallery from "./ImportFromGallery";
import TransactionPopup from "./TransactionPopup";
import { PAYMENT_PROCESSOR_ADDRESS } from "@/config/constants";
import { BASE_SEPOLIA } from "@/config/chains";
import { ReceiptPopUp, ReceiptData } from "@/components/ReceiptPopUp";
import Modal from "@/components/Modal";

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
  disabled?: boolean;
}

export default function QRCode({ onScanResult, disabled }: QRCodeProps) {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [scannedPayload, setScannedPayload] =
    useState<PaymentRequestPayload | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  // Error modal state
  const [errorModal, setErrorModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({ isOpen: false, title: "", message: "" });

  const handleScanNow = () => {
    if (disabled) {
      return;
    }
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
      if (data.chainId !== BASE_SEPOLIA.id) {
        throw new Error(
          `Wrong network. Expected Base Sepolia (${BASE_SEPOLIA.id})`
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
      setErrorModal({
        isOpen: true,
        title: "Invalid QR Code",
        message: e instanceof Error ? e.message : "Invalid QR Code format",
      });
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

  useEffect(() => {
    if (disabled && isCameraOpen) {
      setIsCameraOpen(false);
    }
  }, [disabled, isCameraOpen]);

  // Show transaction popup if data scanned
  if (scannedPayload) {
    return (
      <TransactionPopup payload={scannedPayload} onCancel={handleCancel} />
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      {isCameraOpen && !disabled ? (
        <OpenCamera onScan={handleScan} onBack={handleBack} />
      ) : (
        <>
          <ClosedCamera onScanNow={handleScanNow} disabled={disabled} />

          <p className="text-accent text-sm">or</p>

          <ImportFromGallery
            onImport={handleImport}
            onError={handleImportError}
            disabled={disabled}
          />
        </>
      )}
      <ReceiptPopUp
        isOpen={showReceipt}
        data={receipt}
        onClose={() => setShowReceipt(false)}
      />

      {/* Error Modal */}
      <Modal
        id="scan-error-modal"
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
