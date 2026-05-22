# Backend Services — Yield Delta

This document describes the three backend services that complement the frontend. The frontend runs on Cloudflare Pages; these services are deployed separately (Railway is the current target for all three).

---

## 1. Backend Signer

**Purpose:** Holds the hot wallet private key that executes on-chain operations for the SEI vaults — rebalancing positions, collecting fees, and interacting with the AI Oracle contract — without exposing the key to the browser or Cloudflare edge runtime.

### What it needs to do

- Receive signed intent payloads from the Next.js API routes (`/api/ai/rebalance`)
- Validate the request (HMAC or JWT secret shared with the frontend)
- Build and broadcast EVM transactions to SEI Atlantic-2 (`chainId 1328`)
- Return the transaction hash to the caller

### Key contracts it interacts with

| Contract | Address |
|---|---|
| SEI Native Vault | `0xD460d6C569631A1BDc6FAF28D47BF376aFDD90D0` |
| USDC Vault | `0xD460d6C569631A1BDc6FAF28D47BF376aFDD90D0` |
| AI Oracle | `0xA3437847337d953ED6c9eB130840D04c249973e5` |
| Vault Factory | `0x1ec598666F2A7322A7C954455018e3CFB5A13A99` |

### Recommended stack

- **Language:** Node.js (TypeScript) or Python
- **Web3:** `ethers` v6 or `viem` — SEI is EVM-compatible
- **RPC:** `https://evm-rpc-testnet.sei-apis.com`

### Environment variables needed

```env
SIGNER_PRIVATE_KEY=          # Hot wallet private key
SEI_RPC_URL=https://evm-rpc-testnet.sei-apis.com
FRONTEND_HMAC_SECRET=        # Shared secret to verify requests from frontend
PORT=3002
```

### Frontend integration point

The Next.js API route `src/app/api/ai/rebalance/route.ts` calls `AI_ENGINE_URL` today. Once a signer is live, add a `SIGNER_URL` env var and POST signed rebalance payloads to it before (or instead of) the AI engine call.

---

## 2. AI Engine (ML Strategy Service)

**Purpose:** Python FastAPI service that provides ML-powered predictions for liquidity range optimisation and rebalance timing for the SEI vaults.

### Endpoints consumed by the frontend

| Method | Path | Called from |
|---|---|---|
| `POST` | `/predict/optimal-range` | `src/app/api/ai/predict/route.ts` → `src/services/mlStrategyService.ts` |
| `POST` | `/analyze/rebalance` | `src/app/api/ai/rebalance/route.ts` |
| `GET` | `/health` | `src/services/mlStrategyService.ts` health check |

### Request / response shapes

**`POST /predict/optimal-range`**
```json
{
  "vault_address": "0x...",
  "current_price": 0.45,
  "volume_24h": 1200000,
  "volatility": 0.18,
  "liquidity": 5000000,
  "timeframe": "1d",
  "chain_id": 1328
}
```
Response fields used: `lower_tick`, `upper_tick`, `lower_price`, `upper_price`, `confidence`, `expected_apr`, `risk_score`, `reasoning`

**`POST /analyze/rebalance`**
```json
{
  "vault_address": "0x...",
  "current_tick": 12500,
  "lower_tick": -887220,
  "upper_tick": 887220,
  "utilization_rate": 0.78,
  "strategy": "threshold_based",
  "market_conditions": { "tvl": 1250000, "impermanent_loss": 0.012, "last_rebalance": "..." }
}
```
Response fields used: `action`, `urgency`, `new_lower_tick`, `new_upper_tick`, `gas_cost_estimate`, `expected_improvement`, `risk_assessment`

### Environment variables needed

```env
AI_ENGINE_URL=https://your-ml-api.railway.app   # server-side only (Next.js API routes)
NEXT_PUBLIC_ML_API_URL=http://localhost:8000     # client-side (mlStrategyService.ts)
NEXT_PUBLIC_ENABLE_ML_STRATEGIES=true
NEXT_PUBLIC_ML_MOCK_MODE=false
PORT=8000
```

