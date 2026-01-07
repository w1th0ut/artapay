export interface Currency {
  id: string;
  name: string;
  symbol: string;
  icon: string;
  chainId: number;
  tokenAddress: string;
  decimals: number;
}

// Lisk Sepolia token addresses
export const currencies: Currency[] = [
  {
    id: "usdc",
    name: "USD Coin",
    symbol: "USDC",
    icon: "/icons/usdc.svg",
    chainId: 4202,
    tokenAddress: "0x301D9ed91BACB39B798a460D133105BA729c6302",
    decimals: 6,
  },
  {
    id: "usdt",
    name: "USD Tether",
    symbol: "USDT",
    icon: "/icons/usdt.svg",
    chainId: 4202,
    tokenAddress: "0x03F60361Aa488826e7DA7D7ADB2E1c6fC96D1B8B",
    decimals: 6,
  },
  {
    id: "idrx",
    name: "IDRX",
    symbol: "IDRX",
    icon: "/icons/idrx.svg",
    chainId: 4202,
    tokenAddress: "0x18bEA3CDa9dE68E74ba9F33F1B2e11ad345112f0",
    decimals: 6,
  },
  {
    id: "jpyc",
    name: "JPY Coin",
    symbol: "JPYC",
    icon: "/icons/jpyc.svg",
    chainId: 4202,
    tokenAddress: "0x97F9812a67b6cBA4F4D9b1013C5f4D708Ce9aA9e",
    decimals: 8,
  },
  {
    id: "eurc",
    name: "Euro Coin",
    symbol: "EURC",
    icon: "/icons/eurc.svg",
    chainId: 4202,
    tokenAddress: "0xd10F51695bc3318759A75335EfE61E32727330b6",
    decimals: 6,
  },
  {
    id: "mxnt",
    name: "Mexican Peso Tether",
    symbol: "MXNT",
    icon: "/icons/mxnt.svg",
    chainId: 4202,
    tokenAddress: "0x5e8B38DC8E00c2332AC253600975502CF9fbF36a",
    decimals: 6,
  },
  {
    id: "cnht",
    name: "CNH Tether",
    symbol: "CNHT",
    icon: "/icons/cnht.svg",
    chainId: 4202,
    tokenAddress: "0xDFaE672AD0e094Ee64e370da99b1E37AB58AAc4f",
    decimals: 6,
  },
];
