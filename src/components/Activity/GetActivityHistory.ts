import { ActivityData, GroupedActivities } from "./types";
import {
  createPublicClient,
  http,
  parseAbiItem,
  formatUnits,
  type Address,
} from "viem";
import { LISK_SEPOLIA } from "@/config/chains";
import { TOKENS } from "@/config/constants";

// Create public client for blockchain queries
const publicClient = createPublicClient({
  chain: LISK_SEPOLIA,
  transport: http(LISK_SEPOLIA.rpcUrls.default.http[0]),
});

// Transfer event ABI
const transferEventAbi = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 value)"
);

// Map token addresses to their info
const tokenInfoMap = new Map(
  TOKENS.map((token) => [token.address.toLowerCase(), token])
);

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
  const activities: ActivityData[] = [];

  console.log("Fetching activity for address:", walletAddress);

  try {
    // Fetch Transfer events for each supported token
    for (const token of TOKENS) {
      try {
        console.log(`Fetching logs for ${token.symbol} at ${token.address}`);

        // Fetch outgoing transfers (send)
        const sentLogs = await publicClient.getLogs({
          address: token.address as Address,
          event: transferEventAbi,
          args: { from: address as Address },
          fromBlock: 0n,
          toBlock: "latest",
        });

        console.log(`Found ${sentLogs.length} sent logs for ${token.symbol}`);

        // Fetch incoming transfers (receive)
        const receivedLogs = await publicClient.getLogs({
          address: token.address as Address,
          event: transferEventAbi,
          args: { to: address as Address },
          fromBlock: 0n,
          toBlock: "latest",
        });

        // Process sent transfers
        for (const log of sentLogs) {
          const block = await publicClient.getBlock({
            blockNumber: log.blockNumber,
          });
          const amount = Number(
            formatUnits(log.args.value || 0n, token.decimals)
          );

          activities.push({
            id: `${log.transactionHash}-${log.logIndex}`,
            type: "send",
            status: "confirmed",
            timestamp: new Date(Number(block.timestamp) * 1000),
            amount,
            currency: token.symbol,
            currencyIcon: `/icons/${token.symbol.toLowerCase()}.svg`,
            txHash: log.transactionHash,
            toAddress: log.args.to,
          });
        }

        // Process received transfers
        for (const log of receivedLogs) {
          const block = await publicClient.getBlock({
            blockNumber: log.blockNumber,
          });
          const amount = Number(
            formatUnits(log.args.value || 0n, token.decimals)
          );

          activities.push({
            id: `${log.transactionHash}-${log.logIndex}`,
            type: "receive",
            status: "confirmed",
            timestamp: new Date(Number(block.timestamp) * 1000),
            amount,
            currency: token.symbol,
            currencyIcon: `/icons/${token.symbol.toLowerCase()}.svg`,
            txHash: log.transactionHash,
            fromAddress: log.args.from,
          });
        }
      } catch (err) {
        console.warn(`Failed to fetch logs for ${token.symbol}:`, err);
      }
    }

    // Sort by timestamp (newest first)
    activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return activities;
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
      label = "This Month";
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
