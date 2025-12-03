import { useState, useCallback, useMemo } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useNetwork } from "@/contexts/NetworkContext";
import { createAptosClient, getFunctionId, formatTimeRemaining, isPollActive } from "@/lib/contract";
import type { Poll, PollWithMeta, CreatePollInput, VoteInput, TransactionResult, PlatformConfig } from "@/types/poll";

export function useContract() {
  const { config } = useNetwork();
  const { signAndSubmitTransaction, account } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const client = useMemo(() => createAptosClient(config), [config]);
  const contractAddress = config.contractAddress;

  // Helper to enrich poll with computed fields
  const enrichPoll = useCallback((poll: Poll): PollWithMeta => {
    const totalVotes = poll.votes.reduce((sum, v) => sum + v, 0);
    const votePercentages = poll.votes.map((v) =>
      totalVotes > 0 ? Math.round((v / totalVotes) * 100) : 0
    );
    return {
      ...poll,
      totalVotes,
      isActive: isPollActive(poll),
      timeRemaining: formatTimeRemaining(poll.end_time),
      votePercentages,
    };
  }, []);

  // Create a new poll
  // Note: distribution_mode is now set when closing the poll, not at creation
  const createPoll = useCallback(
    async (input: CreatePollInput): Promise<TransactionResult> => {
      if (!signAndSubmitTransaction) {
        throw new Error("Wallet not connected");
      }

      setLoading(true);
      setError(null);

      try {
        const response = await signAndSubmitTransaction({
          data: {
            function: getFunctionId(contractAddress, "create_poll"),
            typeArguments: [],
            functionArguments: [
              contractAddress, // registry_addr
              input.title,
              input.description,
              input.options,
              input.rewardPerVote.toString(),
              input.maxVoters.toString(),
              input.durationSecs.toString(),
              input.fundAmount.toString(),
            ],
          },
        });

        return {
          hash: response.hash,
          success: true,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to create poll";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [signAndSubmitTransaction, contractAddress]
  );

  // Fund an existing poll
  const fundPoll = useCallback(
    async (pollId: number, amount: number): Promise<TransactionResult> => {
      if (!signAndSubmitTransaction) {
        throw new Error("Wallet not connected");
      }

      setLoading(true);
      setError(null);

      try {
        const response = await signAndSubmitTransaction({
          data: {
            function: getFunctionId(contractAddress, "fund_poll"),
            typeArguments: [],
            functionArguments: [
              contractAddress,
              pollId.toString(),
              amount.toString(),
            ],
          },
        });

        return {
          hash: response.hash,
          success: true,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to fund poll";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [signAndSubmitTransaction, contractAddress]
  );

  // Claim reward (for Manual Pull mode)
  const claimReward = useCallback(
    async (pollId: number): Promise<TransactionResult> => {
      if (!signAndSubmitTransaction) {
        throw new Error("Wallet not connected");
      }

      setLoading(true);
      setError(null);

      try {
        const response = await signAndSubmitTransaction({
          data: {
            function: getFunctionId(contractAddress, "claim_reward"),
            typeArguments: [],
            functionArguments: [
              contractAddress,
              pollId.toString(),
            ],
          },
        });

        return {
          hash: response.hash,
          success: true,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to claim reward";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [signAndSubmitTransaction, contractAddress]
  );

  // Distribute rewards to all voters (for Manual Push mode)
  const distributeRewards = useCallback(
    async (pollId: number): Promise<TransactionResult> => {
      if (!signAndSubmitTransaction) {
        throw new Error("Wallet not connected");
      }

      setLoading(true);
      setError(null);

      try {
        const response = await signAndSubmitTransaction({
          data: {
            function: getFunctionId(contractAddress, "distribute_rewards"),
            typeArguments: [],
            functionArguments: [
              contractAddress,
              pollId.toString(),
            ],
          },
        });

        return {
          hash: response.hash,
          success: true,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to distribute rewards";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [signAndSubmitTransaction, contractAddress]
  );

  // Withdraw remaining funds from a poll
  const withdrawRemaining = useCallback(
    async (pollId: number): Promise<TransactionResult> => {
      if (!signAndSubmitTransaction) {
        throw new Error("Wallet not connected");
      }

      setLoading(true);
      setError(null);

      try {
        const response = await signAndSubmitTransaction({
          data: {
            function: getFunctionId(contractAddress, "withdraw_remaining"),
            typeArguments: [],
            functionArguments: [
              contractAddress,
              pollId.toString(),
            ],
          },
        });

        return {
          hash: response.hash,
          success: true,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to withdraw funds";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [signAndSubmitTransaction, contractAddress]
  );

  // Vote on a poll
  const vote = useCallback(
    async (input: VoteInput): Promise<TransactionResult> => {
      if (!signAndSubmitTransaction) {
        throw new Error("Wallet not connected");
      }

      setLoading(true);
      setError(null);

      try {
        const response = await signAndSubmitTransaction({
          data: {
            function: getFunctionId(contractAddress, "vote"),
            typeArguments: [],
            functionArguments: [
              contractAddress, // registry_addr
              input.pollId.toString(),
              input.optionIndex.toString(),
            ],
          },
        });

        return {
          hash: response.hash,
          success: true,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to vote";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [signAndSubmitTransaction, contractAddress]
  );

  // Close a poll and set distribution mode
  // distributionMode: 0 = Manual Pull (participants claim), 1 = Manual Push (creator distributes)
  const closePoll = useCallback(
    async (pollId: number, distributionMode: number): Promise<TransactionResult> => {
      if (!signAndSubmitTransaction) {
        throw new Error("Wallet not connected");
      }

      setLoading(true);
      setError(null);

      try {
        const response = await signAndSubmitTransaction({
          data: {
            function: getFunctionId(contractAddress, "close_poll"),
            typeArguments: [],
            functionArguments: [
              contractAddress, // registry_addr
              pollId.toString(),
              distributionMode.toString(),
            ],
          },
        });

        return {
          hash: response.hash,
          success: true,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to close poll";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [signAndSubmitTransaction, contractAddress]
  );

  // Get a single poll by ID (view function)
  const getPoll = useCallback(
    async (pollId: number): Promise<PollWithMeta | null> => {
      if (!contractAddress) return null;

      try {
        const result = await client.view({
          payload: {
            function: getFunctionId(contractAddress, "get_poll"),
            typeArguments: [],
            functionArguments: [contractAddress, pollId.toString()],
          },
        });

        if (result && result[0]) {
          const poll = result[0] as Poll;
          return enrichPoll(poll);
        }
        return null;
      } catch (err) {
        console.error("Failed to get poll:", err);
        return null;
      }
    },
    [client, contractAddress, enrichPoll]
  );

  // Get total poll count (view function)
  const getPollCount = useCallback(async (): Promise<number> => {
    if (!contractAddress) return 0;

    try {
      const result = await client.view({
        payload: {
          function: getFunctionId(contractAddress, "get_poll_count"),
          typeArguments: [],
          functionArguments: [contractAddress],
        },
      });

      if (result && result[0] !== undefined) {
        return Number(result[0]);
      }
      return 0;
    } catch (err) {
      console.error("Failed to get poll count:", err);
      return 0;
    }
  }, [client, contractAddress]);

  // Check if user has voted (view function)
  const hasVoted = useCallback(
    async (pollId: number, voterAddress?: string): Promise<boolean> => {
      const address = voterAddress || account?.address;
      if (!contractAddress || !address) return false;

      try {
        const result = await client.view({
          payload: {
            function: getFunctionId(contractAddress, "has_voted"),
            typeArguments: [],
            functionArguments: [contractAddress, pollId.toString(), address],
          },
        });

        return Boolean(result && result[0]);
      } catch (err) {
        console.error("Failed to check vote status:", err);
        return false;
      }
    },
    [client, contractAddress, account?.address]
  );

  // Check if user has claimed reward (view function)
  const hasClaimed = useCallback(
    async (pollId: number, claimerAddress?: string): Promise<boolean> => {
      const address = claimerAddress || account?.address;
      if (!contractAddress || !address) return false;

      try {
        const result = await client.view({
          payload: {
            function: getFunctionId(contractAddress, "has_claimed"),
            typeArguments: [],
            functionArguments: [contractAddress, pollId.toString(), address],
          },
        });

        return Boolean(result && result[0]);
      } catch (err) {
        console.error("Failed to check claim status:", err);
        return false;
      }
    },
    [client, contractAddress, account?.address]
  );

  // Get all polls (fetches each poll individually)
  const getAllPolls = useCallback(async (): Promise<PollWithMeta[]> => {
    const count = await getPollCount();
    if (count === 0) return [];

    const polls: PollWithMeta[] = [];
    for (let i = 0; i < count; i++) {
      const poll = await getPoll(i);
      if (poll) {
        polls.push(poll);
      }
    }

    return polls;
  }, [getPollCount, getPoll]);

  // Get platform configuration (view function)
  const getPlatformConfig = useCallback(async (): Promise<PlatformConfig | null> => {
    if (!contractAddress) return null;

    try {
      const result = await client.view({
        payload: {
          function: getFunctionId(contractAddress, "get_platform_config"),
          typeArguments: [],
          functionArguments: [contractAddress],
        },
      });

      if (result && result.length >= 3) {
        return {
          feeBps: Number(result[0]),
          treasury: String(result[1]),
          totalFeesCollected: Number(result[2]),
        };
      }
      return null;
    } catch (err) {
      console.error("Failed to get platform config:", err);
      return null;
    }
  }, [client, contractAddress]);

  return {
    // State
    loading,
    error,
    contractAddress,

    // Write functions
    createPoll,
    vote,
    closePoll,
    fundPoll,
    claimReward,
    distributeRewards,
    withdrawRemaining,

    // Read functions
    getPoll,
    getPollCount,
    hasVoted,
    hasClaimed,
    getAllPolls,
    getPlatformConfig,

    // Helpers
    enrichPoll,
  };
}
