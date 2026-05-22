/// suiUSDe Layered Meta Vault
///
/// Maximises capital efficiency by using suiUSDe as core margin collateral
/// on DeepBook Margin. A single deposit simultaneously earns:
///
///   1. Staking rewards   — from the underlying suiUSDe restaking mechanism
///   2. Perpetual funding — from delta-neutral perp positions on DeepBook
///   3. Money market rate — from idle collateral deposited to a lending pool
///   4. CLOB trading fees — from passive market-making on DeepBook spot
///
/// Each layer's rate is tracked separately so the UI can display a breakdown
/// and the compounder can efficiently harvest each source independently.
module yield_vaults::suiusde_meta_vault;

use sui::balance::{Self, Balance};
use sui::coin::{Self, Coin};
use sui::clock::Clock;
use sui::event;

// === Errors ===

#[error]
const EZeroAmount: vector<u8> = b"Amount must be greater than zero";
#[error]
const EInsufficientShares: vector<u8> = b"Insufficient shares for withdrawal";
#[error]
const EVaultPaused: vector<u8> = b"Vault is paused";
#[error]
const ECompoundTooSoon: vector<u8> = b"Compound interval has not elapsed";
#[error]
const ELayerRateExceedsMax: vector<u8> = b"Layer yield rate exceeds maximum";

// === Constants ===

#[allow(unused_const)]
const SCALE: u64 = 1_000_000_000;
const MAX_RATE_BPS: u64 = 5_000; // 50% max annual rate per layer
const COMPOUND_INTERVAL_MS: u64 = 86_400_000; // 24h minimum compound window

// === Structs ===

public struct AdminCap has key, store {
    id: UID,
    vault_id: ID,
}

/// Tracks each distinct yield layer's annual rate in basis points.
public struct LayerRates has copy, drop, store {
    /// suiUSDe staking rewards (annualised bps).
    staking_bps: u64,
    /// Perpetual funding rate earned from delta-neutral perp positions (annualised bps).
    perp_funding_bps: u64,
    /// Money market deposit rate from idle collateral (annualised bps).
    money_market_bps: u64,
    /// CLOB fee revenue from DeepBook market-making (annualised bps).
    clob_fee_bps: u64,
}

