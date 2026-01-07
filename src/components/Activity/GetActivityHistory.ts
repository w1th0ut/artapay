import { ActivityData, GroupedActivities } from './types';

/**
 * Fetch activity history from blockchain
 * TODO: Replace with actual smart contract call
 */
export async function fetchActivityHistory(walletAddress: string): Promise<ActivityData[]> {
  // ============================================
  // TODO: Implement actual blockchain data fetching
  // This should connect to smart contract and fetch transaction history
  // 
  // Example implementation:
  // const contract = new ethers.Contract(contractAddress, abi, provider);
  // const events = await contract.queryFilter(contract.filters.Transfer(walletAddress));
  // return events.map(event => parseEventToActivityData(event));
  // ============================================
  // Hardcoded dummy data for development
  const now = new Date();
  const dummyData: ActivityData[] = [
    {
      id: '1',
      type: 'swap',
      status: 'confirmed',
      timestamp: new Date(now.getFullYear(), now.getMonth(), 25, 14, 43),
      amount: 0.0001,
      currency: 'USDC',
      currencyIcon: '/icons/usdc.svg',
      swapToAmount: 0.0001,
      swapToCurrency: 'IDRX',
      swapToCurrencyIcon: '/icons/idrx.svg',
    },
    {
      id: '2',
      type: 'receive',
      status: 'confirmed',
      timestamp: new Date(now.getFullYear(), now.getMonth(), 25, 14, 43),
      amount: 0.0001,
      currency: 'USDC',
      currencyIcon: '/icons/usdc.svg',
    },
    {
      id: '3',
      type: 'send',
      status: 'confirmed',
      timestamp: new Date(now.getFullYear(), now.getMonth(), 20, 10, 30),
      amount: 0.0001,
      currency: 'USDC',
      currencyIcon: '/icons/usdc.svg',
    },
    {
      id: '4',
      type: 'send',
      status: 'pending',
      timestamp: new Date(now.getFullYear(), now.getMonth() - 1, 15, 9, 0),
      amount: 0.05,
      currency: 'USDT',
      currencyIcon: '/icons/usdt.svg',
    },
    {
      id: '5',
      type: 'swap',
      status: 'canceled',
      timestamp: new Date(now.getFullYear() - 1, 7, 10, 16, 20), // August last year
      amount: 100,
      currency: 'USDC',
      currencyIcon: '/icons/usdc.svg',
      swapToAmount: 1580000,
      swapToCurrency: 'IDRX',
      swapToCurrencyIcon: '/icons/idrx.svg',
    },
  ];
  return dummyData;
}

/**
 * Group activities by month/year
 */
export function groupActivitiesByPeriod(activities: ActivityData[]): GroupedActivities[] {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // Sort activities by date (newest first)
  const sorted = [...activities].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  // Group by period
  const groups: Map<string, ActivityData[]> = new Map();

  sorted.forEach(activity => {
    const activityYear = activity.timestamp.getFullYear();
    const activityMonth = activity.timestamp.getMonth();
    let label: string;
    if (activityYear === currentYear && activityMonth === currentMonth) {
      label = 'This Month';
    } else if (activityYear === currentYear && activityMonth === currentMonth - 1) {
      label = 'Last Month';
    } else if (activityYear === currentYear) {
      // Same year, different month
      label = activity.timestamp.toLocaleString('en-US', { month: 'short' });
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
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format time for display
 */
export function formatActivityTime(date: Date): string {
  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  }) + ' WIB';
}
