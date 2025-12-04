/// Swap module for PULSE/USDC AMM trading
/// Implements constant product (x*y=k) automated market maker
module contracts::swap {
    use std::signer;
    use aptos_framework::coin::{Self, Coin};
    use aptos_framework::event;
    use contracts::pulse::PULSE;

    /// Error codes
    const E_NOT_ADMIN: u64 = 1;
    const E_ALREADY_INITIALIZED: u64 = 2;
    const E_NOT_INITIALIZED: u64 = 3;
    const E_INSUFFICIENT_LIQUIDITY: u64 = 4;
    const E_INSUFFICIENT_INPUT_AMOUNT: u64 = 5;
    const E_INSUFFICIENT_OUTPUT_AMOUNT: u64 = 6;
    const E_INVALID_FEE: u64 = 7;
    const E_SLIPPAGE_EXCEEDED: u64 = 8;
    const E_ZERO_LIQUIDITY: u64 = 9;
    const E_INSUFFICIENT_LP_BALANCE: u64 = 10;
    const E_K_INVARIANT_VIOLATED: u64 = 11;

    /// Fee constants
    const MAX_FEE_BPS: u64 = 500;       // Max 5% fee
    const DEFAULT_FEE_BPS: u64 = 30;    // Default 0.3% fee
    const BPS_DENOMINATOR: u64 = 10000;

    /// Minimum liquidity locked forever to prevent division by zero
    const MINIMUM_LIQUIDITY: u64 = 1000;

    /// Liquidity Pool state - generic over the stable coin type (USDC)
    struct LiquidityPool<phantom StableCoin> has key {
        pulse_reserve: Coin<PULSE>,
        stable_reserve: Coin<StableCoin>,
        total_lp_shares: u64,
        fee_bps: u64,
        admin: address,
    }

    /// LP position for each liquidity provider
    struct LPPosition<phantom StableCoin> has key {
        shares: u64,
    }

    // ==================== Events ====================

    #[event]
    struct PoolInitialized has drop, store {
        admin: address,
        fee_bps: u64,
    }

    #[event]
    struct LiquidityAdded has drop, store {
        provider: address,
        pulse_amount: u64,
        stable_amount: u64,
        lp_shares_minted: u64,
    }

    #[event]
    struct LiquidityRemoved has drop, store {
        provider: address,
        pulse_amount: u64,
        stable_amount: u64,
        lp_shares_burned: u64,
    }

    #[event]
    struct Swap has drop, store {
        trader: address,
        pulse_in: u64,
        stable_in: u64,
        pulse_out: u64,
        stable_out: u64,
        fee_amount: u64,
    }

    #[event]
    struct FeeUpdated has drop, store {
        old_fee_bps: u64,
        new_fee_bps: u64,
    }

    // ==================== Admin Functions ====================

    /// Initialize the liquidity pool (admin only, one-time)
    public entry fun initialize<StableCoin>(
        account: &signer,
        fee_bps: u64
    ) {
        let admin = signer::address_of(account);
        assert!(!exists<LiquidityPool<StableCoin>>(admin), E_ALREADY_INITIALIZED);
        assert!(fee_bps <= MAX_FEE_BPS, E_INVALID_FEE);

        let pool = LiquidityPool<StableCoin> {
            pulse_reserve: coin::zero<PULSE>(),
            stable_reserve: coin::zero<StableCoin>(),
            total_lp_shares: 0,
            fee_bps,
            admin,
        };

        move_to(account, pool);

        event::emit(PoolInitialized { admin, fee_bps });
    }

