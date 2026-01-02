# MVPulse API Reference

## Base URL

- **Development**: `http://localhost:5000/api`
- **Production**: `https://mvpulse-mono.onrender.com/api`

---

## Authentication

Most endpoints require a wallet address for user identification. No traditional authentication is needed - wallet signatures verify ownership on-chain.

---

## User & Profile

### Get User Profile

```http
GET /api/user/profile/:address
```

**Response:**
```json
{
  "profile": {
    "address": "0x...",
    "tier": "silver",
    "totalVotes": 42,
    "currentStreak": 7,
    "longestStreak": 14,
    "lastVoteDate": "2025-01-02"
  }
}
```

### Sync User Tier

Recalculate tier based on PULSE balance and staking.

```http
POST /api/user/sync-tier/:address
```

### Get User Settings

```http
GET /api/user/settings/:address
```

### Update User Settings

```http
PUT /api/user/settings/:address
```

**Body:**
```json
{
  "theme": "dark",
  "notifications": true,
  "language": "en"
}
```

---

## Voting

### Get Remaining Daily Votes

```http
GET /api/votes/remaining/:address
```

**Response:**
```json
{
  "remaining": 5,
  "limit": 6,
  "tier": "silver"
}
```

### Record Vote

```http
POST /api/votes/record/:address
```

**Body:**
```json
{
  "pollId": "123"
}
```

Updates vote count, streak tracking, and quest progress.

---

## Seasons

### List All Seasons

```http
GET /api/seasons
```

### Get Current Season

```http
GET /api/seasons/current
```

**Response:**
```json
{
  "season": {
    "id": 1,
    "name": "Season 1",
    "startDate": "2025-01-01",
    "endDate": "2025-03-31",
    "status": "active",
    "totalPrizePool": 100000
  }
}
```

### Get Season Details

```http
GET /api/seasons/:seasonId
```

### Get Season Leaderboard

```http
GET /api/seasons/:seasonId/leaderboard
```

**Response:**
```json
{
  "leaderboard": [
    { "rank": 1, "address": "0x...", "points": 1500, "tier": "platinum" },
    { "rank": 2, "address": "0x...", "points": 1200, "tier": "gold" }
  ]
}
```

### Get User Season Stats

```http
GET /api/seasons/:seasonId/user/:address
```

### Create Season (Admin)

```http
POST /api/seasons
```

**Body:**
```json
{
  "name": "Season 2",
  "startDate": "2025-04-01",
  "endDate": "2025-06-30",
  "prizePool": 150000
}
```

### Update Season Status

```http
PATCH /api/seasons/:seasonId/status
```

**Body:**
```json
{
  "status": "active" | "ended" | "pending"
}
```

### Start Season

```http
POST /api/seasons/:seasonId/start
```

### End Season

```http
POST /api/seasons/:seasonId/end
```

### Distribute Season Rewards

```http
POST /api/seasons/:seasonId/distribute
```

### Get Season Snapshots

```http
GET /api/seasons/:seasonId/snapshots
```

### Copy Quests to New Season

```http
POST /api/seasons/:seasonId/copy-quests
```

---

## Quests

### Get Active Quests

```http
GET /api/quests/active/:seasonId
```

### Get Creator's Quests

```http
GET /api/quests/creator/:address
```

### Get Quest Progress

```http
GET /api/quests/progress/:address/:seasonId
```

**Response:**
```json
{
  "progress": [
    {
      "questId": 1,
      "name": "Daily Voter",
      "type": "daily",
      "progress": 2,
      "target": 3,
      "completed": false,
      "claimed": false
    }
  ]
}
```

### Claim Quest Reward

```http
POST /api/quests/claim/:address/:questId
```

### Create Quest

```http
POST /api/quests
```

**Body:**
```json
{
  "name": "Vote Master",
  "description": "Vote on 10 polls",
  "type": "weekly",
  "action": "vote",
  "target": 10,
  "points": 100,
  "seasonId": 1
}
```

---

## Referrals

### Get Referral Code

```http
GET /api/referral/code/:address
```

**Response:**
```json
{
  "code": "abc123",
  "link": "https://mvpulse.xyz?ref=abc123"
}
```

### Validate Referral Code

```http
GET /api/referral/validate/:code
```

### Track Referral

```http
POST /api/referral/track
```

**Body:**
```json
{
  "referrerCode": "abc123",
  "refereeAddress": "0x..."
}
```

### Get Referral Stats

```http
GET /api/referral/stats/:address
```

**Response:**
```json
{
  "totalReferrals": 15,
  "activeReferrals": 10,
  "pendingReferrals": 5,
  "totalPoints": 750,
  "tier": "gold"
}
```

### Get Referees List

```http
GET /api/referral/referees/:address
```

### Get Referral Leaderboard

```http
GET /api/referral/leaderboard
```

---

