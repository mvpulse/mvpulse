# MVPulse Technical Architecture

## System Overview

MVPulse is a full-stack decentralized application with on-chain smart contracts and off-chain services for enhanced functionality.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    React + TypeScript + Vite                      │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │   │
│  │  │  Pages   │ │Components│ │  Hooks   │ │    Contexts      │   │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                     │
│                    ┌───────────────┼───────────────┐                    │
│                    ▼               ▼               ▼                    │
│            ┌──────────────┐ ┌──────────────┐ ┌──────────────┐          │
│            │ Privy SDK    │ │ Aptos SDK    │ │ Shinami SDK  │          │
│            │ (Wallet)     │ │ (Blockchain) │ │ (Gas Station)│          │
│            └──────────────┘ └──────────────┘ └──────────────┘          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
┌──────────────────────┐  ┌──────────────────┐  ┌──────────────────────┐
│   EXPRESS BACKEND    │  │ MOVEMENT NETWORK │  │   SHINAMI SERVICE    │
│  ┌────────────────┐  │  │  ┌────────────┐  │  │  ┌────────────────┐  │
│  │   REST API     │  │  │  │   Poll     │  │  │  │  Gas Station   │  │
│  │   Routes       │  │  │  │  Contract  │  │  │  │  Sponsorship   │  │
│  └────────────────┘  │  │  └────────────┘  │  │  └────────────────┘  │
│  ┌────────────────┐  │  │  ┌────────────┐  │  └──────────────────────┘
│  │  Drizzle ORM   │  │  │  │   PULSE    │  │
│  │                │  │  │  │   Token    │  │
│  └────────────────┘  │  │  └────────────┘  │
│          │           │  │  ┌────────────┐  │
│          ▼           │  │  │  Staking   │  │
│  ┌────────────────┐  │  │  │  Contract  │  │
│  │   PostgreSQL   │  │  │  └────────────┘  │
│  │   (Neon)       │  │  │  ┌────────────┐  │
│  └────────────────┘  │  │  │   Swap     │  │
└──────────────────────┘  │  │   AMM      │  │
                          │  └────────────┘  │
                          └──────────────────┘
```

---

## Component Breakdown

### 1. Frontend (React Application)

**Location**: `frontend/client/`

| Directory | Purpose |
|-----------|---------|
| `src/pages/` | Route-based page components |
| `src/components/` | Reusable UI components |
| `src/hooks/` | Custom React hooks for data fetching |
| `src/contexts/` | React contexts (Wallet, Network, Theme) |
| `src/lib/` | Utility functions, token configs, Privy setup |

**Key Technologies**:
- React 18 with TypeScript
- Vite for build tooling
- TailwindCSS + shadcn/ui for styling
- TanStack React Query for state management
- Wouter for routing

### 2. Backend (Express Server)

**Location**: `frontend/server/`

| File | Purpose |
|------|---------|
| `index.ts` | Server entry point, middleware setup |
| `routes.ts` | API endpoint definitions |
| `db.ts` | Database connection (Drizzle) |

**Key Features**:
- RESTful API for off-chain data
- Drizzle ORM for type-safe database access
- Session management for user preferences

### 3. Database (PostgreSQL)

**Location**: `frontend/shared/schema.ts`

**Provider**: Neon Serverless PostgreSQL

| Table Group | Tables |
|-------------|--------|
| **Users** | `userProfiles`, `userSettings`, `userSeasonSnapshots` |
| **Voting** | `dailyVoteLogs` |
| **Quests** | `seasons`, `quests`, `questProgress`, `seasonLeaderboard` |
| **Questionnaires** | `questionnaires`, `questionnairePolls`, `questionnaireProgress` |
| **Projects** | `projects`, `projectCollaborators`, `projectPolls`, `projectQuestionnaires`, `projectInsights` |
| **Referrals** | `referralCodes`, `referrals`, `referralMilestones`, `referralStats` |
| **Utility** | `sponsorshipLogs` |

### 4. Smart Contracts (Move)

**Location**: `contracts/`

| Contract | Address (Testnet) | Purpose |
|----------|-------------------|---------|
| Poll | `0x4a3593c9...` | Core polling, voting, rewards |
| PULSE | `0x69c7c675...` | Platform token (FA standard) |
| Staking | `0xa317fa28...` | PULSE staking for tiers |
| Swap | `0x55872704...` | AMM for token exchange |

---

## Data Flow Diagrams

### Poll Creation Flow

```
Creator                Frontend              Backend            Blockchain
   │                      │                     │                    │
   │  Fill poll form      │                     │                    │
   │─────────────────────>│                     │                    │
   │                      │                     │                    │
   │                      │ Build transaction   │                    │
   │                      │────────────────────────────────────────>│
   │                      │                     │                    │
   │                      │                     │    Create poll +   │
   │                      │                     │    Transfer tokens │
   │                      │<────────────────────────────────────────│
   │                      │                     │                    │
   │                      │ Store metadata      │                    │
   │                      │────────────────────>│                    │
   │                      │                     │  Save to DB        │
   │                      │                     │───────────>        │
   │                      │<────────────────────│                    │
   │  Poll created        │                     │                    │
   │<─────────────────────│                     │                    │
