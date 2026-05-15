use anchor_lang::prelude::*;

use crate::state::OracleState;

// ---------------------------------------------------------------------------
// Accounts
// PDA seeds: ["oracle_config"]
// ---------------------------------------------------------------------------

#[derive(Accounts)]
pub struct InitializeOracle<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    /// Global oracle configuration PDA.
    #[account(
        init,
        payer = authority,
        space = OracleState::LEN,
        seeds = [b"oracle_config"],
        bump,
    )]
    pub oracle_state: Account<'info, OracleState>,

    pub system_program: Program<'info, System>,
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

pub fn handler(ctx: Context<InitializeOracle>) -> Result<()> {
    let oracle = &mut ctx.accounts.oracle_state;
    oracle.authority    = ctx.accounts.authority.key();
    oracle.signal_count = 0;
    oracle.bump         = ctx.bumps.oracle_state;

    msg!(
        "Oracle initialized: authority={} pda={}",
        ctx.accounts.authority.key(),
        ctx.accounts.oracle_state.key(),
    );
    Ok(())
}
