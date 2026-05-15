use anchor_lang::prelude::*;

// ---------------------------------------------------------------------------
// Strategy type enum — one byte, embedded in PDA seed
// ---------------------------------------------------------------------------

/// Identifies the yield strategy variant a vault instance executes.
/// Serialised as a u8 in the PDA seed so each strategy gets its own PDA
/// space even when sharing the same deposit-token mint.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug)]
#[repr(u8)]
pub enum StrategyType {
    /// Single-asset USDC stablecoin lending (strategy 1)
    StablecoinLending = 0,
    /// SOL liquid staking via Marinade / Jito (strategy 2)
    SolStaking        = 1,
    /// Orca Whirlpool LP with auto-compounding (strategy 3)
    LpAutoCompound    = 2,
    /// Volatility-aware LP with AI tick adjustment (strategy 4)
    VolatilityAwareLp = 3,
    /// Delta-neutral LP + Drift perp hedge (strategy 5)
    DeltaNeutral      = 4,
    /// AI meta-allocator across sub-vaults (strategy 6)
    MetaAllocator     = 5,
    /// Experimental / sandbox (strategy 7)
    Experimental      = 6,
}

impl StrategyType {
    pub fn to_seed_byte(self) -> [u8; 1] {
        [self as u8]
    }
}

// ---------------------------------------------------------------------------
// VaultCoreState — primary vault account
// PDA seeds: ["vault_core", strategy_type_byte, token_mint]
// ---------------------------------------------------------------------------

#[account]
pub struct VaultCoreState {
    /// Vault administrator — authorises admin instructions and fee harvests.
    pub authority: Pubkey,

    /// Designated recipient of harvested performance and management fees.
    pub fee_receiver: Pubkey,

    /// The deposit-token SPL mint (e.g. devnet USDC, wSOL).
    pub token_mint: Pubkey,

    /// Share-token SPL mint; mint authority is this PDA.
    pub vault_mint: Pubkey,

    /// ATA owned by this PDA that holds deposited / idle tokens.
    pub vault_token_account: Pubkey,

    /// Which strategy this vault instance runs.
    pub strategy_type: StrategyType,

    /// Total share tokens currently in circulation (scaled by share-mint decimals).
    pub total_shares: u64,

    /// Total deposit tokens currently managed by this vault (includes deployed capital).
    pub total_assets: u64,

    /// Unix timestamp of the last management-fee accrual.
    pub last_fee_harvest: i64,

    /// Performance fee in basis points (e.g. 1000 = 10 %).
    pub performance_fee_bps: u16,

    /// Annual management fee in basis points (e.g. 50 = 0.5 %/year).
    pub management_fee_bps: u16,

    /// When true, deposits and withdrawals are blocked.
    pub paused: bool,

    /// Bump seed for this PDA.
    pub bump: u8,
}

impl VaultCoreState {
    /// On-chain space:
    ///   discriminator (8)
    ///   + 5×Pubkey (160)
    ///   + StrategyType/u8 (1)
    ///   + 2×u64 (16)
    ///   + i64 (8)
    ///   + 2×u16 (4)
    ///   + bool (1)
    ///   + u8 bump (1)
    ///   + padding to 8-byte alignment (1)
    pub const LEN: usize = 8 + 160 + 1 + 16 + 8 + 4 + 1 + 1 + 1;

    /// 10 000 basis-point denominator.
    pub const BPS_DENOM: u128 = 10_000;

    /// Seconds in a year (365.25 days) used for pro-rata management-fee calc.
    pub const SECS_PER_YEAR: u128 = 31_557_600;

    /// Minimum deposit to prevent share dilution attacks on first deposit.
    pub const MIN_DEPOSIT: u64 = 1_000;

    /// Calculate shares to mint for a given deposit amount (ERC4626 formula).
    ///
    /// First deposit: shares == assets (1:1, avoids division by zero).
    /// Subsequent:    shares = amount * total_shares / total_assets
    pub fn shares_for_deposit(&self, amount: u64) -> Option<u64> {
        if self.total_shares == 0 {
            // 1:1 seeding on first deposit
            Some(amount)
        } else {
            let shares = (amount as u128)
                .checked_mul(self.total_shares as u128)?
                .checked_div(self.total_assets as u128)?;
            Some(shares as u64)
        }
    }

    /// Calculate assets to return for a given share burn (ERC4626 formula).
    ///
    /// assets_out = shares * total_assets / total_shares
    pub fn assets_for_shares(&self, shares: u64) -> Option<u64> {
        let assets = (shares as u128)
            .checked_mul(self.total_assets as u128)?
            .checked_div(self.total_shares as u128)?;
        Some(assets as u64)
    }

    /// Accrue the time-weighted management fee and return the fee amount (in
    /// deposit-token units).  Does NOT mutate self — caller applies the delta.
    ///
    /// fee = total_assets * management_fee_bps / BPS_DENOM * elapsed_secs / SECS_PER_YEAR
    pub fn accrued_management_fee(&self, now: i64) -> Option<u64> {
        let elapsed = (now as u128).checked_sub(self.last_fee_harvest as u128)?;
        if elapsed == 0 {
            return Some(0);
        }
        let fee = (self.total_assets as u128)
            .checked_mul(self.management_fee_bps as u128)?
            .checked_mul(elapsed)?
            .checked_div(Self::BPS_DENOM)?
            .checked_div(Self::SECS_PER_YEAR)?;
        Some(fee as u64)
    }
}

// ---------------------------------------------------------------------------
// UserPosition — tracks individual shares per-user per-vault
// PDA seeds: ["user_position", vault_state, user]
// ---------------------------------------------------------------------------

#[account]
pub struct UserPosition {
    /// Wallet that owns this position.
    pub owner: Pubkey,

    /// The VaultCoreState PDA this position belongs to.
    pub vault: Pubkey,

    /// Share tokens credited to this user (mirrors on-chain share-token balance
    /// for convenient off-chain queries without token account lookup).
    pub shares: u64,

    /// Cumulative deposit tokens deposited lifetime (informational).
    pub total_deposited: u64,

    /// Cumulative deposit tokens withdrawn lifetime (informational).
    pub total_withdrawn: u64,

    /// Bump seed for this PDA.
    pub bump: u8,
}

impl UserPosition {
    /// discriminator (8) + 2×Pubkey (64) + 3×u64 (24) + u8 (1) + padding (7)
    pub const LEN: usize = 8 + 64 + 24 + 1 + 7;
}
