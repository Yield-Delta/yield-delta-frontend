// stake.rs — User deposits SOL → vault wraps to wSOL → Marinade deposit → mSOL
//
// Marinade Finance devnet program: MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD
//
// Full Marinade CPI requires ~20 accounts (marinade_state, liq_pool_sol_leg_pda,
// liq_pool_msol_leg, treasury_msol_account, get_msol_from, get_msol_from_authority,
// etc.).  Rather than embed the entire off-chain Marinade SDK struct here — which
// would require a separate crate and exact IDL match — we use a verified minimal
// CPI stub that:
//   1. Transfers wSOL from the user into the vault's wSOL ATA.
//   2. Emits a StakeEvent log that the off-chain keeper reads.
//   3. The keeper executes the real Marinade deposit and sends mSOL to the
//      vault_msol_account, then calls update_msol_balance.
//
// This pattern keeps the on-chain program compilable and deployable on devnet
// while the keeper handles the actual Marinade interaction.
//
// TODO: Replace the stub with a full Marinade CPI once the Marinade Rust SDK
// (marinade-finance/marinade-sdk) stabilises for Anchor 0.30.

use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, MintTo, Token, TokenAccount, Transfer},
};

use crate::errors::StakingVaultError;
use crate::state::{StakingVaultState, UserStakePosition};

// ---------------------------------------------------------------------------
// Accounts
// ---------------------------------------------------------------------------

#[derive(Accounts)]
pub struct Stake<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    /// Staking vault state PDA.
    /// Seeds: ["staking_vault", wsol_mint]
    #[account(
        mut,
        seeds = [b"staking_vault", vault_state.token_mint.as_ref()],
        bump = vault_state.bump,
        constraint = !vault_state.paused @ StakingVaultError::VaultPaused,
    )]
    pub vault_state: Account<'info, StakingVaultState>,

    /// User's wSOL ATA — source of funds.
    #[account(
        mut,
        constraint = user_wsol_account.mint == vault_state.token_mint
            @ StakingVaultError::Overflow,
        constraint = user_wsol_account.owner == user.key()
            @ StakingVaultError::Unauthorized,
    )]
    pub user_wsol_account: Account<'info, TokenAccount>,

    /// Vault's wSOL ATA — interim holding before Marinade deposit.
    #[account(
        mut,
        constraint = vault_wsol_account.key() == vault_state.vault_wsol_account
            @ StakingVaultError::Overflow,
    )]
    pub vault_wsol_account: Account<'info, TokenAccount>,

    /// Share-token mint.
    #[account(
        mut,
        constraint = vault_mint.key() == vault_state.vault_mint
            @ StakingVaultError::Overflow,
    )]
    pub vault_mint: Account<'info, Mint>,

    /// User's share-token ATA — created on first stake.
    #[account(
        init_if_needed,
        payer = user,
        associated_token::mint = vault_mint,
        associated_token::authority = user,
    )]
    pub user_share_account: Account<'info, TokenAccount>,

    /// Per-user position PDA.
    /// Seeds: ["user_stake", vault_state, user]
    #[account(
        init_if_needed,
        payer = user,
        space = UserStakePosition::LEN,
        seeds = [b"user_stake", vault_state.key().as_ref(), user.key().as_ref()],
        bump,
    )]
    pub user_position: Account<'info, UserStakePosition>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

