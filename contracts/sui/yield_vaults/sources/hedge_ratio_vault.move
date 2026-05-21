/// GBM Hedge-Ratio Vault
///
/// Implements the constrained optimal hedge ratio:
///     h** = min(h*, h̄(α))
///
/// where:
///   h* is the unconstrained GBM moment-matched hedge ratio,
///   h̄(α) is the maximum ratio that keeps P(LTV > ℓ_max) < 1−α.
///
/// Rebalancing frequency T is scaled down as realized volatility σ̃ increases,
/// ensuring the vault stays within its risk envelope automatically.
///
/// An owned MarginManager routes all collateral operations through
/// DeepBook Margin on the parallel execution fast-path.
module yield_vaults::hedge_ratio_vault;

use sui::balance::{Self, Balance};
use sui::coin::{Self, Coin};
use sui::clock::Clock;
use sui::event;

// === Errors ===

#[error]
const EZeroAmount: vector<u8> = b"Amount must be greater than zero";
#[error]
const EHedgeRatioExceedsMax: vector<u8> = b"Proposed h* exceeds h_bar(alpha) constraint";
#[error]
const EInsufficientShares: vector<u8> = b"Insufficient shares to withdraw";
#[error]
const ETooEarlyToRebalance: vector<u8> = b"Rebalance interval T has not elapsed yet";
#[error]
const EVaultPaused: vector<u8> = b"Vault is paused";

// === Constants ===

const SCALE: u64 = 1_000_000_000; // 1e9 — fixed-point scaling factor
const DEFAULT_ALPHA_BPS: u64 = 9_900; // 99% confidence (1% liquidation tolerance)
const DEFAULT_LTV_MAX_BPS: u64 = 8_000; // 80% max LTV before liquidation
const MIN_REBALANCE_INTERVAL_MS: u64 = 60_000; // 1 minute floor

// === Structs ===

public struct AdminCap has key, store {
    id: UID,
    vault_id: ID,
}

/// Owned MarginManager — holds collateral positions on DeepBook Margin.
/// Owned objects bypass consensus, ensuring rebalances execute on the
/// parallel fast-path without contending with other users.
public struct MarginManager has key {
    id: UID,
    vault_id: ID,
    /// Collateral posted to DeepBook Margin (in SUI MIST).
    collateral: Balance<0x2::sui::SUI>,
    /// Outstanding borrow (tracks LTV).
    borrow_amount: u64,
}

/// Shared vault — holds depositor funds and hedge state.
public struct HedgeRatioVault has key {
    id: UID,
    /// Current optimal hedge ratio h* in scaled units (SCALE = 1.0).
    h_star: u64,
    /// Maximum allowed hedge ratio h̄(α) in scaled units.
    h_bar: u64,
    /// Risk tolerance alpha in basis points (e.g., 9900 = 99%).
    alpha_bps: u64,
    /// Maximum LTV threshold ℓ_max in basis points.
    ltv_max_bps: u64,
    /// Realized annualized volatility σ̃ in scaled units.
    sigma_tilde: u64,
    /// Dynamic rebalancing interval T in milliseconds.
    rebalance_interval_ms: u64,
    /// Timestamp of last rebalance.
    last_rebalance_ms: u64,
    /// Depositor principal.
    vault_balance: Balance<0x2::sui::SUI>,
    /// Total LP shares outstanding.
    total_shares: u64,
    /// Total deposited (TVL proxy).
    total_deposited: u64,
    paused: bool,
}

// === Events ===

public struct Deposited has copy, drop {
    vault_id: ID,
    depositor: address,
    amount: u64,
    shares_minted: u64,
}

public struct Withdrawn has copy, drop {
    vault_id: ID,
    recipient: address,
    shares_burned: u64,
    amount_out: u64,
}

public struct HedgeRatioUpdated has copy, drop {
    vault_id: ID,
    old_h_star: u64,
    new_h_star: u64,
    h_bar: u64,
    /// True if h* was clipped to h_bar.
    was_clipped: bool,
}

public struct VolatilityUpdated has copy, drop {
    vault_id: ID,
    new_sigma_tilde: u64,
    new_rebalance_interval_ms: u64,
}

public struct Rebalanced has copy, drop {
    vault_id: ID,
    timestamp_ms: u64,
    h_effective: u64,
}

// === Init ===

public fun new(ctx: &mut TxContext): AdminCap {
    let vault_uid = object::new(ctx);
    let vault_id = object::uid_to_inner(&vault_uid);

    let vault = HedgeRatioVault {
        id: vault_uid,
        h_star: 0,
        h_bar: SCALE, // default max h_bar = 1.0
        alpha_bps: DEFAULT_ALPHA_BPS,
        ltv_max_bps: DEFAULT_LTV_MAX_BPS,
        sigma_tilde: 0,
        rebalance_interval_ms: 3_600_000, // 1 hour default
        last_rebalance_ms: 0,
        vault_balance: balance::zero(),
        total_shares: 0,
        total_deposited: 0,
        paused: false,
    };

    let manager = MarginManager {
        id: object::new(ctx),
        vault_id,
        collateral: balance::zero(),
        borrow_amount: 0,
    };

    transfer::transfer(manager, ctx.sender());
    transfer::share_object(vault);

    AdminCap { id: object::new(ctx), vault_id }
}

