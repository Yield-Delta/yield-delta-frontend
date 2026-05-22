# SUI AI Engine Architecture — Vault Execution & DEX/Perp Integrations

The four SUI vaults differ fundamentally from the SEI vaults: their execution logic lives **inside deployed Move modules** on-chain. The AI engine does not submit raw contract calls — it computes optimal parameters and passes them to a **keeper bot** that builds Programmable Transaction Blocks (PTBs) calling the vault's Move entry functions.

---

## The 4 Vaults and What Each Needs

| Vault | Object ID | Strategy | AI computes | Protocols needed |
|---|---|---|---|---|
| Delta-Neutral DeepBook | `0x20d65b...` | `delta_neutral` | target delta ε, tick range | DeepBook CLMM + DeepBook Perps |
| GBM Hedge-Ratio | `0x3d2da9...` | `hedge` | h** = min(h*, h̄(α)), rebalance interval T | DeepBook Margin |
| LVR Offset Options | `0x2e39f2...` | `concentrated_liquidity` | CI option strike/maturity, IV surface | DeepBook Predict (options) |
| suiUSDe Meta Vault | `0x41f09a...` | `layered_yield` | allocation weights across 4 yield layers | DeepBook CLOB + Navi + suiUSDe |

---

## Architecture Overview

```
AI Engine (Railway, Python)
  │  computes parameters (tick range, hedge ratio, etc.)
  │
  ▼
Keeper Bot (Railway, TypeScript)      ← holds the hot SUI keypair
  │  builds PTBs, signs, submits
  ▼
Sui Testnet
  ├─ Vault Move module (delta_neutral_vault / hedge_ratio_vault / etc.)
  │    └─ calls into ──►  DeepBook CLMM  (LP management)
  │                   ──►  DeepBook Perps (hedge positions)
  │                   ──►  DeepBook Margin (collateral)
  │                   ──►  Navi Protocol  (money market — meta vault)
  └─ BalanceManager (owned object, parallel execution fast-path)
```

**Why split AI engine from keeper bot:**
- The AI engine does the math (Python, sklearn/numpy-friendly).
- The keeper bot does Sui-specific PTB construction (`@mysten/sui` TypeScript SDK).
- Keeps the private key out of the Python service entirely.

---

## 1. DeepBook v3 Integration

DeepBook is Sui's native CLOB + CLMM. All four vaults route through it.

### SDK

```bash
npm install @mysten/deepbook-v3    # keeper bot
pip install pysui                  # AI engine (for read-only queries)
```

### Key object IDs (Sui Testnet)

```typescript
// Keeper bot — update vaultPrograms.ts with real addresses once confirmed
const DEEPBOOK = {
  // CLMM pool for SUI/USDC (0.1% tier)
  poolSuiUsdc:      '0x...', // query DeepBook registry on testnet
  // BalanceManager — one per vault strategy (owned by keeper)
  balanceManagerDN: '0x...', // delta-neutral vault's manager
  balanceManagerGBM:'0x...', // hedge-ratio vault's manager
  // Perps market
  perpMarketSui:    '0x...', // SUI-PERP market object
  // Margin module
  marginModule:     '0x...',
}
```