## Questionnaires

### List Questionnaires

```http
GET /api/questionnaires
```

### Get Active Questionnaires

```http
GET /api/questionnaires/active
```

### Get Questionnaire Details

```http
GET /api/questionnaires/:id
```

**Response:**
```json
{
  "questionnaire": {
    "id": 1,
    "title": "DeFi Survey",
    "description": "Share your thoughts on DeFi",
    "category": "defi",
    "rewardType": "shared_pool",
    "rewardPool": 10000,
    "coinType": "PULSE",
    "status": "active",
    "pollCount": 5,
    "completions": 42
  }
}
```

### Get Questionnaire Polls

```http
GET /api/questionnaires/:id/polls
```

### Get Creator's Questionnaires

```http
GET /api/questionnaires/creator/:address
```

### Create Questionnaire

```http
POST /api/questionnaires
```

**Body:**
```json
{
  "title": "NFT Market Survey",
  "description": "Help us understand the NFT market",
  "category": "nft",
  "rewardType": "shared_pool",
  "rewardPool": 5000,
  "coinType": "PULSE",
  "creatorAddress": "0x..."
}
```

### Update Questionnaire

```http
PUT /api/questionnaires/:id
```

### Delete Questionnaire

```http
DELETE /api/questionnaires/:id
```

### Add Poll to Questionnaire

```http
POST /api/questionnaires/:id/polls
```

**Body:**
```json
{
  "pollId": 123,
  "sortOrder": 0
}
```

### Remove Poll from Questionnaire

```http
DELETE /api/questionnaires/:id/polls/:pollId
```

### Reorder Polls

```http
PUT /api/questionnaires/:id/polls/order
```

**Body:**
```json
{
  "pollIds": [5, 3, 1, 4, 2]
}
```

### Get User Progress

```http
GET /api/questionnaires/:id/progress/:address
```

### Start Questionnaire

```http
POST /api/questionnaires/:id/start/:address
```

### Update Progress

```http
PUT /api/questionnaires/:id/progress/:address
```

### Record Bulk Vote

```http
POST /api/questionnaires/:id/bulk-vote
```

**Body:**
```json
{
  "address": "0x...",
  "votes": [
    { "pollId": 1, "optionIndex": 0 },
    { "pollId": 2, "optionIndex": 2 }
  ]
}
```

---

## Projects

### List Projects

```http
GET /api/projects
```

### Get Project Details

```http
GET /api/projects/:id
```

### Create Project

```http
POST /api/projects
```

**Body:**
```json
{
  "name": "DeFi Research",
  "description": "Research project on DeFi trends",
  "color": "#3B82F6",
  "icon": "chart",
  "ownerAddress": "0x..."
}
```

### Update Project

```http
PUT /api/projects/:id
```

### Delete Project

```http
DELETE /api/projects/:id
```

### Add Poll to Project

```http
POST /api/projects/:id/polls
```

### Remove Poll from Project

```http
DELETE /api/projects/:id/polls/:pollId
```

### Add Questionnaire to Project

```http
POST /api/projects/:id/questionnaires
```

### Remove Questionnaire from Project

```http
DELETE /api/projects/:id/questionnaires/:questionnaireId
```

---

## Project Collaboration

### Get Collaborators

```http
GET /api/projects/:id/collaborators
```

### Invite Collaborator

```http
POST /api/projects/:id/collaborators
```

**Body:**
```json
{
  "address": "0x...",
  "role": "editor"
}
```

Roles: `owner`, `admin`, `editor`, `viewer`

### Accept Invitation

```http
POST /api/projects/:id/collaborators/accept
```

### Update Collaborator Role

```http
PUT /api/projects/:id/collaborators/:collabAddress
```

### Remove Collaborator

```http
DELETE /api/projects/:id/collaborators/:collabAddress
```

### Get Pending Invites

```http
GET /api/projects/pending-invites/:address
```

---

## Project Analytics

### Get Project Analytics

```http
GET /api/projects/:id/analytics
```

**Response:**
```json
{
  "analytics": {
    "totalPolls": 10,
    "totalQuestionnaires": 2,
    "totalVotes": 500,
    "totalCompletions": 45,
    "engagementRate": 0.75
  }
}
```

### Get Project Insights

```http
GET /api/projects/:id/insights
```

### Generate AI Insights

```http
POST /api/projects/:id/insights/generate
```

---

## Gas Sponsorship

### Get Sponsorship Status

```http
GET /api/sponsorship-status
```

**Response:**
```json
{
  "enabled": true,
  "remainingQuota": 95
}
```

### Sponsor Transaction

```http
POST /api/sponsor-transaction
```

**Body:**
```json
{
  "transactionBytes": "0x...",
  "userAddress": "0x..."
}
```

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "error": "Error message description"
}
```

### Common HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 404 | Not Found |
| 500 | Server Error |
