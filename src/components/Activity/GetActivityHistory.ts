import { ActivityData, GroupedActivities } from "./types";
import {
  createPublicClient,
  http,
  parseAbiItem,
  formatUnits,
  type Address,
} from "viem";
import { LISK_SEPOLIA } from "@/config/chains";
import {
  PAYMENT_PROCESSOR_ADDRESS,
  PAYMASTER_ADDRESS,
  STABLE_SWAP_ADDRESS,
  TOKENS,
} from "@/config/constants";
import { env } from "@/config/env";

const publicClient = createPublicClient({
  chain: LISK_SEPOLIA,
  transport: http(LISK_SEPOLIA.rpcUrls.default.http[0]),
});

const transferEventAbi = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 value)"
);

const paymentCompletedEventAbi = parseAbiItem(
  "event PaymentCompleted(bytes32 indexed nonce, address indexed recipient, address indexed payer, address requestedToken, address payToken, uint256 requestedAmount, uint256 paidAmount)"
);

const tokenInfoMap = new Map(
  TOKENS.map((token) => [token.address.toLowerCase(), token])
);

const MAX_ACTIVITIES = 10;
const MAX_BLOCK_RANGE = 100000n;
const MAX_LOOKBACK_BLOCKS = BigInt(env.activityLookbackBlocks);
const MAX_CHUNKS = 20;

type LogWithArgs = Awaited<ReturnType<typeof publicClient.getLogs>>[number] & {
  args?: Record<string, unknown>;
};

type TransferLog = LogWithArgs & {
  args?: {
    from?: Address;
    to?: Address;
    value?: bigint;
  };
};

type TokenTransferLog = {
  log: TransferLog;
  token: (typeof TOKENS)[number];
  direction: "send" | "receive";
};

type PaymentLog = {
  log: LogWithArgs;
  role: "payer" | "recipient";
};

/**
 * Fetch activity history from blockchain
 */
