/// PULSE Staking module for MVPulse dApp
/// Users can stake PULSE tokens for fixed lock periods to boost their tier qualification
/// Supports multiple stake positions per user with different lock durations
module staking::staking {
    use std::signer;
    use std::vector;
    use aptos_framework::timestamp;
    use aptos_framework::object::{Self, Object};
    use aptos_framework::fungible_asset::{Self, Metadata, FungibleStore};
    use aptos_framework::primary_fungible_store;
    use aptos_framework::event;

    use pulse::pulse;

    // ==================== Constants ====================

    /// Lock period options (in seconds)
    const LOCK_7_DAYS: u64 = 604800;        // 7 * 24 * 60 * 60
    const LOCK_14_DAYS: u64 = 1209600;      // 14 * 24 * 60 * 60
    const LOCK_21_DAYS: u64 = 1814400;      // 21 * 24 * 60 * 60
    const LOCK_30_DAYS: u64 = 2592000;      // 30 * 24 * 60 * 60
    const LOCK_90_DAYS: u64 = 7776000;      // 90 * 24 * 60 * 60
    const LOCK_180_DAYS: u64 = 15552000;    // 180 * 24 * 60 * 60
    const LOCK_365_DAYS: u64 = 31536000;    // 365 * 24 * 60 * 60

    /// Error codes
    const E_NOT_ADMIN: u64 = 1;
    const E_ALREADY_INITIALIZED: u64 = 2;
    const E_NOT_INITIALIZED: u64 = 3;
    const E_INVALID_LOCK_PERIOD: u64 = 4;
    const E_INSUFFICIENT_BALANCE: u64 = 5;
    const E_POSITION_STILL_LOCKED: u64 = 6;
    const E_INVALID_POSITION_INDEX: u64 = 7;
    const E_NO_STAKES: u64 = 8;
    const E_ZERO_AMOUNT: u64 = 9;

    /// Seed for creating the staking pool object
    const STAKING_POOL_SEED: vector<u8> = b"STAKING_POOL";

    // ==================== Structs ====================

    #[resource_group_member(group = aptos_framework::object::ObjectGroup)]
    /// Global staking pool stored as a named object
    struct StakingPool has key {
        total_staked: u64,
        stakers_count: u64,
        pulse_metadata: Object<Metadata>,
        /// The fungible store that holds all staked PULSE
        stake_store: Object<FungibleStore>,
    }

    /// Individual stake position
    struct StakePosition has store, drop, copy {
        amount: u64,
        staked_at: u64,
        lock_duration: u64,
        unlock_at: u64,
    }

    /// User's staking info stored under user's address
    struct UserStakes has key {
        positions: vector<StakePosition>,
        total_staked: u64,
    }

    // ==================== Events ====================

    #[event]
    struct PoolInitialized has drop, store {
        admin: address,
        pulse_metadata: address,
    }

    #[event]
    struct Staked has drop, store {
        staker: address,
        amount: u64,
        lock_duration: u64,
        unlock_at: u64,
        position_index: u64,
    }

    #[event]
    struct Unstaked has drop, store {
        staker: address,
        amount: u64,
        position_index: u64,
    }

    // ==================== Admin Functions ====================

    /// Initialize the staking pool (one-time setup by deployer)
    public entry fun initialize(admin: &signer) {
        let admin_addr = signer::address_of(admin);
        assert!(admin_addr == @staking, E_NOT_ADMIN);

        let pool_addr = get_pool_address();
        assert!(!exists<StakingPool>(pool_addr), E_ALREADY_INITIALIZED);

        // Get PULSE metadata from the PULSE contract
        let pulse_metadata = pulse::get_metadata();

        // Create a named object for the staking pool
        let constructor_ref = object::create_named_object(admin, STAKING_POOL_SEED);
        let pool_signer = object::generate_signer(&constructor_ref);

        // Create a fungible store to hold staked PULSE
        let stake_store = fungible_asset::create_store(&constructor_ref, pulse_metadata);

        // Initialize the staking pool
        move_to(&pool_signer, StakingPool {
            total_staked: 0,
            stakers_count: 0,
            pulse_metadata,
            stake_store,
        });

        event::emit(PoolInitialized {
            admin: admin_addr,
            pulse_metadata: object::object_address(&pulse_metadata),
        });
    }

    // ==================== Entry Functions ====================