> **Note:** `AI_ENGINE_URL` is used in edge API routes (no `NEXT_PUBLIC_` prefix — never exposed to the browser). `NEXT_PUBLIC_ML_API_URL` is used by `mlStrategyService.ts` which runs in the browser; point it at the same service or a public proxy.

### Recommended stack

- **Framework:** FastAPI (Python 3.11+)
- **ML:** scikit-learn, lightgbm, or a transformer model of your choice
- **Deploy:** Railway — set `PORT` to match the `$PORT` env var Railway injects

### Fallback behaviour

Both API routes have full fallback logic if the AI engine is unreachable — they return lower-confidence heuristic results. The feature flag `NEXT_PUBLIC_ENABLE_ML_STRATEGIES=false` disables all outbound calls and forces mock mode globally.

---

## 3. Kairos AI Agent (ElizaOS)

**Purpose:** Conversational AI agent that users chat with in the dashboard. Built on the ElizaOS framework and hosted on Railway.

### How the frontend talks to it

`src/app/api/eliza/chat/route.ts` (edge runtime):
1. Creates a session: `POST {ELIZA_AGENT_URL}/api/messaging/sessions`
2. Sends the user message: `POST .../sessions/{sessionId}/messages`
3. Polls for the agent reply: `GET .../sessions/{sessionId}/messages` (up to 6 retries, 2–7 s each)

Agent ID hardcoded in the route: `a823d035-4008-0c15-a813-b5e540c102ef`

### Current deployment

| Variable | Value |
|---|---|
| `ELIZA_AGENT_URL` | `https://yield-delta-protocol-production.up.railway.app` |
| `KAIROS_AGENT_URL` | same |
| `NEXT_PUBLIC_ELIZAOS_WS_URL` | `wss://yield-delta-protocol-production.up.railway.app/ws` |
| `ELIZA_SERVER_AUTH_TOKEN` | set in `.env.cloudflare` |
| `ACTIVE_AGENT` | `kairos` |

### Environment variables needed (server-side)

```env
ELIZA_AGENT_URL=https://your-eliza.railway.app
KAIROS_AGENT_URL=https://your-eliza.railway.app
ELIZA_SERVER_AUTH_TOKEN=<token>
ACTIVE_AGENT=kairos
NEXT_PUBLIC_ELIZAOS_WS_URL=wss://your-eliza.railway.app/ws
```

### Fallback behaviour

If the agent is unreachable, `callElizaAgent` catches the error and `generateFallbackResponse` returns a canned educational response based on keyword matching. No UI change is visible to the user.

---

## Service dependency map

```
Browser
  │
  ├─► Next.js (Cloudflare Pages)
  │     ├─► /api/eliza/chat  ───────────────► Kairos Agent (Railway)
  │     ├─► /api/ai/predict  ───────────────► AI Engine    (Railway)
  │     └─► /api/ai/rebalance ─► AI Engine ─► Backend Signer (Railway) ─► SEI RPC
  │
  └─► SUI Testnet (direct — dapp-kit-react, no backend needed)
```

The SUI vaults interact **directly** from the browser via `@mysten/dapp-kit-react` and `@mysten/sui` — no backend signer is needed for SUI because the user's own wallet signs every transaction.

---

## Env var checklist for Cloudflare Pages

Add these in the Cloudflare Pages dashboard under **Settings → Environment variables**:

| Variable | Scope | Notes |
|---|---|---|
| `ELIZA_AGENT_URL` | Server | Railway URL for Kairos |
| `KAIROS_AGENT_URL` | Server | Same as above |
| `ELIZA_SERVER_AUTH_TOKEN` | Server | Auth token for ElizaOS |
| `AI_ENGINE_URL` | Server | Railway URL for ML service |
| `SIGNER_URL` | Server | Railway URL for backend signer (when ready) |
| `FRONTEND_HMAC_SECRET` | Server | Shared secret with signer |
| `NEXT_PUBLIC_ML_API_URL` | Client | Public ML endpoint (or proxy) |
| `NEXT_PUBLIC_ENABLE_ML_STRATEGIES` | Client | `true` in production |
| `NEXT_PUBLIC_ELIZAOS_WS_URL` | Client | WebSocket URL for live chat |
