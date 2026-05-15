// yield_oracle — AI Signal Oracle Program
//
// An authorised keeper (off-chain AI/ML process) posts strategy signals on-chain.
// Vault programs read SignalAccount PDAs before triggering rebalances.
//
// Staleness guard: signal older than 2 hours causes vault programs to reject
// rebalance requests — enforced by vault programs reading signal.posted_at.
//
// PDA seeds (oracle config): ["oracle_config"]
// PDA seeds (signal):        ["signal", strategy_id_byte]

use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod state;

use instructions::initialize_oracle::*;
use instructions::mark_rebalanced::*;
use instructions::post_signal::*;
use state::VolatilityRegime;

// Replace with: solana address -k target/deploy/yield_oracle-keypair.json
declare_id!("PLACEHOLDER_YIELD_ORACLE");

#[program]
pub mod yield_oracle {
    use super::*;

    /// Create the global oracle configuration PDA.
    /// Call once per deployment.
    pub fn initialize_oracle(ctx: Context<InitializeOracle>) -> Result<()> {
        instructions::initialize_oracle::handler(ctx)
    }

    /// Post (or overwrite) an AI signal for a strategy.
    /// Sets rebalance_needed = true and updates all signal fields.
    pub fn post_signal(
        ctx: Context<PostSignal>,
        strategy_id: u8,
        allocation_bps: u16,
        confidence: u8,
        volatility_regime: VolatilityRegime,
        suggested_lower_tick: i32,
        suggested_upper_tick: i32,
    ) -> Result<()> {
        instructions::post_signal::handler(
            ctx,
            strategy_id,
            allocation_bps,
            confidence,
            volatility_regime,
            suggested_lower_tick,
            suggested_upper_tick,
        )
    }

    /// Clear rebalance_needed after the associated vault has acted on the signal.
    pub fn mark_rebalanced(ctx: Context<MarkRebalanced>, strategy_id: u8) -> Result<()> {
        instructions::mark_rebalanced::handler(ctx, strategy_id)
    }
}
