// unstake.rs — User burns shares → Marinade liquid unstake → wSOL to user.
//
// Same keeper pattern as stake.rs:
//   1. Burn user share tokens.
//   2. Emit KEEPER_MARINADE_UNSTAKE log.
//   3. Keeper calls Marinade liquidUnstake, wSOL arrives in vault_wsol_account.
//   4. Vault transfers wSOL to user.
//
// For immediate liquidity (no unstake delay) we use Marinade's liquidUnstake
// which draws from the liquidity pool at a small fee (~0.3 %).
// If the pool is empty the keeper falls back to delayed unstake (ticket system).
//
// TODO: Replace with direct Marinade CPI when SDK stabilises.

use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Burn, Mint, Token, TokenAccount, Transfer},
};

use crate::errors::StakingVaultError;
use crate::state::{StakingVaultState, UserStakePosition};

// ---------------------------------------------------------------------------
// Accounts
// ---------------------------------------------------------------------------

#[derive(Accounts)]
pub struct Unstake<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    /// Staking vault state PDA.
    #[account(
        mut,
        seeds = [b"staking_vault", vault_state.token_mint.as_ref()],
        bump = vault_state.bump,
        constraint = !vault_state.paused @ StakingVaultError::VaultPaused,
    )]
    pub vault_state: Account<'info, StakingVaultState>,

    /// User's wSOL ATA — receives redeemed SOL.
    #[account(
        mut,
        constraint = user_wsol_account.mint == vault_state.token_mint
            @ StakingVaultError::Overflow,
        constraint = user_wsol_account.owner == user.key()
            @ StakingVaultError::Unauthorized,
    )]
    pub user_wsol_account: Account<'info, TokenAccount>,

    /// Vault's wSOL ATA — source of redemption liquidity.
    #[account(
        mut,
        constraint = vault_wsol_account.key() == vault_state.vault_wsol_account
            @ StakingVaultError::Overflow,
    )]
    pub vault_wsol_account: Account<'info, TokenAccount>,

    /// Share-token mint — for burning shares.
    #[account(
        mut,
        constraint = vault_mint.key() == vault_state.vault_mint
            @ StakingVaultError::Overflow,
    )]
    pub vault_mint: Account<'info, Mint>,

    /// User's share-token ATA.
    #[account(
        mut,
        constraint = user_share_account.mint == vault_state.vault_mint
            @ StakingVaultError::Overflow,
        constraint = user_share_account.owner == user.key()
            @ StakingVaultError::Unauthorized,
    )]
    pub user_share_account: Account<'info, TokenAccount>,

    /// Per-user position PDA.
    /// Seeds: ["user_stake", vault_state, user]
    #[account(
        mut,
        seeds = [b"user_stake", vault_state.key().as_ref(), user.key().as_ref()],
        bump = user_position.bump,
        constraint = user_position.owner == user.key()
            @ StakingVaultError::Unauthorized,
    )]
    pub user_position: Account<'info, UserStakePosition>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

pub fn handler(ctx: Context<Unstake>, shares: u64) -> Result<()> {
    require!(shares > 0, StakingVaultError::InsufficientShares);
    require!(
        ctx.accounts.user_position.shares >= shares,
        StakingVaultError::InsufficientShares
    );
    require!(
        ctx.accounts.vault_state.total_shares > 0,
        StakingVaultError::ZeroShares
    );

    let vault = &ctx.accounts.vault_state;

    // SOL equivalent to return = shares * total_assets / total_shares
    let sol_out = vault
        .sol_for_shares(shares)
        .ok_or(StakingVaultError::Overflow)?;

    // Check immediate wSOL liquidity in the vault ATA.
    // If insufficient, the keeper will handle the Marinade unstake asynchronously
    // and deliver funds once available.  For devnet UX we still process the share
    // burn so the user's position is immediately updated.
    let available_wsol = ctx.accounts.vault_wsol_account.amount;

    // --- Step 1: burn share tokens -----------------------------------------
    token::burn(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Burn {
                mint:      ctx.accounts.vault_mint.to_account_info(),
                from:      ctx.accounts.user_share_account.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            },
        ),
        shares,
    )?;

    // --- Step 2: transfer available wSOL if present ------------------------
    // In production: keeper handles Marinade liquidUnstake and delivers wSOL.
    // Here we transfer whatever wSOL is already in the vault (from idle deposits
    // not yet delegated, or from previous unstakes that completed).
    let transfer_amount = sol_out.min(available_wsol);

    if transfer_amount > 0 {
        let wsol_key = vault.token_mint;
        let bump     = vault.bump;
        let seeds: &[&[u8]] = &[b"staking_vault", wsol_key.as_ref(), &[bump]];
        let signer_seeds = &[seeds];

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from:      ctx.accounts.vault_wsol_account.to_account_info(),
                    to:        ctx.accounts.user_wsol_account.to_account_info(),
                    authority: ctx.accounts.vault_state.to_account_info(),
                },
                signer_seeds,
            ),
            transfer_amount,
        )?;
    }

    // --- Step 3: update state ----------------------------------------------
    let vault = &mut ctx.accounts.vault_state;
    vault.total_shares = vault
        .total_shares
        .checked_sub(shares)
        .ok_or(StakingVaultError::Overflow)?;
    vault.total_assets = vault
        .total_assets
        .checked_sub(sol_out)
        .ok_or(StakingVaultError::Overflow)?;

    let pos = &mut ctx.accounts.user_position;
    pos.shares = pos
        .shares
        .checked_sub(shares)
        .ok_or(StakingVaultError::Overflow)?;
    pos.total_withdrawn_lamports = pos
        .total_withdrawn_lamports
        .checked_add(sol_out)
        .ok_or(StakingVaultError::Overflow)?;

    // --- Step 4: emit keeper event if Marinade unstake needed --------------
    if sol_out > transfer_amount {
        let remaining = sol_out
            .checked_sub(transfer_amount)
            .ok_or(StakingVaultError::Overflow)?;
        // TODO: Replace with direct Marinade liquidUnstake CPI.
        msg!(
            "KEEPER_MARINADE_UNSTAKE: vault={} lamports_needed={} user={}",
            ctx.accounts.vault_state.key(),
            remaining,
            ctx.accounts.user.key(),
        );
    }

    msg!(
        "Unstake: user={} shares={} sol_out={} transferred={} \
         total_assets={} total_shares={}",
        ctx.accounts.user.key(),
        shares,
        sol_out,
        transfer_amount,
        ctx.accounts.vault_state.total_assets,
        ctx.accounts.vault_state.total_shares,
    );
    Ok(())
}