    /// Update swap fee (admin only)
    public entry fun set_fee<StableCoin>(
        account: &signer,
        pool_address: address,
        new_fee_bps: u64
    ) acquires LiquidityPool {
        let caller = signer::address_of(account);
        let pool = borrow_global_mut<LiquidityPool<StableCoin>>(pool_address);

        assert!(caller == pool.admin, E_NOT_ADMIN);
        assert!(new_fee_bps <= MAX_FEE_BPS, E_INVALID_FEE);

        let old_fee = pool.fee_bps;
        pool.fee_bps = new_fee_bps;

        event::emit(FeeUpdated { old_fee_bps: old_fee, new_fee_bps });
    }

    /// Transfer admin role
    public entry fun transfer_admin<StableCoin>(
        account: &signer,
        pool_address: address,
        new_admin: address
    ) acquires LiquidityPool {
        let caller = signer::address_of(account);
        let pool = borrow_global_mut<LiquidityPool<StableCoin>>(pool_address);

        assert!(caller == pool.admin, E_NOT_ADMIN);
        pool.admin = new_admin;
    }

    // ==================== Liquidity Functions ====================

    /// Add liquidity to the pool
    /// First provider sets the initial price ratio
    /// Subsequent providers must match the current ratio
    public entry fun add_liquidity<StableCoin>(
        account: &signer,
        pool_address: address,
        pulse_amount: u64,
        stable_amount: u64,
        min_lp_shares: u64
    ) acquires LiquidityPool, LPPosition {
        let provider = signer::address_of(account);
        let pool = borrow_global_mut<LiquidityPool<StableCoin>>(pool_address);

        let pulse_reserve = coin::value(&pool.pulse_reserve);
        let stable_reserve = coin::value(&pool.stable_reserve);

        let lp_shares: u64;

        if (pool.total_lp_shares == 0) {
            // First liquidity provision - use geometric mean
            // shares = sqrt(pulse_amount * stable_amount) - MINIMUM_LIQUIDITY
            lp_shares = sqrt((pulse_amount as u128) * (stable_amount as u128)) - MINIMUM_LIQUIDITY;
            // Lock minimum liquidity forever
            pool.total_lp_shares = MINIMUM_LIQUIDITY;
        } else {
            // Calculate shares based on the ratio that gives fewer shares
            // This ensures providers add in proportion to current reserves
            let shares_from_pulse = ((pulse_amount as u128) * (pool.total_lp_shares as u128) / (pulse_reserve as u128) as u64);
            let shares_from_stable = ((stable_amount as u128) * (pool.total_lp_shares as u128) / (stable_reserve as u128) as u64);
            lp_shares = if (shares_from_pulse < shares_from_stable) {
                shares_from_pulse
            } else {
                shares_from_stable
            };
        };

        assert!(lp_shares >= min_lp_shares, E_SLIPPAGE_EXCEEDED);
        assert!(lp_shares > 0, E_ZERO_LIQUIDITY);

        // Transfer tokens to pool
        let pulse_coins = coin::withdraw<PULSE>(account, pulse_amount);
        let stable_coins = coin::withdraw<StableCoin>(account, stable_amount);

        coin::merge(&mut pool.pulse_reserve, pulse_coins);
        coin::merge(&mut pool.stable_reserve, stable_coins);
        pool.total_lp_shares = pool.total_lp_shares + lp_shares;

        // Update or create LP position
        if (!exists<LPPosition<StableCoin>>(provider)) {
            move_to(account, LPPosition<StableCoin> { shares: lp_shares });
        } else {
            let position = borrow_global_mut<LPPosition<StableCoin>>(provider);
            position.shares = position.shares + lp_shares;
        };

        event::emit(LiquidityAdded {
            provider,
            pulse_amount,
            stable_amount,
            lp_shares_minted: lp_shares,
        });
    }

