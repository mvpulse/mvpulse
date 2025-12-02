# MovePoll Smart Contracts

Move smart contracts for the MovePoll dApp on Movement Network.

## Prerequisites

### Install Movement CLI

```bash
# Option 1: Install script
curl -fsSL https://raw.githubusercontent.com/movementlabsxyz/aptos-core/main/scripts/install_cli.sh | bash

# Option 2: Homebrew (macOS)
brew install movementlabsxyz/tap/movement

# Verify installation
movement --version
```

## Setup

### 1. Initialize Account (First Time Only)

```bash
cd contracts

# For Testnet (Porto)
movement init --network custom \
  --rest-url https://aptos.testnet.porto.movementlabs.xyz/v1 \
  --faucet-url https://fund.testnet.porto.movementlabs.xyz

# For Mainnet
movement init --network custom \
  --rest-url https://mainnet.movementnetwork.xyz/v1
```

This creates a `.movement` folder with your private key. **Keep this secure!**

### 2. Fund Your Account (Testnet)

```bash
movement account fund-with-faucet --amount 100000000
```

### 3. Check Balance

```bash
movement account balance
```

## Development

### Compile Contracts

```bash
movement move compile --named-addresses contracts=default
```

### Run Tests

```bash
movement move test --named-addresses contracts=default
```

### Publish to Network

```bash
# Testnet
movement move publish --named-addresses contracts=default

# With gas options
movement move publish \
  --named-addresses contracts=default \
  --max-gas 10000 \
  --gas-unit-price 100
```

## Contract Structure

```
contracts/
├── Move.toml          # Project configuration
├── sources/
│   └── poll.move      # Main poll contract
└── tests/             # Unit tests
```

## Poll Contract Functions

### Entry Functions (Write)

| Function | Description |
|----------|-------------|
| `initialize()` | Initialize poll registry (call once after deploy) |
| `create_poll(...)` | Create a new poll with options and rewards |
| `vote(poll_id, option)` | Cast a vote on a poll |
| `close_poll(poll_id)` | Close a poll (creator only) |

### View Functions (Read)

| Function | Description |
|----------|-------------|
| `get_poll(poll_id)` | Get poll details |
| `get_poll_count()` | Get total number of polls |
| `has_voted(poll_id, addr)` | Check if address has voted |

## After Deployment

After publishing, note your contract address (same as your account address). Update your frontend to interact with the contract:

```typescript
const CONTRACT_ADDRESS = "0xYOUR_ADDRESS";
const MODULE_NAME = "poll";

// Example: Create a poll
await signAndSubmitTransaction({
  data: {
    function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::create_poll`,
    typeArguments: [],
    functionArguments: [
      CONTRACT_ADDRESS,  // registry_addr
      "Poll Title",      // title
      "Description",     // description
      ["Option A", "Option B", "Option C"],  // options
      1000000,           // reward_per_vote (in octas)
      86400,             // duration_secs (24 hours)
    ],
  },
});
```

## Network Information

| Network | Chain ID | RPC URL |
|---------|----------|---------|
| Testnet (Porto) | 177 | https://aptos.testnet.porto.movementlabs.xyz/v1 |
| Mainnet | 126 | https://mainnet.movementnetwork.xyz/v1 |

## Resources

- [Movement Docs](https://docs.movementnetwork.xyz)
- [Move Language Book](https://move-language.github.io/move/)
- [Aptos Move Examples](https://github.com/aptos-labs/aptos-core/tree/main/aptos-move/move-examples)
