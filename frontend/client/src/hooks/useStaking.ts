/**
 * Hook for PULSE staking operations
 * Handles stake, unstake, and view functions for the staking contract
 */

import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useNetwork } from "@/contexts/NetworkContext";
import { createAptosClient } from "@/lib/contract";
import { usePrivyWallet } from "@/hooks/usePrivyWallet";
import { submitPrivyTransaction } from "@/lib/privy-transactions";
import {
  submitPrivySponsoredTransaction,
  submitNativeSponsoredTransaction,
  type TransactionData,
} from "@/lib/sponsored-transactions";
import type { TransactionResultWithSponsorship } from "@/hooks/useContract";

// Lock period options (in seconds) - must match contract constants
export const LOCK_PERIODS = [
  { days: 7, seconds: 604800, label: "7 days" },
  { days: 14, seconds: 1209600, label: "14 days" },
  { days: 21, seconds: 1814400, label: "21 days" },
  { days: 30, seconds: 2592000, label: "30 days" },
  { days: 90, seconds: 7776000, label: "90 days" },
  { days: 180, seconds: 15552000, label: "180 days" },
  { days: 365, seconds: 31536000, label: "1 year" },
] as const;

export interface StakePosition {
  amount: number;
  stakedAt: number;
  lockDuration: number;
  unlockAt: number;
  isUnlocked: boolean;
}

export interface StakingInfo {
  totalStaked: number;
  positions: StakePosition[];
  unlockableAmount: number;
  lockedAmount: number;
  poolTotalStaked: number;
  stakersCount: number;
}

// Helper to get function ID for staking contract
function getStakingFunctionId(contractAddress: string, functionName: string): `${string}::${string}::${string}` {
  return `${contractAddress}::staking::${functionName}`;
}

