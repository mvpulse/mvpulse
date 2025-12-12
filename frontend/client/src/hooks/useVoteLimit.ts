/**
 * Hook for managing user vote limits based on their tier
 * Uses React Query for caching and automatic refetching
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { TIER_NAMES, TIER_VOTE_LIMITS } from "@shared/schema";

export interface VoteLimitInfo {
  canVote: boolean;
  votesRemaining: number;
  votesUsed: number;
  tierLimit: number;
  tier: number;
  tierName: string;
  currentStreak: number;
  longestStreak: number;
}

interface VoteRemainingResponse {
  votesRemaining: number;
  votesUsed: number;
  voteLimit: number;
  tier: number;
  canVote: boolean;
  streak: number;
}

interface RecordVoteResponse {
  success: boolean;
  votesRemaining: number;
  votesUsed: number;
  newStreak: number;
  questsCompleted: Array<{
    questId: string;
    questName: string;
    pointsAwarded: number;
  }>;
}

export function useVoteLimit(address: string | null | undefined) {
  const queryClient = useQueryClient();

  // Fetch vote limit info
  const voteLimitQuery = useQuery<VoteLimitInfo>({
    queryKey: ["voteLimit", address],
    queryFn: async () => {
      if (!address) {
        return {
          canVote: false,
          votesRemaining: 0,
          votesUsed: 0,
          tierLimit: TIER_VOTE_LIMITS[0],
          tier: 0,
          tierName: TIER_NAMES[0],
          currentStreak: 0,
          longestStreak: 0,
        };
      }

      const res = await fetch(`/api/votes/remaining/${address}`, {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch vote limit: ${res.statusText}`);
      }

      const response = await res.json();
      const data: VoteRemainingResponse = response.data;

      return {
        canVote: data.canVote,
        votesRemaining: data.votesRemaining,
        votesUsed: data.votesUsed,
        tierLimit: data.voteLimit,
        tier: data.tier,
        tierName: TIER_NAMES[data.tier as keyof typeof TIER_NAMES] || "Bronze",
        currentStreak: data.streak || 0,
        longestStreak: 0,
      };
    },
    enabled: !!address,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true,
  });

  // Mutation to record a vote
  const recordVoteMutation = useMutation<RecordVoteResponse, Error, { pollId: number; seasonId?: string }>({
    mutationFn: async ({ pollId, seasonId }) => {
      if (!address) {
        throw new Error("No wallet address provided");
      }

      const res = await apiRequest("POST", `/api/votes/record/${address}`, {
        pollId,
        seasonId,
      });

      return res.json();
    },
    onSuccess: (data) => {
      // Invalidate vote limit query to refresh the data
      queryClient.invalidateQueries({ queryKey: ["voteLimit", address] });
      // Also invalidate user profile if it exists
      queryClient.invalidateQueries({ queryKey: ["userProfile", address] });
      // Invalidate quest progress
      queryClient.invalidateQueries({ queryKey: ["questProgress", address] });
    },
  });

  return {
    // Query data
    canVote: voteLimitQuery.data?.canVote ?? false,
    votesRemaining: voteLimitQuery.data?.votesRemaining ?? 0,
    votesUsed: voteLimitQuery.data?.votesUsed ?? 0,
    tierLimit: voteLimitQuery.data?.tierLimit ?? TIER_VOTE_LIMITS[0],
    tier: voteLimitQuery.data?.tier ?? 0,
    tierName: voteLimitQuery.data?.tierName ?? "Bronze",
    currentStreak: voteLimitQuery.data?.currentStreak ?? 0,
    longestStreak: voteLimitQuery.data?.longestStreak ?? 0,

    // Query state
    isLoading: voteLimitQuery.isLoading,
    isError: voteLimitQuery.isError,
    error: voteLimitQuery.error,

    // Actions
    recordVote: recordVoteMutation.mutateAsync,
    isRecordingVote: recordVoteMutation.isPending,
    recordVoteError: recordVoteMutation.error,

    // Refetch
    refetch: voteLimitQuery.refetch,
  };
}
