# MVPulse Smart Contract Documentation

## Overview

MVPulse consists of four smart contracts deployed on Movement Network, all written in Move language.

---

## Contract Addresses (Testnet)

| Contract | Address | Module |
|----------|---------|--------|
| Poll | `0x4a3593c9631d8686a00b72eaf4da8341947386c6ced38513fb5a88a63aa10cde` | `poll::poll` |
| PULSE | `0x69c7c6752b3426e00fec646270e5b7e9f0efa18bddbd7f112a8e84f7fbe3f737` | `pulse::pulse` |
| Staking | `0xa317fa282be3423cd8378b818f04ba9492981d955206ed2a46eff281be8aa55f` | `staking::staking` |
| Swap | `0x55872704413ffc43bb832df7eb14c0665c9ae401897077a262d56e2de37d2b7e` | `swap::swap` |

---

## 1. Poll Contract (`poll::poll`)

The core contract for creating polls, voting, and distributing rewards.

### Constants

```move
// Poll Status
STATUS_ACTIVE: u8 = 0
STATUS_CLOSED: u8 = 1
STATUS_CLAIMING_OR_DISTRIBUTION: u8 = 2
STATUS_FINALIZED: u8 = 3

// Distribution Modes
DISTRIBUTION_MANUAL_PULL: u8 = 0  // Voters claim rewards
DISTRIBUTION_MANUAL_PUSH: u8 = 1  // Creator distributes

// Coin Types
COIN_TYPE_APTOS: u8 = 0   // MOVE (legacy coin)
COIN_TYPE_PULSE: u8 = 1   // PULSE (FA)
COIN_TYPE_USDC: u8 = 2    // USDC (FA)

// Fees
DEFAULT_FEE_BPS: u64 = 200    // 2%
MAX_FEE_BPS: u64 = 1000       // 10%
```

### Entry Functions

#### Initialization

```move
public entry fun initialize(account: &signer)
```
Initialize the poll registry. Called once by deployer.

```move
public entry fun initialize_fa_store(
    account: &signer,
    registry_addr: address,
    fa_metadata_address: address
)
```
Initialize a store for a Fungible Asset token. Required before using that FA for polls.

#### Poll Creation

```move
public entry fun create_poll_with_move(
    account: &signer,
    registry_addr: address,
    title: String,
    description: String,
    options: vector<String>,
    reward_per_vote: u64,      // 0 for equal split
    max_voters: u64,           // 0 for unlimited
    duration_secs: u64,
    fund_amount: u64
)
```
Create a poll funded with MOVE tokens.

```move
public entry fun create_poll_with_fa(
    account: &signer,
    registry_addr: address,
    title: String,
    description: String,
    options: vector<String>,
    reward_per_vote: u64,
    max_voters: u64,
    duration_secs: u64,
    fund_amount: u64,
    fa_metadata_address: address,
    coin_type_id: u8
)
```
Create a poll funded with any Fungible Asset (PULSE, USDC).

```move
public entry fun create_polls_batch_with_fa(...)
public entry fun create_polls_batch_with_move(...)
```
Create multiple polls in a single atomic transaction (for questionnaires).

#### Voting

```move
public entry fun vote(
    account: &signer,
    registry_addr: address,
    poll_id: u64,
    option_index: u64
)
```
Cast a vote on a poll.

```move
public entry fun bulk_vote(
    account: &signer,
    registry_addr: address,
    poll_ids: vector<u64>,
    option_indices: vector<u64>
)
```
Vote on multiple polls in a single transaction.

#### Poll Lifecycle

```move
public entry fun start_claims(
    account: &signer,
    registry_addr: address,
    poll_id: u64,
    distribution_mode: u8
)
```
Close voting and start claims/distribution period.

```move
public entry fun close_poll(...)
```
Close the claims period.

```move
public entry fun finalize_poll_move(...)
public entry fun finalize_poll_fa(...)
```
Finalize a poll after claim period, send unclaimed funds to treasury.

#### Rewards

```move
public entry fun claim_reward_move(...)
public entry fun claim_reward_fa(...)
```
Claim reward (for MANUAL_PULL mode).

```move
public entry fun distribute_rewards_move(...)
public entry fun distribute_rewards_fa(...)
```
Distribute rewards to all voters (for MANUAL_PUSH mode).

### View Functions

```move
#[view] public fun get_poll(registry_addr: address, poll_id: u64): Poll
#[view] public fun get_poll_count(registry_addr: address): u64
#[view] public fun has_voted(registry_addr: address, poll_id: u64, voter: address): bool
#[view] public fun has_claimed(registry_addr: address, poll_id: u64, claimer: address): bool
#[view] public fun get_platform_config(registry_addr: address): (u64, address, u64, u64)
```