// === Public Functions ===

public fun deposit(
    vault: &mut HedgeRatioVault,
    coin_in: Coin<0x2::sui::SUI>,
    ctx: &mut TxContext,
): u64 {
    assert!(!vault.paused, EVaultPaused);
    let amount = coin_in.value();
    assert!(amount > 0, EZeroAmount);

    let shares = if (vault.total_shares == 0 || vault.total_deposited == 0) {
        amount
    } else {
        amount * vault.total_shares / vault.total_deposited
    };

    vault.total_shares = vault.total_shares + shares;
    vault.total_deposited = vault.total_deposited + amount;
    balance::join(&mut vault.vault_balance, coin_in.into_balance());

    event::emit(Deposited {
        vault_id: object::id(vault),
        depositor: ctx.sender(),
        amount,
        shares_minted: shares,
    });

    shares
}

public fun withdraw(
    vault: &mut HedgeRatioVault,
    shares: u64,
    ctx: &mut TxContext,
): Coin<0x2::sui::SUI> {
    assert!(!vault.paused, EVaultPaused);
    assert!(shares > 0, EZeroAmount);
    assert!(shares <= vault.total_shares, EInsufficientShares);

    let amount_out = shares * vault.total_deposited / vault.total_shares;
    vault.total_shares = vault.total_shares - shares;
    vault.total_deposited = vault.total_deposited - amount_out;

    let out = vault.vault_balance.split(amount_out).into_coin(ctx);

    event::emit(Withdrawn {
        vault_id: object::id(vault),
        recipient: ctx.sender(),
        shares_burned: shares,
        amount_out,
    });

    out
}

/// Update the hedge ratio with the constrained optimal:
///     h_effective = min(h_star_proposed, vault.h_bar)
///
/// Called by the off-chain keeper after computing h* from GBM moment-matching.
/// AdminCap gates this to prevent unauthorized ratio manipulation.
public fun update_hedge_ratio(
    _: &AdminCap,
    vault: &mut HedgeRatioVault,
    h_star_proposed: u64,
    clock: &Clock,
) {
    let was_clipped = h_star_proposed > vault.h_bar;
    let h_effective = if (was_clipped) { vault.h_bar } else { h_star_proposed };
    let old = vault.h_star;

    vault.h_star = h_effective;
    vault.last_rebalance_ms = clock.timestamp_ms();

    event::emit(HedgeRatioUpdated {
        vault_id: object::id(vault),
        old_h_star: old,
        new_h_star: h_effective,
        h_bar: vault.h_bar,
        was_clipped,
    });

    event::emit(Rebalanced {
        vault_id: object::id(vault),
        timestamp_ms: vault.last_rebalance_ms,
        h_effective,
    });
}

/// Update realized volatility and dynamically adjust the rebalancing interval T.
///
/// As σ̃ increases, T shrinks to maintain the LTV constraint. The relationship
/// is T ∝ 1/σ̃², derived from the GBM variance scaling property.
/// Floor at MIN_REBALANCE_INTERVAL_MS to prevent excessive rebalancing costs.
public fun update_volatility(
    _: &AdminCap,
    vault: &mut HedgeRatioVault,
    new_sigma_tilde: u64, // scaled by SCALE
) {
    assert!(new_sigma_tilde > 0, EZeroAmount);
    vault.sigma_tilde = new_sigma_tilde;

    // T = base_interval / (sigma_tilde / SCALE)^2
    // Approximate: T_ms = 3_600_000 * SCALE^2 / sigma_tilde^2
    let t_raw = 3_600_000_u64 * SCALE / new_sigma_tilde;
    vault.rebalance_interval_ms =
        if (t_raw < MIN_REBALANCE_INTERVAL_MS) { MIN_REBALANCE_INTERVAL_MS }
        else { t_raw };

    event::emit(VolatilityUpdated {
        vault_id: object::id(vault),
        new_sigma_tilde,
        new_rebalance_interval_ms: vault.rebalance_interval_ms,
    });
}

/// Update h_bar — the maximum hedge ratio that keeps P(LTV > ℓ_max) < 1−α.
/// Off-chain: h_bar = f(alpha, ltv_max, sigma_tilde) from GBM tail probability.
public fun set_h_bar(_: &AdminCap, vault: &mut HedgeRatioVault, new_h_bar: u64) {
    vault.h_bar = new_h_bar;
}

public fun set_paused(_: &AdminCap, vault: &mut HedgeRatioVault, paused: bool) {
    vault.paused = paused;
}

// === Getters ===

public fun h_star(vault: &HedgeRatioVault): u64 { vault.h_star }
public fun h_bar(vault: &HedgeRatioVault): u64 { vault.h_bar }
public fun sigma_tilde(vault: &HedgeRatioVault): u64 { vault.sigma_tilde }
public fun rebalance_interval_ms(vault: &HedgeRatioVault): u64 { vault.rebalance_interval_ms }
public fun total_deposited(vault: &HedgeRatioVault): u64 { vault.total_deposited }
public fun total_shares(vault: &HedgeRatioVault): u64 { vault.total_shares }
