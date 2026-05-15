// yield_vault_core — Core Vault Base Program
//
// Provides ERC4626-style share accounting, fee accrual, and admin controls
// that all strategy-specific vault programs build on.
//
// PDA seeds (vault state): ["vault_core", strategy_type_byte, token_mint]
// PDA seeds (user position): ["user_position", vault_state, user_wallet]

use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod state;

use instructions::admin::*;
use instructions::deposit::*;
use instructions::harvest_fees::*;
use instructions::initialize::*;
use instructions::withdraw::*;

use state::StrategyType;

// Replace with address from: solana address -k target/deploy/yield_vault_core-keypair.json
declare_id!("PLACEHOLDER_YIELD_VAULT_CORE");

#[program]
pub mod yield_vault_core {
    use super::*;

    // -----------------------------------------------------------------------
    // Lifecycle
    // -----------------------------------------------------------------------

    /// Creates vault state PDA, share-mint, and vault token ATA.
    /// Called once per (strategy_type, token_mint) pair.
    pub fn initialize(
        ctx: Context<InitializeVaultCore>,
        strategy_type: StrategyType,
        performance_fee_bps: u16,
        management_fee_bps: u16,
    ) -> Result<()> {
        instructions::initialize::handler(ctx, strategy_type, performance_fee_bps, management_fee_bps)
    }

    // -----------------------------------------------------------------------
    // User instructions
    // -----------------------------------------------------------------------

    /// Deposit tokens → mint proportional share tokens (ERC4626).
    pub fn deposit(ctx: Context<DepositCore>, amount: u64) -> Result<()> {
        instructions::deposit::handler(ctx, amount)
    }

    /// Burn share tokens → receive proportional deposit tokens back.
    pub fn withdraw(ctx: Context<WithdrawCore>, shares: u64) -> Result<()> {
        instructions::withdraw::handler(ctx, shares)
    }

    // -----------------------------------------------------------------------
    // Authority instructions
    // -----------------------------------------------------------------------

    /// Transfer accrued management fees to the fee-receiver ATA.
    pub fn harvest_fees(ctx: Context<HarvestFees>) -> Result<()> {
        instructions::harvest_fees::handler(ctx)
    }

    /// Force-exit a user's position; bypasses pause guard.
    pub fn emergency_withdraw(ctx: Context<EmergencyWithdraw>, shares: u64) -> Result<()> {
        instructions::withdraw::handler_emergency(ctx, shares)
    }

    /// Pause user-facing instructions (deposit / withdraw).
    pub fn pause(ctx: Context<AdminVaultCore>) -> Result<()> {
        instructions::admin::handler_pause(ctx)
    }

    /// Unpause the vault.
    pub fn unpause(ctx: Context<AdminVaultCore>) -> Result<()> {
        instructions::admin::handler_unpause(ctx)
    }

    /// Update performance and management fee basis points.
    pub fn update_fees(
        ctx: Context<UpdateFees>,
        performance_fee_bps: u16,
        management_fee_bps: u16,
    ) -> Result<()> {
        instructions::admin::handler_update_fees(ctx, performance_fee_bps, management_fee_bps)
    }

    /// Transfer vault authority to a new pubkey.
    pub fn transfer_authority(ctx: Context<TransferAuthority>) -> Result<()> {
        instructions::admin::handler_transfer_authority(ctx)
    }
}
