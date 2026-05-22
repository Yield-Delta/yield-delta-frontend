# Solana AI Engine Architecture — Vault Integration Guide

Seven Anchor programs are deployed on Solana devnet. Each program's core vault logic (deposit/withdraw/share accounting) is complete. What's missing is the **keeper layer** that drives the authority-gated instructions, plus the **DEX integrations** needed to turn simulation calls into real on-chain positions.

---

## Program Suite at a Glance

| Program | Program ID | Tag | Authority instructions needed |
|---|---|---|---|
| `yield_vault` | `FGH5S7dZ...` | Core | — (yield accrual is external) |
| `staking_vault` | `CKeT6u3d...` | SOL Staking | `accrue_yield` |
| `lp_vault` | `E1Vwm8sa...` | LP Auto-Compound | `simulate_compound` → real `compound` |
| `delta_neutral_vault` | `J27AutkC...` | Delta Neutral | `rebalance_hedge` |
| `meta_vault` | `GWnVeWAT...` | AI Allocator | `set_allocations`, `accrue_returns` |
| `yield_oracle` | `BCfceGYV...` | Oracle | `update_prices`, `post_signal` |
| `adaptive_yield_vault` | `DUBHVDkW...` | Experimental | `accrue_adaptive` |

**Shared library:** `yield_vault_core` — `calculate_shares_to_mint`, `calculate_assets_for_shares`, `apply_bps`, `accrue_simple_interest`

---

## Architecture Overview

```
AI Engine (Python, Railway)
  │  computes: regime, allocation weights, tick ranges, hedge ratio
  ▼
Keeper Bot (TypeScript, Railway)       ← holds the authority keypair
  │  calls authority-gated instructions via Anchor
  ├─► yield_oracle::update_prices      (price feed)
  ├─► yield_oracle::post_signal        (regime + allocation_bps)
  ├─► staking_vault::accrue_yield      (staking rewards)
  ├─► lp_vault::simulate_compound →   (later: real Orca CPI)
  ├─► delta_neutral_vault::rebalance_hedge
  ├─► meta_vault::set_allocations + accrue_returns
  └─► adaptive_yield_vault::accrue_adaptive
        └─ reads yield_oracle SignalAccount on-chain (no keeper arg needed)
```

---

## 1. Missing IDLs — First Priority

Only `yield_vault` has an IDL file (`src/lib/solana/idl/yield_vault.json`). The other six programs need IDLs to be callable from the frontend and the keeper bot TypeScript layer.

### How to generate them

```bash
# In your Anchor workspace root
# Requires nightly Rust (anchor-syn uses proc_macro_span):
rustup default nightly
anchor build   # generates target/idl/<program>.json for all programs

# Copy to frontend
cp target/idl/staking_vault.json          src/lib/solana/idl/
cp target/idl/lp_vault.json               src/lib/solana/idl/
cp target/idl/delta_neutral_vault.json    src/lib/solana/idl/
cp target/idl/meta_vault.json             src/lib/solana/idl/
cp target/idl/yield_oracle.json           src/lib/solana/idl/
cp target/idl/adaptive_yield_vault.json   src/lib/solana/idl/
```

If nightly Rust is unavailable in CI, build with `anchor build --no-idl` for deployment but keep a nightly branch just for IDL generation.

### Wiring them into anchorProvider.ts

```typescript
// src/lib/solana/anchorProvider.ts — add per-program factories
import stakingIdl    from './idl/staking_vault.json'
import lpIdl         from './idl/lp_vault.json'
import deltaNeutIdl  from './idl/delta_neutral_vault.json'
import metaIdl       from './idl/meta_vault.json'
import oracleIdl     from './idl/yield_oracle.json'
import adaptiveIdl   from './idl/adaptive_yield_vault.json'

export function getStakingProgram(wallet, cluster = 'devnet') {
  const provider = new AnchorProvider(getSolanaConnection(cluster), wallet, { commitment: 'confirmed' })
  return new Program({ ...stakingIdl, address: SOLANA_PROGRAM_IDS.stakingVault } as Idl, provider)
}
// repeat for each program...
```

---

## 2. Keeper Bot

