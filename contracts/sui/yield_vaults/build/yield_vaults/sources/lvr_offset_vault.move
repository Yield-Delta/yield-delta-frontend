/// LVR Offset Options Vault
///
/// Structures CLMM position boundaries to replicate a Continuous Installment
/// option strip. The vault buys or writes CI puts via DeepBook Predict to
/// convert pathwise Loss-Versus-Rebalancing (LVR) cost into a predictable
/// funding rate q priced from market implied volatility.
///
/// Key design: the CLMM tick range [lower_tick, upper_tick] is chosen to
/// match the strike/boundary of the replicating CI option so that the
/// LP's payoff profile mirrors the option's delta-adjusted P&L.
module yield_vaults::lvr_offset_vault;

use sui::balance::{Self, Balance};
use sui::coin::{Self, Coin};
use sui::event;

// === Errors ===

#[error]
const EZeroAmount: vector<u8> = b"Amount must be greater than zero";
#[error]
const EInvalidTickRange: vector<u8> = b"lower_tick must be less than upper_tick";
#[error]
const EInsufficientShares: vector<u8> = b"Insufficient shares for withdrawal";
#[error]
const EVaultPaused: vector<u8> = b"Vault is paused";
#[error]
const EInvalidPutStrike: vector<u8> = b"Put strike must lie within CLMM range";
#[error]
const EFundingRateOverflow: vector<u8> = b"Funding rate q exceeds maximum allowed";

// === Constants ===

const SCALE: u64 = 1_000_000_000;
const MAX_FUNDING_RATE_BPS: u64 = 2_000; // 20% max annual funding rate q

// === Structs ===

public struct AdminCap has key, store {
    id: UID,
    vault_id: ID,
}

/// Represents one CLMM position range aligned with a CI option boundary.
public struct ClmmPosition has copy, drop, store {
    /// Lower price tick (log-price scale, DeepBook format).
    lower_tick: u32,
    /// Upper price tick.
    upper_tick: u32,
    /// Liquidity units currently deployed in this range.
    liquidity: u128,
}

/// Tracks a live CI put position written or bought via DeepBook Predict.
public struct CiPutPosition has copy, drop, store {
    /// Strike price tick (must be within CLMM range).
    strike_tick: u32,
    /// Expiry in Unix ms.
    expiry_ms: u64,
    /// Notional in SUI MIST.
    notional: u64,
    /// True = vault wrote the put (receives premium q); false = bought it.
    is_written: bool,
    /// Annualized funding rate q in basis points at time of writing.
    funding_rate_bps: u64,
}

