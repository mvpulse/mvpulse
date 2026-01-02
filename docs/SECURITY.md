# MVPulse Security Documentation

## Overview

This document outlines security considerations, known risks, and mitigations for the MVPulse platform.

---

## Smart Contract Security

### Move Language Benefits

Move provides several built-in security features:

1. **Resource-Oriented Programming**: Assets cannot be duplicated or destroyed accidentally
2. **Formal Verification**: Move Prover can verify contract correctness
3. **No Reentrancy**: Move's execution model prevents reentrancy attacks
4. **Overflow Protection**: Built-in integer overflow checks

### Access Control

| Function | Access Level | Protection |
|----------|--------------|------------|
| `create_poll_*` | Any user | None required |
| `vote` | Any user | One vote per address |
| `start_claims` | Poll creator only | `E_NOT_OWNER` check |
| `distribute_rewards_*` | Poll creator only | Creator verification |
| `set_platform_fee` | Admin only | `E_NOT_ADMIN` check |
| `initialize` | Deployer only | Once per contract |

### Poll Contract Security

```move
// Access control pattern used throughout
assert!(poll.creator == caller, E_NOT_OWNER);
assert!(caller == registry.admin, E_NOT_ADMIN);
```

**Protections:**
- Only poll creator can close/distribute
- Only admin can modify platform fees
- Vote uniqueness enforced per address
- Reward claims tracked to prevent double-claiming

### Staking Contract Security

**Lock Period Enforcement:**
```move
assert!(current_time >= position.unlock_at, E_POSITION_STILL_LOCKED);
```

**Protections:**
- Cannot unstake before lock period expires
- Uses on-chain timestamps (not user input)
- Valid lock periods are whitelisted

### Swap Contract Security

**AMM Invariant:**
```move
assert!(
    new_pulse_reserve * new_stable_reserve >=
    pulse_reserve * stable_reserve,
    E_K_INVARIANT_VIOLATED
);
```

**Protections:**
- Constant product (x*y=k) validation
- Slippage protection via `min_*_out` parameters
- Minimum liquidity locked forever

---

## Known Risks & Mitigations

### 1. Sybil Attacks

**Risk:** Users creating multiple wallets to farm rewards

**Mitigations:**
- Tier system requires PULSE holdings/staking
- Daily vote limits per wallet
- Future: On-chain identity integration (Galxe, Gitcoin Passport)

### 2. Front-Running

**Risk:** MEV bots front-running transactions

**Mitigations:**
- Movement Network's transaction ordering
- Slippage protection on swaps
- Most poll operations are not price-sensitive

### 3. Oracle Manipulation

**Risk:** Price manipulation in swap AMM

**Mitigations:**
- AMM uses on-chain reserves only
- No external price oracles
- Price impact calculation for UI warnings

### 4. Admin Key Compromise

**Risk:** Malicious admin actions

**Current State:**
- Single admin key controls fees and treasury

**Future Mitigations:**
- Multi-sig admin controls
- Timelock on sensitive operations
- DAO governance transition

### 5. Smart Contract Bugs

**Risk:** Undiscovered vulnerabilities

**Mitigations:**
- Move language safety features
- Thorough testing
- Planned: Professional security audit

---

## Off-Chain Security

### API Security

| Protection | Implementation |
|------------|----------------|
| Input Validation | All API inputs validated |
| SQL Injection | Drizzle ORM parameterized queries |
| CORS | Configured for allowed origins |
| Rate Limiting | Applied to sensitive endpoints |

### Database Security

- PostgreSQL with SSL/TLS
- Connection pooling via Neon
- No raw SQL queries (ORM only)
- Environment-based configuration

### Secret Management

| Secret | Storage |
|--------|---------|
| Database URL | Environment variable |
| Privy App ID | Environment variable |
| Shinami API Key | Environment variable |
| Admin Keys | Secure wallet |

**Recommendations:**
- Never commit secrets to git
- Use secret managers in production
- Rotate keys periodically

---

## Gas Sponsorship Security

### Shinami Integration

**Risks:**
- Abuse of sponsored transactions
- Quota exhaustion attacks

**Mitigations:**
- Sponsorship only for Privy wallets
- Daily quota limits
- Transaction type restrictions
- Logging for audit

```typescript
// Sponsorship validation
if (!isPrivyWallet(address)) {
  return { sponsored: false };
}
```

---

## Vulnerability Disclosure

### Reporting Security Issues

If you discover a security vulnerability:

1. **DO NOT** create a public GitHub issue
2. Email: security@mvpulse.xyz (placeholder)
3. Include detailed description and reproduction steps
4. We aim to respond within 48 hours

### Bug Bounty (Future)

We plan to implement a bug bounty program post-mainnet launch.

---

## Audit Status

| Component | Audit Status | Date |
|-----------|--------------|------|
| Poll Contract | Not Audited | - |
| PULSE Contract | Not Audited | - |
| Staking Contract | Not Audited | - |
| Swap Contract | Not Audited | - |

**Note:** Professional security audits are planned before mainnet deployment.

---

## Security Checklist for Mainnet

- [ ] Complete security audit
- [ ] Implement multi-sig for admin
- [ ] Add timelock to fee changes
- [ ] Rate limiting on all endpoints
- [ ] DDoS protection (Cloudflare)
- [ ] Monitoring and alerting
- [ ] Incident response plan
- [ ] Insurance consideration

---

## Best Practices for Users

### Wallet Security
- Use hardware wallets for large holdings
- Never share private keys
- Verify transaction details before signing

### Interaction Safety
- Only interact with verified contract addresses
- Be cautious of phishing sites
- Check URL matches official domain

### Token Approvals
- Review approvals before confirming
- Revoke unused approvals periodically

---

## Contract Addresses (Verify Before Use)

**Testnet:**
```
Poll:    0x4a3593c9631d8686a00b72eaf4da8341947386c6ced38513fb5a88a63aa10cde
PULSE:   0x69c7c6752b3426e00fec646270e5b7e9f0efa18bddbd7f112a8e84f7fbe3f737
Staking: 0xa317fa282be3423cd8378b818f04ba9492981d955206ed2a46eff281be8aa55f
Swap:    0x55872704413ffc43bb832df7eb14c0665c9ae401897077a262d56e2de37d2b7e
```

Always verify addresses match official sources before interacting.

---

*Last Updated: January 2, 2025*