export function useStaking() {
  const { config, network } = useNetwork();
  const { signAndSubmitTransaction, signTransaction, account } = useWallet();
  const {
    isPrivyWallet,
    walletAddress: privyAddress,
    publicKey: privyPublicKey,
    signRawHash,
  } = usePrivyWallet();

  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const client = useMemo(() => createAptosClient(config), [config]);
  const stakingContractAddress = config.stakingContractAddress;

  // Get the active wallet address
  const activeAddress = isPrivyWallet ? privyAddress : account?.address?.toString();

  // Check if sponsorship is enabled
  const getSponsorshipEnabled = useCallback(() => {
    const stored = localStorage.getItem("mvpulse-gas-sponsorship-enabled");
    return stored !== null ? stored === "true" : true;
  }, []);

  const getNetworkType = useCallback((): "testnet" | "mainnet" => {
    return network === "mainnet" ? "mainnet" : "testnet";
  }, [network]);

  // Execute transaction helper (same pattern as useContract)
  const executeTransaction = useCallback(
    async (
      functionName: string,
      functionArguments: (string | number | boolean)[],
      errorMessage: string
    ): Promise<TransactionResultWithSponsorship> => {
      if (!stakingContractAddress) {
        throw new Error("Staking contract address not configured");
      }

      const transactionData: TransactionData = {
        function: getStakingFunctionId(stakingContractAddress, functionName),
        typeArguments: [],
        functionArguments,
      };

      const networkType = getNetworkType();
      const sponsorshipEnabled = getSponsorshipEnabled();

      // Try sponsored transaction first
      if (sponsorshipEnabled) {
        try {
          if (isPrivyWallet) {
            if (!privyAddress || !privyPublicKey || !signRawHash) {
              throw new Error("Privy wallet not properly connected");
            }

            const result = await submitPrivySponsoredTransaction(
              client,
              privyAddress,
              privyPublicKey,
              signRawHash,
              transactionData,
              networkType
            );

            return { hash: result.hash, success: true, sponsored: true };
          } else {
            if (!signTransaction || !account?.address) {
              throw new Error("Wallet does not support sponsored transactions");
            }

            const result = await submitNativeSponsoredTransaction(
              client,
              account.address.toString(),
              signTransaction as any,
              transactionData,
              networkType
            );

            return { hash: result.hash, success: true, sponsored: true };
          }
        } catch (sponsorError) {
          console.warn("Sponsorship failed, falling back to user-paid gas:", sponsorError);
        }
      }

      // Fallback: Non-sponsored transaction
      if (isPrivyWallet) {
        if (!privyAddress || !privyPublicKey || !signRawHash) {
          throw new Error("Privy wallet not properly connected");
        }

        const hash = await submitPrivyTransaction(
          client,
          privyAddress,
          privyPublicKey,
          signRawHash,
          transactionData
        );

        return { hash, success: true, sponsored: false };
      } else {
        if (!signAndSubmitTransaction) {
          throw new Error("Wallet not connected");
        }

        const response = await signAndSubmitTransaction({
          data: transactionData,
        });

        return { hash: response.hash, success: true, sponsored: false };
      }
    },
    [
      isPrivyWallet, privyAddress, privyPublicKey, signRawHash,
      signAndSubmitTransaction, signTransaction, account, client,
      stakingContractAddress, getNetworkType, getSponsorshipEnabled
    ]
  );

  // ==================== View Functions ====================

  // Get user's total staked amount
  const getStakedAmount = useCallback(
    async (userAddress?: string): Promise<number> => {
      const address = userAddress || activeAddress;
      if (!stakingContractAddress || !address) return 0;

      try {
        const result = await client.view({
          payload: {
            function: getStakingFunctionId(stakingContractAddress, "get_staked_amount"),
            typeArguments: [],
            functionArguments: [address],
          },
        });

        return result && result[0] !== undefined ? Number(result[0]) : 0;
      } catch (err) {
        console.error("Failed to get staked amount:", err);
        return 0;
      }
    },
    [client, stakingContractAddress, activeAddress]
  );

  // Get user's positions count
  const getPositionsCount = useCallback(
    async (userAddress?: string): Promise<number> => {
      const address = userAddress || activeAddress;
      if (!stakingContractAddress || !address) return 0;

      try {
        const result = await client.view({
          payload: {
            function: getStakingFunctionId(stakingContractAddress, "get_positions_count"),
            typeArguments: [],
            functionArguments: [address],
          },
        });

        return result && result[0] !== undefined ? Number(result[0]) : 0;
      } catch (err) {
        console.error("Failed to get positions count:", err);
        return 0;
      }
    },
    [client, stakingContractAddress, activeAddress]
  );

  // Get a specific position
  const getPosition = useCallback(
    async (index: number, userAddress?: string): Promise<StakePosition | null> => {
      const address = userAddress || activeAddress;
      if (!stakingContractAddress || !address) return null;

      try {
        const result = await client.view({
          payload: {
            function: getStakingFunctionId(stakingContractAddress, "get_position"),
            typeArguments: [],
            functionArguments: [address, index.toString()],
          },
        });

        if (result && result.length >= 4) {
          const unlockAt = Number(result[3]);
          const currentTime = Math.floor(Date.now() / 1000);
          return {
            amount: Number(result[0]),
            stakedAt: Number(result[1]),
            lockDuration: Number(result[2]),
            unlockAt,
            isUnlocked: currentTime >= unlockAt,
          };
        }
        return null;
      } catch (err) {
        console.error("Failed to get position:", err);
        return null;
      }
    },
    [client, stakingContractAddress, activeAddress]
  );

  // Get all user positions
  const getAllPositions = useCallback(
    async (userAddress?: string): Promise<StakePosition[]> => {
      const address = userAddress || activeAddress;
      if (!address) return [];

      const count = await getPositionsCount(address);
      if (count === 0) return [];

      const positions: StakePosition[] = [];
      for (let i = 0; i < count; i++) {
        const position = await getPosition(i, address);
        if (position) {
          positions.push(position);
        }
      }

      return positions;
    },
    [getPositionsCount, getPosition, activeAddress]
  );

  // Get unlockable amount
  const getUnlockableAmount = useCallback(
    async (userAddress?: string): Promise<number> => {
      const address = userAddress || activeAddress;
      if (!stakingContractAddress || !address) return 0;

      try {
        const result = await client.view({
          payload: {
            function: getStakingFunctionId(stakingContractAddress, "get_unlockable_amount"),
            typeArguments: [],
            functionArguments: [address],
          },
        });

        return result && result[0] !== undefined ? Number(result[0]) : 0;
      } catch (err) {
        console.error("Failed to get unlockable amount:", err);
        return 0;
      }
    },
    [client, stakingContractAddress, activeAddress]
  );

  // Get locked amount
  const getLockedAmount = useCallback(
    async (userAddress?: string): Promise<number> => {
      const address = userAddress || activeAddress;
      if (!stakingContractAddress || !address) return 0;

      try {
        const result = await client.view({
          payload: {
            function: getStakingFunctionId(stakingContractAddress, "get_locked_amount"),
            typeArguments: [],
            functionArguments: [address],
          },
        });

        return result && result[0] !== undefined ? Number(result[0]) : 0;
      } catch (err) {
        console.error("Failed to get locked amount:", err);
        return 0;
      }
    },
    [client, stakingContractAddress, activeAddress]
  );

  // Get pool total staked
  const getPoolTotalStaked = useCallback(async (): Promise<number> => {
    if (!stakingContractAddress) return 0;

    try {
      const result = await client.view({
        payload: {
          function: getStakingFunctionId(stakingContractAddress, "get_total_staked"),
          typeArguments: [],
          functionArguments: [],
        },
      });

      return result && result[0] !== undefined ? Number(result[0]) : 0;
    } catch (err) {
      console.error("Failed to get pool total staked:", err);
      return 0;
    }
  }, [client, stakingContractAddress]);

  // Get stakers count
  const getStakersCount = useCallback(async (): Promise<number> => {
    if (!stakingContractAddress) return 0;

    try {
      const result = await client.view({
        payload: {
          function: getStakingFunctionId(stakingContractAddress, "get_stakers_count"),
          typeArguments: [],
          functionArguments: [],
        },
      });

      return result && result[0] !== undefined ? Number(result[0]) : 0;
    } catch (err) {
      console.error("Failed to get stakers count:", err);
      return 0;
    }
  }, [client, stakingContractAddress]);

  // Check if pool is initialized
  const isPoolInitialized = useCallback(async (): Promise<boolean> => {
    if (!stakingContractAddress) return false;

    try {
      const result = await client.view({
        payload: {
          function: getStakingFunctionId(stakingContractAddress, "is_initialized"),
          typeArguments: [],
          functionArguments: [],
        },
      });

      return Boolean(result && result[0]);
    } catch (err) {
      console.error("Failed to check pool initialization:", err);
      return false;
    }
  }, [client, stakingContractAddress]);

  // ==================== React Query ====================

  // Query for staking info
  const stakingInfoQuery = useQuery<StakingInfo>({
    queryKey: ["stakingInfo", activeAddress, stakingContractAddress],
    queryFn: async () => {
      if (!activeAddress || !stakingContractAddress) {
        return {
          totalStaked: 0,
          positions: [],
          unlockableAmount: 0,
          lockedAmount: 0,
          poolTotalStaked: 0,
          stakersCount: 0,
        };
      }

      const [totalStaked, positions, unlockableAmount, lockedAmount, poolTotalStaked, stakersCount] =
        await Promise.all([
          getStakedAmount(),
          getAllPositions(),
          getUnlockableAmount(),
          getLockedAmount(),
          getPoolTotalStaked(),
          getStakersCount(),
        ]);

      return {
        totalStaked,
        positions,
        unlockableAmount,
        lockedAmount,
        poolTotalStaked,
        stakersCount,
      };
    },
    enabled: !!activeAddress && !!stakingContractAddress,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true,
  });

  // ==================== Entry Functions ====================

  // Stake PULSE
  const stakeMutation = useMutation({
    mutationFn: async ({ amount, lockPeriod }: { amount: number; lockPeriod: number }) => {
      setLoading(true);
      try {
        const result = await executeTransaction(
          "stake",
          [amount.toString(), lockPeriod.toString()],
          "Failed to stake PULSE"
        );
        return result;
      } finally {
        setLoading(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stakingInfo", activeAddress] });
      queryClient.invalidateQueries({ queryKey: ["userProfile", activeAddress] });
    },
  });

  // Unstake specific position
  const unstakeMutation = useMutation({
    mutationFn: async ({ positionIndex }: { positionIndex: number }) => {
      setLoading(true);
      try {
        const result = await executeTransaction(
          "unstake",
          [positionIndex.toString()],
          "Failed to unstake PULSE"
        );
        return result;
      } finally {
        setLoading(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stakingInfo", activeAddress] });
      queryClient.invalidateQueries({ queryKey: ["userProfile", activeAddress] });
    },
  });

  // Unstake all unlocked positions
  const unstakeAllMutation = useMutation({
    mutationFn: async () => {
      setLoading(true);
      try {
        const result = await executeTransaction(
          "unstake_all",
          [],
          "Failed to unstake all PULSE"
        );
        return result;
      } finally {
        setLoading(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stakingInfo", activeAddress] });
      queryClient.invalidateQueries({ queryKey: ["userProfile", activeAddress] });
    },
  });

  return {
    // Contract info
    stakingContractAddress,
    isConfigured: !!stakingContractAddress,

    // State
    loading,
    isLoading: stakingInfoQuery.isLoading,
    isError: stakingInfoQuery.isError,
    error: stakingInfoQuery.error,

    // Staking info
    totalStaked: stakingInfoQuery.data?.totalStaked ?? 0,
    positions: stakingInfoQuery.data?.positions ?? [],
    unlockableAmount: stakingInfoQuery.data?.unlockableAmount ?? 0,
    lockedAmount: stakingInfoQuery.data?.lockedAmount ?? 0,
    poolTotalStaked: stakingInfoQuery.data?.poolTotalStaked ?? 0,
    stakersCount: stakingInfoQuery.data?.stakersCount ?? 0,

    // Actions
    stake: stakeMutation.mutateAsync,
    unstake: unstakeMutation.mutateAsync,
    unstakeAll: unstakeAllMutation.mutateAsync,

    // Action states
    isStaking: stakeMutation.isPending,
    isUnstaking: unstakeMutation.isPending || unstakeAllMutation.isPending,

    // Refetch
    refetch: stakingInfoQuery.refetch,

    // View functions (for manual calls)
    getStakedAmount,
    getPositionsCount,
    getPosition,
    getAllPositions,
    getUnlockableAmount,
    getLockedAmount,
    getPoolTotalStaked,
    getStakersCount,
    isPoolInitialized,
  };
}
