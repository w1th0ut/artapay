"use client";

import { useState, useEffect, useCallback } from 'react';
import { ArrowUpDown } from 'lucide-react';
import { Currency, currencies } from '@/components/Currency';
import CurrencyBadge from './CurrencyBadge';
import CurrencyModal from './CurrencyModal';
import { getSwapResult, formatNumber, SwapResult } from './GetSwapToken';
import { ReceiptPopUp, ReceiptData } from '@/components/ReceiptPopUp';

export default function SwapToken() {
  const [fromCurrency, setFromCurrency] = useState<Currency>(currencies[0]); // USDC
  const [toCurrency, setToCurrency] = useState<Currency>(currencies[2]);     // IDRX
  const [amount, setAmount] = useState<string>('');
  const [swapResult, setSwapResult] = useState<SwapResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  
  // Modal states
  const [showFromModal, setShowFromModal] = useState(false);
  const [showToModal, setShowToModal] = useState(false);

  // Debounced calculation - triggers 1 second after user stops typing
  useEffect(() => {
    const numAmount = parseFloat(amount);
    
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      setSwapResult(null);
      return;
    }
    setIsCalculating(true);
    const timer = setTimeout(() => {
      const result = getSwapResult(fromCurrency, toCurrency, numAmount);
      setSwapResult(result);
      setIsCalculating(false);
    }, 1000); // 1 second delay
    return () => clearTimeout(timer);
  }, [amount, fromCurrency, toCurrency]);

  // Swap currencies
  const handleSwapCurrencies = useCallback(() => {
    const temp = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(temp);
  }, [fromCurrency, toCurrency]);

  // Handle swap action
  const handleSwapNow = async () => {
    if (!swapResult) return;
    
    console.log('Swapping:', {
      from: fromCurrency.symbol,
      to: toCurrency.symbol,
      amount: parseFloat(amount),
      result: swapResult,
    });
    
    // TODO: Implement actual swap logic
    // const txHash = await executeSwap(...);
    
    // Hardcoded receipt for testing
    const receiptData: ReceiptData = {
      id: '1',
      type: 'swap',
      status: 'success', // or 'failed'
      timestamp: new Date(),
      amount: parseFloat(amount),
      currency: fromCurrency.symbol,
      currencyIcon: fromCurrency.icon,
      swapToAmount: swapResult.convertedAmount,
      swapToCurrency: toCurrency.symbol,
      swapToCurrencyIcon: toCurrency.icon,
    };
    
    setReceipt(receiptData);
    setShowReceipt(true);
    
    // Reset form
    setAmount('');
    setSwapResult(null);
  };
  
  return (
    <div className="p-6 space-y-6">
      {/* From Currency Input */}
      <div className="flex items-center justify-between gap-4">
        <input
          type="text"
          inputMode="decimal"
          value={amount}
          onChange={(e) => {
            // Only allow numbers and decimal point
            const value = e.target.value.replace(/[^0-9.]/g, '');
            setAmount(value);
          }}
          placeholder="0"
          className="flex-1 bg-transparent text-white text-4xl font-light outline-none placeholder-zinc-600"
        />
        <CurrencyBadge 
          currency={fromCurrency} 
          onClick={() => setShowFromModal(true)} 
        />
      </div>
      {/* Swap Direction Button */}
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-zinc-700" />
        </div>
        <button
          onClick={handleSwapCurrencies}
          className="relative z-10 p-2 bg-zinc-800 rounded-full border border-zinc-700 hover:border-zinc-500 transition-colors"
        >
          <ArrowUpDown size={20} className="text-zinc-400" />
        </button>
      </div>
      {/* To Currency Output */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 text-4xl font-light">
          {isCalculating ? (
            <span className="text-zinc-500">Calculating...</span>
          ) : swapResult ? (
            <span className="text-white">{formatNumber(swapResult.convertedAmount)}</span>
          ) : (
            <span className="text-zinc-600">0</span>
          )}
        </div>
        <CurrencyBadge 
          currency={toCurrency} 
          onClick={() => setShowToModal(true)} 
        />
      </div>
      {/* Rate and Fee - Only show when result is available */}
      {swapResult && !isCalculating && (
        <div className="space-y-2 pt-4">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Rate</span>
            <span className="text-white">
              1 {fromCurrency.symbol} = {formatNumber(swapResult.rate)} {toCurrency.symbol}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Fee</span>
            <span className="text-primary">
              {formatNumber(swapResult.fee)} {fromCurrency.symbol}
            </span>
          </div>
        </div>
      )}
      {/* Swap Button - Only show when result is available */}
      {swapResult && !isCalculating && (
        <button
          onClick={handleSwapNow}
          className="w-full py-4 bg-primary text-black font-bold text-xl rounded-xl hover:bg-primary/90 transition-colors"
        >
          SWAP NOW
        </button>
      )}
      {/* Currency Selection Modals */}
      <CurrencyModal
        isOpen={showFromModal}
        onClose={() => setShowFromModal(false)}
        onSelect={setFromCurrency}
        excludeCurrency={toCurrency}
      />
      <CurrencyModal
        isOpen={showToModal}
        onClose={() => setShowToModal(false)}
        onSelect={setToCurrency}
        excludeCurrency={fromCurrency}
      />

      <ReceiptPopUp 
        isOpen={showReceipt} 
        data={receipt} 
        onClose={() => setShowReceipt(false)} 
      />

    </div>
  );
}
