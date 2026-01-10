# MVPulse

A decentralized polling and rewards platform built on Movement Network. Create polls, vote, and earn rewards in MOVE, PULSE, or USDC tokens.

**Live Demo:** [mvpulse.onrender.com](https://mvpulse.onrender.com)

## Documentation

| Document | Description |
|----------|-------------|
| [User Manual](docs/USER_MANUAL.md) | Complete guide for end users |
| [One-Pager](docs/ONE_PAGER.md) | Quick project overview |
| [Architecture](docs/ARCHITECTURE.md) | System design and data flows |
| [Smart Contracts](docs/SMART_CONTRACTS.md) | Contract specifications and functions |
| [API Reference](docs/API_REFERENCE.md) | REST API documentation |
| [Deployment Guide](docs/DEPLOYMENT.md) | How to deploy the platform |
| [Demo Script](docs/DEMO_SCRIPT.md) | Live demonstration guide |
| [Video Script](docs/VIDEO_SCRIPT.md) | Demo video recording script |
| [Roadmap](docs/ROADMAP.md) | Future plans and vision |
| [Security](docs/SECURITY.md) | Security considerations |

### Checkpoints
- [Checkpoint 1](01_checkpoint.md) - Initial development
- [Checkpoint 2](02_checkpoint.md) - Core features complete
- [Checkpoint 3](03_checkpoint.md) - Latest features (Questionnaires, Staking, Projects, Referrals)

## Project Structure

```
mvpulse/
├── frontend/          # React + Vite dApp with wallet connection
└── contracts/         # Move smart contracts
    ├── pulse/         # PULSE token (Fungible Asset)
    ├── poll/          # Polling system with rewards
    ├── swap/          # PULSE/USDC AMM swap
    └── staking/       # PULSE staking for tier qualification
```

## Deployed Contracts (Testnet)

| Package | Address | Module |
|---------|---------|--------|
| **pulse** | `0x69c7c6752b3426e00fec646270e5b7e9f0efa18bddbd7f112a8e84f7fbe3f737` | `pulse::pulse` |
| **poll** | `0x4a3593c9631d8686a00b72eaf4da8341947386c6ced38513fb5a88a63aa10cde` | `poll::poll` |
| **swap** | `0x55872704413ffc43bb832df7eb14c0665c9ae401897077a262d56e2de37d2b7e` | `swap::swap` |
| **staking** | `0xa317fa282be3423cd8378b818f04ba9492981d955206ed2a46eff281be8aa55f` | `staking::staking` |

## Features

### Polling System
- Create polls with MOVE, PULSE, or USDC rewards
- Multiple reward distribution modes (Fixed per vote, Equal split)
- Platform fee (2%) for sustainability
- Manual claim (MANUAL_PULL) or creator distribution (MANUAL_PUSH)
- Full poll lifecycle: ACTIVE → CLAIMING → CLOSED → FINALIZED
- Bulk voting for questionnaires (single transaction)

### Questionnaires
- Bundle multiple polls into surveys
- Shared reward pools with auto-calculation
- Progress tracking for participants
- Bulk vote recording (atomic transaction)

### PULSE Token
- Fixed supply Fungible Asset (FA) token
- 1 billion max supply
- Testnet faucet for development

### Token Swap
- AMM-based PULSE/USDC swap
- Constant product (x*y=k) market maker
- Liquidity provision with LP shares

### PULSE Staking
- Lock PULSE tokens for fixed periods (7, 14, 21, 30, 90, 180, or 365 days)
- Staking counts towards tier qualification (wallet balance + staked = tier)
- Multiple stake positions with different lock periods
- Unstake anytime after lock period expires

### Tier System
Users earn tiers based on their total PULSE holdings (wallet + staked):

| Tier | PULSE Required | Daily Votes |
|------|----------------|-------------|
| Bronze | 0+ | 3 |
| Silver | 1,000+ | 6 |
| Gold | 10,000+ | 9 |
| Platinum | 100,000+ | 12 |

**Streak Bonuses:**
- 7+ day voting streak: +1 tier
- 30+ day voting streak: +2 tiers (max Platinum)

### Projects & Collaboration
- Organize polls and questionnaires into projects
- Team collaboration with role-based access (Owner, Admin, Editor, Viewer)
- Project analytics and AI-powered insights
- Invitation system for collaborators

### Referral System
- Unique referral codes per user
- Milestone rewards (1, 10, 50, 100 votes)
- Tiered point multipliers
- Referral leaderboard

### Quests & Seasons
- Daily, weekly, and achievement quests
- Seasonal competitions with leaderboards
- Point-based rewards system

## Frontend

The frontend is a React + Vite application with wallet connection support.

### Setup

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

### Features

- Multi-wallet support (Petra, Nightly, Martian, Pontem)
- Privy embedded wallets (social login: Email, Google, Discord)
- Movement Network testnet and mainnet support
- PULSE faucet for testnet
- Poll creation with MOVE/PULSE/USDC rewards
- Questionnaire creation with shared reward pools
- Token swap interface (PULSE/USDC AMM)
- PULSE staking dashboard with tier progression
- Project organization with team collaboration
- Referral dashboard with milestone tracking
- Quest system with seasonal competitions
- Gas sponsorship via Shinami

### Environment Variables

Create a `.env` file in the `frontend/` directory:

```env
# Testnet Contract Addresses
VITE_TESTNET_CONTRACT_ADDRESS=0x4a3593c9631d8686a00b72eaf4da8341947386c6ced38513fb5a88a63aa10cde
VITE_TESTNET_PULSE_CONTRACT_ADDRESS=0x69c7c6752b3426e00fec646270e5b7e9f0efa18bddbd7f112a8e84f7fbe3f737
VITE_TESTNET_PULSE_METADATA_ADDRESS=0x4c7028f47b62b952c11bbeb0ba209523b0e3d54205c085752905bcccd35f2f03
VITE_TESTNET_SWAP_CONTRACT_ADDRESS=0x55872704413ffc43bb832df7eb14c0665c9ae401897077a262d56e2de37d2b7e
VITE_TESTNET_STAKING_CONTRACT_ADDRESS=0xa317fa282be3423cd8378b818f04ba9492981d955206ed2a46eff281be8aa55f
VITE_TESTNET_USDC_CONTRACT_ADDRESS=0xb89077cfd2a82a0c1450534d49cfd5f2707643155273069bc23a912bcfefdee7

# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://...

# Privy (for embedded wallets)
VITE_PRIVY_APP_ID=your_privy_app_id

# Shinami Gas Sponsorship
SHINAMI_GAS_KEY_TESTNET=your_shinami_testnet_key
```

## Contracts

See [contracts/README.md](contracts/README.md) for detailed contract documentation.

### Quick Start

```bash
# Compile all packages
cd contracts/pulse && movement move compile
cd contracts/poll && movement move compile
cd contracts/swap && movement move compile
cd contracts/staking && movement move compile

# Deploy (requires funded account)
cd contracts/pulse && movement move publish --assume-yes
cd contracts/poll && movement move publish --assume-yes
cd contracts/swap && movement move publish --assume-yes
cd contracts/staking && movement move publish --assume-yes
```

## Networks

| Network | Chain ID | RPC URL |
|---------|----------|---------|
| Mainnet | 126 | https://full.mainnet.movementinfra.xyz/v1 |
| Testnet | 250 | https://testnet.movementnetwork.xyz/v1 |

## Tech Stack

| Layer | Technology |
|-------|------------|
| Blockchain | Movement Network (Aptos Move) |
| Smart Contracts | Move Language |
| Frontend | React + TypeScript + Vite |
| Backend | Express.js + Drizzle ORM |
| Database | PostgreSQL (Neon) |
| Styling | TailwindCSS + shadcn/ui |
| Wallet | Privy + Petra/Nightly/Martian |
| Gas Sponsorship | Shinami Gas Station |

## Resources

- [Movement Docs](https://docs.movementnetwork.xyz)
- [Move Language Book](https://move-language.github.io/move/)
- [Privy Documentation](https://docs.privy.io)
- [Shinami Documentation](https://docs.shinami.com)

---

*Built for the Encode x Movement M1 Hackathon*
