"use client"
import { useState, useCallback, useMemo, useEffect } from "react";
import { Menu, SendContent, ReceiveContent, SwapContent, ActivityContent, MenuType } from '@/components/Menu';
import { UserHeader } from '@/components/User';
const contentComponents = {
  send: SendContent,
  receive: ReceiveContent,
  swap: SwapContent,
  activity: ActivityContent,
}
const STORAGE_KEY = "artapay_active_menu";
export default function Home() {
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
    <div className="min-h-screen bg-zinc-900 p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* User Header - Balance & Address */}
        <UserHeader />
        
        {/* Menu */}
        <div className="flex flex-col items-center justify-center">
          <Menu activeMenu={activeMenu} onMenuChange={handleMenuChange} />
        </div>
        
        {/* Content */}
        <div>
          <ActiveContent />
        </div>
      </div>
    </div>
  );
}
