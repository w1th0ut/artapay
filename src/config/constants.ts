import type { Address } from "viem";

export const ENTRY_POINT_ADDRESS =
  "0x0000000071727De22E5E9d8BAf0edAc6f37da032" as const;

export const SIMPLE_ACCOUNT_FACTORY =
  "0x91E60e0613810449d098b0b5Ec8b51A0FE8c8985" as const;

export const GELATO_BUNDLER_URL = `https://api.gelato.digital/bundlers/${
  process.env.NEXT_PUBLIC_CHAIN_ID || 4202
}/rpc${
  process.env.NEXT_PUBLIC_GELATO_API_KEY
    ? `?apiKey=${process.env.NEXT_PUBLIC_GELATO_API_KEY}`
    : ""
}`;

export const PAYMASTER_ADDRESS = (process.env.NEXT_PUBLIC_PAYMASTER_ADDRESS ||
  "0x6f1330f207Ab5e2a52c550AF308bA28e3c517311") as Address;

export const STABLE_SWAP_ADDRESS = (process.env
  .NEXT_PUBLIC_STABLE_SWAP_ADDRESS ||
  "0x49c37C3b3a96028D2A1A1e678A302C1d727f3FEF") as Address;

export const PAYMENT_PROCESSOR_ADDRESS = (process.env
  .NEXT_PUBLIC_PAYMENT_PROCESSOR_ADDRESS ||
  "0xCb5A11a2913763a01FA97CBDE67BCAB4Bf234D97") as Address;

export const TOKENS: { symbol: string; address: Address; decimals: number }[] =
  [
    {
      symbol: "USDC",
      address:("0x301D9ed91BACB39B798a460D133105BA729c6302" as Address),
      decimals: 6,
    },
    {
      symbol: "USDT",
      address: "0x03F60361Aa488826e7DA7D7ADB2E1c6fC96D1B8B" as Address,
      decimals: 6,
    },
    {
      symbol: "IDRX",
      address: "0x18bEA3CDa9dE68E74ba9F33F1B2e11ad345112f0" as Address,
      decimals: 6,
    },
    {
      symbol: "JPYC",
      address: "0x97F9812a67b6cBA4F4D9b1013C5f4D708Ce9aA9e" as Address,
      decimals: 8,
    },
    {
      symbol: "EURC",
      address: "0xd10F51695bc3318759A75335EfE61E32727330b6" as Address,
      decimals: 6,
    },
    {
      symbol: "MXNT",
      address: "0x5e8B38DC8E00c2332AC253600975502CF9fbF36a" as Address,
      decimals: 6,
    },
    {
      symbol: "CNHT",
      address: "0xDFaE672AD0e094Ee64e370da99b1E37AB58AAc4f" as Address,
      decimals: 6,
    },
  ];

export const DEFAULT_TOKEN_SYMBOL = "USDC";