    /// Stake PULSE tokens with a specified lock period
    public entry fun stake(
        account: &signer,
        amount: u64,
        lock_duration: u64
    ) acquires StakingPool, UserStakes {
        assert!(amount > 0, E_ZERO_AMOUNT);
        assert!(is_valid_lock_period(lock_duration), E_INVALID_LOCK_PERIOD);

        let staker_addr = signer::address_of(account);
        let pool_addr = get_pool_address();
        assert!(exists<StakingPool>(pool_addr), E_NOT_INITIALIZED);

        let pool = borrow_global_mut<StakingPool>(pool_addr);
        let pulse_metadata = pool.pulse_metadata;

        // Check user has sufficient PULSE balance
        let user_balance = primary_fungible_store::balance(staker_addr, pulse_metadata);
        assert!(user_balance >= amount, E_INSUFFICIENT_BALANCE);

        // Withdraw PULSE from user and deposit to staking pool
        let fa = primary_fungible_store::withdraw(account, pulse_metadata, amount);
        fungible_asset::deposit(pool.stake_store, fa);

        // Calculate unlock time
        let current_time = timestamp::now_seconds();
        let unlock_at = current_time + lock_duration;

        // Create stake position
        let position = StakePosition {
            amount,
            staked_at: current_time,
            lock_duration,
            unlock_at,
        };

        // Update or create user stakes
        let position_index: u64;
        if (!exists<UserStakes>(staker_addr)) {
            // First stake - create UserStakes
            pool.stakers_count = pool.stakers_count + 1;
            let positions = vector::empty<StakePosition>();
            vector::push_back(&mut positions, position);
            move_to(account, UserStakes {
                positions,
                total_staked: amount,
            });
            position_index = 0;
        } else {
            // Add to existing stakes
            let user_stakes = borrow_global_mut<UserStakes>(staker_addr);
            position_index = vector::length(&user_stakes.positions);
            vector::push_back(&mut user_stakes.positions, position);
            user_stakes.total_staked = user_stakes.total_staked + amount;
        };

        // Update pool total
        pool.total_staked = pool.total_staked + amount;

        event::emit(Staked {
            staker: staker_addr,
            amount,
            lock_duration,
            unlock_at,
            position_index,
        });
    }

    /// Unstake a specific position (only if lock period has expired)
    public entry fun unstake(
        account: &signer,
        position_index: u64
    ) acquires StakingPool, UserStakes {
        let staker_addr = signer::address_of(account);

        assert!(exists<UserStakes>(staker_addr), E_NO_STAKES);

        let user_stakes = borrow_global_mut<UserStakes>(staker_addr);
        let positions_len = vector::length(&user_stakes.positions);
        assert!(position_index < positions_len, E_INVALID_POSITION_INDEX);

        let position = vector::borrow(&user_stakes.positions, position_index);
        let current_time = timestamp::now_seconds();
        assert!(current_time >= position.unlock_at, E_POSITION_STILL_LOCKED);

        let amount = position.amount;

        // Remove position from vector (swap and pop for efficiency)
        vector::swap_remove(&mut user_stakes.positions, position_index);
        user_stakes.total_staked = user_stakes.total_staked - amount;

        // Withdraw from pool and return to user
        let pool_addr = get_pool_address();
        let pool = borrow_global_mut<StakingPool>(pool_addr);
        let fa = fungible_asset::withdraw(account, pool.stake_store, amount);
        primary_fungible_store::deposit(staker_addr, fa);

        pool.total_staked = pool.total_staked - amount;

        // Update stakers count if user has no more stakes
        if (vector::is_empty(&user_stakes.positions)) {
            pool.stakers_count = pool.stakers_count - 1;
        };

        event::emit(Unstaked {
            staker: staker_addr,
            amount,
            position_index,
        });
    }

    /// Unstake all positions that have expired
    public entry fun unstake_all(account: &signer) acquires StakingPool, UserStakes {
        let staker_addr = signer::address_of(account);

        assert!(exists<UserStakes>(staker_addr), E_NO_STAKES);

        let user_stakes = borrow_global_mut<UserStakes>(staker_addr);
        let current_time = timestamp::now_seconds();
        let pool_addr = get_pool_address();
        let pool = borrow_global_mut<StakingPool>(pool_addr);

        let total_to_withdraw: u64 = 0;
        let i = 0;

        // Iterate backwards to safely remove elements
        while (i < vector::length(&user_stakes.positions)) {
            let position = vector::borrow(&user_stakes.positions, i);
            if (current_time >= position.unlock_at) {
                let amount = position.amount;
                total_to_withdraw = total_to_withdraw + amount;

                event::emit(Unstaked {
                    staker: staker_addr,
                    amount,
                    position_index: i,
                });

                vector::swap_remove(&mut user_stakes.positions, i);
                // Don't increment i since we removed an element
            } else {
                i = i + 1;
            };
        };

        if (total_to_withdraw > 0) {
            user_stakes.total_staked = user_stakes.total_staked - total_to_withdraw;
            pool.total_staked = pool.total_staked - total_to_withdraw;

            let fa = fungible_asset::withdraw(account, pool.stake_store, total_to_withdraw);
            primary_fungible_store::deposit(staker_addr, fa);

            if (vector::is_empty(&user_stakes.positions)) {
                pool.stakers_count = pool.stakers_count - 1;
            };
        };
    }