export async function fetchActivityHistory(
  walletAddress: string
): Promise<ActivityData[]> {
  if (!walletAddress || walletAddress === "0x1234...5678") {
    return [];
  }

  const address = walletAddress.toLowerCase() as Address;
  const stableSwapAddress = STABLE_SWAP_ADDRESS.toLowerCase();
  const paymentProcessorAddress = PAYMENT_PROCESSOR_ADDRESS.toLowerCase();
  const paymasterAddress = PAYMASTER_ADDRESS.toLowerCase();

  const activities: ActivityData[] = [];
  const blockTimestampCache = new Map<bigint, Date>();

  const getBlockDate = async (blockNumber: bigint) => {
    const cached = blockTimestampCache.get(blockNumber);
    if (cached) return cached;
    const block = await publicClient.getBlock({ blockNumber });
    const date = new Date(Number(block.timestamp) * 1000);
    blockTimestampCache.set(blockNumber, date);
    return date;
  };

  const getTokenByAddress = (tokenAddress: string) =>
    tokenInfoMap.get(tokenAddress.toLowerCase());

  const buildActivitiesFromLogs = async (
    transferLogs: TokenTransferLog[],
    paymentLogs: PaymentLog[]
  ): Promise<ActivityData[]> => {
    const chunkActivities: ActivityData[] = [];
    const swapLogIds = new Set<string>();

    const swapCandidates = new Map<
      string,
      { out?: TokenTransferLog; in?: TokenTransferLog }
    >();

    for (const entry of transferLogs) {
      const from = (entry.log.args?.from as string | undefined)?.toLowerCase();
      const to = (entry.log.args?.to as string | undefined)?.toLowerCase();
      const txHash = entry.log.transactionHash as string | undefined;
      if (!txHash) continue;

      if (entry.direction === "send" && to === stableSwapAddress) {
        const existing = swapCandidates.get(txHash) || {};
        existing.out = entry;
        swapCandidates.set(txHash, existing);
      }

      if (entry.direction === "receive" && from === stableSwapAddress) {
        const existing = swapCandidates.get(txHash) || {};
        existing.in = entry;
        swapCandidates.set(txHash, existing);
      }
    }

    for (const [txHash, pair] of swapCandidates.entries()) {
      if (!pair.out || !pair.in) continue;
      if (pair.out.log.blockNumber == null || pair.in.log.blockNumber == null) {
        continue;
      }

      const outLogId = `${pair.out.log.transactionHash}-${pair.out.log.logIndex}`;
      const inLogId = `${pair.in.log.transactionHash}-${pair.in.log.logIndex}`;
      swapLogIds.add(outLogId);
      swapLogIds.add(inLogId);

      const timestamp = await getBlockDate(pair.out.log.blockNumber);
      const amountIn = Number(
        formatUnits(pair.out.log.args?.value || 0n, pair.out.token.decimals)
      );
      const amountOut = Number(
        formatUnits(pair.in.log.args?.value || 0n, pair.in.token.decimals)
      );

      chunkActivities.push({
        id: `${txHash}-swap`,
        type: "swap",
        status: "confirmed",
        timestamp,
        amount: amountIn,
        currency: pair.out.token.symbol,
        currencyIcon: `/icons/${pair.out.token.symbol.toLowerCase()}.svg`,
        swapToAmount: amountOut,
        swapToCurrency: pair.in.token.symbol,
        swapToCurrencyIcon: `/icons/${pair.in.token.symbol.toLowerCase()}.svg`,
        txHash,
      });
    }

    const paymentActivityIds = new Set<string>();
    for (const entry of paymentLogs) {
      if (entry.log.blockNumber == null || !entry.log.transactionHash) {
        continue;
      }
      const args = entry.log.args as {
        recipient: Address;
        payer: Address;
        requestedToken: Address;
        payToken: Address;
        requestedAmount: bigint;
        paidAmount: bigint;
      };

      const timestamp = await getBlockDate(entry.log.blockNumber);
      const logId = `${entry.log.transactionHash}-${entry.log.logIndex}-payment-${entry.role}`;
      if (paymentActivityIds.has(logId)) continue;
      paymentActivityIds.add(logId);

      if (entry.role === "payer") {
        const token = getTokenByAddress(args.payToken);
        if (!token) continue;
        const amount = Number(formatUnits(args.paidAmount, token.decimals));

        chunkActivities.push({
          id: logId,
          type: "send",
          status: "confirmed",
          timestamp,
          amount,
          currency: token.symbol,
          currencyIcon: `/icons/${token.symbol.toLowerCase()}.svg`,
          txHash: entry.log.transactionHash,
          fromAddress: args.payer,
          toAddress: args.recipient,
        });
      } else {
        const token = getTokenByAddress(args.requestedToken);
        if (!token) continue;
        const amount = Number(formatUnits(args.requestedAmount, token.decimals));

        chunkActivities.push({
          id: logId,
          type: "receive",
          status: "confirmed",
          timestamp,
          amount,
          currency: token.symbol,
          currencyIcon: `/icons/${token.symbol.toLowerCase()}.svg`,
          txHash: entry.log.transactionHash,
          fromAddress: args.payer,
          toAddress: args.recipient,
        });
      }
    }

    for (const entry of transferLogs) {
      if (entry.log.blockNumber == null || !entry.log.transactionHash) {
        continue;
      }
      const logId = `${entry.log.transactionHash}-${entry.log.logIndex}`;
      if (swapLogIds.has(logId)) continue;

      const from = (entry.log.args?.from as string | undefined)?.toLowerCase();
      const to = (entry.log.args?.to as string | undefined)?.toLowerCase();
      const counterparty = entry.direction === "send" ? to : from;

      if (
        counterparty === stableSwapAddress ||
        counterparty === paymentProcessorAddress ||
        counterparty === paymasterAddress
      ) {
        continue;
      }

      const timestamp = await getBlockDate(entry.log.blockNumber);
      const amount = Number(
        formatUnits(entry.log.args?.value || 0n, entry.token.decimals)
      );

      chunkActivities.push({
        id: logId,
        type: entry.direction,
        status: "confirmed",
        timestamp,
        amount,
        currency: entry.token.symbol,
        currencyIcon: `/icons/${entry.token.symbol.toLowerCase()}.svg`,
        txHash: entry.log.transactionHash,
        fromAddress: entry.log.args?.from as Address | undefined,
        toAddress: entry.log.args?.to as Address | undefined,
      });
    }

    return chunkActivities;
  };

  try {
    const latestBlock = await publicClient.getBlockNumber();
    const minBlock =
      latestBlock > MAX_LOOKBACK_BLOCKS
        ? latestBlock - MAX_LOOKBACK_BLOCKS + 1n
        : 0n;
    let toBlock = latestBlock;
    let chunkCount = 0;

    while (toBlock >= 0n && activities.length < MAX_ACTIVITIES) {
      if (toBlock < minBlock) break;
      if (chunkCount >= MAX_CHUNKS) break;
      let fromBlock =
        toBlock > MAX_BLOCK_RANGE ? toBlock - MAX_BLOCK_RANGE + 1n : 0n;
      if (fromBlock < minBlock) {
        fromBlock = minBlock;
      }

      const range = { fromBlock, toBlock };

      const [sentByToken, receivedByToken] = await Promise.all([
        Promise.all(
          TOKENS.map(async (token) => {
            try {
              const logs = await publicClient.getLogs({
                address: token.address as Address,
                event: transferEventAbi,
                args: { from: address },
                ...range,
              });
              return logs.map((log) => ({
                log,
                token,
                direction: "send" as const,
              }));
            } catch (err) {
              console.warn(
                `Failed to fetch sent logs for ${token.symbol}:`,
                err
              );
              return [];
            }
          })
        ),
        Promise.all(
          TOKENS.map(async (token) => {
            try {
              const logs = await publicClient.getLogs({
                address: token.address as Address,
                event: transferEventAbi,
                args: { to: address },
                ...range,
              });
              return logs.map((log) => ({
                log,
                token,
                direction: "receive" as const,
              }));
            } catch (err) {
              console.warn(
                `Failed to fetch received logs for ${token.symbol}:`,
                err
              );
              return [];
            }
          })
        ),
      ]);

      const transferLogs = [...sentByToken.flat(), ...receivedByToken.flat()];

      const [paymentByPayer, paymentByRecipient] = await Promise.all([
        publicClient
          .getLogs({
            address: PAYMENT_PROCESSOR_ADDRESS as Address,
            event: paymentCompletedEventAbi,
            args: { payer: address },
            ...range,
          })
          .then((logs) => logs.map((log) => ({ log, role: "payer" as const })))
          .catch((err) => {
            console.warn("Failed to fetch payment logs (payer):", err);
            return [];
          }),
        publicClient
          .getLogs({
            address: PAYMENT_PROCESSOR_ADDRESS as Address,
            event: paymentCompletedEventAbi,
            args: { recipient: address },
            ...range,
          })
          .then((logs) =>
            logs.map((log) => ({ log, role: "recipient" as const }))
          )
          .catch((err) => {
            console.warn("Failed to fetch payment logs (recipient):", err);
            return [];
          }),
      ]);

      const chunkActivities = await buildActivitiesFromLogs(transferLogs, [
        ...paymentByPayer,
        ...paymentByRecipient,
      ]);

      activities.push(...chunkActivities);
      activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      if (activities.length >= MAX_ACTIVITIES) break;
      if (fromBlock === minBlock) break;
      toBlock = fromBlock - 1n;
      chunkCount += 1;
    }

    return activities.slice(0, MAX_ACTIVITIES);
  } catch (err) {
    console.error("Failed to fetch activity history:", err);
    return [];
  }
}

