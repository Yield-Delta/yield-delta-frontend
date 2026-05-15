use anchor_lang::prelude::*;

#[error_code]
pub enum OracleError {
    #[msg("Caller is not the oracle authority")]
    Unauthorized,

    #[msg("Allocation basis points must be in range 0–10 000")]
    InvalidAllocationBps,

    #[msg("Confidence score must be in range 0–100")]
    InvalidConfidence,

    #[msg("Signal is stale (older than 2 hours); post a fresh signal before acting")]
    StaleSignal,

    #[msg("Signal has already been marked as rebalanced")]
    AlreadyRebalanced,

    #[msg("Arithmetic overflow")]
    Overflow,
}
