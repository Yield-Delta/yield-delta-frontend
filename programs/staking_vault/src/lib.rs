// staking_vault — SOL Liquid Staking Vault (Strategy 2)
//
// Accepts native SOL (wrapped to wSOL), delegates to Marinade Finance for mSOL,
// and issues proportional share tokens.  Yield accrues via mSOL exchange-rate
// appreciation (no explicit harvest required by users).
//
// Marinade devnet program: MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD
//
// PDA seeds (vault):    ["staking_vault", wsol_mint]
// PDA seeds (position): ["user_stake", vault_state, user]

use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod state;

use instructions::initialize::*;
use instructions::stake::*;
use instructions::unstake::*;

// Replace with: solana address -k target/deploy/staking_vault-keypair.json
declare_id!("PLACEHOLDER_STAKING_VAULT");

#[program]
pub mod staking_vault {
    use super::*;

    /// Initialise the staking vault — create state PDA, share mint, wSOL and
    /// mSOL ATAs.  Called once per deployment.
    pub fn initialize(
        ctx: Context<InitializeStakingVault>,
        performance_fee_bps: u16,
    ) -> Result<()> {
        instructions::initialize::handler(ctx, performance_fee_bps)
    }

    /// Deposit wSOL → receive share tokens.
    /// Keeper follows up with Marinade deposit to receive mSOL.
    pub fn stake(ctx: Context<Stake>, lamports: u64) -> Result<()> {
        instructions::stake::handler(ctx, lamports)
    }

    /// Burn share tokens → receive wSOL.
    /// Keeper follows up with Marinade liquidUnstake if vault lacks liquidity.
    pub fn unstake(ctx: Context<Unstake>, shares: u64) -> Result<()> {
        instructions::unstake::handler(ctx, shares)
    }

    /// Called by keeper after Marinade deposit / unstake completes to sync
    /// mSOL balance and exchange rate.
    pub fn update_msol_balance(
        ctx: Context<UpdateMsolBalance>,
        new_msol_price_lamports: u64,
    ) -> Result<()> {
        instructions::stake::handler_update_msol(ctx, new_msol_price_lamports)
    }
}