> The placeholders in `vaultPrograms.ts` (`0x000...0005`, `0x000...0006`) need replacing with real testnet addresses. Query them via `suix_getOwnedObjects` on the DeepBook deployer address or from the [DeepBook docs](https://docs.deepbook.tech).

### CLMM position queries (AI engine, read-only via pysui)

```python
# integrations/deepbook.py
from pysui.sui.sui_clients.sync_client import SuiClient
from pysui.sui.sui_config import SuiConfig

class DeepBookClient:
    def __init__(self, rpc_url="https://fullnode.testnet.sui.io"):
        cfg = SuiConfig.user_config(rpc_url=rpc_url)
        self.client = SuiClient(cfg)

    def get_pool_state(self, pool_id: str) -> dict:
        """
        Returns: current_tick, sqrt_price, liquidity, fee_growth_global
        Used as input to all ML models.
        """
        result = self.client.get_object(pool_id)
        fields = result.result_data.content.fields
        return {
            "current_tick":   int(fields["current_tick_index"]["fields"]["bits"]),
            "sqrt_price":     int(fields["current_sqrt_price"]),
            "liquidity":      int(fields["liquidity"]),
        }

    def get_position(self, position_id: str) -> dict:
        """LP position: lower_tick, upper_tick, liquidity, uncollected_fees."""
        result = self.client.get_object(position_id)
        fields = result.result_data.content.fields
        return {
            "lower_tick": int(fields["tick_lower_index"]["fields"]["bits"]),
            "upper_tick": int(fields["tick_upper_index"]["fields"]["bits"]),
            "liquidity":  int(fields["liquidity"]),
        }

    def get_perp_position(self, account: str, market_id: str) -> dict:
        """Current perp position size and delta for hedge tracking."""
        # Query via dynamic fields on the BalanceManager object
        ...
```

### PTB for rebalancing an LP position (keeper bot)

```typescript
// keeper/src/rebalance.ts
import { Transaction } from '@mysten/sui/transactions'
import { DeepBookClient } from '@mysten/deepbook-v3'

async function rebalanceLPPosition(
  params: { vaultId: string; newLower: number; newUpper: number; balanceManagerId: string }
) {
  const tx = new Transaction()
  tx.setSender(keeperAddress)

  // Step 1 — collect all fees and remove full liquidity
  tx.moveCall({
    target: `${VAULT_PKG}::delta_neutral_vault::collect_and_remove_liquidity`,
    arguments: [tx.object(params.vaultId)],
  })

  // Step 2 — swap imbalanced tokens to match new range ratio
  // (DeepBook CLMM swap — same PTB, atomic)
  const [coinOut] = tx.moveCall({
    target: `${DEEPBOOK_PKG}::clmm::swap_exact_input`,
    arguments: [
      tx.object(DEEPBOOK.poolSuiUsdc),
      tx.object(params.balanceManagerId),
      tx.pure.u64(swapAmount),
      tx.pure.u64(minAmountOut),
      tx.pure.bool(a2b),
    ],
  })

  // Step 3 — add liquidity at new range
  tx.moveCall({
    target: `${VAULT_PKG}::delta_neutral_vault::add_liquidity`,
    arguments: [
      tx.object(params.vaultId),
      tx.object(DEEPBOOK.poolSuiUsdc),
      tx.pure.u64(params.newLower),
      tx.pure.u64(params.newUpper),
      coinOut,
    ],
  })

  const result = await dAppKit.signAndExecuteTransaction({ transaction: tx })
  return result.Transaction.digest
}
```

**Everything above happens in a single atomic PTB** — no partial state is possible.

---

## 2. Delta-Neutral Vault — Perp Hedge

After adding LP, the vault has long delta on SUI. The hedge opens/adjusts a short on DeepBook Perps (or Bluefin as fallback) to bring net delta ≤ ε.

### Hot Potato DeltaReceipt pattern

The deployed Move module enforces atomicity via a Hot Potato:

```move
// Conceptual Move — matches delta_neutral_vault module
public fun rebalance(vault: &mut DeltaNeutralVault, ...): DeltaReceipt {
    // returns a Hot Potato — MUST be consumed in same tx
    DeltaReceipt { delta_exposure: computed_delta }
}

public fun settle_hedge(vault: &mut DeltaNeutralVault, receipt: DeltaReceipt, ...) {
    // consumes the Hot Potato by opening/adjusting the perp short
    assert!(receipt.delta_exposure <= vault.epsilon, EHedgeNotSatisfied);
    // ...
}
```

The keeper bot always calls `rebalance` + `settle_hedge` in the same PTB. If the hedge fails to satisfy ε, the whole PTB reverts.

### AI engine: computing the hedge adjustment

```python
# models/delta_neutral.py

def compute_hedge_adjustment(pool_state, position, current_perp_size_usd) -> HedgeAction:
    """
    Returns: { action: 'increase'|'decrease'|'hold', delta_usd: float }
    """
    # LP delta = liquidity * (sqrtP_upper - sqrtP) / sqrtP (for the SUI side)
    sqrt_p = pool_state["sqrt_price"] / (2**64)
    sqrt_upper = tick_to_sqrt_price(position["upper_tick"])
    lp_delta_sui = position["liquidity"] * (sqrt_upper - sqrt_p) / sqrt_p

    lp_delta_usd = lp_delta_sui * sui_price_usd
    target_short_usd = lp_delta_usd  # 1:1 hedge for full neutrality

    adjustment_usd = target_short_usd - current_perp_size_usd
    epsilon_usd = lp_delta_usd * 0.02  # 2% tolerance

    if abs(adjustment_usd) < epsilon_usd:
        return HedgeAction(action="hold", delta_usd=0)
    return HedgeAction(
        action="increase" if adjustment_usd > 0 else "decrease",
        delta_usd=abs(adjustment_usd),
    )
```

### Bluefin as perp fallback (EVM-compatible on Sui)

DeepBook Perps may not have testnet liquidity. Bluefin is the main production perp DEX on Sui.

```typescript
// keeper/src/integrations/bluefin.ts
// Bluefin has a TypeScript SDK: npm install @bluefin-exchange/bluefin-v2-client

import { BluefinClient, Networks } from "@bluefin-exchange/bluefin-v2-client"

const bluefin = new BluefinClient(true, Networks.SUI_STAGING)
await bluefin.init()

async function openShort(assetSymbol: string, sizeUsd: number, leverage = 1) {
  return bluefin.postOrder({
    symbol: `${assetSymbol}-PERP`,
    side: "SELL",
    orderType: "MARKET",
    quantity: sizeUsd / currentPrice,
    leverage,
    reduceOnly: false,
  })
}
```

---

## 3. GBM Hedge-Ratio Vault — Volatility-Scaled Rebalancing

The core math is GBM moment-matching to find the optimal hedge ratio h** and rebalance interval T.

### AI engine model

```python
# models/gbm_hedge_ratio.py
import numpy as np

class GBMHedgeRatioModel:
    def __init__(self, alpha=0.95, ltv_max=0.85):
        self.alpha = alpha          # confidence level for VaR
        self.ltv_max = ltv_max      # max allowed LTV

    def compute_optimal_hedge(self, returns_history: list[float], position_value_usd: float) -> dict:
        log_returns = np.diff(np.log(returns_history))
        sigma = np.std(log_returns) * np.sqrt(365 * 24)   # annualised vol

        # GBM moment-matching: match first two moments of LP P&L
        mu = np.mean(log_returns) * 365 * 24
        h_star = 0.5 + mu / (2 * sigma**2)                # unconstrained optimal ratio

        # VaR constraint: h̄(α) = 1 - z_alpha * sigma / sqrt(T)
        z_alpha = 1.645  # 95th percentile
        h_bar = 1 - z_alpha * sigma / np.sqrt(1/365)       # daily rebalance
        h_optimal = min(h_star, h_bar)

        # Rebalance frequency: T ∝ 1/σ̃² — less frequent when quiet
        T_days = max(0.5, 1.0 / (sigma**2 * 252))

        return {
            "h_star":     h_star,
            "h_bar":      h_bar,
            "h_optimal":  h_optimal,
            "rebalance_interval_hours": T_days * 24,
            "annualised_vol": sigma,
            "should_rebalance": True,  # caller decides based on interval
        }
```

### What the keeper bot sends to the vault

```typescript
tx.moveCall({
  target: `${VAULT_PKG}::hedge_ratio_vault::set_hedge_params`,
  arguments: [
    tx.object(vaultId),
    tx.pure.u64(Math.round(h_optimal * 1e9)),  // fixed-point
    tx.pure.u64(Math.round(T_hours * 3600)),   // seconds
  ],
})
```

---

## 4. LVR Offset Options Vault — DeepBook Predict Integration

This vault converts LVR (Loss Versus Rebalancing) cost into a continuous funding rate by replicating Continuous Installment (CI) options on DeepBook Predict.

### LVR formula (what the AI engine computes)

```python
# models/lvr_offset.py

def compute_lvr_cost(sigma: float, fee_tier: float, tick_width_pct: float) -> float:
    """
    Pathwise LVR per unit time = σ²/2 × Γ (gamma of LP position)
    For a CLMM position:  LVR_rate ≈ σ² × liquidity / (4 × price × tick_width)
    """
    gamma_approx = 1.0 / tick_width_pct   # CLMM gamma ≈ 1 / range_width
    lvr_rate = (sigma**2 / 2) * gamma_approx
    net_lvr = lvr_rate - fee_tier          # subtract fees earned
    return net_lvr

def compute_ci_option_params(lvr_rate: float, current_price: float, sigma: float) -> dict:
    """
    Price CI put strip so that funding rate q offsets net LVR.
    CI option pricing: use Carr's continuous installment approximation.
    """
    import scipy.stats as stats
    T = 1/365       # daily installment
    K = current_price * (1 - sigma * np.sqrt(T))   # OTM strike

    # Black-Scholes put price for CI strip
    d1 = (np.log(current_price / K) + 0.5 * sigma**2 * T) / (sigma * np.sqrt(T))
    d2 = d1 - sigma * np.sqrt(T)
    put_premium = K * np.exp(-0 * T) * stats.norm.cdf(-d2) - current_price * stats.norm.cdf(-d1)

    return {
        "strike": K,
        "put_premium_per_day": put_premium,
        "implied_funding_rate": lvr_rate,
        "recommended_action": "buy_put" if lvr_rate > fee_tier else "write_put",
    }
```

### DeepBook Predict calls (keeper bot)

DeepBook Predict is Sui's on-chain options/prediction market. The keeper buys CI puts when LVR > fees, writes them when fees > LVR.

```typescript
// Conceptual — replace with DeepBook Predict SDK calls once available on testnet
tx.moveCall({
  target: `${DEEPBOOK_PREDICT_PKG}::options::buy_put`,
  arguments: [
    tx.object(DEEPBOOK.perpMarketSui),
    tx.pure.u64(strikePrice),
    tx.pure.u64(expiryTimestamp),
    tx.pure.u64(notionalAmount),
    tx.object(DEEPBOOK.balanceManagerDN),
  ],
})
```

---

## 5. suiUSDe Meta Vault — 4-Layer Yield Stack

This vault stacks four yield sources simultaneously. The AI engine allocates capital weights across them each rebalance cycle.

### Yield layers

| Layer | Protocol | Yield source | SDK |
|---|---|---|---|
| 1. Staking rewards | Aftermath / Lido on Sui | stSUI yield | `@aftermath-finance/sdk` |
| 2. Perp funding | DeepBook Perps / Bluefin | Positive funding on shorts | Bluefin SDK |
| 3. Money market | Navi Protocol | Lending deposit APY | `navi-sdk` |
| 4. CLOB fees | DeepBook CLOB | Maker rebates from active orders | `@mysten/deepbook-v3` |

### AI engine: allocation optimizer

```python
# models/meta_vault_allocator.py
import numpy as np
from scipy.optimize import minimize

class MetaVaultAllocator:
    def compute_weights(self, yields: dict, risks: dict, total_capital_usd: float) -> dict:
        """
        Max Sharpe allocation across 4 yield sources.
        yields = { staking: 0.04, funding: 0.08, lending: 0.06, clob: 0.05 }
        risks  = { staking: 0.01, funding: 0.15, lending: 0.02, clob: 0.03 }
        """
        names = list(yields.keys())
        mu = np.array([yields[n] for n in names])
        sigma = np.array([risks[n] for n in names])

        def neg_sharpe(w):
            port_ret  = np.dot(w, mu)
            port_risk = np.sqrt(np.dot(w**2, sigma**2))
            return -port_ret / port_risk

        constraints = [{"type": "eq", "fun": lambda w: np.sum(w) - 1}]
        bounds = [(0.05, 0.60)] * len(names)   # min 5%, max 60% per layer
        w0 = np.array([0.25] * len(names))

        result = minimize(neg_sharpe, w0, bounds=bounds, constraints=constraints)
        weights = dict(zip(names, result.x))

        return {
            "weights": weights,
            "allocations_usd": {k: v * total_capital_usd for k, v in weights.items()},
            "expected_blended_apy": float(np.dot(result.x, mu)),
        }
```

### Navi Protocol integration (lending layer)

```typescript
// keeper/src/integrations/navi.ts
// npm install navi-sdk
import { NAVISDKClient } from 'navi-sdk'
import { Pool, PoolConfig } from 'navi-sdk/dist/types'

const navi = new NAVISDKClient({ networkType: 'testnet' })

async function depositToNavi(tx: Transaction, coinObject: string, poolConfig: PoolConfig) {
  // Deposit suiUSDe/USDC to earn lending yield
  await navi.depositToNavi(poolConfig, BigInt(depositAmount), tx)
}

async function getNaviAPY(asset: string): Promise<number> {
  const pool = await navi.getPoolInfo(NAVI_POOLS[asset])
  return pool.supply_rate
}
```

---

## 6. Keeper Bot — Full Rebalance Flow

```
Every N minutes (N from AI engine's rebalance_interval):
│
├─ AI engine → POST /analyze/rebalance  for each vault
│    ├─ delta_neutral:  compute hedge adjustment
│    ├─ hedge_ratio:    compute h**, T
│    ├─ lvr_offset:     compute CI option params
│    └─ meta_vault:     compute allocation weights
│
└─ Keeper bot receives params → builds PTB per vault:

   [delta_neutral PTB]
     collect_fees → remove_liquidity → swap_imbalance
     → add_liquidity(new_range) → settle_hedge(DeltaReceipt)
     (all atomic, DeltaReceipt is Hot Potato — cannot be dropped)

   [hedge_ratio PTB]
     set_hedge_params(h**, T) → adjust_margin_position

   [lvr_offset PTB]
     update_clmm_range → buy_or_write_ci_put(strike, expiry)

   [meta_vault PTB]
     rebalance_layers(staking_weight, funding_weight, lending_weight, clob_weight)
     → deposit_to_navi → adjust_bluefin_funding_position
```

---

## 7. Environment Variables (Keeper Bot + AI Engine)

```env
# SUI network
SUI_RPC_URL=https://fullnode.testnet.sui.io:443
SUI_NETWORK=testnet

# Keeper bot wallet (TypeScript service — holds private key)
SUI_KEEPER_MNEMONIC=word1 word2 ... word24
# OR
SUI_KEEPER_PRIVATE_KEY=suiprivkey1...

# Vault package (already deployed)
VAULT_PACKAGE_ID=0xdcdbb87eeeb9ea5ab945313458b4e95f0d9cee27e980de57443ee60a34bda092

# DeepBook
DEEPBOOK_PACKAGE_ID=0x...           # from DeepBook testnet docs
DEEPBOOK_POOL_SUI_USDC=0x...        # real address — replace placeholder in vaultPrograms.ts
DEEPBOOK_BALANCE_MANAGER=0x...      # keeper's owned BalanceManager object

# Bluefin (perp fallback)
BLUEFIN_NETWORK=SUI_STAGING
BLUEFIN_API_KEY=...

# Navi (meta vault lending layer)
NAVI_PACKAGE_ID=0x...

# AI engine communication
AI_ENGINE_URL=http://ai-engine:8000
KEEPER_SECRET=...          # HMAC secret for AI engine → keeper auth

# Scheduler
REBALANCE_CHECK_INTERVAL_MINUTES=10
```

---

## 8. What Needs to be Built vs What Exists

| Component | Status | Notes |
|---|---|---|
| Move vault modules | **Deployed** (testnet) | Package `0xdcdb...` with 4 modules |
| Frontend deposit/withdraw | **Complete** | `useSuiVault.ts` calls `deposit` / `withdraw` |
| Keeper bot scaffold | **Not built** | TypeScript service, needs PTB builders per vault |
| AI engine — delta neutral | **Not built** | `compute_hedge_adjustment` model |
| AI engine — GBM hedge | **Not built** | `GBMHedgeRatioModel` |
| AI engine — LVR/options | **Not built** | `compute_ci_option_params` + scipy |
| AI engine — meta vault | **Not built** | `MetaVaultAllocator` max-Sharpe |
| DeepBook CLMM read queries | **Not built** | Need real pool object IDs first |
| Bluefin perp integration | **Not built** | `@bluefin-exchange/bluefin-v2-client` |
| Navi lending integration | **Not built** | `navi-sdk` |
| DeepBook pool/balance mgr IDs | **Placeholders** | `vaultPrograms.ts` has `0x000...0005/0006` |

**First step:** replace the DeepBook placeholder IDs in `vaultPrograms.ts` with real testnet addresses — everything else depends on those.
