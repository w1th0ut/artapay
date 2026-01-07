"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { QRCodeSVG } from 'qrcode.react';
import { Currency } from '@/components/Currency';

interface QRData {
  app: string;
  type: string;
  chainId: number;
  tokenAddress: string;
  receiver: string;
  amount: number;
  symbol: string;
  transactionId: string;
  expiresAt: number;
}

interface GeneratedQRCodeProps {
  data: QRData;
  currency: Currency;
  onBack: () => void;
  onExpired: () => void;
}

// QR expires after 2 minutes (120 seconds)
const EXPIRY_DURATION = 120;

export default function GeneratedQRCode({ data, currency, onBack, onExpired }: GeneratedQRCodeProps) {
  const [timeLeft, setTimeLeft] = useState(EXPIRY_DURATION);
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [onExpired]);
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} min ${secs.toString().padStart(2, '0')} sec`;
  };
  const qrValue = JSON.stringify(data);
  return (
    <div className="flex flex-col items-center gap-6 p-6">
      {/* QR Code */}
      <div className="p-6 bg-zinc-800 rounded-2xl border-2 border-zinc-700">
        <QRCodeSVG 
          value={qrValue} 
          size={200} 
          bgColor="transparent"
          fgColor="#6b7280"
        />
      </div>
      
      {/* Transaction Info */}
      <div className="w-full max-w-sm space-y-4">
        {/* Receive As */}
        <div className="flex justify-between items-center">
          <span className="text-zinc-400">Receive as</span>
          <div className="flex items-center gap-2">
            <Image src={currency.icon} alt={currency.name} width={24} height={24} className="rounded-full" />
            <div className="text-right">
              <p className="text-white font-medium">{currency.name}</p>
              <p className="text-zinc-400 text-sm">{currency.symbol}</p>
            </div>
          </div>
        </div>
        {/* Amount */}
        <div className="flex justify-between items-center">
          <span className="text-zinc-400">Amount</span>
          <span className="text-white font-bold">{data.amount}</span>
        </div>
        {/* Expired In */}
        <div className="flex justify-between items-center">
          <span className="text-zinc-400">Expired in</span>
          <span className={`font-medium ${timeLeft < 30 ? 'text-red-500' : 'text-primary'}`}>
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>
      {/* Cancel Button */}
      <button
        onClick={onBack}
        className="w-full max-w-sm py-4 bg-zinc-700 text-accent font-bold text-xl rounded-xl hover:bg-zinc-600 transition-colors"
      >
        CANCEL
      </button>
    </div>
  );
}

/**
 * Generate unique transaction ID with timestamp
 * This creates a unique ID for each QR generation period
 */
export function generateTransactionId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `tx_${timestamp}_${random}`;
}
/**
 * Calculate expiry timestamp
 */
export function getExpiryTimestamp(): number {
  return Date.now() + (EXPIRY_DURATION * 1000);
}