/**
 * Group activities by month/year
 */
export function groupActivitiesByPeriod(
  activities: ActivityData[]
): GroupedActivities[] {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // Sort activities by date (newest first)
  const sorted = [...activities].sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
  );

  // Group by period
  const groups: Map<string, ActivityData[]> = new Map();

  sorted.forEach((activity) => {
    const activityYear = activity.timestamp.getFullYear();
    const activityMonth = activity.timestamp.getMonth();
    let label: string;
    if (activityYear === currentYear && activityMonth === currentMonth) {
      label = "Latest Transactions";
    } else if (
      activityYear === currentYear &&
      activityMonth === currentMonth - 1
    ) {
      label = "Last Month";
    } else if (activityYear === currentYear) {
      // Same year, different month
      label = activity.timestamp.toLocaleString("en-US", { month: "short" });
    } else {
      // Different year
      label = activityYear.toString();
    }

    const existing = groups.get(label) || [];
    existing.push(activity);
    groups.set(label, existing);
  });
  // Convert to array
  return Array.from(groups.entries()).map(([label, activities]) => ({
    label,
    activities,
  }));
}

/**
 * Format date for display
 */
export function formatActivityDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Format time for display
 */
export function formatActivityTime(date: Date): string {
  return (
    date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    }) + " WIB"
  );
}
