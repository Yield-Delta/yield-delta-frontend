# Solana Anchor Program Specification

## Overview

The `yield_vault` Anchor program is the on-chain counterpart to the existing frontend vault UI. It manages user deposits, mints share tokens, tracks positions, and handles withdrawals.

This document specifies what needs to be built and deployed to Solana devnet.

---

## Program Structure

```
programs/
└── yield_vault/
    ├── Cargo.toml
    └── src/
        ├── lib.rs          ← instruction entrypoints
        ├── state.rs        ← account structs (VaultState, UserPosition)
        ├── instructions/
        │   ├── initialize.rs
        │   ├── deposit.rs
        │   └── withdraw.rs
        └── errors.rs
```

---

## Accounts

### `VaultState` (PDA)

```rust
#[account]
pub struct VaultState {
    pub authority: Pubkey,       // vault admin
    pub token_mint: Pubkey,      // deposit token (e.g. USDC mint)
    pub vault_mint: Pubkey,      // share token mint (minted on deposit)
    pub token_vault: Pubkey,     // PDA token account holding deposited funds
    pub total_shares: u64,
    pub total_assets: u64,
    pub bump: u8,
}
```

Seeds: `["vault", token_mint]`

### `UserPosition` (PDA)

```rust
#[account]
pub struct UserPosition {
    pub owner: Pubkey,
    pub vault: Pubkey,
    pub shares: u64,
    pub bump: u8,
}
```

Seeds: `["user_position", vault_pda, user_wallet]`

---

## Instructions

### `initialize`

Creates the vault PDA, vault token account, and share mint.

```rust
pub fn initialize(ctx: Context<Initialize>, vault_bump: u8) -> Result<()>
```

**Accounts:**
- `authority` — signer, pays for account creation
- `vault_state` — PDA init
- `token_mint` — the deposit token mint (USDC, wSOL, etc.)
- `vault_mint` — new share token mint (authority = vault PDA)
- `vault_token_account` — ATA owned by vault PDA
- `system_program`, `token_program`, `associated_token_program`, `rent`

---

### `deposit`

Transfers deposit tokens from user → vault, mints proportional share tokens to user.

```rust
pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()>
```

**Share calculation:**
```
if total_shares == 0:
    shares_to_mint = amount
else:
    shares_to_mint = (amount * total_shares) / total_assets
```

**Accounts:**
- `user` — signer
- `vault_state` — mutable
- `user_token_account` — source (user's ATA for deposit token)
- `vault_token_account` — destination (vault's ATA)
- `vault_mint` — mutable (for minting shares)
- `user_share_account` — user's ATA for share token (create if needed)
- `user_position` — PDA, init if first deposit
- `token_program`, `associated_token_program`, `system_program`

---

### `withdraw`

Burns user share tokens, releases proportional deposit tokens back to user.

```rust
pub fn withdraw(ctx: Context<Withdraw>, shares: u64) -> Result<()>
```

**Amount calculation:**
```
tokens_out = (shares * total_assets) / total_shares
```

**Accounts:**
- `user` — signer
- `vault_state` — mutable
- `user_token_account` — destination (user gets tokens back)
- `vault_token_account` — source (vault releases tokens)
- `vault_mint` — mutable (burn shares from here)
- `user_share_account` — source (burn from user's share ATA)
- `user_position` — PDA, mutable
- `token_program`, `associated_token_program`, `system_program`

---

## Error Codes

```rust
#[error_code]
pub enum VaultError {
    #[msg("Deposit amount must be greater than zero")]
    InvalidDepositAmount,
    #[msg("Withdraw shares must be greater than zero")]
    InvalidWithdrawShares,
    #[msg("Insufficient shares to withdraw")]
    InsufficientShares,
    #[msg("Arithmetic overflow")]
    Overflow,
}
```

---

## Build & Deploy to Devnet

### Prerequisites
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Install Anchor CLI
cargo install --git https://github.com/coral-xyz/anchor avm --locked
avm install latest && avm use latest
```

### Deploy Steps
```bash
# 1. Configure CLI for devnet
solana config set --url devnet
solana-keygen new --outfile ~/.config/solana/devnet-deployer.json
solana config set --keypair ~/.config/solana/devnet-deployer.json
solana airdrop 2  # fund deployer wallet

# 2. Build the program
anchor build

# 3. Get the program ID from the build
solana address -k target/deploy/yield_vault-keypair.json
# → copy this address into declare_id!() in lib.rs and Anchor.toml

# 4. Rebuild with correct program ID
anchor build

# 5. Deploy
anchor deploy --provider.cluster devnet

# 6. Record outputs
# Program ID → NEXT_PUBLIC_VAULT_PROGRAM_ID in .env.local
# IDL file  → cp target/idl/yield_vault.json src/lib/solana/idl/yield_vault.json
```

### Initialize First Vault (After Deploy)
```bash
# Initialize a USDC vault on devnet
anchor run initialize-devnet-vault
# (write a script in scripts/initialize-devnet-vault.ts)
```

---

## After Deployment

Update these files:

1. **`.env.local`**
   ```env
   NEXT_PUBLIC_VAULT_PROGRAM_ID=<deployed_program_id>
   ```

2. **`src/lib/solana/idl/yield_vault.json`** — copy from `target/idl/yield_vault.json`

3. **`src/lib/solana/vaultCatalog.ts`** — add the PDA addresses from the initialization script output

See `SOLANA_FRONTEND_WIRING.md` for how the frontend consumes these.

---

## Security Considerations for Devnet

- Vault authority should be a multisig even on devnet (use Squads protocol)
- No slippage protection required for Phase 4 devnet (add before mainnet)
- Rate limiting on withdrawals can be skipped for devnet
- Audit checklist lives in `SECURITY_AUDIT_CHECKLIST.md` (to be created pre-mainnet)
