use anchor_lang::prelude::*;

// ---------------------------------------------------------------------------
// Volatility regime — used by LP vaults to choose tick width
// ---------------------------------------------------------------------------

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug)]
#[repr(u8)]
pub enum VolatilityRegime {
    /// Calm market — use tighter tick ranges for higher fee capture.
    Low    = 0,
    /// Normal market conditions.
    Medium = 1,
    /// High-volatility market — use wider tick ranges to reduce impermanent loss.
    High   = 2,
}

// ---------------------------------------------------------------------------
// OracleState — global oracle config
// PDA seeds: ["oracle_config"]
// ---------------------------------------------------------------------------

#[account]
pub struct OracleState {
    /// Authorised keeper that may post / update signals.
    pub authority: Pubkey,

    /// Total number of signal accounts registered.
    pub signal_count: u64,

    /// Bump seed.
    pub bump: u8,
}

impl OracleState {
    /// discriminator (8) + Pubkey (32) + u64 (8) + u8 (1) + padding (7)
    pub const LEN: usize = 8 + 32 + 8 + 1 + 7;
}

// ---------------------------------------------------------------------------
// SignalAccount — per-strategy AI signal
// PDA seeds: ["signal", strategy_id_bytes]
// strategy_id is a u8 matching the StrategyType enum in yield_vault_core
// ---------------------------------------------------------------------------

#[account]
pub struct SignalAccount {
    /// Which strategy this signal targets (0–6, matches StrategyType).
    pub strategy_id: u8,

    /// AI-recommended allocation in basis points (0–10 000).
    /// 10 000 = 100 % of available capital should be deployed in this strategy.
    pub recommended_allocation_bps: u16,

    /// Model confidence score 0–100.
    pub confidence: u8,

    /// Current volatility regime assessment.
    pub volatility_regime: VolatilityRegime,

    /// Unix timestamp when this signal was posted.
    pub posted_at: i64,

    /// Whether the associated vault has already acted on this signal.
    pub rebalance_needed: bool,

    /// Lower tick override for LP vaults (i32::MIN = "use default").
    pub suggested_lower_tick: i32,

    /// Upper tick override for LP vaults (i32::MAX = "use default").
    pub suggested_upper_tick: i32,

    /// Bump seed.
    pub bump: u8,
}

impl SignalAccount {
    /// discriminator (8) + u8 (1) + u16 (2) + u8 (1) + u8 regime (1)
    /// + i64 (8) + bool (1) + 2×i32 (8) + u8 (1) + padding (2)
    pub const LEN: usize = 8 + 1 + 2 + 1 + 1 + 8 + 1 + 8 + 1 + 2;

    /// Signals older than 2 hours are considered stale.
    pub const STALENESS_SECS: i64 = 2 * 3600;

    /// Returns true if the signal is fresh enough to act on.
    pub fn is_fresh(&self, now: i64) -> bool {
        (now - self.posted_at) < Self::STALENESS_SECS
    }
}