### Events

| Event | Fields |
|-------|--------|
| `PollCreated` | poll_id, creator, title, reward_pool, max_voters, platform_fee, coin_type_id |
| `VoteCast` | poll_id, voter, option_index |
| `PollClosed` | poll_id, distribution_mode, total_voters |
| `RewardClaimed` | poll_id, claimer, amount |
| `RewardsDistributed` | poll_id, total_distributed, recipient_count |
| `PollFinalized` | poll_id, unclaimed_amount, sent_to_treasury |
| `BulkVoteCast` | voter, poll_ids, option_indices |

---

## 2. PULSE Token Contract (`pulse::pulse`)

Platform token implemented as a Fungible Asset with fixed supply.

### Constants

```move
MAX_SUPPLY: u64 = 100_000_000_000_000_000  // 1 billion with 8 decimals
FAUCET_AMOUNT: u64 = 100_000_000_000       // 1000 PULSE
```

### Entry Functions

```move
public entry fun initialize(account: &signer)
```
Initialize the PULSE token. Called once by deployer.

```move
public entry fun mint_all_to_treasury(admin: &signer, treasury: address)
```
One-time mint of entire supply to treasury. **Permanently disables minting.**

```move
public entry fun faucet(account: &signer)
```
Get 1000 PULSE (testnet only, before treasury mint).

```move
public entry fun burn(account: &signer, amount: u64)
```
Burn PULSE tokens.

```move
public entry fun transfer(from: &signer, to: address, amount: u64)
```
Transfer PULSE tokens.

### View Functions

```move
#[view] public fun get_metadata(): Object<Metadata>
#[view] public fun get_metadata_address(): address
#[view] public fun total_minted(): u64
#[view] public fun max_supply(): u64
#[view] public fun remaining_supply(): u64
#[view] public fun balance(account: address): u64
#[view] public fun is_initialized(): bool
#[view] public fun is_minting_enabled(): bool
```

---

## 3. Staking Contract (`staking::staking`)

Stake PULSE tokens for tier qualification with flexible lock periods.

### Constants

```move
// Lock periods (in seconds)
LOCK_7_DAYS: u64 = 604800
LOCK_14_DAYS: u64 = 1209600
LOCK_21_DAYS: u64 = 1814400
LOCK_30_DAYS: u64 = 2592000
LOCK_90_DAYS: u64 = 7776000
LOCK_180_DAYS: u64 = 15552000
LOCK_365_DAYS: u64 = 31536000
```

### Entry Functions

```move
public entry fun initialize(admin: &signer)
```
Initialize the staking pool.

```move
public entry fun stake(
    account: &signer,
    amount: u64,
    lock_duration: u64
)
```
Stake PULSE with a specified lock period.

```move
public entry fun unstake(account: &signer, position_index: u64)
```
Unstake a specific position (must be unlocked).

```move
public entry fun unstake_all(account: &signer)
```
Unstake all unlocked positions.

### View Functions

```move
#[view] public fun is_valid_lock_period(duration: u64): bool
#[view] public fun get_pool_address(): address
#[view] public fun is_initialized(): bool
#[view] public fun get_total_staked(): u64
#[view] public fun get_stakers_count(): u64
#[view] public fun get_staked_amount(user: address): u64
#[view] public fun get_positions_count(user: address): u64
#[view] public fun get_position(user: address, index: u64): (u64, u64, u64, u64)
#[view] public fun get_unlockable_amount(user: address): u64
#[view] public fun get_locked_amount(user: address): u64
#[view] public fun has_stakes(user: address): bool
#[view] public fun get_lock_periods(): vector<u64>
```

### Events

| Event | Fields |
|-------|--------|
| `PoolInitialized` | admin, pulse_metadata |
| `Staked` | staker, amount, lock_duration, unlock_at, position_index |
| `Unstaked` | staker, amount, position_index |

---

## 4. Swap Contract (`swap::swap`)

AMM for PULSE/USDC trading using constant product formula (x*y=k).

### Constants

```move
MAX_FEE_BPS: u64 = 500       // Max 5%
DEFAULT_FEE_BPS: u64 = 30    // 0.3%
MINIMUM_LIQUIDITY: u64 = 1000
```

### Entry Functions

```move
public entry fun initialize(
    account: &signer,
    stable_metadata_addr: address,
    fee_bps: u64
)
```
Initialize the liquidity pool.

