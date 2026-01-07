"use client";

import Image from 'next/image';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { ReceiptData, formatReceiptDate, formatReceiptTime, shortenAddress } from './Receipt';
import SuccessIcon from '@/assets/Success.svg';

interface SuccessReceiptProps {
  data: ReceiptData;
  onContinue: () => void;
}

export default function SuccessReceipt({ data, onContinue }: SuccessReceiptProps) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    const addressToCopy = data.type === 'send' ? data.toAddress : data.fromAddress;
    if (addressToCopy) {
      await navigator.clipboard.writeText(addressToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getTransactionLabel = () => {
    switch (data.type) {
      case 'send': return 'Send Token';
      case 'receive': return 'Receive Token';
      case 'swap': return 'Swap Token';
    }
  };

  const getAddressLabel = () => {
    switch (data.type) {
      case 'send': return 'Sent to';
      case 'receive': return 'Received from';
      case 'swap': return 'Swapped via';
    }
  };

  const displayAddress = data.type === 'send' ? data.toAddress : data.fromAddress;
  
  return (
    <div className="bg-zinc-800 rounded-2xl p-8 w-full max-w-lg">
      {/* Success Icon */}
      <div className="flex flex-col items-center mb-6">
        <Image src={SuccessIcon} alt="Success" width={60} height={60} />
        <p className="text-primary font-medium mt-2">Success!</p>
      </div>
      {/* Receipt Title */}
      <h2 className="text-white text-xl font-bold text-center mb-6">
        Transaction Receipt
      </h2>
      {/* Receipt Details - Wider gap */}
      <div className="space-y-4">
        <div className="flex justify-between items-center gap-8">
          <span className="text-zinc-400">Date</span>
          <span className="text-white">{formatReceiptDate(data.timestamp)}</span>
        </div>
        <div className="flex justify-between items-center gap-8">
          <span className="text-zinc-400">Time</span>
          <span className="text-white">{formatReceiptTime(data.timestamp)}</span>
        </div>
        <div className="flex justify-between items-center gap-8">
          <span className="text-zinc-400">Transaction</span>
          <span className="text-white font-medium">{getTransactionLabel()}</span>
        </div>
        {displayAddress && (
          <div className="flex justify-between items-center gap-8">
            <span className="text-zinc-400">{getAddressLabel()}</span>
            <div className="flex items-center gap-2">
              <span className="text-white font-mono">{shortenAddress(displayAddress)}</span>
              <button onClick={handleCopy} className="text-zinc-400 hover:text-white">
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
          </div>
        )}
        <div className="flex justify-between items-center gap-8">
          <span className="text-zinc-400">Sender's currency</span>
          <div className="flex items-center gap-2">
            <Image src={data.currencyIcon} alt="" width={20} height={20} />
            <span className="text-white">{data.currency}</span>
          </div>
        </div>
        <div className="flex justify-between items-center gap-8">
          <span className="text-zinc-400">Receiver's currency</span>
          <div className="flex items-center gap-2">
            {data.type === 'swap' && data.swapToCurrencyIcon ? (
              <>
                <Image src={data.swapToCurrencyIcon} alt="" width={20} height={20} />
                <span className="text-white">{data.swapToCurrency}</span>
              </>
            ) : (
              <>
                <Image src={data.currencyIcon} alt="" width={20} height={20} />
                <span className="text-white">{data.currency}</span>
              </>
            )}
          </div>
        </div>
        {/* Separator */}
        <div className="border-t border-zinc-700 pt-4">
          <div className="flex justify-between items-center gap-8">
            <span className="text-zinc-400">Total Amount</span>
            <span>
              <span className="text-primary font-bold">{data.amount}</span>
              <span className="text-white ml-1">{data.currency}</span>
            </span>
          </div>
          {data.type === 'swap' && data.swapToAmount && (
            <div className="flex justify-between items-center gap-8 mt-2">
              <span className="text-zinc-400">Converted to</span>
              <span>
                <span className="text-primary font-bold">{data.swapToAmount}</span>
                <span className="text-white ml-1">{data.swapToCurrency}</span>
              </span>
            </div>
          )}
        </div>
      </div>
      {/* Continue Button */}
      <button
        onClick={onContinue}
        className="w-full mt-6 py-4 border-2 border-primary text-primary font-bold text-xl rounded-xl hover:bg-primary/10 transition-colors"
      >
        CONTINUE
      </button>
    </div>
  );
}
