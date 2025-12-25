/**
 * Hooks for season management (admin/creator)
 * Separate from useQuests.ts to handle season lifecycle operations
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SEASON_STATUS, type Season, type UserSeasonSnapshot } from "@shared/schema";

// ============================================
// Types
// ============================================

export interface SeasonWithStats extends Season {
  participantCount?: number;
  totalPointsDistributed?: number;
}

export interface CreateSeasonInput {
  name: string;
  description?: string;
  startTime: string;
  endTime: string;
  totalPulsePool?: string;
  creatorAddress: string;
}

// Helper to get status label
export function getSeasonStatusLabel(status: number): string {
  switch (status) {
    case SEASON_STATUS.PENDING:
      return "Pending";
    case SEASON_STATUS.ACTIVE:
      return "Active";
    case SEASON_STATUS.ENDED:
      return "Ended";
    case SEASON_STATUS.DISTRIBUTED:
      return "Distributed";
    default:
      return "Unknown";
  }
}

// Helper to get status color
export function getSeasonStatusColor(status: number): string {
  switch (status) {
    case SEASON_STATUS.PENDING:
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
    case SEASON_STATUS.ACTIVE:
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    case SEASON_STATUS.ENDED:
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
    case SEASON_STATUS.DISTRIBUTED:
      return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
  }
}

// ============================================
// useSeasons Hook - List all seasons
// ============================================

export function useSeasons(status?: number) {
  return useQuery<SeasonWithStats[]>({
    queryKey: ["seasons", status],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (status !== undefined) {
        params.set("status", status.toString());
      }
      params.set("limit", "50");

      const res = await fetch(`/api/seasons?${params.toString()}`, {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch seasons: ${res.statusText}`);
      }

      const data = await res.json();
      return data.data || [];
    },
  });
}

// ============================================
// useSeason Hook - Get single season with stats
// ============================================

export function useSeasonDetails(seasonId: string | undefined) {
  return useQuery<SeasonWithStats | null>({
    queryKey: ["season", seasonId],
    queryFn: async () => {
      if (!seasonId) return null;

      const res = await fetch(`/api/seasons/${seasonId}`, {
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error(`Failed to fetch season: ${res.statusText}`);
      }

      const data = await res.json();
      return data.data || null;
    },
    enabled: !!seasonId,
  });
}

// ============================================
// useSeasonSnapshots Hook - Get snapshots for ended season
// ============================================

export function useSeasonSnapshots(seasonId: string | undefined) {
  return useQuery<UserSeasonSnapshot[]>({
    queryKey: ["seasonSnapshots", seasonId],
    queryFn: async () => {
      if (!seasonId) return [];

      const res = await fetch(`/api/seasons/${seasonId}/snapshots?limit=100`, {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch snapshots: ${res.statusText}`);
      }

      const data = await res.json();
      return data.data || [];
    },
    enabled: !!seasonId,
  });
}

// ============================================
// Mutations
// ============================================

export function useCreateSeason() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateSeasonInput) => {
      const res = await fetch("/api/seasons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(input),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create season");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seasons"] });
    },
  });
}

export function useStartSeason() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (seasonId: string) => {
      const res = await fetch(`/api/seasons/${seasonId}/start`, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to start season");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seasons"] });
      queryClient.invalidateQueries({ queryKey: ["currentSeason"] });
    },
  });
}

export function useEndSeason() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (seasonId: string) => {
      const res = await fetch(`/api/seasons/${seasonId}/end`, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to end season");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seasons"] });
      queryClient.invalidateQueries({ queryKey: ["currentSeason"] });
    },
  });
}

export function useDistributeSeason() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (seasonId: string) => {
      const res = await fetch(`/api/seasons/${seasonId}/distribute`, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to mark season as distributed");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seasons"] });
    },
  });
}

export function useCopyQuests() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      targetSeasonId,
      fromSeasonId,
    }: {
      targetSeasonId: string;
      fromSeasonId: string;
    }) => {
      const res = await fetch(`/api/seasons/${targetSeasonId}/copy-quests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ fromSeasonId }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to copy quests");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quests"] });
    },
  });
}

// Re-export SEASON_STATUS for convenience
export { SEASON_STATUS };
