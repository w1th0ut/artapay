"use client"
import { useState, useCallback, useMemo, useEffect } from "react";
import {
  Menu,
  MenuType,
  SendContent,
  ReceiveContent,
  SwapContent,
  ActivityContent,
} from "@/components/Menu";
import { WalletButton, BalanceDisplay } from "@/components/Wallet";

const contentComponents = {
  send: SendContent,
  receive: ReceiveContent,
  swap: SwapContent,
  activity: ActivityContent,
}
const STORAGE_KEY = "artapay_active_menu";

export default function Start() {
  const [activeMenu, setActiveMenu] = useState<MenuType>("send");
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && ["send", "receive", "swap", "activity"].includes(saved)) {
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

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-zinc-900 p-8">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Skeleton */}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900 p-4 sm:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header with Logo and Wallet */}
        <div className="flex items-start justify-between gap-4">
          {/* Logo - bigger */}
          <img src="/logo.svg" alt="ArtaPay" className="h-10 sm:h-12" />

          {/* Wallet Info - Address + Balance */}
          <div className="flex flex-col items-end gap-2">
            <WalletButton />
            <BalanceDisplay />
          </div>
        </div>

        <Menu activeMenu={activeMenu} onMenuChange={handleMenuChange} />
        <ActiveContent />
      </div>
    </div>
  );
}