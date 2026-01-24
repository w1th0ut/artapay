import { useState, useEffect, useCallback } from "react";
import { createPublicClient, http, type Address } from "viem";
import { BASE_SEPOLIA } from "@/config/chains";
import { ERC20_ABI, PAYMASTER_ABI } from "@/config/abi";
import { TOKENS, PAYMASTER_ADDRESS } from "@/config/constants";

const publicClient = createPublicClient({
  chain: BASE_SEPOLIA,
  transport: http(BASE_SEPOLIA.rpcUrls.default.http[0]),
});

export function useApprovalStatus(smartAccountAddress: Address | null) {
  const [isApproved, setIsApproved] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [ethBalance, setEthBalance] = useState<bigint>(BigInt(0));

  const checkApproval = useCallback(
    async (showLoading = false) => {
      if (!smartAccountAddress) {
        setIsApproved(null);
        setEthBalance(BigInt(0));
        return;
      }
      if (showLoading) {
        setIsChecking(true);
      }
      try {
        // Check if all tokens are supported + approved to Paymaster
        const approvalChecks = await Promise.all(
          TOKENS.map(async (token) => {
            try {
              const supported = await publicClient.readContract({
                address: PAYMASTER_ADDRESS,
                abi: PAYMASTER_ABI,
                functionName: "isSupportedToken",
                args: [token.address as Address],
              });
              const allowance = await publicClient.readContract({
                address: token.address as Address,
                abi: ERC20_ABI,
                functionName: "allowance",
                args: [smartAccountAddress, PAYMASTER_ADDRESS],
              });
              return Boolean(supported) && (allowance as bigint) > BigInt(0);
            } catch {
              return false;
            }
          })
        );

        // Check ETH balance
        const balance = await publicClient.getBalance({
          address: smartAccountAddress,
        });
        setEthBalance(balance);

        const hasAllApprovals = approvalChecks.every((approved) => approved);
        setIsApproved(hasAllApprovals);
      } catch (err) {
        console.error("Failed to check approval status:", err);
        setIsApproved(false);
      } finally {
        if (showLoading) {
          setIsChecking(false);
        }
      }
    },
    [smartAccountAddress]
  );

  useEffect(() => {
    if (!smartAccountAddress) {
      setIsApproved(null);
      setEthBalance(BigInt(0));
      return;
    }

    checkApproval(true);
    const intervalId = setInterval(() => checkApproval(false), 7000);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        checkApproval(false);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [smartAccountAddress, checkApproval]);

  return { isApproved, isChecking, ethBalance, refresh: checkApproval };
}
