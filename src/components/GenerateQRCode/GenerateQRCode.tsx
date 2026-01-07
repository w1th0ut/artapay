"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import ClosedQRCode from "./ClosedQRCode";
import GeneratedQRCode from "./GeneratedQRCode";
import { CurrencyDropdown, Currency, currencies } from "@/components/Currency";
import { useSmartAccount } from "@/hooks/useSmartAccount";
import { PAYMENT_PROCESSOR_ADDRESS } from "@/config/constants";
import { LISK_SEPOLIA } from "@/config/chains";
import { parseUnits, keccak256, encodeAbiParameters, toHex } from "viem";

interface PaymentRequestPayload {
  version: "artapay-payment-v2";
  processor: string;
  chainId: number;
  request: {
    recipient: string;
    requestedToken: string;
    requestedAmountRaw: string;
    deadline: number;
    nonce: `0x${string}`;
    merchantSigner: string;
  };
  signature: `0x${string}`;
}

export default function GenerateQRCode() {
  const [currency, setCurrency] = useState<Currency>(currencies[0]);
  const [amount, setAmount] = useState<number>(0);
  const [generatedPayload, setGeneratedPayload] =
    useState<PaymentRequestPayload | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    smartAccountAddress,
    eoaAddress,
    signMessageWithEOA,
    isLoading,
    isReady,
    status,
  } = useSmartAccount();

  // Reset generated QR when user logs out or changes account
  useEffect(() => {
    if (!smartAccountAddress) {
      setGeneratedPayload(null);
      setAmount(0);
      setError(null);
    }
  }, [smartAccountAddress]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (amount <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    if (!smartAccountAddress || !eoaAddress) {
      setError("Please connect wallet first");
      return;
    }

    setIsGenerating(true);

    try {
      const requestedAmountRaw = parseUnits(
        amount.toString(),
        currency.decimals
      );
      const deadline = Math.floor(Date.now() / 1000) + 5 * 60; // 5 minutes
      const nonce = toHex(
        crypto.getRandomValues(new Uint8Array(32))
      ) as `0x${string}`;

      // Create hash for signing
      const hash = keccak256(
        encodeAbiParameters(
          [
            { name: "processor", type: "address" },
            { name: "chainId", type: "uint256" },
            { name: "recipient", type: "address" },
            { name: "requestedToken", type: "address" },
            { name: "requestedAmount", type: "uint256" },
            { name: "deadline", type: "uint256" },
            { name: "nonce", type: "bytes32" },
            { name: "merchantSigner", type: "address" },
          ],
          [
            PAYMENT_PROCESSOR_ADDRESS as `0x${string}`,
            BigInt(LISK_SEPOLIA.id),
            smartAccountAddress,
            currency.tokenAddress as `0x${string}`,
            requestedAmountRaw,
            BigInt(deadline),
            nonce,
            eoaAddress,
          ]
        )
      );

      // Sign with EOA
      const signature = (await signMessageWithEOA(
        hash as `0x${string}`
      )) as `0x${string}`;

      const payload: PaymentRequestPayload = {
        version: "artapay-payment-v2",
        processor: PAYMENT_PROCESSOR_ADDRESS,
        chainId: LISK_SEPOLIA.id,
        request: {
          recipient: smartAccountAddress,
          requestedToken: currency.tokenAddress,
          requestedAmountRaw: requestedAmountRaw.toString(),
          deadline,
          nonce,
          merchantSigner: eoaAddress,
        },
        signature,
      };

      setGeneratedPayload(payload);
    } catch (err) {
      console.error("Generate error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to generate QR code"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBack = () => {
    setGeneratedPayload(null);
    setError(null);
  };

  if (generatedPayload) {
    return <GeneratedQRCode data={generatedPayload} onBack={handleBack} />;
  }

  return (
    <div className="flex flex-col items-center gap-6 p-6">
      {/* Connection Warning - only show after isReady */}
      {isReady && !smartAccountAddress && (
        <div className="w-full max-w-sm p-3 bg-yellow-500/20 border border-yellow-500 rounded-lg text-yellow-400 text-sm text-center">
          Connect wallet to generate payment QR codes
        </div>
      )}

      <ClosedQRCode />

      <form onSubmit={handleGenerate} className="w-full max-w-sm space-y-6">
        {/* Receive As (Currency Dropdown) */}
        <div className="space-y-2">
          <label className="text-white font-medium">Receive as</label>
          <CurrencyDropdown value={currency} onChange={setCurrency} />
        </div>

        {/* Amount Input */}
        <div className="space-y-2">
          <label className="text-white font-medium">Amount</label>
          <input
            type="number"
            value={amount || ""}
            onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
            placeholder="0"
            min="0"
            step="0.000001"
            className="w-full p-4 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {/* Status Message */}
        {(isGenerating || isLoading) && (
          <div className="flex items-center justify-center gap-2 text-primary text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            {status || "Generating..."}
          </div>
        )}

        {/* Generate Button */}
        <button
          type="submit"
          disabled={!smartAccountAddress || isGenerating || isLoading}
          className="w-full py-4 bg-primary text-black font-bold text-xl rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? "GENERATING..." : "GENERATE QR"}
        </button>
      </form>
    </div>
  );
}
