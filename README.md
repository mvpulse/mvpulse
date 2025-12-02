# MVPulse

A dApp built on Movement L1 platform.

## Project Structure

```
mvpulse/
├── frontend/     # Next.js dApp with wallet connection
└── contracts/    # Move smart contracts
```

## Frontend

The frontend is a Next.js application based on the [Movement Network ConnectWallet Template](https://github.com/Rahat-ch/Movement-Network-ConnectWallet-Template).

### Setup

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:3000`.

### Features

- Wallet connection (Petra, Nightly, Martian, Pontem)
- Movement Network mainnet and testnet support
- Theme switching (light/dark mode)

### Deployment

The frontend can be deployed to Vercel or Replit as a standalone Next.js application.

## Contracts

Move smart contracts for the MVPulse dApp.

### Structure

```
contracts/
├── Move.toml      # Project configuration
├── sources/       # Contract modules (.move files)
└── tests/         # Contract tests
```

### Prerequisites

Install the Movement CLI:
```bash
# See https://docs.movementnetwork.xyz for installation instructions
```

### Development

Initialize your Movement account (first time only):
```bash
cd contracts
movement init --network custom \
  --rest-url https://testnet.movementnetwork.xyz/v1 \
  --faucet-url https://faucet.testnet.movementnetwork.xyz/
```

Compile contracts:
```bash
movement move compile --named-addresses contracts=default
```

Run tests:
```bash
movement move test --named-addresses contracts=default
```

Deploy to testnet:
```bash
movement move publish --named-addresses contracts=default
```

## Networks

| Network | Chain ID | RPC URL |
|---------|----------|---------|
| Mainnet | 126 | https://mainnet.movementnetwork.xyz/v1 |
| Testnet | 250 | https://testnet.movementnetwork.xyz/v1 |
