"use client";

import { ReactNode } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PrivyProvider } from "@privy-io/react-auth";
import { LISK_SEPOLIA } from "@/config/chains";

const queryClient = new QueryClient();

const wagmiConfig = createConfig({
  chains: [LISK_SEPOLIA],
  connectors: [injected({ shimDisconnect: true })],
  transports: {
    [LISK_SEPOLIA.id]: http(process.env.NEXT_PUBLIC_RPC_URL),
  },
  multiInjectedProviderDiscovery: false,
});

interface Web3ProviderProps {
  children: ReactNode;
}

export default function Web3Provider({ children }: Web3ProviderProps) {
  const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  if (!privyAppId) {
    // If no Privy App ID, just render children without Web3 providers
    // This allows the app to at least render during development
    console.warn(
      "NEXT_PUBLIC_PRIVY_APP_ID is not set. Web3 features will be disabled."
    );
    return <>{children}</>;
  }

  return (
    <PrivyProvider
      appId={privyAppId}
      config={{
        loginMethods: ["wallet", "email", "google"],
        appearance: { theme: "dark" },
        embeddedWallets: { createOnLogin: "all-users" },
        externalWallets: {},
      }}
    >
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </WagmiProvider>
    </PrivyProvider>
  );
}
