# Solana Devnet — Next Steps

## Current State

Phases 1–3 are complete. The following layers exist and work:

| Layer | Status |
|---|---|
| Wallet connection (Phantom/Solflare/Backpack) | ✅ Real |
| SOL balance fetching via RPC | ✅ Real |
| Vault UI (cards, deposit/withdraw modals) | ✅ Real |
| Deposit/withdraw transactions | ❌ Mocked (fake signatures, 1.5s delay) |
| User position (shares/value) | ❌ Mocked (always returns 0) |
| On-chain Anchor program | ❌ Does not exist |
| Vaults page Solana integration | ❌ Not wired in |

---

## Phase 4 — Anchor Program (On-Chain)

The vault logic must live in a Solana program. See [`SOLANA_ANCHOR_PROGRAM.md`](./SOLANA_ANCHOR_PROGRAM.md) for the full spec.

**Deliverables:**
- [ ] Write `yield_vault` Anchor program with `initialize`, `deposit`, `withdraw` instructions
- [ ] Define vault state account (PDA) and user share accounts (PDA)
- [ ] Add SPL token support (USDC, wrapped SOL)
- [ ] Deploy program to Solana devnet
- [ ] Record deployed `PROGRAM_ID` in `.env.local`
- [ ] Export IDL to `src/lib/solana/idl/yield_vault.json`

**Estimated effort:** 1–2 weeks (Rust/Anchor familiarity required)

---

## Phase 5 — Frontend Wiring

Replace all mocked logic in `src/hooks/useSolanaVault.ts` with real Anchor CPI calls. See [`SOLANA_FRONTEND_WIRING.md`](./SOLANA_FRONTEND_WIRING.md) for the step-by-step guide.

**Deliverables:**
- [ ] Install `@coral-xyz/anchor` and add IDL types
- [ ] Implement real `deposit()` — build + sign + send SPL token transfer + program CPI
- [ ] Implement real `withdraw()` — burn shares, release tokens
- [ ] Implement real `getUserPosition()` — fetch PDA account data on-chain
- [ ] Add SPL associated token account creation (auto-create if missing)
- [ ] Wire `vaultMint` and `tokenMint` addresses from devnet vault catalog

**Estimated effort:** 3–5 days

---

## Phase 6 — Solana Vault Catalog

A hardcoded or API-driven list of deployed vault addresses for devnet.

**Deliverables:**
- [ ] Create `src/lib/solana/vaultCatalog.ts` with devnet vault addresses (see below)
- [ ] Wire `SolanaVaultList` into the `/vaults` page alongside EVM vaults
- [ ] Add chain filter/tab to the vaults page to switch between SEI and Solana

**Initial devnet catalog:**
```typescript
export const SOLANA_DEVNET_VAULTS: SolanaVaultInfo[] = [
  {
    address: '<PDA after deploy>',
    name: 'SOL Staking Vault',
    strategy: 'staked_sol',
    depositToken: 'SOL',
    tokenMint: 'So11111111111111111111111111111111111111112',  // native SOL mint
    tokenDecimals: 9,
    vaultMint: '<vault share mint PDA>',
    apy: 7.2,
    tvl: 0,
    description: 'Liquid staking via Marinade/Jito on devnet',
  },
  {
    address: '<PDA after deploy>',
    name: 'USDC Yield Vault',
    strategy: 'stable_max',
    depositToken: 'USDC',
    tokenMint: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',  // devnet USDC
    tokenDecimals: 6,
    vaultMint: '<vault share mint PDA>',
    apy: 9.8,
    tvl: 0,
    description: 'USDC lending optimization across devnet protocols',
  },
]
```

---

## Phase 7 — Transaction History

**Deliverables:**
- [ ] Create `src/hooks/useSolanaTransactionHistory.ts` — fetch confirmed txns for wallet using `getSignaturesForAddress`
- [ ] Add a "Recent Activity" section to the vaults page / dashboard for Solana transactions
- [ ] Link each tx to `https://explorer.solana.com/tx/{sig}?cluster=devnet`

---

## Phase 8 — Devnet Testing

**Deliverables:**
- [ ] Manually test full deposit → position shown → withdraw flow on devnet
- [ ] Test with USDC faucet and SOL faucet
- [ ] Test error paths: insufficient balance, slippage, wallet rejection
- [ ] Test auto-refresh (30s balance interval already wired in `useSolanaWallet.ts`)
- [ ] Performance check: RPC latency under normal and free-tier rate limits

**Faucets:**
- SOL devnet: `solana airdrop 2 <address> --url devnet` or https://faucet.solana.com
- USDC devnet: https://spl-token-faucet.com (devnet USDC mint: `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`)

---

## Phase 9 — Premium RPC & Monitoring

**Deliverables:**
- [ ] Get a Helius API key (https://helius.dev) — free tier is fine for devnet
- [ ] Set `NEXT_PUBLIC_HELIUS_API_KEY` and `NEXT_PUBLIC_SOLANA_RPC_PREMIUM` in `.env.local`
- [ ] Update `src/lib/solana/connection.ts` to prefer premium RPC on devnet
- [ ] Add basic RPC latency logging to catch degraded performance

---

## Blockers

| Blocker | Owner | Notes |
|---|---|---|
| Anchor program needs to be written | Backend/Solana dev | Frontend is ready to consume IDL once available |
| Devnet vault PDAs need to be recorded | Deployer | Must update `SOLANA_DEVNET_VAULTS` catalog after deploy |
| SPL token test balances | QA | Use faucets above before testing |

---

## Quick Reference — Files That Change in Phase 5

```
src/hooks/useSolanaVault.ts           ← replace mocks with real Anchor calls
src/lib/solana/vaultCatalog.ts        ← new file: devnet vault addresses
src/lib/solana/idl/yield_vault.json   ← new file: exported from Anchor build
src/app/vaults/page.tsx               ← add Solana vault list + chain tab
.env.local                            ← add NEXT_PUBLIC_VAULT_PROGRAM_ID
```
