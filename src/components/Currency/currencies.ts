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
const usds = getToken("USDS");
const eurc = getToken("EURC");
const brz = getToken("BRZ");
const audd = getToken("AUDD");
const cadc = getToken("CADC");
const zchf = getToken("ZCHF");
const tgbp = getToken("TGBP");
const idrx = getToken("IDRX");

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
    id: "usds",
    name: "Sky Dollar",
    symbol: "USDS",
    icon: "/icons/usdc.svg",
    chainId,
    tokenAddress: usds.address,
    decimals: usds.decimals,
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
    id: "brz",
    name: "Brazilian Digital",
    symbol: "BRZ",
    icon: "/icons/usdc.svg",
    chainId,
    tokenAddress: brz.address,
    decimals: brz.decimals,
  },
  {
    id: "audd",
    name: "AUDD",
    symbol: "AUDD",
    icon: "/icons/usdc.svg",
    chainId,
    tokenAddress: audd.address,
    decimals: audd.decimals,
  },
  {
    id: "cadc",
    name: "CAD Coin",
    symbol: "CADC",
    icon: "/icons/usdc.svg",
    chainId,
    tokenAddress: cadc.address,
    decimals: cadc.decimals,
  },
  {
    id: "zchf",
    name: "Frankencoin",
    symbol: "ZCHF",
    icon: "/icons/usdc.svg",
    chainId,
    tokenAddress: zchf.address,
    decimals: zchf.decimals,
  },
  {
    id: "tgbp",
    name: "Tokenised GBP",
    symbol: "TGBP",
    icon: "/icons/usdc.svg",
    chainId,
    tokenAddress: tgbp.address,
    decimals: tgbp.decimals,
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
];
