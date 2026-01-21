// @ts-nocheck
"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
import { useWallets, usePrivy } from "@privy-io/react-auth";
import {
  createPublicClient,
  createWalletClient,
  custom,
  getAddress,
  http,
  type Address,
  encodeFunctionData,
  maxUint256,
  parseUnits,
} from "viem";
import { createSmartAccountClient } from "permissionless";
import { toSimpleSmartAccount } from "permissionless/accounts";
import { LISK_SEPOLIA } from "@/config/chains";
import {
  ENTRY_POINT_ADDRESS,
  GELATO_BUNDLER_URL,
  PAYMASTER_ADDRESS,
  PAYMENT_PROCESSOR_ADDRESS,
  SIMPLE_ACCOUNT_FACTORY,
} from "@/config/constants";
import {
  ERC20_ABI,
  FAUCET_ABI,
  PAYMENT_PROCESSOR_ABI,
  STABLE_SWAP_ABI,
} from "@/config/abi";
import { buildPaymasterData } from "@/lib/paymasterData";
import { getPaymasterSignature } from "@/api/signerApi";

/**
 * Transform Gelato rate limit errors into user-friendly messages
 */
function transformError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  if (
    message.toLowerCase().includes("too many requests") ||
    message.toLowerCase().includes("rate limit")
  ) {
    return "Rate limit gelato reached. Please try again a minute later.";
  }
  return message;
}

