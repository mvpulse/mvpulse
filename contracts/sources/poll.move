/// Poll module for MovePoll dApp
/// Allows creating polls, voting, and distributing rewards
module contracts::poll {
    use std::string::String;
    use std::vector;
    use std::signer;
    use aptos_framework::timestamp;
    use aptos_framework::event;

    /// Error codes
    const E_NOT_OWNER: u64 = 1;
    const E_POLL_NOT_FOUND: u64 = 2;
    const E_POLL_CLOSED: u64 = 3;
    const E_ALREADY_VOTED: u64 = 4;
    const E_INVALID_OPTION: u64 = 5;
    const E_POLL_NOT_ENDED: u64 = 6;

    /// Poll status
    const STATUS_ACTIVE: u8 = 0;
    const STATUS_CLOSED: u8 = 1;

    /// Represents a single poll
    struct Poll has store, drop, copy {
        id: u64,
        creator: address,
        title: String,
        description: String,
        options: vector<String>,
        votes: vector<u64>,
        voters: vector<address>,
        reward_per_vote: u64,
        end_time: u64,
        status: u8,
    }

    /// Global poll registry stored at contract address
    struct PollRegistry has key {
        polls: vector<Poll>,
        next_id: u64,
    }

    #[event]
    /// Event emitted when a poll is created
    struct PollCreated has drop, store {
        poll_id: u64,
        creator: address,
        title: String,
    }

    #[event]
    struct VoteCast has drop, store {
        poll_id: u64,
        voter: address,
        option_index: u64,
    }

    /// Initialize the poll registry (call once when deploying)
    public entry fun initialize(account: &signer) {
        let registry = PollRegistry {
            polls: vector::empty(),
            next_id: 0,
        };
        move_to(account, registry);
    }

    /// Create a new poll
    public entry fun create_poll(
        account: &signer,
        registry_addr: address,
        title: String,
        description: String,
        options: vector<String>,
        reward_per_vote: u64,
        duration_secs: u64,
    ) acquires PollRegistry {
        let creator = signer::address_of(account);
        let registry = borrow_global_mut<PollRegistry>(registry_addr);

        let poll_id = registry.next_id;
        let num_options = vector::length(&options);
        let votes = vector::empty<u64>();

        // Initialize vote counts to 0
        let i = 0;
        while (i < num_options) {
            vector::push_back(&mut votes, 0);
            i = i + 1;
        };

        let poll = Poll {
            id: poll_id,
            creator,
            title,
            description,
            options,
            votes,
            voters: vector::empty(),
            reward_per_vote,
            end_time: timestamp::now_seconds() + duration_secs,
            status: STATUS_ACTIVE,
        };

        vector::push_back(&mut registry.polls, poll);
        registry.next_id = poll_id + 1;

        event::emit(PollCreated {
            poll_id,
            creator,
            title,
        });
    }

    /// Cast a vote on a poll
    public entry fun vote(
        account: &signer,
        registry_addr: address,
        poll_id: u64,
        option_index: u64,
    ) acquires PollRegistry {
        let voter = signer::address_of(account);
        let registry = borrow_global_mut<PollRegistry>(registry_addr);

        assert!(poll_id < vector::length(&registry.polls), E_POLL_NOT_FOUND);

        let poll = vector::borrow_mut(&mut registry.polls, poll_id);

        // Check poll is active
        assert!(poll.status == STATUS_ACTIVE, E_POLL_CLOSED);
        assert!(timestamp::now_seconds() < poll.end_time, E_POLL_CLOSED);

        // Check valid option
        assert!(option_index < vector::length(&poll.options), E_INVALID_OPTION);

        // Check not already voted
        let i = 0;
        let len = vector::length(&poll.voters);
        while (i < len) {
            assert!(*vector::borrow(&poll.voters, i) != voter, E_ALREADY_VOTED);
            i = i + 1;
        };

        // Record vote
        let current_votes = vector::borrow_mut(&mut poll.votes, option_index);
        *current_votes = *current_votes + 1;
        vector::push_back(&mut poll.voters, voter);

        event::emit(VoteCast {
            poll_id,
            voter,
            option_index,
        });
    }

    /// Close a poll (only creator can close)
    public entry fun close_poll(
        account: &signer,
        registry_addr: address,
        poll_id: u64,
    ) acquires PollRegistry {
        let caller = signer::address_of(account);
        let registry = borrow_global_mut<PollRegistry>(registry_addr);

        assert!(poll_id < vector::length(&registry.polls), E_POLL_NOT_FOUND);

        let poll = vector::borrow_mut(&mut registry.polls, poll_id);
        assert!(poll.creator == caller, E_NOT_OWNER);

        poll.status = STATUS_CLOSED;
    }

    #[view]
    /// View function to get poll details
    public fun get_poll(registry_addr: address, poll_id: u64): Poll acquires PollRegistry {
        let registry = borrow_global<PollRegistry>(registry_addr);
        assert!(poll_id < vector::length(&registry.polls), E_POLL_NOT_FOUND);
        *vector::borrow(&registry.polls, poll_id)
    }

    #[view]
    /// View function to get total number of polls
    public fun get_poll_count(registry_addr: address): u64 acquires PollRegistry {
        let registry = borrow_global<PollRegistry>(registry_addr);
        vector::length(&registry.polls)
    }

    #[view]
    /// View function to check if address has voted
    public fun has_voted(registry_addr: address, poll_id: u64, voter: address): bool acquires PollRegistry {
        let registry = borrow_global<PollRegistry>(registry_addr);
        assert!(poll_id < vector::length(&registry.polls), E_POLL_NOT_FOUND);

        let poll = vector::borrow(&registry.polls, poll_id);
        let i = 0;
        let len = vector::length(&poll.voters);
        while (i < len) {
            if (*vector::borrow(&poll.voters, i) == voter) {
                return true
            };
            i = i + 1;
        };
        false
    }
}
