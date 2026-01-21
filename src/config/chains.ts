import { env } from "./env";

export const BASE_SEPOLIA = {
  id: env.chainId,
  name: env.chainName,
  nativeCurrency: {
    name: env.nativeCurrencyName,
    symbol: env.nativeCurrencySymbol,
    decimals: env.nativeCurrencyDecimals,
  },
  rpcUrls: {
    default: { http: [env.rpcUrl] },
  },
  blockExplorers: {
    default: { name: env.blockExplorerName, url: env.blockExplorerUrl },
  },
} as const;