```move
public entry fun add_liquidity(
    account: &signer,
    pulse_amount: u64,
    stable_amount: u64,
    min_lp_shares: u64
)
```
Add liquidity and receive LP shares.

```move
public entry fun remove_liquidity(
    account: &signer,
    lp_shares: u64,
    min_pulse_out: u64,
    min_stable_out: u64
)
```
Remove liquidity by burning LP shares.

```move
public entry fun swap_pulse_to_stable(
    account: &signer,
    pulse_amount_in: u64,
    min_stable_out: u64
)
```
Sell PULSE for stablecoin.

```move
public entry fun swap_stable_to_pulse(
    account: &signer,
    stable_amount_in: u64,
    min_pulse_out: u64
)
```
Buy PULSE with stablecoin.

### View Functions

```move
#[view] public fun get_reserves(): (u64, u64)
#[view] public fun get_pool_info(): (u64, u64, u64, u64)
#[view] public fun get_lp_position(provider: address): u64
#[view] public fun get_amount_out(amount_in: u64, is_pulse_to_stable: bool): u64
#[view] public fun get_price_impact(amount_in: u64, is_pulse_to_stable: bool): u64
#[view] public fun get_spot_price(): u64
#[view] public fun is_initialized(): bool
```

### Events

| Event | Fields |
|-------|--------|
| `PoolInitialized` | admin, fee_bps, pulse_metadata, stable_metadata |
| `LiquidityAdded` | provider, pulse_amount, stable_amount, lp_shares_minted |
| `LiquidityRemoved` | provider, pulse_amount, stable_amount, lp_shares_burned |
| `Swap` | trader, pulse_in, stable_in, pulse_out, stable_out, fee_amount |

---

## Error Codes

### Poll Contract

| Code | Name | Description |
|------|------|-------------|
| 1 | E_NOT_OWNER | Caller is not the poll creator |
| 2 | E_POLL_NOT_FOUND | Poll ID does not exist |
| 3 | E_POLL_CLOSED | Poll is not active |
| 4 | E_ALREADY_VOTED | User has already voted |
| 5 | E_INVALID_OPTION | Option index out of bounds |
| 7 | E_ALREADY_CLAIMED | Reward already claimed |
| 8 | E_NOT_VOTER | User did not vote on this poll |
| 16 | E_NOT_ADMIN | Caller is not admin |

### Staking Contract

| Code | Name | Description |
|------|------|-------------|
| 4 | E_INVALID_LOCK_PERIOD | Lock duration not in allowed list |
| 5 | E_INSUFFICIENT_BALANCE | Not enough PULSE to stake |
| 6 | E_POSITION_STILL_LOCKED | Cannot unstake before unlock time |
| 8 | E_NO_STAKES | User has no stake positions |
| 9 | E_ZERO_AMOUNT | Cannot stake zero amount |

### Swap Contract

| Code | Name | Description |
|------|------|-------------|
| 4 | E_INSUFFICIENT_LIQUIDITY | Pool has no liquidity |
| 8 | E_SLIPPAGE_EXCEEDED | Output less than minimum |
| 11 | E_K_INVARIANT_VIOLATED | AMM invariant broken |

---

## Integration Examples

### Creating a Poll with PULSE

```typescript
const tx = await aptos.transaction.build.simple({
  sender: creatorAddress,
  data: {
    function: `${POLL_CONTRACT}::poll::create_poll_with_fa`,
    functionArguments: [
      POLL_CONTRACT,           // registry_addr
      "Best blockchain?",      // title
      "Vote for your pick",    // description
      ["Movement", "Aptos", "Sui"],  // options
      0,                       // reward_per_vote (0 = equal split)
      100,                     // max_voters
      86400,                   // duration (1 day)
      1000_00000000,          // fund_amount (1000 PULSE)
      PULSE_METADATA_ADDRESS,  // fa_metadata_address
      1,                       // coin_type_id (PULSE)
    ],
  },
});
```

### Staking PULSE

```typescript
const tx = await aptos.transaction.build.simple({
  sender: userAddress,
  data: {
    function: `${STAKING_CONTRACT}::staking::stake`,
    functionArguments: [
      1000_00000000,  // 1000 PULSE
      2592000,        // 30 days lock
    ],
  },
});
```

### Swapping Tokens

```typescript
const tx = await aptos.transaction.build.simple({
  sender: userAddress,
  data: {
    function: `${SWAP_CONTRACT}::swap::swap_pulse_to_stable`,
    functionArguments: [
      100_00000000,  // 100 PULSE in
      95_000000,     // min 95 USDC out (allowing 5% slippage)
    ],
  },
});
```
