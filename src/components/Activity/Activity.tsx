"use client";

import { useState, useEffect } from 'react';
import ActivityItem from './ActivityItem';
import { ActivityData, GroupedActivities } from './types';
import { fetchActivityHistory, groupActivitiesByPeriod } from './GetActivityHistory';

export default function Activity() {
  const [groupedActivities, setGroupedActivities] = useState<GroupedActivities[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const loadActivities = async () => {
      try {
        setIsLoading(true);
        setError(null);
        // ============================================
        // TODO: Get actual wallet address from wallet connection
        // const walletAddress = await getConnectedWalletAddress();
        // ============================================
        const walletAddress = '0x1234...5678'; // Placeholder
        const activities = await fetchActivityHistory(walletAddress);
        const grouped = groupActivitiesByPeriod(activities);
        setGroupedActivities(grouped);
      } catch (err) {
        console.error('Failed to load activities:', err);
        setError('Failed to load activity history');
      } finally {
        setIsLoading(false);
      }
    };
    loadActivities();
  }, []);
  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <p className="text-zinc-400">Loading activities...</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }
  if (groupedActivities.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-zinc-400">No activity yet</p>
      </div>
    );
  }
  return (
    <div className="p-6 space-y-6">
      {groupedActivities.map((group) => (
        <div key={group.label}>
          {/* Period Label */}
          <h3 className="text-zinc-400 text-sm font-medium mb-2">
            {group.label}
          </h3>
          
          {/* Activity Items */}
          <div className="divide-y divide-zinc-800">
            {group.activities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