The keeper is a Node.js/TypeScript service that runs on a cron schedule and calls the authority-gated instructions. It holds the authority keypair — the vault programs check `ctx.accounts.authority` on every restricted instruction.

### Project structure

```
keeper/
├── src/
│   ├── index.ts               # entry point, scheduler
│   ├── oracle.ts              # update_prices + post_signal
│   ├── staking.ts             # accrue_yield loop
│   ├── lp.ts                  # simulate_compound / real compound
│   ├── deltaNeutral.ts        # rebalance_hedge
│   ├── metaVault.ts           # set_allocations + accrue_returns
│   ├── adaptive.ts            # accrue_adaptive
│   └── aiClient.ts            # HTTP client → AI engine
├── keypair/
│   └── authority.json         # NEVER commit — load from env
└── package.json
```

### Scheduler

```typescript
// src/index.ts
import cron from 'node-cron'

cron.schedule('*/5 * * * *',  () => runOracleUpdate())      // every 5 min
cron.schedule('*/10 * * * *', () => runStakingAccrue())     // every 10 min
cron.schedule('*/10 * * * *', () => runLPCompound())        // every 10 min
cron.schedule('*/10 * * * *', () => runDeltaNeutralCheck()) // every 10 min
cron.schedule('*/15 * * * *', () => runMetaVaultRebalance())// every 15 min
cron.schedule('*/10 * * * *', () => runAdaptiveAccrue())    // every 10 min
```

### Authority wallet setup

```typescript
// src/utils/wallet.ts
import { Keypair } from '@solana/web3.js'

export function loadAuthorityKeypair(): Keypair {
  const raw = process.env.SOLANA_AUTHORITY_SECRET_KEY
  if (!raw) throw new Error('SOLANA_AUTHORITY_SECRET_KEY not set')
  return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(raw)))
}
```

---

## 3. yield_oracle — The Central Signal Bus

The oracle is the only program the AI engine talks to on-chain. Everything else reads from it.

### What the oracle stores

**OracleConfig PDA** (`["oracle_config"]`):
- `sol_price_usd` — 6-decimal fixed-point (e.g. `98_500_000` = $98.50)
- `usdc_price_usd` — always ~`1_000_000`
- `last_updated` — Unix timestamp

**SignalAccount PDA** (`["signal", strategy_id_byte]`):
- `volatility_regime` — `Low | Medium | High`
- `allocation_bps` — how much of meta_vault TVL to deploy here
- `suggested_lower_tick`, `suggested_upper_tick` — for LP vaults
- `posted_at` — timestamp (adaptive vault rejects signals older than 2 hours)

### Keeper oracle update loop

```typescript
// src/oracle.ts
import { getOracleProgram } from '../lib/anchor'

async function runOracleUpdate() {
  const params = await aiClient.getOracleParams()  // GET /oracle/params from AI engine
  const program = getOracleProgram(authority, 'devnet')

  // 1. Update prices
  await program.methods
    .updatePrices(
      new BN(params.sol_price_usd_6dec),
      new BN(params.usdc_price_usd_6dec)
    )
    .accounts({ oracleConfig: ORACLE_CONFIG_PDA, authority: authority.publicKey })
    .rpc()

  // 2. Post signal for each strategy
  for (const signal of params.signals) {
    await program.methods
      .postSignal(
        signal.strategy_id,            // u8 — maps to each vault
        { [signal.regime]: {} },       // VolatilityRegime enum variant
        new BN(signal.allocation_bps),
        new BN(signal.lower_tick),
        new BN(signal.upper_tick)
      )
      .accounts({
        signalAccount: getSignalPDA(signal.strategy_id),
        oracleConfig: ORACLE_CONFIG_PDA,
        authority: authority.publicKey,
      })
      .rpc()
  }
}
```

### AI engine: oracle params endpoint

```python
# ai_engine/routes/oracle.py
@app.get("/oracle/params")
async def get_oracle_params():
    sol_price = await fetch_sol_price()   # Pyth / Chainlink / Jupiter price API
    regime    = classify_regime(recent_returns)

    return {
        "sol_price_usd_6dec": int(sol_price * 1_000_000),
        "usdc_price_usd_6dec": 1_000_000,
        "signals": [
            { "strategy_id": 0, "regime": regime, "allocation_bps": weights[0], ... },
            { "strategy_id": 1, "regime": regime, "allocation_bps": weights[1], ... },
            # one entry per strategy
        ]
    }
```