    // ==================== View Functions ====================

    #[view]
    /// Check if a lock period is valid
    public fun is_valid_lock_period(duration: u64): bool {
        duration == LOCK_7_DAYS ||
        duration == LOCK_14_DAYS ||
        duration == LOCK_21_DAYS ||
        duration == LOCK_30_DAYS ||
        duration == LOCK_90_DAYS ||
        duration == LOCK_180_DAYS ||
        duration == LOCK_365_DAYS
    }

    #[view]
    /// Get the staking pool address
    public fun get_pool_address(): address {
        object::create_object_address(&@staking, STAKING_POOL_SEED)
    }

    #[view]
    /// Check if the staking pool is initialized
    public fun is_initialized(): bool {
        exists<StakingPool>(get_pool_address())
    }

    #[view]
    /// Get total PULSE staked in the pool
    public fun get_total_staked(): u64 acquires StakingPool {
        let pool_addr = get_pool_address();
        if (!exists<StakingPool>(pool_addr)) {
            return 0
        };
        borrow_global<StakingPool>(pool_addr).total_staked
    }

    #[view]
    /// Get total number of stakers
    public fun get_stakers_count(): u64 acquires StakingPool {
        let pool_addr = get_pool_address();
        if (!exists<StakingPool>(pool_addr)) {
            return 0
        };
        borrow_global<StakingPool>(pool_addr).stakers_count
    }

    #[view]
    /// Get user's total staked amount
    public fun get_staked_amount(user: address): u64 acquires UserStakes {
        if (!exists<UserStakes>(user)) {
            return 0
        };
        borrow_global<UserStakes>(user).total_staked
    }

    #[view]
    /// Get user's stake positions count
    public fun get_positions_count(user: address): u64 acquires UserStakes {
        if (!exists<UserStakes>(user)) {
            return 0
        };
        vector::length(&borrow_global<UserStakes>(user).positions)
    }

    #[view]
    /// Get a specific stake position details
    /// Returns (amount, staked_at, lock_duration, unlock_at)
    public fun get_position(user: address, index: u64): (u64, u64, u64, u64) acquires UserStakes {
        assert!(exists<UserStakes>(user), E_NO_STAKES);
        let user_stakes = borrow_global<UserStakes>(user);
        assert!(index < vector::length(&user_stakes.positions), E_INVALID_POSITION_INDEX);

        let position = vector::borrow(&user_stakes.positions, index);
        (position.amount, position.staked_at, position.lock_duration, position.unlock_at)
    }

    #[view]
    /// Get amount that can be unstaked now (unlocked positions)
    public fun get_unlockable_amount(user: address): u64 acquires UserStakes {
        if (!exists<UserStakes>(user)) {
            return 0
        };

        let user_stakes = borrow_global<UserStakes>(user);
        let current_time = timestamp::now_seconds();
        let unlockable: u64 = 0;

        let i = 0;
        let len = vector::length(&user_stakes.positions);
        while (i < len) {
            let position = vector::borrow(&user_stakes.positions, i);
            if (current_time >= position.unlock_at) {
                unlockable = unlockable + position.amount;
            };
            i = i + 1;
        };

        unlockable
    }

    #[view]
    /// Get amount that is still locked
    public fun get_locked_amount(user: address): u64 acquires UserStakes {
        if (!exists<UserStakes>(user)) {
            return 0
        };

        let user_stakes = borrow_global<UserStakes>(user);
        let current_time = timestamp::now_seconds();
        let locked: u64 = 0;

        let i = 0;
        let len = vector::length(&user_stakes.positions);
        while (i < len) {
            let position = vector::borrow(&user_stakes.positions, i);
            if (current_time < position.unlock_at) {
                locked = locked + position.amount;
            };
            i = i + 1;
        };

        locked
    }

    #[view]
    /// Check if user has any active stakes
    public fun has_stakes(user: address): bool acquires UserStakes {
        if (!exists<UserStakes>(user)) {
            return false
        };
        !vector::is_empty(&borrow_global<UserStakes>(user).positions)
    }

    #[view]
    /// Get all valid lock period options (in seconds)
    public fun get_lock_periods(): vector<u64> {
        let periods = vector::empty<u64>();
        vector::push_back(&mut periods, LOCK_7_DAYS);
        vector::push_back(&mut periods, LOCK_14_DAYS);
        vector::push_back(&mut periods, LOCK_21_DAYS);
        vector::push_back(&mut periods, LOCK_30_DAYS);
        vector::push_back(&mut periods, LOCK_90_DAYS);
        vector::push_back(&mut periods, LOCK_180_DAYS);
        vector::push_back(&mut periods, LOCK_365_DAYS);
        periods
    }
}
