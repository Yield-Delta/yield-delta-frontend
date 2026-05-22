# AI Engine Architecture — Vault Execution & DEX/Perp Integrations

This document describes how the Python AI engine should be built to drive real vault execution on SEI, covering the rebalancing decision loop, DEX integrations, and perpetual exchange hedging.

---

## Overview

```
Frontend (Cloudflare Pages)
  └─► /api/ai/rebalance  ─► AI Engine (Railway, Python FastAPI)
        /api/ai/predict         │
        /api/trading/*          │  1. fetch live market data
                                │  2. run ML model → optimal range
                                │  3. if action needed → POST /execute
                                ▼
                         Backend Signer (Railway, Node/Python)
                                │
                   ┌────────────┼────────────┐
                   ▼            ▼            ▼
             DragonSwap      Levana       Jellyverse
             (EVM, LP mgmt)  (CosmWasm,   (EVM,
                              perp hedge)  perp hedge)
```

---

## 1. AI Engine Service (FastAPI)

### Project structure

```
ai-engine/
├── main.py                  # FastAPI app, routes
├── models/
│   ├── range_predictor.py   # tick range ML model
│   ├── rebalance_detector.py
│   └── funding_arb.py       # funding rate arb detector
├── integrations/
│   ├── dragonswap.py        # DEX price feeds + LP state
│   ├── levana.py            # Levana perp quotes + positions
│   ├── jellyverse.py        # Jellyverse perp integration
│   └── sei_rpc.py           # EVM + CosmWasm RPC helpers
├── executor/
│   └── signer_client.py     # HTTP client → backend signer
└── scheduler.py             # APScheduler rebalance loop
```

### Core endpoints (what the frontend calls today)

| Route | What the AI engine must do |
|---|---|
| `POST /predict/optimal-range` | Run range predictor model, return `lower_tick / upper_tick / confidence` |
| `POST /analyze/rebalance` | Compare current range vs optimal, return `action / urgency / new_lower_tick / new_upper_tick` |
| `GET /health` | Return `{"status": "healthy", "version": "..."}` |

### New endpoint needed for vault execution

```
POST /execute/rebalance
Body: { vault_address, new_lower_tick, new_upper_tick, strategy, hedge_ratio }
```

This is the only endpoint that triggers real on-chain transactions via the backend signer. The frontend routes do **not** call this directly — the AI engine calls it internally after deciding an action is warranted.

---

## 2. DragonSwap Integration (EVM — Uniswap V3 fork)

DragonSwap is a Uniswap V3 fork on SEI EVM (`chainId 1328`). Vault LP positions live here.

### Key contract addresses (SEI Atlantic-2 testnet)

```python
DRAGONSWAP_ADDRESSES = {
    "factory":       "0xBeA4fDf1A3AA8Cae4f4E68Eb9B5BaCf40f7e5D68",
    "router":        "0xB1Fd44B2D09C9F3Df1a1EeF69e6fC9B67AAf41D",
    "position_mgr":  "0xA1BBF613F6E47eACb0219EC1d5543a51F9A5d6F3",
    "quoter_v2":     "0xD458E81FE8A4b0Cb18f39c11cEcc13BD4e59c2a2",
}
```

> **Verify these on seitrace.com** — testnet addresses rotate between deployments.

### What the AI engine needs to do

```python
# integrations/dragonswap.py

from web3 import Web3
from uniswap_sdk_py import ...  # or raw ABI calls

class DragonSwapClient:
    def __init__(self, rpc_url, private_key):
        self.w3 = Web3(Web3.HTTPProvider(rpc_url))
        # Load NonfungiblePositionManager, SwapRouter ABIs (same as Uniswap V3)

    def get_pool_state(self, token0, token1, fee_tier) -> PoolState:
        """Current tick, sqrtPriceX96, liquidity — used as ML model input."""

    def get_position(self, token_id) -> Position:
        """Current LP position range, liquidity, uncollected fees."""

    def quote_rebalance(self, vault, new_lower, new_upper) -> RebalanceQuote:
        """
        Simulate:
          1. Remove all liquidity from current range
          2. Swap excess token to re-balance for new range ratio
          3. Add liquidity to new range
        Returns estimated gas cost + expected output amounts.
        """

    def build_rebalance_tx(self, vault, new_lower, new_upper, slippage=0.005):
        """Build the calldata for the signer to submit."""
        # Sequence:
        # 1. decreaseLiquidity(tokenId, liquidity=100%, deadline)
        # 2. collect(tokenId, recipient=vault, max_amount0, max_amount1)
        # 3. if amounts are imbalanced: exactInputSingle on SwapRouter
        # 4. mint(new params) or increaseLiquidity on existing position
```

### Fee tiers on SEI

DragonSwap uses the same fee tiers as Uniswap V3: `100`, `500`, `3000`, `10000` bps. Use `3000` (0.3%) for most SEI pairs.

---

## 3. Levana Perpetuals Integration (CosmWasm)