---

## 4. staking_vault — SOL Liquid Staking

### Current state
Simulation: `accrue_yield` mints yield proportional to elapsed time × `yield_bps`. No real staking.

### Real integration: Marinade Finance

Marinade is the main liquid staking protocol on Solana. The vault deposits SOL and receives mSOL.

```bash
npm install @marinade.finance/marinade-ts-sdk
```

```typescript
// src/staking.ts (keeper bot)
import { Marinade, MarinadeConfig, Provider } from '@marinade.finance/marinade-ts-sdk'

const config = new MarinadeConfig({ connection, publicKey: authority.publicKey })
const marinade = new Marinade(config)

async function runStakingAccrue() {
  // 1. Compound: swap accumulated SOL in vault for mSOL via Marinade
  const { transaction } = await marinade.deposit(new BN(compoundAmount))
  await sendAndConfirmTransaction(connection, transaction, [authorityKeypair])

  // 2. Report to vault: call accrue_yield with actual mSOL APY from Marinade API
  const marinadeStats = await fetch('https://api.marinade.finance/msol/apy/1y')
  const realYieldBps = Math.round((await marinadeStats.json()).value * 10_000)

  await stakingVaultProgram.methods
    .accrueYield(new BN(realYieldBps))
    .accounts({ vaultState: STAKING_VAULT_PDA, authority: authority.publicKey })
    .rpc()
}
```

**Alternative:** JitoSOL (`@jito-foundation/stake-pool-sdk`) for MEV-boosted staking yields.

---

## 5. lp_vault — LP Auto-Compounding

### Current state
`simulate_compound` applies `compound_fee_bps` to `total_lp_tokens`. No real DEX.

### Real integration: Orca Whirlpools (CLMM)

Orca is Solana's main CLMM DEX (like Uniswap V3). The `@orca-so/whirlpools-sdk` is the standard.

```bash
npm install @orca-so/whirlpools-sdk @orca-so/common-sdk
```

```typescript
// src/lp.ts (keeper bot)
import {
  WhirlpoolContext, buildWhirlpoolClient, PDAUtil,
  decreaseLiquidityQuoteByLiquidityWithParams, increaseLiquidityQuoteByInputTokenWithParams,
} from '@orca-so/whirlpools-sdk'
import { AnchorProvider } from '@coral-xyz/anchor'

const ctx = WhirlpoolContext.from(connection, authorityWallet, ORCA_WHIRLPOOL_PROGRAM_ID)
const client = buildWhirlpoolClient(ctx)

async function runLPCompound() {
  const pool = await client.getPool(SOL_USDC_WHIRLPOOL_ADDRESS)
  const position = await client.getPosition(VAULT_POSITION_NFT)

  // 1. Collect accumulated fees
  const collectTx = await position.collectFees()
  await collectTx.buildAndExecute()

  // 2. Swap half the collected fees back to correct ratio for the current range
  // (use Jupiter for the swap — see section 7)
  const swapTx = await jupiterSwap(collectedTokenA, targetRatio)

  // 3. Re-add as liquidity at the same range (auto-compound)
  const increaseTx = await position.increaseLiquidity(
    increaseLiquidityQuoteByInputTokenWithParams({ ... })
  )
  await increaseTx.buildAndExecute()

  // 4. Report to vault state
  await lpVaultProgram.methods
    .reportCompound(new BN(newTotalLpTokens))
    .accounts({ ... })
    .rpc()
}
```

### Orca devnet pool addresses

```typescript
const ORCA_SOL_USDC_WHIRLPOOL = new PublicKey(
  'HJPjoWUrhoZzkNfRpHuieeFk9WcZWjwy6PBjZ81ngndJ'  // devnet SOL/USDC 0.3%
)
```

---

## 6. delta_neutral_vault — Hedge Rebalancing

### Current state
`rebalance_hedge` adjusts `short_notional` on-chain based on `long_notional`. The hedge itself is simulated — no real short position.

### Real integration: Drift Protocol (Perps)

Drift is Solana's main perpetuals DEX. It has a full devnet deployment.