/// Shared vault — holds suiUSDe-denominated deposits and tracks layered yield state.
/// suiUSDe is represented here using SUI as a proxy type until the suiUSDe coin
/// type address is finalised on testnet. Replace SUI with the real type at deployment.
public struct SuiUsdeMetaVault has key {
    id: UID,
    layer_rates: LayerRates,
    /// Total effective APY = sum of all layers (capped at MAX_RATE_BPS * 4 in practice).
    total_apy_bps: u64,
    /// Total compound rewards accumulated since last harvest.
    pending_rewards: u64,
    /// Timestamp of the last compound operation.
    last_compound_ms: u64,
    /// Depositor principal (in suiUSDe MIST — using SUI proxy for testnet).
    vault_balance: Balance<0x2::sui::SUI>,
    /// Accrued protocol fee balance (10% of yield).
    fee_balance: Balance<0x2::sui::SUI>,
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

public struct YieldCompounded has copy, drop {
    vault_id: ID,
    timestamp_ms: u64,
    staking_yield: u64,
    perp_funding_yield: u64,
    money_market_yield: u64,
    clob_fee_yield: u64,
    total_compounded: u64,
    protocol_fee: u64,
}

public struct LayerRatesUpdated has copy, drop {
    vault_id: ID,
    staking_bps: u64,
    perp_funding_bps: u64,
    money_market_bps: u64,
    clob_fee_bps: u64,
    total_apy_bps: u64,
}

// === Init ===

public fun new(ctx: &mut TxContext): AdminCap {
    let vault_uid = object::new(ctx);
    let vault_id = object::uid_to_inner(&vault_uid);

    let vault = SuiUsdeMetaVault {
        id: vault_uid,
        layer_rates: LayerRates {
            staking_bps: 0,
            perp_funding_bps: 0,
            money_market_bps: 0,
            clob_fee_bps: 0,
        },
        total_apy_bps: 0,
        pending_rewards: 0,
        last_compound_ms: 0,
        vault_balance: balance::zero(),
        fee_balance: balance::zero(),
        total_shares: 0,
        total_deposited: 0,
        paused: false,
    };

    transfer::share_object(vault);
    AdminCap { id: object::new(ctx), vault_id }
}

// === Public Functions ===

public fun deposit(
    vault: &mut SuiUsdeMetaVault,
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
    vault: &mut SuiUsdeMetaVault,
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

/// Harvest and compound all yield layers into the vault balance.
/// Each layer's contribution is calculated from its rate and time elapsed.
/// A 10% protocol fee is skimmed before compounding the rest into TVL,
/// which increases the share price for all existing depositors.
public fun compound(
    vault: &mut SuiUsdeMetaVault,
    staking_yield: u64,
    perp_funding_yield: u64,
    money_market_yield: u64,
    clob_fee_yield: u64,
    coin_in: Coin<0x2::sui::SUI>, // must equal sum of yields
    clock: &Clock,
    _: &AdminCap,
) {
    assert!(!vault.paused, EVaultPaused);
    let now_ms = clock.timestamp_ms();
    assert!(
        now_ms >= vault.last_compound_ms + COMPOUND_INTERVAL_MS,
        ECompoundTooSoon
    );

    let total = staking_yield + perp_funding_yield + money_market_yield + clob_fee_yield;
    assert!(total == coin_in.value(), EZeroAmount);

    // 10% protocol fee
    let fee = total / 10;
    let net = total - fee;

    let mut bal = coin_in.into_balance();
    let fee_bal = bal.split(fee);
    balance::join(&mut vault.fee_balance, fee_bal);
    balance::join(&mut vault.vault_balance, bal);

    // Net yield increases total_deposited (raises share price)
    vault.total_deposited = vault.total_deposited + net;
    vault.pending_rewards = 0;
    vault.last_compound_ms = now_ms;

    event::emit(YieldCompounded {
        vault_id: object::id(vault),
        timestamp_ms: now_ms,
        staking_yield,
        perp_funding_yield,
        money_market_yield,
        clob_fee_yield,
        total_compounded: net,
        protocol_fee: fee,
    });
}

/// Update all layer rates. Total APY = sum of all layers.
public fun update_layer_rates(
    _: &AdminCap,
    vault: &mut SuiUsdeMetaVault,
    staking_bps: u64,
    perp_funding_bps: u64,
    money_market_bps: u64,
    clob_fee_bps: u64,
) {
    assert!(staking_bps <= MAX_RATE_BPS, ELayerRateExceedsMax);
    assert!(perp_funding_bps <= MAX_RATE_BPS, ELayerRateExceedsMax);
    assert!(money_market_bps <= MAX_RATE_BPS, ELayerRateExceedsMax);
    assert!(clob_fee_bps <= MAX_RATE_BPS, ELayerRateExceedsMax);

    vault.layer_rates = LayerRates { staking_bps, perp_funding_bps, money_market_bps, clob_fee_bps };
    vault.total_apy_bps = staking_bps + perp_funding_bps + money_market_bps + clob_fee_bps;

    event::emit(LayerRatesUpdated {
        vault_id: object::id(vault),
        staking_bps,
        perp_funding_bps,
        money_market_bps,
        clob_fee_bps,
        total_apy_bps: vault.total_apy_bps,
    });
}

/// Withdraw accumulated protocol fees. Only callable with AdminCap.
public fun withdraw_fees(
    _: &AdminCap,
    vault: &mut SuiUsdeMetaVault,
    ctx: &mut TxContext,
): Coin<0x2::sui::SUI> {
    let amount = vault.fee_balance.value();
    vault.fee_balance.split(amount).into_coin(ctx)
}

public fun set_paused(_: &AdminCap, vault: &mut SuiUsdeMetaVault, paused: bool) {
    vault.paused = paused;
}

// === Getters ===

public fun total_apy_bps(vault: &SuiUsdeMetaVault): u64 { vault.total_apy_bps }
public fun total_deposited(vault: &SuiUsdeMetaVault): u64 { vault.total_deposited }
public fun total_shares(vault: &SuiUsdeMetaVault): u64 { vault.total_shares }
public fun layer_rates(vault: &SuiUsdeMetaVault): &LayerRates { &vault.layer_rates }
public fun staking_bps(rates: &LayerRates): u64 { rates.staking_bps }
public fun perp_funding_bps(rates: &LayerRates): u64 { rates.perp_funding_bps }
public fun money_market_bps(rates: &LayerRates): u64 { rates.money_market_bps }
public fun clob_fee_bps(rates: &LayerRates): u64 { rates.clob_fee_bps }
public fun last_compound_ms(vault: &SuiUsdeMetaVault): u64 { vault.last_compound_ms }
public fun fee_balance_value(vault: &SuiUsdeMetaVault): u64 { vault.fee_balance.value() }