    /// Remove liquidity from the pool
    public entry fun remove_liquidity<StableCoin>(
        account: &signer,
        pool_address: address,
        lp_shares: u64,
        min_pulse_out: u64,
        min_stable_out: u64
    ) acquires LiquidityPool, LPPosition {
        let provider = signer::address_of(account);

        // Verify LP position
        assert!(exists<LPPosition<StableCoin>>(provider), E_INSUFFICIENT_LP_BALANCE);
        let position = borrow_global_mut<LPPosition<StableCoin>>(provider);
        assert!(position.shares >= lp_shares, E_INSUFFICIENT_LP_BALANCE);

        let pool = borrow_global_mut<LiquidityPool<StableCoin>>(pool_address);

        let pulse_reserve = coin::value(&pool.pulse_reserve);
        let stable_reserve = coin::value(&pool.stable_reserve);

        // Calculate token amounts to return
        let pulse_out = ((lp_shares as u128) * (pulse_reserve as u128) / (pool.total_lp_shares as u128) as u64);
        let stable_out = ((lp_shares as u128) * (stable_reserve as u128) / (pool.total_lp_shares as u128) as u64);

        assert!(pulse_out >= min_pulse_out, E_SLIPPAGE_EXCEEDED);
        assert!(stable_out >= min_stable_out, E_SLIPPAGE_EXCEEDED);

        // Update state
        position.shares = position.shares - lp_shares;
        pool.total_lp_shares = pool.total_lp_shares - lp_shares;

        // Transfer tokens to provider
        let pulse_coins = coin::extract(&mut pool.pulse_reserve, pulse_out);
        let stable_coins = coin::extract(&mut pool.stable_reserve, stable_out);

        coin::deposit(provider, pulse_coins);
        coin::deposit(provider, stable_coins);

        event::emit(LiquidityRemoved {
            provider,
            pulse_amount: pulse_out,
            stable_amount: stable_out,
            lp_shares_burned: lp_shares,
        });
    }

    // ==================== Swap Functions ====================

    /// Swap PULSE for StableCoin (sell PULSE)
    public entry fun swap_pulse_to_stable<StableCoin>(
        account: &signer,
        pool_address: address,
        pulse_amount_in: u64,
        min_stable_out: u64
    ) acquires LiquidityPool {
        let trader = signer::address_of(account);
        let pool = borrow_global_mut<LiquidityPool<StableCoin>>(pool_address);

        let pulse_reserve = coin::value(&pool.pulse_reserve);
        let stable_reserve = coin::value(&pool.stable_reserve);

        assert!(pulse_reserve > 0 && stable_reserve > 0, E_INSUFFICIENT_LIQUIDITY);
        assert!(pulse_amount_in > 0, E_INSUFFICIENT_INPUT_AMOUNT);

        // Calculate output using x*y=k formula with fee
        // amount_out = (reserve_out * amount_in * (10000 - fee_bps)) /
        //              (reserve_in * 10000 + amount_in * (10000 - fee_bps))
        let amount_in_with_fee = (pulse_amount_in as u128) * ((BPS_DENOMINATOR - pool.fee_bps) as u128);
        let numerator = (stable_reserve as u128) * amount_in_with_fee;
        let denominator = (pulse_reserve as u128) * (BPS_DENOMINATOR as u128) + amount_in_with_fee;
        let stable_out = (numerator / denominator as u64);

        assert!(stable_out >= min_stable_out, E_SLIPPAGE_EXCEEDED);
        assert!(stable_out > 0, E_INSUFFICIENT_OUTPUT_AMOUNT);

        // Calculate fee for event
        let fee_amount = (pulse_amount_in * pool.fee_bps) / BPS_DENOMINATOR;

        // Verify k invariant (new_k >= old_k)
        let new_pulse_reserve = pulse_reserve + pulse_amount_in;
        let new_stable_reserve = stable_reserve - stable_out;
        assert!(
            (new_pulse_reserve as u128) * (new_stable_reserve as u128) >=
            (pulse_reserve as u128) * (stable_reserve as u128),
            E_K_INVARIANT_VIOLATED
        );

        // Execute swap
        let pulse_in = coin::withdraw<PULSE>(account, pulse_amount_in);
        coin::merge(&mut pool.pulse_reserve, pulse_in);

        let stable_out_coins = coin::extract(&mut pool.stable_reserve, stable_out);
        coin::deposit(trader, stable_out_coins);

        event::emit(Swap {
            trader,
            pulse_in: pulse_amount_in,
            stable_in: 0,
            pulse_out: 0,
            stable_out,
            fee_amount,
        });
    }