```bash
npm install @drift-labs/sdk
```

```typescript
// src/deltaNeutral.ts (keeper bot)
import { DriftClient, BN, PRICE_PRECISION, BASE_PRECISION } from '@drift-labs/sdk'

const driftClient = new DriftClient({
  connection,
  wallet: authorityWallet,
  env: 'devnet',
})
await driftClient.subscribe()

async function runDeltaNeutralCheck() {
  // 1. Ask AI engine for hedge decision
  const { action, delta_usd } = await aiClient.post('/analyze/rebalance', {
    vault_address: DELTA_NEUTRAL_VAULT_PROGRAM_ID,
    strategy: 'delta_neutral',
  })

  if (action === 'hold') return

  // 2. Adjust the Drift perp short
  const marketIndex = 0  // SOL-PERP market index on Drift devnet
  const sizeBase = new BN(delta_usd / sol_price).mul(BASE_PRECISION)

  if (action === 'increase') {
    await driftClient.openPosition(
      PositionDirection.SHORT, sizeBase, marketIndex
    )
  } else {
    await driftClient.closePosition(marketIndex, sizeBase)
  }

  // 3. Update vault program with new hedge state
  const vaultState = await getVaultState()
  const newShortNotional = vaultState.long_notional  // full hedge
  await deltaNeutralProgram.methods
    .rebalanceHedge(new BN(newShortNotional))
    .accounts({ vaultState: DELTA_NEUTRAL_PDA, authority: authority.publicKey })
    .rpc()
}
```

### Drift devnet setup

```bash
# Fund the keeper with devnet USDC for margin
solana airdrop 2 <keeper-pubkey> --url devnet
# Then deposit USDC collateral into Drift via the SDK before opening positions
```

---

## 7. Jupiter — Swap Aggregator

Every vault that rebalances (lp_vault, delta_neutral) needs to swap tokens. Use Jupiter for best execution on both devnet and mainnet.

```bash
npm install @jup-ag/api  # REST API wrapper
# or
npm install @jup-ag/core  # direct SDK
```

```typescript
// src/utils/jupiter.ts
import { createJupiterApiClient } from '@jup-ag/api'

const jupiter = createJupiterApiClient({
  basePath: 'https://quote-api.jup.ag/v6',  // mainnet
  // devnet: 'https://quote-api.jup.ag/v6'  (Jupiter supports devnet tokens too)
})

export async function jupiterSwap(
  inputMint: string,
  outputMint: string,
  amount: number,
  slippageBps = 50
) {
  const quote = await jupiter.quoteGet({
    inputMint,
    outputMint,
    amount,
    slippageBps,
  })

  const { swapTransaction } = await jupiter.swapPost({
    swapRequest: {
      quoteResponse: quote,
      userPublicKey: authority.publicKey.toBase58(),
    },
  })

  const txBuf = Buffer.from(swapTransaction, 'base64')
  const tx = VersionedTransaction.deserialize(txBuf)
  tx.sign([authorityKeypair])
  return connection.sendRawTransaction(tx.serialize())
}
```

---

## 8. meta_vault — AI Multi-Strategy Allocator

### Current state
`set_allocations` updates up to 6 `AllocationSlot` entries (strategy_id → weight_bps). `accrue_returns` simulates blended APY growth based on current weights.

### Keeper flow

```typescript
// src/metaVault.ts
async function runMetaVaultRebalance() {
  // 1. Get AI engine allocation recommendation
  const { weights } = await aiClient.post('/meta-vault/allocate', {
    current_tvl_usd: await getMetaVaultTVL(),
    vault_apys: await getAllVaultAPYs(),
  })
  // weights: { staking: 0.25, lp: 0.30, delta_neutral: 0.25, adaptive: 0.20 }

  const slots = Object.entries(weights).map(([strategy, weight], idx) => ({
    strategy_id: idx,
    weight_bps: Math.round(weight * 10_000),
  }))

  // 2. Set allocations on-chain
  await metaVaultProgram.methods
    .setAllocations(slots)
    .accounts({ vaultState: META_VAULT_PDA, authority: authority.publicKey })
    .rpc()

  // 3. Accrue blended returns
  const blendedBps = slots.reduce((acc, s) =>
    acc + (s.weight_bps * strategyYields[s.strategy_id]) / 10_000, 0)

  await metaVaultProgram.methods
    .accrueReturns(new BN(Math.round(blendedBps)))
    .accounts({ vaultState: META_VAULT_PDA, authority: authority.publicKey })
    .rpc()
}
```

