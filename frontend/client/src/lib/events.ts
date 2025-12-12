/**
 * Event fetching utilities for MVPulse
 * Uses Movement Indexer GraphQL API to fetch user activity
 */

export interface ActivityEvent {
  type: 'vote' | 'reward_claimed' | 'poll_created';
  pollId?: number;
  pollTitle?: string;
  amount?: number;
  timestamp: number;
  txHash: string;
  optionIndex?: number;
}

// Event data structure from the poll contract
interface EventData {
  poll_id?: string;
  voter?: string;
  claimer?: string;
  creator?: string;
  amount?: string;
  option_index?: string;
  title?: string;
}

interface IndexerEvent {
  type: string;
  data: EventData;
  transaction_version: string;
  transaction_block_height: number;
  block_metadata_transaction?: {
    timestamp: string;
  };
}

interface GraphQLResponse {
  data?: {
    events: IndexerEvent[];
  };
  errors?: Array<{ message: string }>;
}

// GraphQL query for events from the poll contract
// Queries events where the user is the voter, claimer, or creator
// Also fetches transaction timestamp by joining with block_metadata_transactions
const ACTIVITY_QUERY = `
  query GetUserActivity($eventTypePattern: String!, $userAddress: String!, $limit: Int!) {
    events(
      where: {
        indexed_type: { _like: $eventTypePattern },
        _or: [
          { data: { _contains: { voter: $userAddress } } },
          { data: { _contains: { claimer: $userAddress } } },
          { data: { _contains: { creator: $userAddress } } }
        ]
      },
      order_by: { transaction_block_height: desc },
      limit: $limit
    ) {
      type
      data
      transaction_version
      transaction_block_height
      block_metadata_transaction {
        timestamp
      }
    }
  }
`;

/**
 * Map event type to activity type
 */
function mapEventTypeToActivityType(eventType: string): ActivityEvent['type'] {
  if (eventType.includes('VoteCast')) {
    return 'vote';
  } else if (eventType.includes('RewardClaimed')) {
    return 'reward_claimed';
  } else if (eventType.includes('PollCreated')) {
    return 'poll_created';
  }
  return 'vote';
}

/**
 * Fetch user activity from the Movement Indexer
 * @param indexerUrl - The GraphQL Indexer endpoint URL
 * @param contractAddress - The poll contract address
 * @param userAddress - The user's wallet address
 * @param limit - Maximum number of activities to fetch
 */
export async function fetchUserActivity(
  indexerUrl: string,
  contractAddress: string,
  userAddress: string,
  limit: number = 10
): Promise<ActivityEvent[]> {
  try {
    // Create event type pattern to match poll contract events
    const eventTypePattern = `${contractAddress}::poll::%`;

    const response = await fetch(indexerUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: ACTIVITY_QUERY,
        variables: {
          eventTypePattern: eventTypePattern,
          userAddress: userAddress,
          limit: limit,
        },
      }),
    });

    if (!response.ok) {
      console.error(`Indexer request failed: ${response.status} ${response.statusText}`);
      return [];
    }

    const result: GraphQLResponse = await response.json();

    if (result.errors) {
      console.error("GraphQL errors:", result.errors);
      return [];
    }

    if (!result.data?.events) {
      return [];
    }

    return result.data.events.map((event): ActivityEvent => {
      const activityType = mapEventTypeToActivityType(event.type);
      const pollId = event.data.poll_id ? parseInt(event.data.poll_id, 10) : undefined;
      const amount = event.data.amount ? parseInt(event.data.amount, 10) / 1e8 : undefined;
      const optionIndex = event.data.option_index ? parseInt(event.data.option_index, 10) : undefined;

      // Get timestamp from block metadata if available, otherwise use current time
      const timestamp = event.block_metadata_transaction?.timestamp
        ? new Date(event.block_metadata_transaction.timestamp).getTime()
        : Date.now();

      return {
        type: activityType,
        pollId,
        pollTitle: event.data.title,
        amount,
        timestamp,
        txHash: event.transaction_version,
        optionIndex,
      };
    });
  } catch (error) {
    console.error("Error fetching user activity from indexer:", error);
    return [];
  }
}

/**
 * Format relative time for display
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = Math.floor((now - timestamp) / 1000);

  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return `${Math.floor(diff / 604800)}w ago`;
}
