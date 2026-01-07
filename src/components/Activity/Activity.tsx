"use client";

import { useState, useEffect } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import ActivityItem from "./ActivityItem";
import { ActivityData, GroupedActivities } from "./types";
import {
  fetchActivityHistory,
  groupActivitiesByPeriod,
} from "./GetActivityHistory";
import { useSmartAccount } from "@/hooks/useSmartAccount";

export default function Activity() {
  const [groupedActivities, setGroupedActivities] = useState<
    GroupedActivities[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { smartAccountAddress, isReady } = useSmartAccount();

  const loadActivities = async () => {
    if (!smartAccountAddress) {
      setGroupedActivities([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const activities = await fetchActivityHistory(smartAccountAddress);
      const grouped = groupActivitiesByPeriod(activities);
      setGroupedActivities(grouped);
    } catch (err) {
      console.error("Failed to load activities:", err);
      setError("Failed to load activity history");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, [smartAccountAddress]);

  // Show connect wallet message if not connected
  if (isReady && !smartAccountAddress) {
    return (
      <div className="p-6 text-center">
        <p className="text-zinc-400">Connect wallet to view activity</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 flex flex-col items-center gap-2">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
        <p className="text-zinc-400">Loading activities...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center space-y-3">
        <p className="text-red-400">{error}</p>
        <button
          onClick={loadActivities}
          className="px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors flex items-center gap-2 mx-auto"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
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
      {/* Refresh button */}
      <div className="flex justify-end">
        <button
          onClick={loadActivities}
          className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

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