### AI engine: meta-vault allocation

```python
# ai_engine/routes/meta_vault.py
@app.post("/meta-vault/allocate")
async def allocate(req: MetaVaultRequest):
    yields  = { "staking": 0.061, "lp": 0.118, "delta_neutral": 0.086, "adaptive": 0.12 }
    risks   = { "staking": 0.01,  "lp": 0.08,  "delta_neutral": 0.03,  "adaptive": 0.05 }
    # Max-Sharpe optimization (same as SUI meta vault allocator)
    weights = MetaVaultAllocator().compute_weights(yields, risks, req.current_tvl_usd)
    return weights
```

---

## 9. adaptive_yield_vault — Volatility-Reactive Vault

This vault reads the `yield_oracle` SignalAccount **on-chain** — no keeper argument needed. The keeper just calls `accrue_adaptive` and the program does the rest.

```typescript
// src/adaptive.ts
async function runAdaptiveAccrue() {
  const signalPDA = getSignalPDA(ADAPTIVE_STRATEGY_ID)

  await adaptiveVaultProgram.methods
    .accrueAdaptive(ADAPTIVE_STRATEGY_ID)
    .accounts({
      vaultState:    ADAPTIVE_VAULT_PDA,
      oracleSignal:  signalPDA,  // program reads regime from here directly
      authority:     authority.publicKey,
      clock:         SYSVAR_CLOCK_PUBKEY,
    })
    .rpc()
  // Vault automatically applies 0.70× / 1× / 1.50× multiplier based on current regime
}
```

The only external dependency is that the oracle updater (section 3) must have called `post_signal` recently (< 2 hours). The adaptive vault rejects stale signals.

---

## 10. Token Mints — Devnet Setup

The vault catalog uses placeholder addresses for most Solana vaults. Before the keeper can call `initialize` on each vault, SPL token mints need to exist on devnet.

### Devnet token mints to use

| Token | Devnet mint | Notes |
|---|---|---|
| USDC | `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU` | Circle's official devnet USDC |
| SOL | native — no mint | Use `SystemProgram.transfer` for SOL deposits |
| mSOL (mock) | create fresh mint | `spl-token create-token` on devnet |
| stSOL (mock) | create fresh mint | same |

### Vault catalog update needed

The placeholder addresses in `vaultCatalog.ts` (`SoLendStable111...`, `SoLStakeLiquid111...`, etc.) need replacing with:
1. The real PDA of each initialized vault (computed from seeds in `pdas.ts`)
2. The `tokenMint` and `vaultMint` fields need real devnet addresses

```typescript
// vaultCatalog.ts — what each entry needs added
{
  address: getVaultStatePDA(USDC_DEVNET_MINT)[0].toBase58(),  // real PDA, not placeholder
  tokenMint: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU', // devnet USDC
  vaultMint:  '<share-token-mint-created-at-initialize>',
  tokenDecimals: 6,
  // ...
}
```

---

## 11. Environment Variables

### Keeper bot