Levana is CosmWasm-based. The AI engine uses it to open/close short positions for delta-neutral vault strategies.

### Python SDK

```bash
pip install cosmpy sei-sdk
```

### Key contract addresses (SEI Atlantic-2)

```python
LEVANA_ADDRESSES = {
    "factory":  "sei1...",   # look up on sei-scan.com/contracts
    "market_sei_usdc": "sei1...",
    "market_eth_usdc": "sei1...",
}
```

### Integration pattern

```python
# integrations/levana.py

from cosmpy.aerial.client import LedgerClient
from cosmpy.aerial.wallet import LocalWallet

class LevanaClient:
    def __init__(self, rpc_url, wallet_mnemonic):
        self.client = LedgerClient(rpc_url)   # SEI CosmWasm RPC
        self.wallet = LocalWallet.from_mnemonic(wallet_mnemonic)

    def get_funding_rate(self, market: str) -> float:
        """Query current funding rate — used in arbitrage detection."""
        result = self.client.query_contract_smart(
            LEVANA_ADDRESSES[market],
            {"spot_price": {}}
        )
        return result["funding_rate"]

    def open_short(self, market, notional_usd, leverage) -> str:
        """Open short to hedge LP delta. Returns position ID."""
        msg = {
            "open_position": {
                "direction": "short",
                "leverage": str(leverage),
                "collateral": str(notional_usd / leverage),
            }
        }
        tx = self.client.execute_contract(
            LEVANA_ADDRESSES[market], msg, self.wallet
        )
        return tx.hash

    def close_position(self, market, position_id) -> str:
        msg = {"close_position": {"id": position_id}}
        tx = self.client.execute_contract(
            LEVANA_ADDRESSES[market], msg, self.wallet
        )
        return tx.hash

    def get_position_delta(self, market, position_id) -> float:
        """Current delta exposure of an open position."""
```

### When the AI engine opens a Levana short

- Strategy: `delta_neutral`
- After adding LP liquidity to DragonSwap, the vault has long delta on token0
- AI engine calls `levana.open_short(notional ≈ 50% of LP value, leverage=1)` to zero net delta
- Funding rate is collected as additional yield when positive

---

## 4. Jellyverse Perpetuals Integration (EVM)

Jellyverse is EVM-based on SEI. Used as an alternative to Levana for EVM-native vault strategies where CosmWasm adds latency.

### Key contracts

```python
JELLYVERSE_ADDRESSES = {
    "vault":          "0x...",  # JLP vault
    "order_book":     "0x...",  # EVM perp order book
    "position_router":"0x...",
}
```

### Integration pattern

```python
# integrations/jellyverse.py

from web3 import Web3
# ABI mirrors GMX/Gains Network patterns

class JellyverseClient:
    def __init__(self, rpc_url, private_key):
        self.w3 = Web3(Web3.HTTPProvider(rpc_url))

    def get_funding_rate(self, asset: str) -> float:
        """Query current 8-hour funding rate for arbitrage detection."""

    def open_position(self, asset, is_long, size_usd, collateral_usd, leverage) -> str:
        """Submit market order. Returns tx hash."""

    def close_position(self, position_key) -> str:
        """Close by position key."""

    def get_position(self, account, asset, is_long) -> dict:
        """
        Returns: {size, collateral, entry_price, unrealized_pnl, funding_paid}
        """
```

### Choosing Levana vs Jellyverse

| Condition | Use |
|---|---|
| Strategy is `delta_neutral`, vault token is SEI or ATOM | Levana (deeper liquidity on those pairs) |
| Strategy is `hedge_ratio`, vault is EVM-heavy, gas cost matters | Jellyverse (single EVM tx, no IBC) |
| Funding rate arb between the two | Open long on one, short on other |

---

## 5. Rebalancing Execution Loop

### Trigger conditions (what `analyze/rebalance` checks)

```python
def should_rebalance(vault_state, pool_state, config) -> RebalanceDecision:
    current_tick = pool_state.current_tick

    # 1. Price out of range
    out_of_range = (
        current_tick < vault_state.lower_tick or
        current_tick > vault_state.upper_tick
    )

    # 2. Range utilisation too low (LP earning near zero)
    distance_to_edge = min(
        abs(current_tick - vault_state.lower_tick),
        abs(current_tick - vault_state.upper_tick)
    )
    range_width = vault_state.upper_tick - vault_state.lower_tick
    utilisation = 1 - (distance_to_edge / (range_width / 2))

    low_utilisation = utilisation < config.min_utilisation  # default 0.30

    # 3. Expected rebalance profit > gas cost
    gas_cost_usd = pool_state.gas_price * 200_000 * sei_price
    potential_apr_gain = predict_apr_gain(pool_state, new_range)
    profitable = (potential_apr_gain * vault_state.tvl / 365) > gas_cost_usd

    if (out_of_range or low_utilisation) and profitable:
        return RebalanceDecision(
            action="rebalance",
            urgency="high" if out_of_range else "medium",
            new_lower_tick=...,
            new_upper_tick=...,
        )
    return RebalanceDecision(action="hold", urgency="low")
```

