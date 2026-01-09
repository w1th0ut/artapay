import type { Address } from "viem";
import { env } from "./env";

export const ENTRY_POINT_ADDRESS = env.entryPointAddress as Address;
export const SIMPLE_ACCOUNT_FACTORY = env.simpleAccountFactory as Address;
export const CHAIN_ID = env.chainId;
export const GELATO_BUNDLER_URL = `https://api.gelato.digital/bundlers/${CHAIN_ID}/rpc${
  env.gelatoApiKey ? `?apiKey=${env.gelatoApiKey}` : ""
}`;

export const PAYMASTER_ADDRESS = env.paymasterAddress as Address;
export const STABLE_SWAP_ADDRESS = env.stableSwapAddress as Address;
export const PAYMENT_PROCESSOR_ADDRESS = env.paymentProcessorAddress as Address;

export const TOKENS: { symbol: string; address: Address; decimals: number }[] = [
  {
    symbol: "USDC",
    address: env.tokenUsdcAddress as Address,
    decimals: env.tokenUsdcDecimals,
  },
  {
    symbol: "USDT",
    address: env.tokenUsdtAddress as Address,
    decimals: env.tokenUsdtDecimals,
  },
  {
    symbol: "IDRX",
    address: env.tokenIdrxAddress as Address,
    decimals: env.tokenIdrxDecimals,
  },
  {
    symbol: "JPYC",
    address: env.tokenJpycAddress as Address,
    decimals: env.tokenJpycDecimals,
  },
  {
    symbol: "EURC",
    address: env.tokenEurcAddress as Address,
    decimals: env.tokenEurcDecimals,
  },
  {
    symbol: "MXNT",
    address: env.tokenMxntAddress as Address,
    decimals: env.tokenMxntDecimals,
  },
  {
    symbol: "CNHT",
    address: env.tokenCnhtAddress as Address,
    decimals: env.tokenCnhtDecimals,
  },
];

export const DEFAULT_TOKEN_SYMBOL = env.defaultTokenSymbol;