```env
# Solana
SOLANA_CLUSTER=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_AUTHORITY_SECRET_KEY=[1,2,3,...]   # JSON array from keypair file — NEVER commit

# Program IDs (match programIds.ts)
YIELD_ORACLE_PROGRAM_ID=BCfceGYVBifA6uQ2D6wiLieTHC786u37dYzCLYoNk1df
YIELD_VAULT_PROGRAM_ID=FGH5S7dZrpM44QUquQaWo4G184rRgvhzV9np5MaAX8ga
STAKING_VAULT_PROGRAM_ID=CKeT6u3dhZqWu9mvVPQ72TvzjLW7TmzUABU92c6ZeHJd
LP_VAULT_PROGRAM_ID=E1Vwm8sabF4V4BgVKgFAoaVNSrwaFctYjj3hFuqDohww
DELTA_NEUTRAL_VAULT_PROGRAM_ID=J27AutkCvCGrNmpu2DxReEhJFUkStUF6HULuQ3hxm8BC
META_VAULT_PROGRAM_ID=GWnVeWATrewpyPjWHkic5QjwH7knczUwovckx34jzHS1
ADAPTIVE_YIELD_VAULT_PROGRAM_ID=DUBHVDkWAF3NUkajnUbFWLrzFHVXkikR1u2ygPd2Ws43

# DEX
ORCA_SOL_USDC_WHIRLPOOL=HJPjoWUrhoZzkNfRpHuieeFk9WcZWjwy6PBjZ81ngndJ

# AI engine
AI_ENGINE_URL=http://ai-engine:8000
KEEPER_SECRET=<hmac-secret>

# Scheduler intervals (minutes)
ORACLE_UPDATE_INTERVAL=5
STAKING_ACCRUE_INTERVAL=10
LP_COMPOUND_INTERVAL=10
DELTA_NEUTRAL_INTERVAL=10
META_VAULT_INTERVAL=15
ADAPTIVE_ACCRUE_INTERVAL=10
```

### Frontend additions needed

```env
NEXT_PUBLIC_SOLANA_DEVNET_RPC=https://api.devnet.solana.com
NEXT_PUBLIC_YIELD_ORACLE_PROGRAM_ID=BCfceGYVBifA6uQ2D6wiLieTHC786u37dYzCLYoNk1df
NEXT_PUBLIC_STAKING_VAULT_PROGRAM_ID=CKeT6u3dhZqWu9mvVPQ72TvzjLW7TmzUABU92c6ZeHJd
NEXT_PUBLIC_LP_VAULT_PROGRAM_ID=E1Vwm8sabF4V4BgVKgFAoaVNSrwaFctYjj3hFuqDohww
NEXT_PUBLIC_DELTA_NEUTRAL_VAULT_PROGRAM_ID=J27AutkCvCGrNmpu2DxReEhJFUkStUF6HULuQ3hxm8BC
NEXT_PUBLIC_META_VAULT_PROGRAM_ID=GWnVeWATrewpyPjWHkic5QjwH7knczUwovckx34jzHS1
NEXT_PUBLIC_ADAPTIVE_YIELD_VAULT_PROGRAM_ID=DUBHVDkWAF3NUkajnUbFWLrzFHVXkikR1u2ygPd2Ws43
```

---

## 12. What Exists vs What Needs to Be Built

| Component | Status | Notes |
|---|---|---|
| All 7 Anchor programs | **Deployed** (devnet) | Core deposit/withdraw logic complete |
| `yield_vault` IDL | **Done** | `src/lib/solana/idl/yield_vault.json` |
| IDLs for other 6 programs | **Missing** | Need `anchor build` with nightly Rust |
| `useSolanaVault` hook | **Done** | Works for `yield_vault` only |
| Hooks for other 5 vaults | **Not built** | Need IDLs first, then same pattern |
| Keeper bot scaffold | **Not built** | TypeScript service, Railway deploy |
| Oracle updater | **Not built** | Most critical — `adaptive_yield_vault` needs it |
| Drift integration (delta-neutral) | **Not built** | `@drift-labs/sdk`, devnet available |
| Orca integration (lp_vault) | **Not built** | `@orca-so/whirlpools-sdk`, devnet pools exist |
| Marinade integration (staking) | **Not built** | `@marinade.finance/marinade-ts-sdk` |
| Jupiter swap utility | **Not built** | Needed by lp_vault + delta_neutral keeper |
| Vault catalog PDAs | **Placeholders** | Replace `SoLendStable111...` with real PDAs |
| `tokenMint` / `vaultMint` fields | **Missing** | Needed in catalog for deposit modal |

**Recommended build order:**
1. Generate IDLs (enables everything else)
2. Deploy oracle + call `initialize_oracle` → keeper can start posting signals
3. Build keeper oracle updater → unblocks `adaptive_yield_vault`
4. Wire up `staking_vault` with Marinade (simplest real DEX integration)
5. Wire up `lp_vault` with Orca + Jupiter
6. Wire up `delta_neutral_vault` with Drift
7. Build `meta_vault` keeper (depends on the others being live)
