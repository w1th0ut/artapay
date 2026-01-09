export const ERC20_ABI = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
  {
    type: "function",
    name: "transfer",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint8" }],
  },
] as const;

export const PAYMASTER_ABI = [
  {
    type: "function",
    name: "getDeposit",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "isSupportedToken",
    stateMutability: "view",
    inputs: [{ name: "token", type: "address" }],
    outputs: [{ type: "bool" }],
  },
  {
    type: "function",
    name: "estimateTotalCost",
    stateMutability: "view",
    inputs: [
      { name: "token", type: "address" },
      { name: "gasLimit", type: "uint256" },
      { name: "maxFeePerGas", type: "uint256" },
    ],
    outputs: [{ name: "gasCost", type: "uint256" }],
  },
] as const;

export const ENTRYPOINT_ABI = [
  {
    type: "function",
    name: "getDepositInfo",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [
      {
        components: [
          { name: "deposit", type: "uint256" },
          { name: "staked", type: "bool" },
          { name: "stake", type: "uint112" },
          { name: "unstakeDelaySec", type: "uint32" },
          { name: "withdrawTime", type: "uint48" },
        ],
        name: "info",
        type: "tuple",
      },
    ],
  },
] as const;

export const STABLE_SWAP_ABI = [
  {
    type: "function",
    name: "getSwapQuote",
    stateMutability: "view",
    inputs: [
      { name: "tokenIn", type: "address" },
      { name: "tokenOut", type: "address" },
      { name: "amountIn", type: "uint256" },
    ],
    outputs: [
      { name: "amountOut", type: "uint256" },
      { name: "fee", type: "uint256" },
      { name: "totalUserPays", type: "uint256" },
    ],
  },
  {
    type: "function",
    name: "swap",
    stateMutability: "nonpayable",
    inputs: [
      { name: "amountIn", type: "uint256" },
      { name: "tokenIn", type: "address" },
      { name: "tokenOut", type: "address" },
      { name: "minAmountOut", type: "uint256" },
    ],
    outputs: [{ name: "amountOut", type: "uint256" }],
  },
] as const;

export const PAYMENT_PROCESSOR_ABI = [
  {
    type: "function",
    name: "calculatePaymentCost",
    stateMutability: "view",
    inputs: [
      { name: "requestedToken", type: "address" },
      { name: "requestedAmount", type: "uint256" },
      { name: "payToken", type: "address" },
    ],
    outputs: [
      {
        components: [
          { name: "baseAmount", type: "uint256" },
          { name: "platformFee", type: "uint256" },
          { name: "swapFee", type: "uint256" },
          { name: "totalRequired", type: "uint256" },
        ],
        name: "breakdown",
        type: "tuple",
      },
    ],
  },
  {
    type: "function",
    name: "executePayment",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "request",
        type: "tuple",
        components: [
          { name: "recipient", type: "address" },
          { name: "requestedToken", type: "address" },
          { name: "requestedAmount", type: "uint256" },
          { name: "deadline", type: "uint256" },
          { name: "nonce", type: "bytes32" },
          { name: "merchantSigner", type: "address" },
        ],
      },
      { name: "merchantSignature", type: "bytes" },
      { name: "payToken", type: "address" },
      { name: "maxAmountToPay", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "event",
    name: "PaymentCompleted",
    inputs: [
      { indexed: true, name: "nonce", type: "bytes32" },
      { indexed: true, name: "recipient", type: "address" },
      { indexed: true, name: "payer", type: "address" },
      { indexed: false, name: "requestedToken", type: "address" },
      { indexed: false, name: "payToken", type: "address" },
      { indexed: false, name: "requestedAmount", type: "uint256" },
      { indexed: false, name: "paidAmount", type: "uint256" },
    ],
  },
] as const;
