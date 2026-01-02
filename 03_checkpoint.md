# MVPulse - Checkpoint 3 Submission

## Project Overview

**MVPulse** is a decentralized polling and rewards platform built on Movement Network. Since Checkpoint 2, we've significantly expanded the platform with questionnaires, staking, project organization, referral systems, and USDC support.

**Repository:** [github.com/mvpulse/mvpulse-mono](https://github.com/mvpulse/mvpulse-mono)

---

## What's New Since Checkpoint 2

### 1. Questionnaires System

A comprehensive survey system that bundles multiple polls together with shared reward pools.

#### Features
- **Multi-poll surveys**: Create questionnaires containing multiple polls as a cohesive survey
- **Shared reward pools**: Auto-calculates per-completion rewards based on total completers
- **Bulk voting**: Record all poll votes in a single on-chain transaction
- **Progress tracking**: Track participant completion through questionnaires
- **Dual reward types**: Fixed per-completion or shared pool rewards
- **Token flexibility**: Support for both PULSE and USDC rewards

#### Key Files
- `frontend/client/src/pages/questionnaire/CreateQuestionnaire.tsx`
- `frontend/client/src/pages/questionnaire/QuestionnaireDetail.tsx`
- `frontend/client/src/components/questionnaire/SharedPoolRewardCard.tsx`

### 2. PULSE Staking Module

New smart contract enabling users to stake PULSE tokens for tier qualification.

#### Features
- **Flexible lock periods**: 7, 14, 21, 30, 90, 180, or 365 days
- **Multiple positions**: Users can have multiple stakes with different durations
- **Tier boost**: Staked PULSE counts toward tier qualification
- **Global pool tracking**: Track total staked amounts and staker counts

#### Contract Functions
```move
stake(signer, amount, lock_period_days)
unstake(signer, stake_index)
unstake_all(signer)
get_user_total_staked(user_addr): u64
get_user_unlockable_amount(user_addr): u64
```

#### Deployed Address (Testnet)
`0xa317fa282be3423cd8378b818f04ba9492981d955206ed2a46eff281be8aa55f`

#### Key Files
- `contracts/staking/sources/staking.move`
- `frontend/client/src/pages/Staking.tsx`

### 3. Project Organization

Organize polls and questionnaires into projects with team collaboration and analytics.

#### Features
- **Project containers**: Group related polls and questionnaires
- **Role-based access**: Owner, Admin, Editor, Viewer permissions
- **Collaboration system**: Invite team members with pending invite acceptance
- **Analytics dashboard**: Track votes, completions, and engagement
- **AI-powered insights**: Generate recommendations based on performance

#### Key Files
- `frontend/client/src/pages/project/ProjectDetail.tsx`
- `frontend/client/src/pages/project/ManageProjectContent.tsx`
- `frontend/client/src/hooks/useProjects.ts`

### 4. Referral System

Complete affiliate/referral program for user acquisition.

#### Features
- **Unique referral codes**: Auto-generated from wallet addresses
- **Milestone tracking**: First Vote, 10 Votes, 50 Votes, 100 Votes
- **Tiered rewards**: Point multipliers based on referral count
- **Leaderboard**: Rank top referrers
- **URL sharing**: `?ref=CODE` parameter support

#### Key Files
- `frontend/client/src/pages/participant/Referrals.tsx`
- `frontend/client/src/hooks/useReferral.ts`
- `frontend/client/src/hooks/useReferralTracking.ts`

### 5. USDC Token Support

Extended poll system to support USDC rewards alongside MOVE and PULSE.

#### Supported Coin Types
| Type | ID | Decimals | Standard |
|------|-----|----------|----------|
| MOVE | 0 | 8 | Legacy Coin |
| PULSE | 1 | 8 | Fungible Asset |
| USDC | 2 | 6 | Fungible Asset |

#### Key Files
- `frontend/client/src/lib/tokens.ts`
- `contracts/poll/sources/poll.move`

### 6. BizPulse - Business Analytics Frontend

A separate analytics application for business intelligence.

#### Features
- Project performance dashboards
- User engagement analytics
- AI-generated insights
- Leaderboard rankings
- Premium tier system

#### Location
`bizpulse/` - Standalone React + Express application

### 7. Season Manager

Enhanced season management for administrators.

#### Features
- Create and manage competition seasons
- Define point structures and rewards
- Monitor season progress
- End-of-season reward distribution

---

## New Database Schema

### Questionnaires
| Table | Purpose |
|-------|---------|
| `questionnaires` | Questionnaire metadata, reward config |
| `questionnairePolls` | Poll-questionnaire associations with sort order |
| `questionnaireProgress` | User completion tracking |

### Projects
| Table | Purpose |
|-------|---------|
| `projects` | Project metadata, cached analytics |
| `projectCollaborators` | Team members with roles |
| `projectPolls` | Poll-project associations |
| `projectQuestionnaires` | Questionnaire-project associations |
| `projectInsights` | AI-generated insights |

### Referrals
| Table | Purpose |
|-------|---------|
| `referralCodes` | Short code to wallet mappings |
| `referrals` | Referrer-referee relationships |
| `referralMilestones` | Milestone achievement tracking |
| `referralStats` | Cached stats for leaderboard |

---

## New API Endpoints

### Questionnaires
- `GET /api/questionnaires` - List questionnaires
- `GET /api/questionnaires/:id` - Get questionnaire with polls
- `POST /api/questionnaires` - Create questionnaire
- `POST /api/questionnaires/:id/bulk-vote` - Record all votes in one transaction
- `GET /api/questionnaires/:id/progress/:address` - Get completion progress

### Projects
- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- `POST /api/projects/:id/collaborators` - Invite collaborator
- `GET /api/projects/:id/analytics` - Get project analytics
- `POST /api/projects/:id/insights/generate` - Generate AI insights

### Referrals
- `GET /api/referral/code/:address` - Get/generate referral code
- `GET /api/referral/stats/:address` - Get referral statistics
- `GET /api/referral/leaderboard` - Get top referrers
- `POST /api/referral/track` - Track referral usage

---

## Deployed Contract Addresses (Testnet)

| Contract | Address |
|----------|---------|
| PULSE Token | `0x69c7c6752b3426e00fec646270e5b7e9f0efa18bddbd7f112a8e84f7fbe3f737` |
| Poll System | `0x4a3593c9631d8686a00b72eaf4da8341947386c6ced38513fb5a88a63aa10cde` |
| Swap AMM | `0x55872704413ffc43bb832df7eb14c0665c9ae401897077a262d56e2de37d2b7e` |
| Staking | `0xa317fa282be3423cd8378b818f04ba9492981d955206ed2a46eff281be8aa55f` |
| USDC (Official) | `0xb89077cfd2a82a0c1450534d49cfd5f2707643155273069bc23a912bcfefdee7` |

---

## Development Timeline (Checkpoint 2 to 3)

| Date | Milestone |
|------|-----------|
| Dec 13 | Checkpoint 2 submitted, Shinami gas integration complete |
| Dec 14-15 | Staking module development and testing |
| Dec 16-17 | USDC support added to poll contract |
| Dec 18-19 | Referral system implementation |
| Dec 20-21 | Poll workflow updates, finalized status |
| Dec 22-24 | Questionnaires feature development |
| Dec 25 | BizPulse analytics frontend |
| Dec 26 | Season manager, project organization |
| Dec 27-Jan 2 | Bug fixes, project collaboration features |

---

## Git Commit History (Since Checkpoint 2)

```
a16b6e3 - Merge: project-organization
eeac20c - bug fix for poll organization to project
9391aad - manage project under creator
8850728 - Merge: add-season-manager
0bc8dc0 - add season manager
486ebe1 - Merge: add-questionnaires
1dbd1ac - add edit questionnaire page
a021c3f - add bulk poll creation for questionnaire
247e10b - implement questionnaire shared pool
14cc8ca - initial version for questionnaires
fcdf580 - Merge: add-usdc-token
a27c02c - add support for usdc to fund polls
9628e69 - Merge: bugfixes
0bc8dc0 - display view results from participant dashboard
3e1bba0 - Merge: referral-system
bd52818 - referral initial commit
d1786ca - Merge: updated-poll-workflow
35991da - updated poll status workflow
c4dccba - add performance optimization with indexer
90332ce - add finalized poll status
64b891e - Merge: staking-module
8a65125 - use direct balance and stake to determine tier
9270998 - initial commit for staking module
f93d13d - Merge: bizpulse
f0f99f0 - add new bizpulse frontend
```

---

## Technical Highlights

### Questionnaire Bulk Voting
- Single transaction for all polls in a questionnaire
- Reduces gas costs and improves UX
- Progress tracking with completion percentage

### Staking Contract Design
- ExtendRef pattern for secure resource management
- Flexible unlock periods with timestamp validation
- Event emission for off-chain indexing

### Project Collaboration
- Role-based permission system (OWNER > ADMIN > EDITOR > VIEWER)
- Invitation workflow with pending state
- Cached analytics for fast dashboard loading

### Referral Milestone System
- Progressive milestone tracking (1 → 10 → 50 → 100 votes)
- Point multipliers based on referrer tier
- Real-time leaderboard updates

---

## Key Features Summary

1. **Questionnaires** - Bundle polls into surveys with shared reward pools
2. **PULSE Staking** - Lock tokens for tier boosts with flexible periods
3. **Project Organization** - Group content with team collaboration
4. **Referral Program** - Earn rewards by inviting users
5. **USDC Support** - Fund polls with stablecoin rewards
6. **BizPulse Analytics** - Dedicated business intelligence dashboard
7. **Season Manager** - Enhanced seasonal competition management

---

## Next Steps

- Mainnet deployment of staking contract
- Advanced referral reward distribution
- Enhanced AI insights with GPT-4 integration
- Mobile-responsive questionnaire experience
- Project templates and duplication
- On-chain season rewards distribution

---

*Built for the Encode x Movement Hackathon*
*Last Updated: January 2, 2025*
