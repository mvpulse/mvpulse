# MVPulse Deployment Guide

## Prerequisites

- Node.js 18+
- Movement CLI
- PostgreSQL database (or Neon account)
- Privy account (for embedded wallets)
- Shinami account (for gas sponsorship)

---

## 1. Smart Contract Deployment

### Install Movement CLI

```bash
curl -fsSL "https://aptos.dev/scripts/install_cli.py" | python3
```

### Initialize Movement Profile

```bash
movement init --network testnet
```

### Deploy PULSE Token

```bash
cd contracts/pulse

# Compile
movement move compile

# Deploy
movement move publish --named-addresses pulse=default
```

Save the deployed address in `.env`:
```
VITE_TESTNET_PULSE_CONTRACT_ADDRESS=0x...
```

### Get PULSE Metadata Address

```bash
movement move run --function-id default::pulse::get_metadata_address
```

Save as `VITE_TESTNET_PULSE_METADATA_ADDRESS`.

### Deploy Poll Contract

```bash
cd contracts/poll

# Update Move.toml with PULSE address
# [addresses]
# poll = "_"
# pulse = "0x..." (PULSE contract address)

movement move compile
movement move publish --named-addresses poll=default
```

### Initialize Poll Contract

```bash
# Initialize registry
movement move run --function-id default::poll::initialize

# Initialize FA store for PULSE
movement move run --function-id default::poll::initialize_fa_store \
  --args address:POLL_CONTRACT address:PULSE_METADATA

# Initialize FA store for USDC (if using USDC)
movement move run --function-id default::poll::initialize_fa_store \
  --args address:POLL_CONTRACT address:USDC_METADATA
```

### Deploy Staking Contract

```bash
cd contracts/staking

# Update Move.toml
movement move compile
movement move publish --named-addresses staking=default

# Initialize
movement move run --function-id default::staking::initialize
```

### Deploy Swap Contract

```bash
cd contracts/swap

# Update Move.toml
movement move compile
movement move publish --named-addresses swap=default

# Initialize with USDC metadata address
movement move run --function-id default::swap::initialize \
  --args address:USDC_METADATA u64:30
```

---

## 2. Database Setup

### Option A: Neon PostgreSQL (Recommended)

1. Create account at [neon.tech](https://neon.tech)
2. Create new project
3. Copy connection string

### Option B: Local PostgreSQL

```bash
createdb mvpulse
```

### Configure Environment

```bash
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
```

### Run Migrations

```bash
cd frontend
npx drizzle-kit push
```

---

## 3. Frontend Deployment

### Environment Variables

Create `.env` in `frontend/`:

```env
# Database
DATABASE_URL=postgresql://...

# Contract Addresses (Testnet)
VITE_TESTNET_CONTRACT_ADDRESS=0x...          # Poll contract
VITE_TESTNET_PULSE_CONTRACT_ADDRESS=0x...    # PULSE token
VITE_TESTNET_PULSE_METADATA_ADDRESS=0x...    # PULSE FA metadata
VITE_TESTNET_STAKING_CONTRACT_ADDRESS=0x...  # Staking contract
VITE_TESTNET_SWAP_CONTRACT_ADDRESS=0x...     # Swap contract
VITE_TESTNET_USDC_CONTRACT_ADDRESS=0x...     # USDC contract

# Network
VITE_TESTNET_RPC_URL=/api/movement-testnet/v1
VITE_TESTNET_CHAIN_ID=250

# Privy (get from privy.io)
VITE_PRIVY_APP_ID=your_app_id

# Shinami (get from shinami.com)
SHINAMI_GAS_KEY_TESTNET=us1_movement_testnet_xxx

# Gas Sponsorship
VITE_GAS_SPONSORSHIP_ENABLED=true

# Admin Addresses
VITE_ADMIN_ADDRESSES=0x...,0x...
```

### Local Development

```bash
cd frontend
npm install
npm run dev
```

### Build for Production

```bash
npm run build
```

### Deploy to Vercel

1. Push to GitHub
2. Import project in Vercel
3. Configure environment variables
4. Deploy

```bash
vercel --prod
```

### Deploy to Other Platforms

#### Netlify
```bash
npm run build
netlify deploy --prod --dir=dist/public
```

#### Render
1. Create Web Service
2. Build command: `npm run build`
3. Start command: `npm run start`
4. Add environment variables

---

## 4. Post-Deployment

### Verify Contracts

Check contract functions work:

```bash
# Check poll count
movement move view --function-id POLL_CONTRACT::poll::get_poll_count \
  --args address:POLL_CONTRACT

# Check PULSE supply
movement move view --function-id PULSE_CONTRACT::pulse::total_minted
```

### Initialize Token Faucet

For testnet, keep minting enabled for faucet functionality.

For mainnet:
```bash
# Mint all to treasury (one-time, irreversible)
movement move run --function-id PULSE_CONTRACT::pulse::mint_all_to_treasury \
  --args address:TREASURY_ADDRESS
```

### Configure Shinami

1. Get API key from Shinami dashboard
2. Add to environment variables
3. Verify sponsorship is working

---

## 5. Mainnet Deployment Checklist

- [ ] Audit smart contracts
- [ ] Deploy contracts to mainnet
- [ ] Update all contract addresses in `.env`
- [ ] Change RPC URL to mainnet
- [ ] Configure mainnet Shinami key
- [ ] Mint PULSE to treasury
- [ ] Initialize all FA stores
- [ ] Test all critical flows
- [ ] Set up monitoring/alerting
- [ ] Configure production database backups

---

## Troubleshooting

### Contract Deployment Fails

```bash
# Check account balance
movement account list

# Fund account
movement account fund-with-faucet --account default
```

### Database Connection Issues

```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

### Vite Proxy Not Working

Check `vite.config.ts` proxy settings match your RPC URLs.

### Gas Sponsorship Not Working

1. Verify Shinami API key is valid
2. Check sponsorship logs: `GET /api/sponsorship-status`
3. Ensure user is using Privy wallet

---

## Monitoring

### Contract Events

Monitor on-chain events using Movement explorer or custom indexer.

### API Health

```bash
curl https://your-domain.com/api/sponsorship-status
```

### Database

Use Neon dashboard for connection pool monitoring and query performance.
