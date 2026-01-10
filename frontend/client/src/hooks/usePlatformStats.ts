/**
 * Hook for fetching platform-wide statistics for the landing page
 * Combines database stats (users, votes) with blockchain stats (polls, rewards)
 * All stats are network-specific (testnet vs mainnet)
 */

import { useQuery } from "@tanstack/react-query";
import { useContract } from "@/hooks/useContract";
import { useNetwork } from "@/contexts/NetworkContext";
import type { PollWithMeta } from "@/types/poll";

export interface PlatformStats {
  pollsCreated: number;
  totalResponses: number;
  rewardsDistributed: number;
  activeUsers: number;
}

interface DatabaseStats {
  totalUsers: number;
  totalVotes: number;
  totalQuestionnaireCompletions: number;
  network: string;
}

interface DatabaseStatsResponse {
  success: boolean;
  data: DatabaseStats;
}

/**
 * Calculate total rewards distributed from all polls
 * For Manual Push mode: if rewards_distributed is true, all reward_pool was distributed
 * For Manual Pull mode: reward_per_vote * claimed.length (or equal split if reward_per_vote is 0)
 */
function calculateTotalRewardsDistributed(polls: PollWithMeta[]): number {
  let total = 0;

  for (const poll of polls) {
    if (poll.rewards_distributed) {
      // Manual Push mode - entire reward pool was distributed
      total += poll.reward_pool;
    } else if (poll.claimed && poll.claimed.length > 0) {
      // Manual Pull mode - calculate based on claims
      if (poll.reward_per_vote > 0) {
        // Fixed amount per voter
        total += poll.reward_per_vote * poll.claimed.length;
      } else if (poll.voters.length > 0) {
        // Equal split mode - each claimer gets reward_pool / total_voters
        const rewardPerVoter = Math.floor(poll.reward_pool / poll.voters.length);
        total += rewardPerVoter * poll.claimed.length;
      }
    }
  }

  return total;
}

export function usePlatformStats() {
  const { getAllPolls, contractAddress } = useContract();
  const { network } = useNetwork();

  // Fetch database stats from our API (network-specific)
  const databaseStatsQuery = useQuery<DatabaseStats>({
    queryKey: ["platformStats", "database", network],
    queryFn: async () => {
      const res = await fetch(`/api/platform/stats?network=${network}`, {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch platform stats: ${res.statusText}`);
      }

      const data: DatabaseStatsResponse = await res.json();

      if (!data.success) {
        throw new Error("Failed to fetch platform stats");
      }

      return data.data;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });

  // Fetch blockchain stats (poll count and rewards distributed)
  // These are already network-specific via the contractAddress from NetworkContext
  const blockchainStatsQuery = useQuery({
    queryKey: ["platformStats", "blockchain", contractAddress, network],
    queryFn: async () => {
      const polls = await getAllPolls();
      const pollCount = polls.length;

      // Calculate total rewards that have been distributed to participants
      const totalRewardsDistributed = calculateTotalRewardsDistributed(polls);

      return {
        pollCount,
        totalRewardsDistributed,
      };
    },
    enabled: !!contractAddress,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });

  // Combine stats
  const stats: PlatformStats = {
    pollsCreated: blockchainStatsQuery.data?.pollCount ?? 0,
    totalResponses: databaseStatsQuery.data?.totalVotes ?? 0,
    rewardsDistributed: blockchainStatsQuery.data?.totalRewardsDistributed ?? 0,
    activeUsers: databaseStatsQuery.data?.totalUsers ?? 0,
  };

  // Format numbers for display
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M+`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(0)}k+`;
    }
    return num > 0 ? `${num}+` : "0";
  };

  // Format currency for display (assuming octas, convert to MOVE)
  const formatRewards = (octas: number): string => {
    // Convert from octas (1e8) to MOVE
    const move = octas / 1e8;
    if (move >= 1000000) {
      return `$${(move / 1000000).toFixed(1)}M+`;
    }
    if (move >= 1000) {
      return `$${(move / 1000).toFixed(0)}k+`;
    }
    return move > 0 ? `$${move.toFixed(0)}+` : "$0";
  };

  const formattedStats = {
    pollsCreated: formatNumber(stats.pollsCreated),
    totalResponses: formatNumber(stats.totalResponses),
    rewardsDistributed: formatRewards(stats.rewardsDistributed),
    activeUsers: formatNumber(stats.activeUsers),
  };

  return {
    // Raw stats
    stats,
    // Formatted stats for display
    formattedStats,
    // Current network these stats are for
    network,
    // Loading state
    isLoading: databaseStatsQuery.isLoading || blockchainStatsQuery.isLoading,
    // Error state
    isError: databaseStatsQuery.isError || blockchainStatsQuery.isError,
    error: databaseStatsQuery.error || blockchainStatsQuery.error,
    // Refetch
    refetch: async () => {
      await Promise.all([
        databaseStatsQuery.refetch(),
        blockchainStatsQuery.refetch(),
      ]);
    },
  };
}
