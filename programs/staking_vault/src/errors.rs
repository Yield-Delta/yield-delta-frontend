use anchor_lang::prelude::*;

#[error_code]
pub enum StakingVaultError {
    #[msg("Deposit amount must be at least the minimum threshold (0.01 SOL)")]
    DepositTooSmall,

    #[msg("Insufficient shares to withdraw")]
    InsufficientShares,

    #[msg("Vault is currently paused")]
    VaultPaused,

    #[msg("Caller is not the vault authority")]
    Unauthorized,

    #[msg("Arithmetic overflow or underflow")]
    Overflow,

    #[msg("Zero shares in circulation; cannot compute redemption")]
    ZeroShares,

    #[msg("Marinade CPI failed or Marinade unavailable on devnet")]
    MarinadeUnavailable,

    #[msg("mSOL exchange rate is stale; update before transacting")]
    StaleExchangeRate,

    #[msg("Withdraw amount would exceed available liquidity")]
    InsufficientLiquidity,
}
