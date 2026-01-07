import { TOKENS } from "@/config/constants";
import { env } from "@/config/env";

export interface Currency {
  id: string;
  name: string;
  symbol: string;
  icon: string;
  chainId: number;
  tokenAddress: string;
  decimals: number;
}

const tokenBySymbol = new Map(TOKENS.map((token) => [token.symbol, token]));

const getToken = (symbol: string) => {
  const token = tokenBySymbol.get(symbol);
  if (!token) {
    throw new Error(`Token ${symbol} is not configured`);
  }
  return token;
};

const chainId = env.chainId;
const usdc = getToken("USDC");
const usdt = getToken("USDT");
const idrx = getToken("IDRX");
const jpyc = getToken("JPYC");
const eurc = getToken("EURC");
const mxnt = getToken("MXNT");
const cnht = getToken("CNHT");

export const currencies: Currency[] = [
  {
    id: "usdc",
    name: "USD Coin",
    symbol: "USDC",
    icon: "/icons/usdc.svg",
    chainId,
    tokenAddress: usdc.address,
    decimals: usdc.decimals,
  },
  {
    id: "usdt",
    name: "USD Tether",
    symbol: "USDT",
    icon: "/icons/usdt.svg",
    chainId,
    tokenAddress: usdt.address,
    decimals: usdt.decimals,
  },
  {
    id: "idrx",
    name: "IDRX",
    symbol: "IDRX",
    icon: "/icons/idrx.svg",
    chainId,
    tokenAddress: idrx.address,
    decimals: idrx.decimals,
  },
  {
    id: "jpyc",
    name: "JPY Coin",
    symbol: "JPYC",
    icon: "/icons/jpyc.svg",
    chainId,
    tokenAddress: jpyc.address,
    decimals: jpyc.decimals,
  },
  {
    id: "eurc",
    name: "Euro Coin",
    symbol: "EURC",
    icon: "/icons/eurc.svg",
    chainId,
    tokenAddress: eurc.address,
    decimals: eurc.decimals,
  },
  {
    id: "mxnt",
    name: "Mexican Peso Tether",
    symbol: "MXNT",
    icon: "/icons/mxnt.svg",
    chainId,
    tokenAddress: mxnt.address,
    decimals: mxnt.decimals,
  },
  {
    id: "cnht",
    name: "CNH Tether",
    symbol: "CNHT",
    icon: "/icons/cnht.svg",
    chainId,
    tokenAddress: cnht.address,
    decimals: cnht.decimals,
  },
];
