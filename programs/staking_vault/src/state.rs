use anchor_lang::prelude::*;

// ---------------------------------------------------------------------------
// Marinade devnet program ID
// Mainnet: MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD
// The same ID is usable on devnet for CPI purposes (Marinade deploys both).
// ---------------------------------------------------------------------------
pub const MARINADE_PROGRAM_ID: &str = "MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD";

// mSOL mint on devnet (Marinade's devnet mSOL)
pub const MSOL_MINT_DEVNET: &str = "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So";

// ---------------------------------------------------------------------------
// StakingVaultState
// PDA seeds: ["staking_vault", token_mint (wSOL)]
// ---------------------------------------------------------------------------

#[account]
pub struct StakingVaultState {
    /// Vault admin.
    pub authority: Pubkey,

    /// wSOL mint (So11111111111111111111111111111111111111112).
    pub token_mint: Pubkey,

    /// Share-token mint; authority is this PDA.
    pub vault_mint: Pubkey,

    /// Vault's ATA for wSOL (idle liquidity before staking).
    pub vault_wsol_account: Pubkey,

    /// Vault's ATA for mSOL (yield-bearing collateral).
    pub vault_msol_account: Pubkey,

    /// mSOL SPL mint address.
    pub msol_mint: Pubkey,

    /// Total share tokens in circulation.
    pub total_shares: u64,

    /// Total SOL equivalent managed (wSOL deposited + mSOL at exchange rate).
    pub total_assets: u64,

    /// Total mSOL tokens held by the vault.
    pub total_msol: u64,

    /// Unix timestamp of last mSOL exchange-rate snapshot.
    pub last_rate_update: i64,

    /// Cached mSOL/SOL exchange rate × 1e9 (lamports per mSOL).
    /// Updated during rebalances; used for share-price estimation.
    pub msol_price_lamports: u64,

    /// When true, deposits and withdrawals are blocked.
    pub paused: bool,

    /// Performance fee in bps (10 % default).
    pub performance_fee_bps: u16,

    /// Bump seed.
    pub bump: u8,
}

impl StakingVaultState {
    /// discriminator (8) + 6×Pubkey (192) + 3×u64 (24) + i64 (8)
    /// + u64 (8) + bool (1) + u16 (2) + u8 (1) + padding (4)
    pub const LEN: usize = 8 + 192 + 24 + 8 + 8 + 1 + 2 + 1 + 4;

    pub const MIN_DEPOSIT_LAMPORTS: u64 = 10_000_000; // 0.01 SOL

    /// Compute share-mint amount for a SOL deposit using current mSOL price.
    pub fn shares_for_sol(&self, lamports: u64) -> Option<u64> {
        if self.total_shares == 0 {
            Some(lamports)
        } else {
            // ERC4626: shares = lamports * total_shares / total_assets
            let shares = (lamports as u128)
                .checked_mul(self.total_shares as u128)?
                .checked_div(self.total_assets as u128)?;
            Some(shares as u64)
        }
    }

    /// Compute SOL redemption for a share burn.
    pub fn sol_for_shares(&self, shares: u64) -> Option<u64> {
        let lamports = (shares as u128)
            .checked_mul(self.total_assets as u128)?
            .checked_div(self.total_shares as u128)?;
        Some(lamports as u64)
    }
}

// ---------------------------------------------------------------------------
// UserStakePosition
// PDA seeds: ["user_stake", vault_state, user]
// ---------------------------------------------------------------------------

#[account]
pub struct UserStakePosition {
    pub owner: Pubkey,
    pub vault: Pubkey,
    pub shares: u64,
    pub total_deposited_lamports: u64,
    pub total_withdrawn_lamports: u64,
    pub bump: u8,
}

impl UserStakePosition {
    /// discriminator (8) + 2×Pubkey (64) + 3×u64 (24) + u8 (1) + padding (7)
    pub const LEN: usize = 8 + 64 + 24 + 1 + 7;
}
