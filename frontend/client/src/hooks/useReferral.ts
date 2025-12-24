/**
 * Hook for managing referral system
 * - Generates/retrieves referral codes
 * - Tracks referral link usage
 * - Fetches referral stats
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useReferralTracking } from "./useReferralTracking";
import { useEffect } from "react";

export interface ReferralCode {
  id: string;
  walletAddress: string;
  code: string;
  createdAt: string;
}

export interface ReferralStats {
  id: string;
  walletAddress: string;
  totalReferrals: number;
  activeReferrals: number;
  totalPointsEarned: number;
  currentTier: number;
  tierName: string;
  tierMultiplier: number;
  referralCode: string | null;
  nextTierThreshold: number | null;
  nextTierName: string | null;
  updatedAt: string;
}

export interface ReferralMilestone {
  id: string;
  referralId: string;
  milestoneType: string;
  referrerPointsAwarded: number;
  refereePointsAwarded: number;
  achievedAt: string;
}

export interface RefereeInfo {
  id: string;
  refereeAddress: string;
  status: number;
  createdAt: string;
  activatedAt: string | null;
  completedAt: string | null;
  milestones: ReferralMilestone[];
  totalPointsEarned: number;
}

export interface ReferralLeaderboardEntry {
  id: string;
  walletAddress: string;
  totalReferrals: number;
  activeReferrals: number;
  totalPointsEarned: number;
  currentTier: number;
  tierName: string;
  rank: number;
  updatedAt: string;
}

interface TrackReferralInput {
  refereeAddress: string;
  referralCode: string;
}

interface TrackReferralResponse {
  referral: {
    id: string;
    referrerAddress: string;
    refereeAddress: string;
    status: number;
  };
  milestoneAwarded: {
    referrerPoints: number;
    refereePoints: number;
  } | null;
}

export function useReferral(address: string | null | undefined) {
  const queryClient = useQueryClient();
  const { storedReferralCode, clearReferralCode, hasPendingReferral } = useReferralTracking();

  // Get referral code for the user
  const referralCodeQuery = useQuery<ReferralCode | null>({
    queryKey: ["referralCode", address],
    queryFn: async () => {
      if (!address) return null;

      const res = await fetch(`/api/referral/code/${address}`, {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch referral code: ${res.statusText}`);
      }
      const data = await res.json();
      return data.data;
    },
    enabled: !!address,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get referral stats for the user
  const statsQuery = useQuery<ReferralStats | null>({
    queryKey: ["referralStats", address],
    queryFn: async () => {
      if (!address) return null;

      const res = await fetch(`/api/referral/stats/${address}`, {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch referral stats: ${res.statusText}`);
      }
      const data = await res.json();
      return data.data;
    },
    enabled: !!address,
    staleTime: 60 * 1000, // 1 minute
  });

  // Get list of referees
  const refereesQuery = useQuery<RefereeInfo[]>({
    queryKey: ["referees", address],
    queryFn: async () => {
      if (!address) return [];

      const res = await fetch(`/api/referral/referees/${address}`, {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch referees: ${res.statusText}`);
      }
      const data = await res.json();
      return data.data;
    },
    enabled: !!address,
    staleTime: 60 * 1000, // 1 minute
  });

  // Track referral mutation
  const trackReferralMutation = useMutation<TrackReferralResponse, Error, TrackReferralInput>({
    mutationFn: async ({ refereeAddress, referralCode }) => {
      const res = await fetch("/api/referral/track", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ refereeAddress, referralCode }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to track referral: ${res.statusText}`);
      }
      const data = await res.json();
      return data.data;
    },
    onSuccess: () => {
      // Clear the stored referral code after successful tracking
      clearReferralCode();
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["referralStats"] });
      queryClient.invalidateQueries({ queryKey: ["referees"] });
      queryClient.invalidateQueries({ queryKey: ["userProfile", address] });
    },
  });

  // Auto-track referral when user connects with a pending referral code
  useEffect(() => {
    if (address && hasPendingReferral && storedReferralCode && !trackReferralMutation.isPending) {
      trackReferralMutation.mutate({
        refereeAddress: address,
        referralCode: storedReferralCode,
      });
    }
  }, [address, hasPendingReferral, storedReferralCode]);

  // Generate referral URL
  const getReferralUrl = (path?: string) => {
    const code = referralCodeQuery.data?.code;
    if (!code) return null;

    const baseUrl = window.location.origin;
    const targetPath = path || "";
    return `${baseUrl}${targetPath}?ref=${code}`;
  };

  // Copy referral link to clipboard
  const copyReferralLink = async (path?: string) => {
    const url = getReferralUrl(path);
    if (url) {
      await navigator.clipboard.writeText(url);
      return true;
    }
    return false;
  };

  return {
    // Referral code
    referralCode: referralCodeQuery.data?.code || null,
    referralCodeLoading: referralCodeQuery.isLoading,

    // Stats
    stats: statsQuery.data,
    statsLoading: statsQuery.isLoading,

    // Referees
    referees: refereesQuery.data || [],
    refereesLoading: refereesQuery.isLoading,

    // Track referral
    trackReferral: trackReferralMutation.mutateAsync,
    isTrackingReferral: trackReferralMutation.isPending,
    trackReferralError: trackReferralMutation.error,

    // Helpers
    getReferralUrl,
    copyReferralLink,
    hasPendingReferral,

    // Refetch functions
    refetchStats: () => statsQuery.refetch(),
    refetchReferees: () => refereesQuery.refetch(),
  };
}

// Hook for fetching referral leaderboard
export function useReferralLeaderboard(limit: number = 50, offset: number = 0) {
  const leaderboardQuery = useQuery<ReferralLeaderboardEntry[]>({
    queryKey: ["referralLeaderboard", limit, offset],
    queryFn: async () => {
      const res = await fetch(`/api/referral/leaderboard?limit=${limit}&offset=${offset}`, {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch leaderboard: ${res.statusText}`);
      }
      const data = await res.json();
      return data.data;
    },
    staleTime: 60 * 1000, // 1 minute
  });

  return {
    leaderboard: leaderboardQuery.data || [],
    isLoading: leaderboardQuery.isLoading,
    error: leaderboardQuery.error,
    refetch: () => leaderboardQuery.refetch(),
  };
}