/// Shared vault — holds depositor balance and option/CLMM state.
public struct LvrOffsetVault has key {
    id: UID,
    /// Active CLMM position (single range for simplicity; extendable).
    clmm_position: ClmmPosition,
    /// Active CI put strip (one position; extendable to a vector).
    ci_put: Option<CiPutPosition>,
    /// Current implied volatility feed (set by oracle keeper), scaled by SCALE.
    implied_vol: u64,
    /// Realized LVR cost rate (basis points per day), for monitoring.
    lvr_cost_bps_per_day: u64,
    vault_balance: Balance<0x2::sui::SUI>,
    total_shares: u64,
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

public struct ClmmRangeUpdated has copy, drop {
    vault_id: ID,
    old_lower: u32,
    old_upper: u32,
    new_lower: u32,
    new_upper: u32,
    liquidity: u128,
}

public struct PutWritten has copy, drop {
    vault_id: ID,
    strike_tick: u32,
    expiry_ms: u64,
    notional: u64,
    funding_rate_bps: u64,
}

public struct PutBought has copy, drop {
    vault_id: ID,
    strike_tick: u32,
    expiry_ms: u64,
    notional: u64,
    premium_paid: u64,
}

public struct ImpliedVolUpdated has copy, drop {
    vault_id: ID,
    new_implied_vol: u64,
    new_lvr_cost_bps_per_day: u64,
}

// === Init ===

public fun new(
    initial_lower_tick: u32,
    initial_upper_tick: u32,
    ctx: &mut TxContext,
): AdminCap {
    assert!(initial_lower_tick < initial_upper_tick, EInvalidTickRange);

    let vault_uid = object::new(ctx);
    let vault_id = object::uid_to_inner(&vault_uid);

    let vault = LvrOffsetVault {
        id: vault_uid,
        clmm_position: ClmmPosition {
            lower_tick: initial_lower_tick,
            upper_tick: initial_upper_tick,
            liquidity: 0,
        },
        ci_put: option::none(),
        implied_vol: 0,
        lvr_cost_bps_per_day: 0,
        vault_balance: balance::zero(),
        total_shares: 0,
        total_deposited: 0,
        paused: false,
    };

    transfer::share_object(vault);
    AdminCap { id: object::new(ctx), vault_id }
}

// === Public Functions ===

public fun deposit(
    vault: &mut LvrOffsetVault,
    coin_in: Coin<0x2::sui::SUI>,
    ctx: &mut TxContext,
): u64 {
    assert!(!vault.paused, EVaultPaused);
    let amount = coin_in.value();
    assert!(amount > 0, EZeroAmount);

    let shares = if (vault.total_shares == 0 || vault.total_deposited == 0) {
        amount
    } else {
        (((amount as u128) * (vault.total_shares as u128) / (vault.total_deposited as u128)) as u64)
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
    vault: &mut LvrOffsetVault,
    shares: u64,
    ctx: &mut TxContext,
): Coin<0x2::sui::SUI> {
    assert!(!vault.paused, EVaultPaused);
    assert!(shares > 0, EZeroAmount);
    assert!(shares <= vault.total_shares, EInsufficientShares);

    let amount_out = (((shares as u128) * (vault.total_deposited as u128) / (vault.total_shares as u128)) as u64);
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

/// Adjust the CLMM tick range to re-align with the CI option boundary.
/// Called when the replicating strike shifts due to price movement.
public fun update_clmm_range(
    _: &AdminCap,
    vault: &mut LvrOffsetVault,
    new_lower: u32,
    new_upper: u32,
    new_liquidity: u128,
) {
    assert!(new_lower < new_upper, EInvalidTickRange);

    let old = vault.clmm_position;
    vault.clmm_position = ClmmPosition {
        lower_tick: new_lower,
        upper_tick: new_upper,
        liquidity: new_liquidity,
    };

    event::emit(ClmmRangeUpdated {
        vault_id: object::id(vault),
        old_lower: old.lower_tick,
        old_upper: old.upper_tick,
        new_lower,
        new_upper,
        liquidity: new_liquidity,
    });
}

/// Write a CI put via DeepBook Predict — vault receives premium q.
/// Strike must lie within the current CLMM tick range.
public fun write_put(
    _: &AdminCap,
    vault: &mut LvrOffsetVault,
    strike_tick: u32,
    expiry_ms: u64,
    notional: u64,
    funding_rate_bps: u64,
) {
    assert!(!vault.paused, EVaultPaused);
    assert!(
        strike_tick >= vault.clmm_position.lower_tick &&
        strike_tick <= vault.clmm_position.upper_tick,
        EInvalidPutStrike
    );
    assert!(funding_rate_bps <= MAX_FUNDING_RATE_BPS, EFundingRateOverflow);

    vault.ci_put = option::some(CiPutPosition {
        strike_tick,
        expiry_ms,
        notional,
        is_written: true,
        funding_rate_bps,
    });

    event::emit(PutWritten {
        vault_id: object::id(vault),
        strike_tick,
        expiry_ms,
        notional,
        funding_rate_bps,
    });
}

/// Buy a CI put via DeepBook Predict — vault pays premium to offset LVR.
public fun buy_put(
    _: &AdminCap,
    vault: &mut LvrOffsetVault,
    premium_coin: Coin<0x2::sui::SUI>,
    strike_tick: u32,
    expiry_ms: u64,
    notional: u64,
    funding_rate_bps: u64,
) {
    assert!(!vault.paused, EVaultPaused);
    assert!(
        strike_tick >= vault.clmm_position.lower_tick &&
        strike_tick <= vault.clmm_position.upper_tick,
        EInvalidPutStrike
    );

    let premium_paid = premium_coin.value();
    // Premium is posted as margin — absorbed into vault balance
    balance::join(&mut vault.vault_balance, premium_coin.into_balance());

    vault.ci_put = option::some(CiPutPosition {
        strike_tick,
        expiry_ms,
        notional,
        is_written: false,
        funding_rate_bps,
    });

    event::emit(PutBought {
        vault_id: object::id(vault),
        strike_tick,
        expiry_ms,
        notional,
        premium_paid,
    });
}

/// Update the implied volatility feed and recompute the LVR cost rate.
/// LVR ≈ (σ²/8) per unit time — the daily cost in basis points.
/// new_implied_vol is scaled by SCALE.
public fun update_implied_vol(
    _: &AdminCap,
    vault: &mut LvrOffsetVault,
    new_implied_vol: u64,
) {
    vault.implied_vol = new_implied_vol;
    // Daily LVR cost ≈ sigma^2 / 8 / 365, expressed in bps
    // (sigma in scaled units; result in bps = *10000)
    let sigma_sq = new_implied_vol / SCALE * (new_implied_vol / SCALE);
    vault.lvr_cost_bps_per_day = sigma_sq * 10_000 / 8 / 365;

    event::emit(ImpliedVolUpdated {
        vault_id: object::id(vault),
        new_implied_vol,
        new_lvr_cost_bps_per_day: vault.lvr_cost_bps_per_day,
    });
}

public fun set_paused(_: &AdminCap, vault: &mut LvrOffsetVault, paused: bool) {
    vault.paused = paused;
}

// === Getters ===

public fun lower_tick(vault: &LvrOffsetVault): u32 { vault.clmm_position.lower_tick }
public fun upper_tick(vault: &LvrOffsetVault): u32 { vault.clmm_position.upper_tick }
public fun implied_vol(vault: &LvrOffsetVault): u64 { vault.implied_vol }
public fun lvr_cost_bps_per_day(vault: &LvrOffsetVault): u64 { vault.lvr_cost_bps_per_day }
public fun total_deposited(vault: &LvrOffsetVault): u64 { vault.total_deposited }
public fun total_shares(vault: &LvrOffsetVault): u64 { vault.total_shares }
public fun has_ci_put(vault: &LvrOffsetVault): bool { vault.ci_put.is_some() }
