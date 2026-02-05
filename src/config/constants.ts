import type { Address } from "viem";
import { env } from "./env";

export const ENTRY_POINT_ADDRESS = env.entryPointAddress as Address;
export const SIMPLE_ACCOUNT_FACTORY = env.simpleAccountFactory as Address;
export const CHAIN_ID = env.chainId;
export const PIMLICO_BUNDLER_URL = `https://api.pimlico.io/v2/${CHAIN_ID}/rpc?apikey=${env.pimlicoApiKey}`;

export const PAYMASTER_ADDRESS = env.paymasterAddress as Address;
export const STABLE_SWAP_ADDRESS = env.stableSwapAddress as Address;
export const PAYMENT_PROCESSOR_ADDRESS = env.paymentProcessorAddress as Address;
export const STABLECOIN_REGISTRY_ADDRESS =
  env.stablecoinRegistryAddress as Address;
export const QRIS_REGISTRY_ADDRESS = env.qrisRegistryAddress as Address;

export const TOKENS: {
  symbol: string;
  address: Address;
  decimals: number;
  icon: string;
}[] = [
  {
    symbol: "USDC",
    address: env.tokenUsdcAddress as Address,
    decimals: env.tokenUsdcDecimals,
    icon: "/icons/usdc.svg",
  },
  {
    symbol: "USDS",
    address: env.tokenUsdsAddress as Address,
    decimals: env.tokenUsdsDecimals,
    icon: "/icons/sky-dollar.svg",
  },
  {
    symbol: "EURC",
    address: env.tokenEurcAddress as Address,
    decimals: env.tokenEurcDecimals,
    icon: "/icons/eurc.svg",
  },
  {
    symbol: "BRZ",
    address: env.tokenBrzAddress as Address,
    decimals: env.tokenBrzDecimals,
    icon: "/icons/brazillian.svg",
  },
  {
    symbol: "AUDD",
    address: env.tokenAuddAddress as Address,
    decimals: env.tokenAuddDecimals,
    icon: "/icons/audd.svg",
  },
  {
    symbol: "CADC",
    address: env.tokenCadcAddress as Address,
    decimals: env.tokenCadcDecimals,
    icon: "/icons/cad.svg",
  },
  {
    symbol: "ZCHF",
    address: env.tokenZchfAddress as Address,
    decimals: env.tokenZchfDecimals,
    icon: "/icons/frankencoin.svg",
  },
  {
    symbol: "TGBP",
    address: env.tokenTgbpAddress as Address,
    decimals: env.tokenTgbpDecimals,
    icon: "/icons/tokenised.svg",
  },
  {
    symbol: "IDRX",
    address: env.tokenIdrxAddress as Address,
    decimals: env.tokenIdrxDecimals,
    icon: "/icons/idrx.svg",
  },
];

export const DEFAULT_TOKEN_SYMBOL = env.defaultTokenSymbol;
