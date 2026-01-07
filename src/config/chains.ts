const DEFAULT_RPC =
  process.env.NEXT_PUBLIC_RPC_URL || "https://rpc.sepolia-api.lisk.com";

export const LISK_SEPOLIA = {
  id: 4202,
  name: "Lisk Sepolia",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: [DEFAULT_RPC] },
  },
  blockExplorers: {
    default: { name: "Blockscout", url: "https://sepolia-blockscout.lisk.com" },
  },
} as const;