    /// Swap StableCoin for PULSE (buy PULSE)
    public entry fun swap_stable_to_pulse<StableCoin>(
        account: &signer,
        pool_address: address,
        stable_amount_in: u64,
        min_pulse_out: u64
    ) acquires LiquidityPool {
        let trader = signer::address_of(account);
        let pool = borrow_global_mut<LiquidityPool<StableCoin>>(pool_address);

        let pulse_reserve = coin::value(&pool.pulse_reserve);
        let stable_reserve = coin::value(&pool.stable_reserve);

        assert!(pulse_reserve > 0 && stable_reserve > 0, E_INSUFFICIENT_LIQUIDITY);
        assert!(stable_amount_in > 0, E_INSUFFICIENT_INPUT_AMOUNT);

        // Calculate output using x*y=k formula with fee
        let amount_in_with_fee = (stable_amount_in as u128) * ((BPS_DENOMINATOR - pool.fee_bps) as u128);
        let numerator = (pulse_reserve as u128) * amount_in_with_fee;
        let denominator = (stable_reserve as u128) * (BPS_DENOMINATOR as u128) + amount_in_with_fee;
        let pulse_out = (numerator / denominator as u64);

        assert!(pulse_out >= min_pulse_out, E_SLIPPAGE_EXCEEDED);
        assert!(pulse_out > 0, E_INSUFFICIENT_OUTPUT_AMOUNT);

        let fee_amount = (stable_amount_in * pool.fee_bps) / BPS_DENOMINATOR;

        // Verify k invariant
        let new_stable_reserve = stable_reserve + stable_amount_in;
        let new_pulse_reserve = pulse_reserve - pulse_out;
        assert!(
            (new_pulse_reserve as u128) * (new_stable_reserve as u128) >=
            (pulse_reserve as u128) * (stable_reserve as u128),
            E_K_INVARIANT_VIOLATED
        );

        // Execute swap
        let stable_in = coin::withdraw<StableCoin>(account, stable_amount_in);
        coin::merge(&mut pool.stable_reserve, stable_in);

        let pulse_out_coins = coin::extract(&mut pool.pulse_reserve, pulse_out);
        coin::deposit(trader, pulse_out_coins);

        event::emit(Swap {
            trader,
            pulse_in: 0,
            stable_in: stable_amount_in,
            pulse_out,
            stable_out: 0,
            fee_amount,
        });
    }

    // ==================== View Functions ====================

    #[view]
    /// Get pool reserves
    public fun get_reserves<StableCoin>(pool_address: address): (u64, u64) acquires LiquidityPool {
        let pool = borrow_global<LiquidityPool<StableCoin>>(pool_address);
        (coin::value(&pool.pulse_reserve), coin::value(&pool.stable_reserve))
    }

    #[view]
    /// Get pool info (reserves, total shares, fee)
    public fun get_pool_info<StableCoin>(pool_address: address): (u64, u64, u64, u64) acquires LiquidityPool {
        let pool = borrow_global<LiquidityPool<StableCoin>>(pool_address);
        (
            coin::value(&pool.pulse_reserve),
            coin::value(&pool.stable_reserve),
            pool.total_lp_shares,
            pool.fee_bps
        )
    }

    #[view]
    /// Get LP position for an address
    public fun get_lp_position<StableCoin>(provider: address): u64 acquires LPPosition {
        if (exists<LPPosition<StableCoin>>(provider)) {
            borrow_global<LPPosition<StableCoin>>(provider).shares
        } else {
            0
        }
    }

