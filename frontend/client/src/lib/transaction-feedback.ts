/**
 * Centralized transaction feedback utilities
 * Provides consistent toast notifications for all transaction types
 */

import { toast } from "sonner";

/**
 * Known Move abort error codes and their user-friendly messages
 */
const MOVE_ERROR_MESSAGES: Record<string, { title: string; description: string }> = {
  // Poll contract errors
  E_FA_VAULT_NOT_INITIALIZED: {
    title: "Token Vault Not Initialized",
    description: "The reward token vault hasn't been set up on this network. Please contact an admin or try using a different token (like MOVE).",
  },
  E_NOT_AUTHORIZED: {
    title: "Not Authorized",
    description: "You don't have permission to perform this action.",
  },
  E_POLL_NOT_ACTIVE: {
    title: "Poll Not Active",
    description: "This poll is no longer accepting votes.",
  },
  E_ALREADY_VOTED: {
    title: "Already Voted",
    description: "You have already voted on this poll.",
  },
  E_INVALID_OPTION: {
    title: "Invalid Option",
    description: "The selected option is not valid for this poll.",
  },
  E_POLL_ENDED: {
    title: "Poll Ended",
    description: "This poll has ended and is no longer accepting votes.",
  },
  E_INSUFFICIENT_FUNDS: {
    title: "Insufficient Funds",
    description: "You don't have enough tokens to complete this transaction.",
  },
  E_MAX_VOTERS_REACHED: {
    title: "Maximum Voters Reached",
    description: "This poll has reached its maximum number of voters.",
  },
  E_ALREADY_CLAIMED: {
    title: "Already Claimed",
    description: "You have already claimed your reward from this poll.",
  },
};

/**
 * Parse a Move transaction error and return a user-friendly message
 */
export function parseTransactionError(error: Error | string): { title: string; description: string } {
  const errorString = typeof error === "string" ? error : error.message;

  // Check for known Move abort errors (format: E_ERROR_NAME(0x...)
  for (const [errorCode, message] of Object.entries(MOVE_ERROR_MESSAGES)) {
    if (errorString.includes(errorCode)) {
      return message;
    }
  }

  // Check for common error patterns
  if (errorString.includes("INSUFFICIENT_BALANCE") || errorString.includes("insufficient balance")) {
    return {
      title: "Insufficient Balance",
      description: "You don't have enough tokens to complete this transaction.",
    };
  }

  if (errorString.includes("rejected") || errorString.includes("User rejected")) {
    return {
      title: "Transaction Rejected",
      description: "You cancelled the transaction.",
    };
  }

  if (errorString.includes("timeout") || errorString.includes("Timeout")) {
    return {
      title: "Transaction Timeout",
      description: "The transaction took too long. Please try again.",
    };
  }

  // Default: return a generic error with the original message
  return {
    title: "Transaction Failed",
    description: errorString.length > 200 ? `${errorString.slice(0, 200)}...` : errorString,
  };
}

/**
 * Show a success toast for completed transactions
 * Includes a "View TX" action button linking to the block explorer
 */
export function showTransactionSuccessToast(
  hash: string,
  message: string,
  description: string,
  explorerUrl: string,
  sponsored?: boolean
): void {
  const finalDescription = sponsored
    ? `${description} (Gas Sponsored)`
    : description;

  toast.success(message, {
    description: finalDescription,
    action: {
      label: "View TX",
      onClick: () => window.open(`${explorerUrl}/txn/${hash}?network=testnet`, "_blank"),
    },
  });
}

/**
 * Show an error toast for failed transactions
 * Parses known Move errors and shows user-friendly messages
 */
export function showTransactionErrorToast(
  message: string,
  error: Error | string
): void {
  const parsed = parseTransactionError(error);

  toast.error(parsed.title, {
    description: parsed.description,
  });
}
