"use client";
import { useState } from 'react';
import ClosedCamera from './ClosedCamera';
import OpenCamera from './OpenCamera';
import ImportFromGallery from './ImportFromGallery';
import TransactionPopup from './TransactionPopup';
import { currencies } from '@/components/Currency';
interface TransactionData {
  app: string;
  type: string;
  chainId: number;
  tokenAddress: string;
  receiver: string;
  amount: number;
  symbol: string;
}
interface QRCodeProps {
  onScanResult?: (result: string) => void;
}
export default function QRCode({ onScanResult }: QRCodeProps) {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [scannedData, setScannedData] = useState<TransactionData | null>(null);
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
      const data = JSON.parse(result) as TransactionData;
      
      // Validate required fields
      if (!data.app || !data.receiver || !data.amount) {
        throw new Error('Data QR tidak lengkap');
      }
      
      setScannedData(data);
      setIsCameraOpen(false);
      setImportError(null);
      onScanResult?.(result);
    } catch (e) {
      console.error("Invalid QR data:", e);
      setImportError('Format QR Code tidak valid untuk ArtaPay');
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
  const handleSend = () => {
    console.log("Sending transaction:", scannedData);
    // TODO: Implement actual send logic
    alert("Transaction sent!");
    setScannedData(null);
  };
  const handleCancel = () => {
    setScannedData(null);
  };
  // Show transaction popup if data scanned
  if (scannedData) {
    return (
      <TransactionPopup
        data={scannedData}
        senderCurrency={currencies[0]}
        onSend={handleSend}
        onCancel={handleCancel}
      />
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
          
          {/* Global Error for invalid QR format */}
          {importError && importError.includes('Format') && (
            <div className="p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-400 text-sm text-center max-w-sm">
              {importError}
            </div>
          )}
        </>
      )}
    </div>
  );
}
