const requireEnv = (value: string | undefined, name: string) => {
  if (!value) {
    throw new Error(`${name} is not set`);
  }
  return value;
};

const parseNumber = (value: string, name: string) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`${name} must be a number`);
  }
  return parsed;
};

export const env = {
  chainId: parseNumber(
    requireEnv(process.env.NEXT_PUBLIC_CHAIN_ID, "NEXT_PUBLIC_CHAIN_ID"),
    "NEXT_PUBLIC_CHAIN_ID",
  ),
  chainName: requireEnv(
    process.env.NEXT_PUBLIC_CHAIN_NAME,
    "NEXT_PUBLIC_CHAIN_NAME",
  ),
  rpcUrl: requireEnv(process.env.NEXT_PUBLIC_RPC_URL, "NEXT_PUBLIC_RPC_URL"),
  blockExplorerName: requireEnv(
    process.env.NEXT_PUBLIC_BLOCK_EXPLORER_NAME,
    "NEXT_PUBLIC_BLOCK_EXPLORER_NAME",
  ),
  blockExplorerUrl: requireEnv(
    process.env.NEXT_PUBLIC_BLOCK_EXPLORER_URL,
    "NEXT_PUBLIC_BLOCK_EXPLORER_URL",
  ),
  nativeCurrencyName: requireEnv(
    process.env.NEXT_PUBLIC_NATIVE_CURRENCY_NAME,
    "NEXT_PUBLIC_NATIVE_CURRENCY_NAME",
  ),
  nativeCurrencySymbol: requireEnv(
    process.env.NEXT_PUBLIC_NATIVE_CURRENCY_SYMBOL,
    "NEXT_PUBLIC_NATIVE_CURRENCY_SYMBOL",
  ),
  nativeCurrencyDecimals: parseNumber(
    requireEnv(
      process.env.NEXT_PUBLIC_NATIVE_CURRENCY_DECIMALS,
      "NEXT_PUBLIC_NATIVE_CURRENCY_DECIMALS",
    ),
    "NEXT_PUBLIC_NATIVE_CURRENCY_DECIMALS",
  ),
  gelatoApiKey: process.env.GELATO_API_KEY,
  entryPointAddress: requireEnv(
    process.env.NEXT_PUBLIC_ENTRY_POINT_ADDRESS,
    "NEXT_PUBLIC_ENTRY_POINT_ADDRESS",
  ),
  simpleAccountFactory: requireEnv(
    process.env.NEXT_PUBLIC_SIMPLE_ACCOUNT_FACTORY,
    "NEXT_PUBLIC_SIMPLE_ACCOUNT_FACTORY",
  ),
  paymasterAddress: requireEnv(
    process.env.NEXT_PUBLIC_PAYMASTER_ADDRESS,
    "NEXT_PUBLIC_PAYMASTER_ADDRESS",
  ),
  stableSwapAddress: requireEnv(
    process.env.NEXT_PUBLIC_STABLE_SWAP_ADDRESS,
    "NEXT_PUBLIC_STABLE_SWAP_ADDRESS",
  ),
  paymentProcessorAddress: requireEnv(
    process.env.NEXT_PUBLIC_PAYMENT_PROCESSOR_ADDRESS,
    "NEXT_PUBLIC_PAYMENT_PROCESSOR_ADDRESS",
  ),
  stablecoinRegistryAddress: requireEnv(
    process.env.NEXT_PUBLIC_STABLECOIN_REGISTRY_ADDRESS,
    "NEXT_PUBLIC_STABLECOIN_REGISTRY_ADDRESS",
  ),
  signerApiUrl: requireEnv(
    process.env.NEXT_PUBLIC_SIGNER_API_URL,
    "NEXT_PUBLIC_SIGNER_API_URL",
  ),
  defaultTokenSymbol: requireEnv(
    process.env.NEXT_PUBLIC_DEFAULT_TOKEN_SYMBOL,
    "NEXT_PUBLIC_DEFAULT_TOKEN_SYMBOL",
  ),
  tokenUsdcAddress: requireEnv(
    process.env.NEXT_PUBLIC_TOKEN_USDC_ADDRESS,
    "NEXT_PUBLIC_TOKEN_USDC_ADDRESS",
  ),
  tokenUsdcDecimals: parseNumber(
    requireEnv(
      process.env.NEXT_PUBLIC_TOKEN_USDC_DECIMALS,
      "NEXT_PUBLIC_TOKEN_USDC_DECIMALS",
    ),
    "NEXT_PUBLIC_TOKEN_USDC_DECIMALS",
  ),
  tokenUsdtAddress: requireEnv(
    process.env.NEXT_PUBLIC_TOKEN_USDT_ADDRESS,
    "NEXT_PUBLIC_TOKEN_USDT_ADDRESS",
  ),
  tokenUsdtDecimals: parseNumber(
    requireEnv(
      process.env.NEXT_PUBLIC_TOKEN_USDT_DECIMALS,
      "NEXT_PUBLIC_TOKEN_USDT_DECIMALS",
    ),
    "NEXT_PUBLIC_TOKEN_USDT_DECIMALS",
  ),
  tokenIdrxAddress: requireEnv(
    process.env.NEXT_PUBLIC_TOKEN_IDRX_ADDRESS,
    "NEXT_PUBLIC_TOKEN_IDRX_ADDRESS",
  ),
  tokenIdrxDecimals: parseNumber(
    requireEnv(
      process.env.NEXT_PUBLIC_TOKEN_IDRX_DECIMALS,
      "NEXT_PUBLIC_TOKEN_IDRX_DECIMALS",
    ),
    "NEXT_PUBLIC_TOKEN_IDRX_DECIMALS",
  ),
  tokenJpycAddress: requireEnv(
    process.env.NEXT_PUBLIC_TOKEN_JPYC_ADDRESS,
    "NEXT_PUBLIC_TOKEN_JPYC_ADDRESS",
  ),
  tokenJpycDecimals: parseNumber(
    requireEnv(
      process.env.NEXT_PUBLIC_TOKEN_JPYC_DECIMALS,
      "NEXT_PUBLIC_TOKEN_JPYC_DECIMALS",
    ),
    "NEXT_PUBLIC_TOKEN_JPYC_DECIMALS",
  ),
  tokenEurcAddress: requireEnv(
    process.env.NEXT_PUBLIC_TOKEN_EURC_ADDRESS,
    "NEXT_PUBLIC_TOKEN_EURC_ADDRESS",
  ),
  tokenEurcDecimals: parseNumber(
    requireEnv(
      process.env.NEXT_PUBLIC_TOKEN_EURC_DECIMALS,
      "NEXT_PUBLIC_TOKEN_EURC_DECIMALS",
    ),
    "NEXT_PUBLIC_TOKEN_EURC_DECIMALS",
  ),
  tokenMxntAddress: requireEnv(
    process.env.NEXT_PUBLIC_TOKEN_MXNT_ADDRESS,
    "NEXT_PUBLIC_TOKEN_MXNT_ADDRESS",
  ),
  tokenMxntDecimals: parseNumber(
    requireEnv(
      process.env.NEXT_PUBLIC_TOKEN_MXNT_DECIMALS,
      "NEXT_PUBLIC_TOKEN_MXNT_DECIMALS",
    ),
    "NEXT_PUBLIC_TOKEN_MXNT_DECIMALS",
  ),
  tokenCnhtAddress: requireEnv(
    process.env.NEXT_PUBLIC_TOKEN_CNHT_ADDRESS,
    "NEXT_PUBLIC_TOKEN_CNHT_ADDRESS",
  ),
  tokenCnhtDecimals: parseNumber(
    requireEnv(
      process.env.NEXT_PUBLIC_TOKEN_CNHT_DECIMALS,
      "NEXT_PUBLIC_TOKEN_CNHT_DECIMALS",
    ),
    "NEXT_PUBLIC_TOKEN_CNHT_DECIMALS",
  ),
  activityLookbackBlocks: parseNumber(
    requireEnv(
      process.env.NEXT_PUBLIC_ACTIVITY_LOOKBACK_BLOCKS,
      "NEXT_PUBLIC_ACTIVITY_LOOKBACK_BLOCKS",
    ),
    "NEXT_PUBLIC_ACTIVITY_LOOKBACK_BLOCKS",
  ),
  privyAppId: process.env.NEXT_PUBLIC_PRIVY_APP_ID,
};