### Full execution sequence

```
1. scheduler.py runs every 10 min (APScheduler)
   │
   ├─ for each active vault:
   │    ├─ dragonswap.get_pool_state()    # current tick, price
   │    ├─ dragonswap.get_position()      # current LP range
   │    ├─ ai_model.analyze_rebalance()   # decision
   │    └─ if action == "rebalance":
   │         ├─ quote = dragonswap.quote_rebalance()
   │         ├─ if quote.net_profit > 0:
   │         │    ├─ tx = dragonswap.build_rebalance_tx()
   │         │    ├─ signer_client.submit(tx)          # sends to backend signer
   │         │    └─ if strategy == "delta_neutral":
   │         │         └─ levana.adjust_hedge(new_delta)
   │         └─ log result → DB / API response
```

### Scheduler config

```python
# scheduler.py
from apscheduler.schedulers.asyncio import AsyncIOScheduler

scheduler = AsyncIOScheduler()
scheduler.add_job(run_rebalance_loop, "interval", minutes=10)
scheduler.add_job(run_funding_arb_scan,  "interval", minutes=1)
scheduler.add_job(run_health_broadcast,  "interval", minutes=5)
```

---

## 6. Funding Rate Arbitrage

The `/api/arbitrage/opportunities` frontend route currently returns mocked rates. Real implementation:

```python
# models/funding_arb.py

async def scan_funding_arb() -> list[ArbOpportunity]:
    levana_rates  = await levana_client.get_all_funding_rates()
    jelly_rates   = await jellyverse_client.get_all_funding_rates()

    opportunities = []
    for asset in ["SEI", "ETH", "BTC", "ATOM"]:
        spread = levana_rates[asset] - jelly_rates[asset]
        if abs(spread) > 0.003:  # 0.3% threshold
            opportunities.append(ArbOpportunity(
                asset=asset,
                long_exchange  = "jellyverse" if spread > 0 else "levana",
                short_exchange = "levana"     if spread > 0 else "jellyverse",
                spread=abs(spread),
                expected_daily_yield=abs(spread) / 3,  # funding pays 3x/day
            ))
    return opportunities
```

---

## 7. Market Data Feeds

The AI model needs live price + volume data. Do not rely on the frontend oracle route.

### Recommended sources

| Data | Source | Notes |
|---|---|---|
| SEI spot prices | DragonSwap pool `slot0()` | On-chain, no API key |
| Volume / liquidity | DragonSwap subgraph (`dragonswap.fun/graphql`) | Free |
| Funding rates | Levana CosmWasm query + Jellyverse contract | On-chain |
| CEX prices (arb reference) | Binance REST `GET /api/v3/ticker/price` | Free, no key for spot |
| Volatility (realised) | Compute from 24h OHLCV from DragonSwap subgraph | — |

---

## 8. Environment Variables (AI Engine)

```env
# SEI network
SEI_EVM_RPC=https://evm-rpc-testnet.sei-apis.com
SEI_COSMOS_RPC=https://rpc-testnet.sei-apis.com
SEI_CHAIN_ID=1328

# Signing wallet (used only by backend signer; AI engine should NOT hold the key)
SIGNER_URL=http://backend-signer:3002

# DragonSwap
DRAGONSWAP_FACTORY=0xBeA4fDf1A3AA8Cae4f4E68Eb9B5BaCf40f7e5D68
DRAGONSWAP_ROUTER=0xB1Fd44B2D09C9F3Df1a1EeF69e6fC9B67AAf41D
DRAGONSWAP_POSITION_MGR=0xA1BBF613F6E47eACb0219EC1d5543a51F9A5d6F3

# Levana
LEVANA_FACTORY=sei1...

# Jellyverse
JELLYVERSE_VAULT=0x...
JELLYVERSE_POSITION_ROUTER=0x...

# Model config
REBALANCE_INTERVAL_MINUTES=10
MIN_UTILISATION_THRESHOLD=0.30
MIN_REBALANCE_PROFIT_USD=0.10
MAX_SLIPPAGE=0.005

# Frontend
PORT=8000
```

---

## 9. What the Frontend Routes Need to Change

### `/api/trading/dragonswap/swap/route.ts`
Currently: mock data.
Real: forward the request body to `AI_ENGINE_URL/execute/swap` and return its response. The AI engine validates the route and calls the backend signer.

### `/api/trading/perpetual/position/route.ts`
Currently: mock data.
Real: forward to `AI_ENGINE_URL/execute/perp` which routes to Levana or Jellyverse based on strategy and asset.

### `/api/arbitrage/opportunities/route.ts`
Currently: hardcoded funding rates.
Real: `GET AI_ENGINE_URL/funding/rates` — AI engine returns live data it already polls.

The pattern for all three is the same — the frontend route is just a thin proxy with auth/validation. All execution intelligence lives in the AI engine.
