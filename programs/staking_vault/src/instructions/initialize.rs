use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount},
};

use crate::state::StakingVaultState;

// ---------------------------------------------------------------------------
// Accounts
// PDA seeds: ["staking_vault", wsol_mint]
// ---------------------------------------------------------------------------

#[derive(Accounts)]
pub struct InitializeStakingVault<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    /// wSOL mint: So11111111111111111111111111111111111111112
    pub wsol_mint: Account<'info, Mint>,

    /// mSOL mint on devnet.
    pub msol_mint: Account<'info, Mint>,

    /// Staking vault state PDA.
    #[account(
        init,
        payer = authority,
        space = StakingVaultState::LEN,
        seeds = [b"staking_vault", wsol_mint.key().as_ref()],
        bump,
    )]
    pub vault_state: Account<'info, StakingVaultState>,

    /// Share-token mint — vault PDA is mint authority.
    #[account(
        init,
        payer = authority,
        mint::decimals = 9,
        mint::authority = vault_state,
        mint::freeze_authority = vault_state,
    )]
    pub vault_mint: Account<'info, Mint>,

    /// Vault ATA for wSOL (idle SOL before staking).
    #[account(
        init,
        payer = authority,
        associated_token::mint = wsol_mint,
        associated_token::authority = vault_state,
    )]
    pub vault_wsol_account: Account<'info, TokenAccount>,

    /// Vault ATA for mSOL (staked yield-bearing tokens).
    #[account(
        init,
        payer = authority,
        associated_token::mint = msol_mint,
        associated_token::authority = vault_state,
    )]
    pub vault_msol_account: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

pub fn handler(ctx: Context<InitializeStakingVault>, performance_fee_bps: u16) -> Result<()> {
    let now = Clock::get()?.unix_timestamp;

    let vault = &mut ctx.accounts.vault_state;
    vault.authority           = ctx.accounts.authority.key();
    vault.token_mint          = ctx.accounts.wsol_mint.key();
    vault.vault_mint          = ctx.accounts.vault_mint.key();
    vault.vault_wsol_account  = ctx.accounts.vault_wsol_account.key();
    vault.vault_msol_account  = ctx.accounts.vault_msol_account.key();
    vault.msol_mint           = ctx.accounts.msol_mint.key();
    vault.total_shares        = 0;
    vault.total_assets        = 0;
    vault.total_msol          = 0;
    vault.last_rate_update    = now;
    // Initial exchange rate: 1 mSOL ≈ 1 SOL (will be updated by keeper)
    vault.msol_price_lamports = 1_000_000_000; // 1e9 lamports
    vault.paused              = false;
    vault.performance_fee_bps = performance_fee_bps;
    vault.bump                = ctx.bumps.vault_state;

    msg!(
        "StakingVault initialized: wsol_mint={} msol_mint={} pda={}",
        ctx.accounts.wsol_mint.key(),
        ctx.accounts.msol_mint.key(),
        ctx.accounts.vault_state.key(),
    );
    Ok(())
}
