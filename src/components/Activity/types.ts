export type ActivityType = 'send' | 'receive' | 'swap';
export type ActivityStatus = 'confirmed' | 'pending' | 'canceled';

export interface ActivityData {
  id: string;
  type: ActivityType;
  status: ActivityStatus;
  timestamp: Date;
  amount: number;
  currency: string;
  currencyIcon: string;
  // For swap activities
  swapToAmount?: number;
  swapToCurrency?: string;
  swapToCurrencyIcon?: string;
}

export interface GroupedActivities {
  label: string;
  activities: ActivityData[];
}
