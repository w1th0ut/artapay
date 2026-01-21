"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import {
  Menu,
  MenuType,
  SendContent,
  ReceiveContent,
  SwapContent,
  TopUpContent,
  ActivityContent,
} from "@/components/Menu";
import {
  WalletButton,
  BalanceDisplay,
  ActivationModal,
  FaucetButton,
} from "@/components/Wallet";
import { useSmartAccount } from "@/hooks/useSmartAccount";
import { useApprovalStatus } from "@/hooks/useApprovalStatus";
import { TOKENS } from "@/config/constants";

const contentComponents = {
  send: SendContent,
  receive: ReceiveContent,
  swap: SwapContent,
  topup: TopUpContent,
  activity: ActivityContent,
};
const STORAGE_KEY = "artapay_active_menu";

export default function Start() {
  const [activeMenu, setActiveMenu] = useState<MenuType>("send");
  const [isHydrated, setIsHydrated] = useState(false);

  const { smartAccountAddress, approvePaymaster } = useSmartAccount();
  const { isApproved, isChecking, refresh } = useApprovalStatus(
    smartAccountAddress
  );

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (
      saved &&
      ["send", "receive", "swap", "topup", "activity"].includes(saved)
    ) {
      setActiveMenu(saved as MenuType);
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(STORAGE_KEY, activeMenu);
    }
  }, [activeMenu, isHydrated]);

  const handleMenuChange = useCallback((menu: MenuType) => {
    setActiveMenu(menu);
  }, []);

  const ActiveContent = useMemo(
    () => contentComponents[activeMenu],
    [activeMenu]
  );

  const handleActivate = async () => {
    const tokenAddresses = TOKENS.map(
      (token) => token.address as `0x${string}`
    );
    await approvePaymaster(tokenAddresses);
    await refresh(false);
  };

  // Show activation modal if connected but not approved
  const showActivationModal =
    smartAccountAddress && !isChecking && isApproved === false;

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-black p-8">
        <div className="max-w-2xl mx-auto space-y-8">{/* Skeleton */}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-4 sm:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header with Logo and Wallet */}
        <div className="flex items-start justify-between gap-4">
          {/* Logo - bigger */}
          <img src="/logo.svg" alt="ArtaPay" className="h-10 sm:h-12" />

          {/* Wallet Info - Address + Balance */}
          <div className="flex flex-col items-end gap-2">
            <WalletButton />
            <BalanceDisplay />
            <FaucetButton />
          </div>
        </div>

        <div className="bg-zinc-900 rounded-2xl">
          <div className="p-4">
            <Menu activeMenu={activeMenu} onMenuChange={handleMenuChange} />
            <ActiveContent />
          </div>
        </div>
      </div>

      {/* Activation Modal - Cannot be closed */}
      {showActivationModal && smartAccountAddress && (
        <ActivationModal
          onActivate={handleActivate}
        />
      )}
    </div>
  );
}