export function useSmartAccount() {
  const { wallets, ready: privyReady } = useWallets();
  const { authenticated } = usePrivy();
  const [smartAccountAddress, setSmartAccountAddress] =
    useState<Address | null>(null);
  const [eoaAddress, setEoaAddress] = useState<Address | null>(null);
  const [walletSource, setWalletSource] = useState<
    "external" | "embedded" | null
  >(null);
  const [effectiveWalletClient, setEffectiveWalletClient] = useState<ReturnType<
    typeof createWalletClient
  > | null>(null);
  const [status, setStatus] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true); // Track initial loading
  const [error, setError] = useState<string | null>(null);
  const [client, setClient] = useState<ReturnType<
    typeof createSmartAccountClient
  > | null>(null);

  // isReady = true when: not authenticated OR smartAccountAddress is set
  const isReady = !authenticated || !!smartAccountAddress;

  // Pick Privy wallet: embedded only (ensure embedded is provisioned via Privy config)
  useEffect(() => {
    let cancelled = false;

    const selectWallet = async () => {
      if (!authenticated || !privyReady) {
        if (cancelled) return;
        setEffectiveWalletClient(null);
        setEoaAddress(null);
        setWalletSource(null);
        return;
      }

      const embedded = wallets.find(
        (w) => w.type === "ethereum" && w.walletClientType === "privy",
      );
      const chosen = embedded; // force embedded-only

      if (!chosen) {
        if (cancelled) return;
        setEffectiveWalletClient(null);
        setEoaAddress(null);
        setWalletSource(null);
        setStatus(
          "No embedded wallet found. Enable embedded wallet (createOnLogin) in Privy and re-login.",
        );
        return;
      }

      try {
        const provider = await chosen.getEthereumProvider();
        const addr = getAddress(chosen.address) as Address;
        const account = { address: addr, type: "json-rpc" as const };
        const createClientAny = createWalletClient as any;
        const privyWalletClient = createClientAny({
          account,
          chain: LISK_SEPOLIA,
          transport: custom(provider),
        });
        if (cancelled) return;
        setEffectiveWalletClient(privyWalletClient);
        setEoaAddress(addr);
        setWalletSource(
          chosen.walletClientType === "privy" ? "embedded" : "external",
        );
      } catch (err) {
        console.error("Failed to init Privy wallet", err);
        if (!cancelled) {
          setEffectiveWalletClient(null);
          setEoaAddress(null);
          setWalletSource(null);
        }
      }
    };

    selectWallet();

    return () => {
      cancelled = true;
    };
  }, [wallets, privyReady, authenticated]);

  useEffect(() => {
    if (!effectiveWalletClient || !eoaAddress) {
      setSmartAccountAddress(null);
      setClient(null);
      setStatus("");
      setError(null);
    }
  }, [effectiveWalletClient, eoaAddress]);

  // Auto-initialize Smart Account when EOA wallet is ready
  useEffect(() => {
    let cancelled = false;

    const autoInitSmartAccount = async () => {
      // Only auto-init if we have EOA but no Smart Account yet
      if (
        !effectiveWalletClient ||
        !eoaAddress ||
        smartAccountAddress ||
        client
      ) {
        return;
      }

      try {
        setStatus("Auto-initializing Smart Account...");
        const simpleAccount = await toSimpleSmartAccount({
          client: createPublicClient({
            chain: LISK_SEPOLIA,
            transport: http(LISK_SEPOLIA.rpcUrls.default.http[0]),
          }),
          owner: effectiveWalletClient,
          entryPoint: { address: ENTRY_POINT_ADDRESS, version: "0.7" as const },
          factoryAddress: SIMPLE_ACCOUNT_FACTORY,
        });

        if (cancelled) return;

        const smartAccountClient = createSmartAccountClient({
          account: simpleAccount,
          chain: LISK_SEPOLIA,
          bundlerTransport: http(GELATO_BUNDLER_URL),
        });

        setSmartAccountAddress(simpleAccount.address);
        setClient(smartAccountClient);
        setStatus("Smart Account ready");
      } catch (err) {
        console.error("Auto-init Smart Account failed:", err);
        if (!cancelled) {
          setStatus("Auto-init failed. Click Init SA to retry.");
        }
      }
    };

    autoInitSmartAccount();

    return () => {
      cancelled = true;
    };
  }, [effectiveWalletClient, eoaAddress, smartAccountAddress, client]);

  const publicClient = useMemo(
    () =>
      createPublicClient({
        chain: LISK_SEPOLIA,
        transport: http(LISK_SEPOLIA.rpcUrls.default.http[0]),
      }),
    [],
  );

  const bundlerClient = useMemo(
    () =>
      createPublicClient({
        chain: LISK_SEPOLIA,
        transport: http(GELATO_BUNDLER_URL),
      }),
    [],
  );

  const getFeeParams = useCallback(async () => {
    // Increased buffer to 150% to handle network congestion and bundler requirements
    const addBuffer = (value: bigint) => {
      const bumped = (value * 30n) / 10n; // +200% (3.0x multiplier)
      return bumped > value ? bumped : value + 1n;
    };

    try {
      const fees = await publicClient.estimateFeesPerGas();
      return {
        maxFeePerGas: addBuffer(fees.maxFeePerGas),
        maxPriorityFeePerGas: addBuffer(fees.maxPriorityFeePerGas),
      };
    } catch {
      const gasPrice = await publicClient.getGasPrice();
      return {
        maxFeePerGas: addBuffer(gasPrice),
        maxPriorityFeePerGas: addBuffer(gasPrice),
      };
    }
  }, [publicClient]);

  const waitForUserOp = useCallback(
    async (userOpHash: `0x${string}`) => {
      // Increased to 40 iterations (40 x 3s = 120s) for complex multi-token transactions
      for (let i = 0; i < 40; i++) {
        try {
          const receipt = (await bundlerClient.request({
            // viem types don't include 4337, so cast
            method: "eth_getUserOperationReceipt",
            params: [userOpHash],
          } as any)) as any;

          if (receipt) {
            let success =
              typeof receipt.success === "boolean"
                ? receipt.success
                : Boolean(receipt?.receipt?.status);
            const txHash = receipt?.receipt?.transactionHash;
            const reason = receipt?.reason;

            // Decode UserOperationEvent if present to trust on-chain flag
            if (receipt.receipt?.logs) {
              const userOpEventTopic =
                "0x49628fd1471006c1482da88028e9ce4dbb080b815c9b0344d39e5a8e6ec1419f";
              const entryLog = receipt.receipt.logs.find(
                (l: any) =>
                  l.topics &&
                  l.topics.length > 0 &&
                  l.topics[0] === userOpEventTopic,
              );
              if (entryLog) {
                // success is the 5th non-indexed slot in data
                const data = entryLog.data as string;
                if (data && data.length >= 2 + 64 * 3) {
                  const successFlag = data.slice(2 + 64, 2 + 64 * 2);
                  // success is encoded as a full 32-byte word with last byte 0/1
                  success = successFlag.endsWith("1");
                }
              }
            }

            return { success, txHash, reason };
          }
        } catch (err) {
          // keep polling; bundler might not have it yet
          console.warn("waitForUserOp poll error", err);
        }
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
      return {
        success: false,
        txHash: null,
        reason: "Timed out waiting for receipt",
      };
    },
    [bundlerClient],
  );

  const ensureClient = useCallback(async () => {
    if (client && smartAccountAddress) {
      return { client, address: smartAccountAddress };
    }

    if (!effectiveWalletClient || !eoaAddress) {
      throw new Error("Connect EOA wallet first");
    }

    setStatus("Preparing smart account...");
    const simpleAccount = await toSimpleSmartAccount({
      client: publicClient,
      owner: effectiveWalletClient,
      entryPoint: { address: ENTRY_POINT_ADDRESS, version: "0.7" as const },
      factoryAddress: SIMPLE_ACCOUNT_FACTORY,
    });

    const smartAccountClient = createSmartAccountClient({
      account: simpleAccount,
      chain: LISK_SEPOLIA,
      bundlerTransport: http(GELATO_BUNDLER_URL),
    });

    setSmartAccountAddress(simpleAccount.address);
    setClient(smartAccountClient);
    return { client: smartAccountClient, address: simpleAccount.address };
  }, [
    client,
    smartAccountAddress,
    effectiveWalletClient,
    eoaAddress,
    publicClient,
  ]);

  const approvePaymaster = useCallback(
    async (tokenAddresses: Address[]) => {
      setError(null);
      setIsLoading(true);
      try {
        const { client, address } = await ensureClient();
        const feeParams = await getFeeParams();

        const calls = tokenAddresses.map((token) => {
          const approveData = encodeFunctionData({
            abi: ERC20_ABI,
            functionName: "approve",
            args: [PAYMASTER_ADDRESS, maxUint256],
          });
          return { to: token, data: approveData, value: BigInt(0) };
        });

        setStatus("Sending approve (SA pays native gas)...");
        const txHash = await client.sendTransaction({
          calls,
          ...feeParams,
        });

        setStatus("Approve submitted");
        return { txHash, sender: address };
      } catch (err) {
        const message = transformError(err);
        setError(message);
        setStatus(message);
        throw new Error(message);
      } finally {
        setIsLoading(false);
      }
    },
    [ensureClient, getFeeParams],
  );

  const claimFaucet = useCallback(
    async (params: { tokenAddress: Address; amount: number }) => {
      setError(null);
      setIsLoading(true);
      try {
        const { client, address } = await ensureClient();
        const feeParams = await getFeeParams();

        const faucetData = encodeFunctionData({
          abi: FAUCET_ABI,
          functionName: "faucet",
          args: [BigInt(params.amount)],
        });

        setStatus("Requesting USDC faucet...");
        const txHash = await client.sendTransaction({
          to: params.tokenAddress,
          data: faucetData,
          value: BigInt(0),
          ...feeParams,
        });

        setStatus("Faucet transaction submitted");
        return { txHash, sender: address };
      } catch (err) {
        const message = transformError(err);
        setError(message);
        setStatus(message);
        throw new Error(message);
      } finally {
        setIsLoading(false);
      }
    },
    [ensureClient, getFeeParams],
  );

  const sendGaslessTransfer = useCallback(
    async (params: {
      recipient: Address;
      amount: string;
      tokenAddress: Address;
      decimals: number;
    }) => {
      setError(null);
      setIsLoading(true);
      try {
        const { client, address } = await ensureClient();
        const amountParsed = parseUnits(params.amount, params.decimals);
        const feeParams = await getFeeParams();

        setStatus("Requesting paymaster signature...");
        const validUntil = Math.floor(Date.now() / 1000) + 3600;
        const validAfter = 0;
        const signature = await getPaymasterSignature({
          payerAddress: address,
          tokenAddress: params.tokenAddress,
          validUntil,
          validAfter,
        });

        const paymasterData = buildPaymasterData({
          tokenAddress: params.tokenAddress,
          payerAddress: address,
          validUntil,
          validAfter,
          hasPermit: false,
          signature: signature as `0x${string}`,
        });

        setStatus("Sending UserOperation to Gelato bundler...");
        let userOpHash = "";
        try {
          const res = await client.sendCalls({
            calls: [
              {
                to: params.tokenAddress,
                data: encodeFunctionData({
                  abi: ERC20_ABI,
                  functionName: "transfer",
                  args: [params.recipient, amountParsed],
                }),
                value: BigInt(0),
              },
            ],
            paymaster: PAYMASTER_ADDRESS,
            paymasterData,
            paymasterVerificationGasLimit: BigInt(200_000),
            paymasterPostOpGasLimit: BigInt(200_000),
            callGasLimit: BigInt(220_000),
            verificationGasLimit: BigInt(450_000),
            ...feeParams,
          });
          userOpHash = res.id as `0x${string}`;
        } catch (err) {
          const msg = err instanceof Error ? err.message : "send failed";
          if (msg.includes("Failed to fetch")) {
            throw new Error(
              `Bundler RPC unreachable at ${GELATO_BUNDLER_URL} (${msg})`,
            );
          }
          throw err;
        }

        setStatus("UserOp submitted to bundler, waiting for execution...");
        const receipt = await waitForUserOp(userOpHash as `0x${string}`);
        if (!receipt.success) {
          const reason = receipt.reason || "Execution failed";
          throw new Error(reason);
        }
        setStatus("UserOp executed on-chain");
        return receipt.txHash || userOpHash;
      } catch (err) {
        const message = transformError(err);
        setError(message);
        setStatus(message);
        throw new Error(message);
      } finally {
        setIsLoading(false);
      }
    },
    [ensureClient, getFeeParams, waitForUserOp],
  );

  const sendBatchTransfer = useCallback(
    async (params: {
      recipients: { address: Address; amount: string }[];
      tokenAddress: Address;
      decimals: number;
    }) => {
      setError(null);
      setIsLoading(true);
      try {
        if (params.recipients.length === 0) {
          throw new Error("At least one recipient is required");
        }
        if (params.recipients.length > 20) {
          throw new Error("Maximum 20 recipients per batch");
        }

        const { client, address } = await ensureClient();
        const feeParams = await getFeeParams();

        setStatus("Requesting paymaster signature for batch transfer...");
        const validUntil = Math.floor(Date.now() / 1000) + 3600;
        const validAfter = 0;
        const signature = await getPaymasterSignature({
          payerAddress: address,
          tokenAddress: params.tokenAddress,
          validUntil,
          validAfter,
        });

        const paymasterData = buildPaymasterData({
          tokenAddress: params.tokenAddress,
          payerAddress: address,
          validUntil,
          validAfter,
          hasPermit: false,
          signature: signature as `0x${string}`,
        });

        // Build transfer calls for each recipient
        const calls = params.recipients.map((recipient) => ({
          to: params.tokenAddress,
          data: encodeFunctionData({
            abi: ERC20_ABI,
            functionName: "transfer",
            args: [
              recipient.address,
              parseUnits(recipient.amount, params.decimals),
            ],
          }),
          value: BigInt(0),
        }));

        // Dynamic gas limits based on recipient count
        const recipientCount = params.recipients.length;
        const baseCallGas = 100_000;
        const perTransferGas = 50_000;
        const callGasLimit = BigInt(
          baseCallGas + recipientCount * perTransferGas,
        );

        setStatus(`Sending batch transfer to ${recipientCount} recipients...`);
        let userOpHash = "";
        try {
          const res = await client.sendCalls({
            calls,
            paymaster: PAYMASTER_ADDRESS,
            paymasterData,
            paymasterVerificationGasLimit: BigInt(200_000),
            paymasterPostOpGasLimit: BigInt(200_000),
            callGasLimit,
            verificationGasLimit: BigInt(450_000),
            ...feeParams,
          });
          userOpHash = res.id as `0x${string}`;
        } catch (err) {
          const msg = err instanceof Error ? err.message : "send failed";
          if (msg.includes("Failed to fetch")) {
            throw new Error(
              `Bundler RPC unreachable at ${GELATO_BUNDLER_URL} (${msg})`,
            );
          }
          throw err;
        }

        setStatus("Batch transfer submitted, waiting for execution...");
        const receipt = await waitForUserOp(userOpHash as `0x${string}`);
        if (!receipt.success) {
          const reason = receipt.reason || "Batch execution failed";
          throw new Error(reason);
        }
        setStatus(`Batch transfer to ${recipientCount} recipients completed`);
        return {
          txHash: receipt.txHash || userOpHash,
          recipientCount,
        };
      } catch (err) {
        const message = transformError(err);
        setError(message);
        setStatus(message);
        throw new Error(message);
      } finally {
        setIsLoading(false);
      }
    },
    [ensureClient, getFeeParams, waitForUserOp],
  );

  const swapTokens = useCallback(
    async (params: {
      tokenIn: Address;
      tokenOut: Address;
      amount: string;
      tokenInDecimals: number;
      stableSwapAddress: Address;
      minAmountOut: bigint;
      totalUserPays: bigint;
      currentAllowance?: bigint;
    }) => {
      setError(null);
      setIsLoading(true);
      try {
        const { client, address } = await ensureClient();
        const amountParsed = parseUnits(params.amount, params.tokenInDecimals);
        const needsApproval =
          !params.currentAllowance ||
          params.currentAllowance < params.totalUserPays;

        const feeParams = await getFeeParams();
        const validUntil = Math.floor(Date.now() / 1000) + 3600;
        const validAfter = 0;
        setStatus("Requesting paymaster signature for swap...");
        const signature = await getPaymasterSignature({
          payerAddress: address,
          tokenAddress: params.tokenIn,
          validUntil,
          validAfter,
        });

        const paymasterData = buildPaymasterData({
          tokenAddress: params.tokenIn,
          payerAddress: address,
          validUntil,
          validAfter,
          hasPermit: false,
          signature: signature as `0x${string}`,
        });

        const calls = [];
        if (needsApproval) {
          calls.push({
            to: params.tokenIn,
            data: encodeFunctionData({
              abi: ERC20_ABI,
              functionName: "approve",
              args: [params.stableSwapAddress, maxUint256],
            }),
            value: BigInt(0),
          });
        }
        calls.push({
          to: params.stableSwapAddress,
          data: encodeFunctionData({
            abi: STABLE_SWAP_ABI,
            functionName: "swap",
            args: [
              amountParsed,
              params.tokenIn,
              params.tokenOut,
              params.minAmountOut,
            ],
          }),
          value: BigInt(0),
        });

        setStatus("Submitting swap UserOperation...");
        const res = await client.sendCalls({
          calls,
          paymaster: PAYMASTER_ADDRESS,
          paymasterData,
          paymasterVerificationGasLimit: BigInt(220_000),
          paymasterPostOpGasLimit: BigInt(220_000),
          callGasLimit: BigInt(600_000),
          verificationGasLimit: BigInt(700_000),
          ...feeParams,
        });

        const userOpHash = res.id as `0x${string}`;
        setStatus("Waiting for swap execution...");
        const receipt = await waitForUserOp(userOpHash);
        if (!receipt.success) {
          const reason = receipt.reason || "Swap failed";
          throw new Error(reason);
        }
        setStatus("Swap executed on-chain");
        return receipt.txHash || userOpHash;
      } catch (err) {
        const message = transformError(err);
        setError(message);
        setStatus(message);
        throw new Error(message);
      } finally {
        setIsLoading(false);
      }
    },
    [ensureClient, getFeeParams, waitForUserOp],
  );

  const payInvoice = useCallback(
    async (params: {
      request: {
        recipient: Address;
        requestedToken: Address;
        requestedAmount: bigint;
        deadline: bigint;
        nonce: `0x${string}`;
        merchantSigner: Address;
      };
      merchantSignature: `0x${string}`;
      payToken: Address;
      totalRequired: bigint;
      maxAmountToPay: bigint;
      paymentProcessorAddress?: Address;
      currentAllowance?: bigint;
    }) => {
      setError(null);
      setIsLoading(true);
      try {
        const { client, address } = await ensureClient();
        const needsApproval =
          !params.currentAllowance ||
          params.currentAllowance < params.totalRequired;
        const feeParams = await getFeeParams();

        const validUntil = Math.floor(Date.now() / 1000) + 3600;
        const validAfter = 0;
        setStatus("Requesting paymaster signature for payment...");
        const signature = await getPaymasterSignature({
          payerAddress: address,
          tokenAddress: params.payToken,
          validUntil,
          validAfter,
        });

        const paymasterData = buildPaymasterData({
          tokenAddress: params.payToken,
          payerAddress: address,
          validUntil,
          validAfter,
          hasPermit: false,
          signature: signature as `0x${string}`,
        });

        const processor =
          params.paymentProcessorAddress || PAYMENT_PROCESSOR_ADDRESS;
        const calls = [];

        if (needsApproval) {
          calls.push({
            to: params.payToken,
            data: encodeFunctionData({
              abi: ERC20_ABI,
              functionName: "approve",
              args: [processor, maxUint256],
            }),
            value: BigInt(0),
          });
        }

        calls.push({
          to: processor,
          data: encodeFunctionData({
            abi: PAYMENT_PROCESSOR_ABI,
            functionName: "executePayment",
            args: [
              [
                params.request.recipient,
                params.request.requestedToken,
                params.request.requestedAmount,
                params.request.deadline,
                params.request.nonce,
                params.request.merchantSigner,
              ],
              params.merchantSignature,
              params.payToken,
              params.maxAmountToPay,
            ],
          }),
          value: BigInt(0),
        });

        setStatus("Submitting payment UserOperation...");
        const res = await client.sendCalls({
          calls,
          paymaster: PAYMASTER_ADDRESS,
          paymasterData,
          paymasterVerificationGasLimit: BigInt(260_000),
          paymasterPostOpGasLimit: BigInt(260_000),
          callGasLimit: BigInt(1_300_000),
          verificationGasLimit: BigInt(950_000),
          ...feeParams,
        });

        const userOpHash = res.id as `0x${string}`;
        setStatus("Waiting for payment execution...");
        const receipt = await waitForUserOp(userOpHash);
        if (!receipt.success) {
          throw new Error(receipt.reason || "Payment failed");
        }

        setStatus("Payment executed");
        return receipt.txHash || userOpHash;
      } catch (err) {
        const message = transformError(err);
        setError(message);
        setStatus(message);
        throw new Error(message);
      } finally {
        setIsLoading(false);
      }
    },
    [ensureClient, getFeeParams, waitForUserOp],
  );

  const payMultiTokenInvoice = useCallback(
    async (params: {
      request: {
        recipient: Address;
        requestedToken: Address;
        requestedAmount: bigint;
        deadline: bigint;
        nonce: `0x${string}`;
        merchantSigner: Address;
      };
      merchantSignature: `0x${string}`;
      payments: { token: Address; amount: bigint }[];
      paymentProcessorAddress?: Address;
    }) => {
      setError(null);
      setIsLoading(true);
      try {
        if (params.payments.length === 0) {
          throw new Error("At least one payment token required");
        }

        const { client, address } = await ensureClient();
        const feeParams = await getFeeParams();

        // Use first payment token for paymaster fee
        const feeToken = params.payments[0].token;

        const validUntil = Math.floor(Date.now() / 1000) + 3600;
        const validAfter = 0;
        setStatus("Requesting paymaster signature for multi-token payment...");
        const signature = await getPaymasterSignature({
          payerAddress: address,
          tokenAddress: feeToken,
          validUntil,
          validAfter,
        });

        const paymasterData = buildPaymasterData({
          tokenAddress: feeToken,
          payerAddress: address,
          validUntil,
          validAfter,
          hasPermit: false,
          signature: signature as `0x${string}`,
        });

        const processor =
          params.paymentProcessorAddress || PAYMENT_PROCESSOR_ADDRESS;
        const calls: { to: Address; data: `0x${string}`; value: bigint }[] = [];

        // Build approve calls for each unique token
        const uniqueTokens = [...new Set(params.payments.map((p) => p.token))];
        for (const token of uniqueTokens) {
          calls.push({
            to: token,
            data: encodeFunctionData({
              abi: ERC20_ABI,
              functionName: "approve",
              args: [processor, maxUint256],
            }),
            value: BigInt(0),
          });
        }

        // Build payments array for contract call
        const paymentsArg = params.payments.map((p) => ({
          token: p.token,
          amount: p.amount,
        }));

        // Add executeMultiTokenPayment call
        calls.push({
          to: processor,
          data: encodeFunctionData({
            abi: PAYMENT_PROCESSOR_ABI,
            functionName: "executeMultiTokenPayment",
            args: [
              [
                params.request.recipient,
                params.request.requestedToken,
                params.request.requestedAmount,
                params.request.deadline,
                params.request.nonce,
                params.request.merchantSigner,
              ],
              params.merchantSignature,
              paymentsArg,
            ],
          }),
          value: BigInt(0),
        });

        setStatus("Submitting multi-token payment UserOperation...");
        const res = await client.sendCalls({
          calls,
          paymaster: PAYMASTER_ADDRESS,
          paymasterData,
          paymasterVerificationGasLimit: BigInt(300_000),
          paymasterPostOpGasLimit: BigInt(300_000),
          callGasLimit: BigInt(2_000_000),
          verificationGasLimit: BigInt(1_200_000),
          ...feeParams,
        });

        const userOpHash = res.id as `0x${string}`;
        setStatus("Waiting for multi-token payment execution...");
        const receipt = await waitForUserOp(userOpHash);
        if (!receipt.success) {
          throw new Error(receipt.reason || "Multi-token payment failed");
        }

        setStatus("Multi-token payment executed");
        return receipt.txHash || userOpHash;
      } catch (err) {
        const message = transformError(err);
        setError(message);
        setStatus(message);
        throw new Error(message);
      } finally {
        setIsLoading(false);
      }
    },
    [ensureClient, getFeeParams, waitForUserOp],
  );

  const signMessageWithEOA = useCallback(
    async (hash: `0x${string}`) => {
      if (!effectiveWalletClient) {
        throw new Error("Connect wallet first");
      }
      return effectiveWalletClient.signMessage({
        message: { raw: hash },
      } as any);
    },
    [effectiveWalletClient],
  );

  return {
    smartAccountAddress,
    eoaAddress,
    walletSource,
    status,
    isLoading,
    isReady,
    error,
    sendGaslessTransfer,
    sendBatchTransfer,
    approvePaymaster,
    claimFaucet,
    initSmartAccount: ensureClient,
    swapTokens,
    payInvoice,
    payMultiTokenInvoice,
    signMessageWithEOA,
  };
}