    #[view]
    /// Calculate output amount for a swap (quote function)
    public fun get_amount_out<StableCoin>(
        pool_address: address,
        amount_in: u64,
        is_pulse_to_stable: bool
    ): u64 acquires LiquidityPool {
        let pool = borrow_global<LiquidityPool<StableCoin>>(pool_address);
        let pulse_reserve = coin::value(&pool.pulse_reserve);
        let stable_reserve = coin::value(&pool.stable_reserve);

        if (pulse_reserve == 0 || stable_reserve == 0) {
            return 0
        };

        if (is_pulse_to_stable) {
            let amount_in_with_fee = (amount_in as u128) * ((BPS_DENOMINATOR - pool.fee_bps) as u128);
            let numerator = (stable_reserve as u128) * amount_in_with_fee;
            let denominator = (pulse_reserve as u128) * (BPS_DENOMINATOR as u128) + amount_in_with_fee;
            (numerator / denominator as u64)
        } else {
            let amount_in_with_fee = (amount_in as u128) * ((BPS_DENOMINATOR - pool.fee_bps) as u128);
            let numerator = (pulse_reserve as u128) * amount_in_with_fee;
            let denominator = (stable_reserve as u128) * (BPS_DENOMINATOR as u128) + amount_in_with_fee;
            (numerator / denominator as u64)
        }
    }

    #[view]
    /// Calculate price impact for a swap (in basis points)
    public fun get_price_impact<StableCoin>(
        pool_address: address,
        amount_in: u64,
        is_pulse_to_stable: bool
    ): u64 acquires LiquidityPool {
        let pool = borrow_global<LiquidityPool<StableCoin>>(pool_address);
        let pulse_reserve = coin::value(&pool.pulse_reserve);
        let stable_reserve = coin::value(&pool.stable_reserve);

        if (pulse_reserve == 0 || stable_reserve == 0 || amount_in == 0) {
            return 0
        };

        // Calculate spot price (scaled by BPS for precision)
        let spot_price_bps: u128 = if (is_pulse_to_stable) {
            (stable_reserve as u128) * (BPS_DENOMINATOR as u128) / (pulse_reserve as u128)
        } else {
            (pulse_reserve as u128) * (BPS_DENOMINATOR as u128) / (stable_reserve as u128)
        };

        // Get actual output
        let amount_out = get_amount_out<StableCoin>(pool_address, amount_in, is_pulse_to_stable);
        if (amount_out == 0) {
            return BPS_DENOMINATOR // 100% impact if no output
        };

        // Calculate execution price
        let exec_price_bps: u128 = (amount_out as u128) * (BPS_DENOMINATOR as u128) / (amount_in as u128);

        // Price impact = (spot - exec) / spot * 10000
        if (spot_price_bps > exec_price_bps) {
            (((spot_price_bps - exec_price_bps) * (BPS_DENOMINATOR as u128) / spot_price_bps) as u64)
        } else {
            0
        }
    }

    #[view]
    /// Get current spot price (PULSE per StableCoin, scaled by 1e8)
    public fun get_spot_price<StableCoin>(pool_address: address): u64 acquires LiquidityPool {
        let pool = borrow_global<LiquidityPool<StableCoin>>(pool_address);
        let pulse_reserve = coin::value(&pool.pulse_reserve);
        let stable_reserve = coin::value(&pool.stable_reserve);

        if (pulse_reserve == 0 || stable_reserve == 0) {
            return 0
        };

        // Returns how many PULSE you get per 1 StableCoin (scaled by 1e8)
        ((pulse_reserve as u128) * 100000000 / (stable_reserve as u128) as u64)
    }

    // ==================== Helper Functions ====================

    /// Integer square root (Babylonian method)
    fun sqrt(x: u128): u64 {
        if (x == 0) return 0;
        let z = (x + 1) / 2;
        let y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        };
        (y as u64)
    }
}
