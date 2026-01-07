"use client";

import { useState, useCallback } from 'react';
import ClosedQRCode from './ClosedQRCode';
import GeneratedQRCode, { generateTransactionId, getExpiryTimestamp } from './GeneratedQRCode';
import { CurrencyDropdown, Currency, currencies } from '@/components/Currency';
import { ReceiptPopUp, ReceiptData } from '@/components/ReceiptPopUp';

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

export default function GenerateQRCode() {
  const [currency, setCurrency] = useState<Currency>(currencies[0]);
  const [amount, setAmount] = useState<number>(0);
  const [generatedData, setGeneratedData] = useState<QRData | null>(null);
  
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  // TODO: Replace with actual wallet address from user context
  const receiverAddress = "0xb6a1c296d8e4f5a7b3c2d1e0f9a8b7c6d5e4f3a2"; 
  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    // Generate unique transaction ID and expiry time
    const transactionId = generateTransactionId();
    const expiresAt = getExpiryTimestamp();
    const qrData: QRData = {
      app: "ArtaPay",
      type: "receive",
      chainId: currency.chainId,
      tokenAddress: currency.tokenAddress,
      receiver: receiverAddress,
      amount: amount,
      symbol: currency.symbol,
      transactionId: transactionId,
      expiresAt: expiresAt,
    };
    setGeneratedData(qrData);
  };
  const handleBack = () => {
    setGeneratedData(null);
  };
  const handleExpired = useCallback(() => {
    alert('QR Code has expired. Please generate a new one.');
    setGeneratedData(null);
  }, []);
  const handleReceiveSuccess = (txHash: string, fromAddress: string) => {
    const receiptData: ReceiptData = {
      id: txHash,
      type: 'receive',
      status: 'success',
      timestamp: new Date(),
      amount: amount,
      currency: currency.symbol,
      currencyIcon: currency.icon,
      fromAddress: fromAddress,
      toAddress: receiverAddress,
      txHash: txHash,
    };
    
    setReceipt(receiptData);
    setShowReceipt(true);
    setGeneratedData(null);
  };
  const handleReceiptClose = () => {
    setShowReceipt(false);
    setReceipt(null);
    setAmount(0);
  };
  if (generatedData) {
    return (
      <>
        <GeneratedQRCode 
          data={generatedData} 
          currency={currency}
          onBack={handleBack} 
          onExpired={handleExpired}
        />
        <ReceiptPopUp 
          isOpen={showReceipt} 
          data={receipt} 
          onClose={handleReceiptClose} 
        />
      </>
    );
  }
  return (
    <div className="flex flex-col items-center gap-6 p-6">
      <ClosedQRCode />
      <form onSubmit={handleGenerate} className="w-full max-w-sm space-y-6">
        <div className="space-y-2">
          <label className="text-white font-medium">Receive as</label>
          <CurrencyDropdown value={currency} onChange={setCurrency} />
        </div>
        <div className="space-y-2">
          <label className="text-white font-medium">Amount</label>
          <input
            type="number"
            value={amount || ''}
            onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
            placeholder="0"
            min="0"
            step="0.000001"
            className="w-full p-4 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-primary transition-colors"
          />
        </div>
        <button
          type="submit"
          className="w-full py-4 bg-primary text-black font-bold text-xl rounded-xl hover:bg-primary/90 transition-colors"
        >
          GENERATE QR
        </button>
      </form>
      <ReceiptPopUp 
        isOpen={showReceipt} 
        data={receipt} 
        onClose={handleReceiptClose} 
      />
    </div>
  );
}
