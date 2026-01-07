"use client";

import { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Download } from "lucide-react";
import { currencies } from "@/components/Currency";
import { formatUnits } from "viem";

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

interface GeneratedQRCodeProps {
  data: PaymentRequestPayload;
  onBack: () => void;
}

export default function GeneratedQRCode({
  data,
  onBack,
}: GeneratedQRCodeProps) {
  const qrRef = useRef<HTMLDivElement>(null);
  const qrValue = JSON.stringify(data);

  // Find currency info from token address
  const currency = currencies.find(
    (c) =>
      c.tokenAddress.toLowerCase() === data.request.requestedToken.toLowerCase()
  );

  const displayAmount = currency
    ? Number(
        formatUnits(BigInt(data.request.requestedAmountRaw), currency.decimals)
      ).toLocaleString(undefined, { maximumFractionDigits: 6 })
    : data.request.requestedAmountRaw;

  const symbol = currency?.symbol || "Token";

  const handleDownload = () => {
    if (!qrRef.current) return;

    const svg = qrRef.current.querySelector("svg");
    if (!svg) return;

    // Create canvas
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size with padding
    const size = 300;
    const padding = 30;
    canvas.width = size + padding * 2;
    canvas.height = size + padding * 2;

    // Fill white background
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Convert SVG to image
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], {
      type: "image/svg+xml;charset=utf-8",
    });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, padding, padding, size, size);
      URL.revokeObjectURL(url);

      // Download
      const link = document.createElement("a");
      link.download = `artapay-qr-${displayAmount}-${symbol}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = url;
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div ref={qrRef} className="p-6 bg-white rounded-2xl">
        <QRCodeSVG value={qrValue} size={200} />
      </div>
      <div className="text-center">
        <p className="text-white font-medium">Scan to pay</p>
        <p className="text-primary text-2xl font-bold">
          {displayAmount} {symbol}
        </p>
        <p className="text-zinc-400 text-sm mt-2">Expires in 5 minutes</p>
      </div>

      <div className="flex gap-3 w-full max-w-sm">
        <button
          onClick={handleDownload}
          className="flex-1 py-4 bg-primary text-black font-bold text-xl rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
        >
          <Download className="w-5 h-5" />
          SAVE QR
        </button>
      </div>

      <button
        onClick={onBack}
        className="w-full max-w-sm py-4 border-2 border-accent text-accent font-bold text-xl rounded-xl hover:bg-accent/10 transition-colors"
      >
        BACK
      </button>
    </div>
  );
}
