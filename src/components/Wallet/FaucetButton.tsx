"use client";

import { useCallback, useEffect, useState } from "react";
import { Droplet, Loader2 } from "lucide-react";
import { createPublicClient, http, type Address } from "viem";
import { useSmartAccount } from "@/hooks/useSmartAccount";
import { BASE_SEPOLIA } from "@/config/chains";
import { env } from "@/config/env";
import { FAUCET_ABI } from "@/config/abi";
import Modal from "@/components/Modal";

const publicClient = createPublicClient({
  chain: BASE_SEPOLIA,
  transport: http(BASE_SEPOLIA.rpcUrls.default.http[0]),
});

const FAUCET_AMOUNT = 10;

const formatCooldown = (seconds: number) => {
  const total = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
};

export default function FaucetButton() {
  const { smartAccountAddress, claimFaucet, isLoading } = useSmartAccount();
  const [cooldownRemaining, setCooldownRemaining] = useState<number | null>(
    null
  );
  const [isChecking, setIsChecking] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [errorModal, setErrorModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({ isOpen: false, title: "Faucet Error", message: "" });

  const usdcAddress = env.tokenUsdcAddress as Address;

  const refreshCooldown = useCallback(async () => {
    if (!smartAccountAddress) {
      setCooldownRemaining(null);
      return;
    }

    setIsChecking(true);
    try {
      const remaining = await publicClient.readContract({
        address: usdcAddress,
        abi: FAUCET_ABI,
        functionName: "getFaucetCooldown",
        args: [smartAccountAddress],
      });
      setCooldownRemaining(Number(remaining));
    } catch (err) {
      console.error("Failed to fetch faucet cooldown:", err);
      setCooldownRemaining(null);
    } finally {
      setIsChecking(false);
    }
  }, [smartAccountAddress, usdcAddress]);

  useEffect(() => {
    refreshCooldown();
  }, [refreshCooldown]);

  if (!smartAccountAddress) {
    return null;
  }

  const cooldownActive =
    typeof cooldownRemaining === "number" && cooldownRemaining > 0;
  const isDisabled =
    cooldownActive || isLoading || isChecking || isClaiming || !smartAccountAddress;

  const handleFaucet = async () => {
    if (!smartAccountAddress || isDisabled) return;
    setIsClaiming(true);
    try {
      await claimFaucet({
        tokenAddress: usdcAddress,
        amount: FAUCET_AMOUNT,
      });
      await refreshCooldown();
    } catch (err) {
      setErrorModal({
        isOpen: true,
        title: "Faucet Error",
        message: err instanceof Error ? err.message : "Faucet failed",
      });
    } finally {
      setIsClaiming(false);
    }
  };

  const title = cooldownActive
    ? `Faucet cooldown: ${formatCooldown(cooldownRemaining ?? 0)}`
    : `Get ${FAUCET_AMOUNT} USDC`;

  return (
    <>
      <button
        onClick={handleFaucet}
        disabled={isDisabled}
        title={title}
        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-primary text-black font-semibold rounded-lg hover:bg-primary/90 transition-colors cursor-pointer text-xs disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isClaiming || isChecking ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Droplet className="w-3.5 h-3.5" />
        )}
        <span>Faucet</span>
      </button>

      <Modal
        id="faucet-error-modal"
        className="modal-alert"
        role="alertdialog"
        aria-modal={true}
        aria-labelledby="faucet-error-title"
        aria-describedby="faucet-error-desc"
        tabIndex={-1}
        isOpen={errorModal.isOpen}
        onClose={() => setErrorModal({ ...errorModal, isOpen: false })}
        title={errorModal.title}
        message={errorModal.message}
      />
    </>
  );
}