```

### Voting Flow

```
Participant           Frontend              Backend            Blockchain
   │                      │                     │                    │
   │  Select option       │                     │                    │
   │─────────────────────>│                     │                    │
   │                      │                     │                    │
   │                      │ Check vote limit    │                    │
   │                      │────────────────────>│                    │
   │                      │                     │  Query user tier   │
   │                      │<────────────────────│                    │
   │                      │                     │                    │
   │                      │ Submit vote tx      │                    │
   │                      │────────────────────────────────────────>│
   │                      │                     │                    │
   │                      │                     │    Record vote     │
   │                      │<────────────────────────────────────────│
   │                      │                     │                    │
   │                      │ Update progress     │                    │
   │                      │────────────────────>│                    │
   │                      │                     │  Update streaks,   │
   │                      │                     │  quest progress    │
   │  Vote confirmed      │<────────────────────│                    │
   │<─────────────────────│                     │                    │
```

### Reward Distribution Flow

```
Creator               Frontend              Blockchain
   │                      │                     │
   │  Trigger distribute  │                     │
   │─────────────────────>│                     │
   │                      │                     │
   │                      │ Call distribute_rewards()
   │                      │────────────────────>│
   │                      │                     │
   │                      │                     │ For each voter:
   │                      │                     │   Calculate share
   │                      │                     │   Transfer tokens
   │                      │                     │
   │                      │<────────────────────│
   │  Distribution done   │                     │
   │<─────────────────────│                     │
```

---

## Smart Contract Architecture

### Poll Contract Structure

```move
module poll::poll {
    // Resources
    struct PollStore has key {
        polls: Table<u64, Poll>,
        poll_count: u64,
        platform_fee_bps: u64,
        fee_recipient: address,
    }

    struct Poll has store {
        creator: address,
        title: String,
        options: vector<String>,
        votes: vector<u64>,
        voters: vector<address>,
        reward_pool: u64,
        coin_type: u8,         // 0=MOVE, 1=PULSE, 2=USDC
        reward_type: u8,       // 0=Fixed, 1=Split
        status: u8,            // 0=Active, 1=Closed, 2=Finalized
        end_time: u64,
    }

    // Entry Functions
    public entry fun create_poll(...);
    public entry fun vote(...);
    public entry fun close_poll(...);
    public entry fun distribute_rewards(...);
    public entry fun claim_reward(...);
}
```

### Token Flow

```
                    ┌─────────────────┐
                    │   User Wallet   │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
        ┌──────────┐  ┌──────────┐  ┌──────────┐
        │   MOVE   │  │  PULSE   │  │   USDC   │
        │ (Native) │  │  (FA)    │  │   (FA)   │
        └────┬─────┘  └────┬─────┘  └────┬─────┘
             │             │             │
             └─────────────┼─────────────┘
                           ▼
                  ┌─────────────────┐
                  │  Poll Contract  │
                  │  (Reward Pool)  │
                  └────────┬────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │   Voters        │
                  │ (Claim Rewards) │
                  └─────────────────┘
```

---

## Security Considerations

### On-Chain Security

1. **Access Control**: Only poll creators can close/distribute
2. **Reentrancy Protection**: Move's resource model prevents reentrancy
3. **Integer Overflow**: Move has built-in overflow checks
4. **Time Manipulation**: Uses on-chain timestamps with reasonable tolerance

### Off-Chain Security

1. **Input Validation**: All API inputs validated
2. **SQL Injection**: Prevented via Drizzle ORM parameterized queries
3. **Rate Limiting**: Applied to API endpoints
4. **CORS**: Configured for allowed origins only

---

## Scalability Design

### Current Architecture (Testnet)

- Single database instance
- Direct RPC calls to Movement
- In-memory caching via React Query

### Production Considerations

1. **Database**: Read replicas for scaling queries
2. **Indexer**: Movement indexer for historical data
3. **Caching**: Redis for frequently accessed data
4. **CDN**: Static asset delivery optimization

---

## Development Setup

```bash
# Clone repository
git clone https://github.com/mvpulse/mvpulse.git
cd mvpulse

# Install dependencies
cd frontend && npm install

# Configure environment
cp .env.example .env
# Edit .env with your values

# Run database migrations
npx drizzle-kit push

# Start development server
npm run dev
```

---

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string |
| `VITE_TESTNET_CONTRACT_ADDRESS` | Poll contract address |
| `VITE_TESTNET_PULSE_CONTRACT_ADDRESS` | PULSE token address |
| `VITE_TESTNET_STAKING_CONTRACT_ADDRESS` | Staking contract address |
| `VITE_PRIVY_APP_ID` | Privy application ID |
| `SHINAMI_GAS_KEY_TESTNET` | Shinami gas sponsorship key |