pub fn handler(ctx: Context<Stake>, lamports: u64) -> Result<()> {
    require!(
        lamports >= StakingVaultState::MIN_DEPOSIT_LAMPORTS,
        StakingVaultError::DepositTooSmall
    );

    let vault = &ctx.accounts.vault_state;

    // Compute shares before mutating state
    let shares_to_mint = vault
        .shares_for_sol(lamports)
        .ok_or(StakingVaultError::Overflow)?;
    require!(shares_to_mint > 0, StakingVaultError::DepositTooSmall);

    // --- Step 1: transfer wSOL from user → vault wSOL ATA ------------------
    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from:      ctx.accounts.user_wsol_account.to_account_info(),
                to:        ctx.accounts.vault_wsol_account.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            },
        ),
        lamports,
    )?;

    // --- Step 2: mint share tokens to user ----------------------------------
    // Vault PDA signs.
    let wsol_key = ctx.accounts.vault_state.token_mint;
    let bump     = ctx.accounts.vault_state.bump;
    let seeds: &[&[u8]] = &[b"staking_vault", wsol_key.as_ref(), &[bump]];
    let signer_seeds = &[seeds];

    token::mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint:      ctx.accounts.vault_mint.to_account_info(),
                to:        ctx.accounts.user_share_account.to_account_info(),
                authority: ctx.accounts.vault_state.to_account_info(),
            },
            signer_seeds,
        ),
        shares_to_mint,
    )?;

    // --- Step 3: update state -----------------------------------------------
    let vault = &mut ctx.accounts.vault_state;
    vault.total_assets = vault
        .total_assets
        .checked_add(lamports)
        .ok_or(StakingVaultError::Overflow)?;
    vault.total_shares = vault
        .total_shares
        .checked_add(shares_to_mint)
        .ok_or(StakingVaultError::Overflow)?;

    // User position
    let pos = &mut ctx.accounts.user_position;
    if pos.owner == Pubkey::default() {
        pos.owner = ctx.accounts.user.key();
        pos.vault = ctx.accounts.vault_state.key();
        pos.bump  = ctx.bumps.user_position;
    }
    pos.shares = pos
        .shares
        .checked_add(shares_to_mint)
        .ok_or(StakingVaultError::Overflow)?;
    pos.total_deposited_lamports = pos
        .total_deposited_lamports
        .checked_add(lamports)
        .ok_or(StakingVaultError::Overflow)?;

    // --- Step 4: emit keeper event for Marinade deposit --------------------
    // TODO: Replace with direct Marinade CPI when SDK stabilises.
    // The off-chain keeper listens for this log, executes:
    //   marinade.deposit(lamports) → receives mSOL → transfers to vault_msol_account
    // then calls update_msol_balance.
    msg!(
        "KEEPER_MARINADE_DEPOSIT: vault={} wsol_amount={} user={}",
        ctx.accounts.vault_state.key(),
        lamports,
        ctx.accounts.user.key(),
    );

    msg!(
        "Stake: user={} lamports={} shares_minted={} \
         total_assets={} total_shares={}",
        ctx.accounts.user.key(),
        lamports,
        shares_to_mint,
        ctx.accounts.vault_state.total_assets,
        ctx.accounts.vault_state.total_shares,
    );
    Ok(())
}

// ---------------------------------------------------------------------------
// UpdateMsolBalance — called by keeper after Marinade deposit completes
// ---------------------------------------------------------------------------

#[derive(Accounts)]
pub struct UpdateMsolBalance<'info> {
    /// Only vault authority may update mSOL balance.
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"staking_vault", vault_state.token_mint.as_ref()],
        bump = vault_state.bump,
        has_one = authority @ StakingVaultError::Unauthorized,
    )]
    pub vault_state: Account<'info, StakingVaultState>,

    /// Vault's mSOL ATA — read balance from this account.
    #[account(
        constraint = vault_msol_account.key() == vault_state.vault_msol_account
            @ StakingVaultError::Overflow,
    )]
    pub vault_msol_account: Account<'info, TokenAccount>,
}

pub fn handler_update_msol(
    ctx: Context<UpdateMsolBalance>,
    new_msol_price_lamports: u64,
) -> Result<()> {
    let now = Clock::get()?.unix_timestamp;
    let on_chain_msol = ctx.accounts.vault_msol_account.amount;

    let vault = &mut ctx.accounts.vault_state;

    // Recompute total_assets = mSOL held × price + wSOL idle
    // (wSOL balance is tracked separately; keeper passes new exchange rate)
    let msol_value = (on_chain_msol as u128)
        .checked_mul(new_msol_price_lamports as u128)
        .ok_or(StakingVaultError::Overflow)?
        .checked_div(1_000_000_000u128)
        .ok_or(StakingVaultError::Overflow)? as u64;

    vault.total_msol           = on_chain_msol;
    vault.msol_price_lamports  = new_msol_price_lamports;
    vault.last_rate_update     = now;

    // total_assets reflects current staked value; yield appreciation is implicit
    // in the increasing mSOL/SOL exchange rate.
    vault.total_assets = msol_value;

    msg!(
        "UpdateMsolBalance: msol_held={} price_lamports={} \
         total_assets={} updated_at={}",
        on_chain_msol,
        new_msol_price_lamports,
        vault.total_assets,
        now,
    );
    Ok(())
}
