use anchor_lang::prelude::*;

#[error_code]
pub enum VaultCoreError {
    #[msg("Deposit amount must be greater than the minimum threshold")]
    DepositTooSmall,

    #[msg("Withdraw shares must be greater than zero")]
    InvalidWithdrawShares,

    #[msg("Insufficient shares to fulfill the withdrawal")]
    InsufficientShares,

    #[msg("Vault currently paused — deposits and withdrawals are disabled")]
    VaultPaused,

    #[msg("Arithmetic overflow or underflow")]
    Overflow,

    #[msg("Caller is not the vault authority")]
    Unauthorized,

    #[msg("Fee basis points exceed 10 000")]
    FeeBpsTooLarge,

    #[msg("Total assets is zero; cannot compute share price")]
    ZeroAssets,

    #[msg("Total shares is zero; cannot compute asset redemption")]
    ZeroShares,

    #[msg("Vault has no yield to harvest fees from")]
    NothingToHarvest,

    #[msg("Management fee accrual timestamp is in the future")]
    InvalidTimestamp,
}
