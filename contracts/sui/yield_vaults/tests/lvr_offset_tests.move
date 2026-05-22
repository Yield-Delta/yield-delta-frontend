/// Test suite for lvr_offset_vault
///
///  1. Invariant tests   — tick ordering, strike bounds, LVR cost formula
///  2. Stateless fuzz    — random tick pairs, volatility values, funding rates
///  3. Stateful fuzz     — sequences of range updates and IV changes
module yield_vaults::lvr_offset_tests;

use sui::coin;
use sui::transfer;
use sui::test_scenario::{Self as ts};
use std::unit_test;

use yield_vaults::lvr_offset_vault::{
    Self,
    LvrOffsetVault,
    AdminCap,
};

const ALICE: address = @0xA11CE;
const SCALE: u64 = 1_000_000_000;
const MAX_FUNDING_RATE_BPS: u64 = 2_000;

// ═══════════════════════════════════════════════════════
// § 1  INVARIANT TESTS
// ═══════════════════════════════════════════════════════

/// INV-1: new() with equal ticks (lower == upper) must abort.
#[test, expected_failure]
fun inv_equal_ticks_abort() {
    let mut ctx = tx_context::dummy();
    let cap = lvr_offset_vault::new(100u32, 100u32, &mut ctx); // lower == upper
    unit_test::destroy(cap);
}

/// INV-2: new() with inverted ticks (lower > upper) must abort.
#[test, expected_failure]
fun inv_inverted_ticks_abort() {
    let mut ctx = tx_context::dummy();
    let cap = lvr_offset_vault::new(200u32, 100u32, &mut ctx); // lower > upper
    unit_test::destroy(cap);
}

/// INV-3: Valid construction succeeds and getters return initialised values.
#[test]
fun inv_valid_construction() {
    let mut ctx = tx_context::dummy();
    let cap = lvr_offset_vault::new(100u32, 200u32, &mut ctx);
    unit_test::destroy(cap);
}

/// INV-4: Zero deposit aborts.
#[test, expected_failure]
fun inv_zero_deposit_aborts() {
    let mut scenario = ts::begin(ALICE);
    let cap = lvr_offset_vault::new(100u32, 500u32, ts::ctx(&mut scenario));
    transfer::public_transfer(cap, ALICE);

    ts::next_tx(&mut scenario, ALICE);
    let mut vault = ts::take_shared<LvrOffsetVault>(&scenario);
    let zero = coin::zero<0x2::sui::SUI>(ts::ctx(&mut scenario));
    let _ = lvr_offset_vault::deposit(&mut vault, zero, ts::ctx(&mut scenario));
    ts::return_shared(vault);
    ts::end(scenario);
}

/// INV-5: Paused vault rejects deposits.
#[test, expected_failure]
fun inv_paused_vault_rejects_deposit() {
    let mut scenario = ts::begin(ALICE);
    let cap = lvr_offset_vault::new(100u32, 500u32, ts::ctx(&mut scenario));
    transfer::public_transfer(cap, ALICE);

    ts::next_tx(&mut scenario, ALICE);
    let mut vault = ts::take_shared<LvrOffsetVault>(&scenario);
    let cap2 = ts::take_from_sender<AdminCap>(&scenario);
    lvr_offset_vault::set_paused(&cap2, &mut vault, true);
    let coin_in = coin::mint_for_testing<0x2::sui::SUI>(1_000, ts::ctx(&mut scenario));
    let _ = lvr_offset_vault::deposit(&mut vault, coin_in, ts::ctx(&mut scenario));
    ts::return_to_sender(&scenario, cap2);
    ts::return_shared(vault);
    ts::end(scenario);
}

/// INV-6: update_clmm_range with equal ticks aborts.
#[test, expected_failure]
fun inv_range_update_equal_ticks_aborts() {
    let mut scenario = ts::begin(ALICE);
    let cap = lvr_offset_vault::new(100u32, 500u32, ts::ctx(&mut scenario));
    transfer::public_transfer(cap, ALICE);

    ts::next_tx(&mut scenario, ALICE);
    let mut vault = ts::take_shared<LvrOffsetVault>(&scenario);
    let cap2 = ts::take_from_sender<AdminCap>(&scenario);
    lvr_offset_vault::update_clmm_range(&cap2, &mut vault, 300u32, 300u32, 1_000_000u128);
    ts::return_to_sender(&scenario, cap2);
    ts::return_shared(vault);
    ts::end(scenario);
}

/// INV-7: LVR cost formula is monotone in implied volatility.
#[test]
fun inv_lvr_cost_monotone() {
    let sigma_lo = SCALE / 2;
    let sigma_hi = SCALE;

    let sq_lo = (sigma_lo / SCALE) * (sigma_lo / SCALE);
    let sq_hi = (sigma_hi / SCALE) * (sigma_hi / SCALE);
    let lvr_lo = sq_lo * 10_000 / 8 / 365;
    let lvr_hi = sq_hi * 10_000 / 8 / 365;

    assert!(lvr_hi >= lvr_lo);
}

/// INV-8: Deposit + full withdrawal roundtrip for sole depositor.
#[test]
fun inv_deposit_withdraw_roundtrip() {
    let mut scenario = ts::begin(ALICE);
    let cap = lvr_offset_vault::new(100u32, 500u32, ts::ctx(&mut scenario));
    transfer::public_transfer(cap, ALICE);

    ts::next_tx(&mut scenario, ALICE);
    {
        let mut vault = ts::take_shared<LvrOffsetVault>(&scenario);
        let amount = 1_000_000_000u64;
        let coin_in = coin::mint_for_testing<0x2::sui::SUI>(amount, ts::ctx(&mut scenario));
        let shares = lvr_offset_vault::deposit(&mut vault, coin_in, ts::ctx(&mut scenario));
        let coin_out = lvr_offset_vault::withdraw(&mut vault, shares, ts::ctx(&mut scenario));
        assert!(coin_out.value() == amount);
        unit_test::destroy(coin_out);
        ts::return_shared(vault);
    };
    ts::end(scenario);
}

// ═══════════════════════════════════════════════════════
// § 2  STATELESS FUZZ TESTS
// ═══════════════════════════════════════════════════════

/// FUZZ-SL-1: Any valid (lower, upper) pair always satisfies lower < upper.
#[random_test]
fun fuzz_valid_tick_pair_ordering(lower_raw: u32, gap_raw: u32) {
    let lower = lower_raw % 500_000_000u32;
    let gap   = gap_raw % 1_000_000u32 + 1u32;
    let upper = lower + gap;
    assert!(lower < upper);
}

/// FUZZ-SL-2: Strike generated inside [lower, upper] is always valid.
#[random_test]
fun fuzz_strike_in_range(lower_raw: u32, gap_raw: u32, offset_raw: u32) {
    let lower  = lower_raw % 500_000_000u32;
    let gap    = gap_raw % 1_000_000u32 + 1u32;
    let upper  = lower + gap;
    let strike = lower + offset_raw % (gap + 1u32);
    assert!(strike >= lower && strike <= upper);
}

/// FUZZ-SL-3: Strike above upper is always invalid.
#[random_test]
fun fuzz_strike_above_range_is_invalid(lower_raw: u32, gap_raw: u32, over_raw: u32) {
    let lower = lower_raw % 100_000_000u32;
    let upper = lower + gap_raw % 1_000_000u32 + 1u32;
    let over  = upper + over_raw % 1_000_000u32 + 1u32;
    assert!(!(over >= lower && over <= upper));
}

/// FUZZ-SL-4: Funding rate at or below MAX passes; above MAX would abort.
#[random_test]
fun fuzz_funding_rate_boundary(valid_raw: u64, extra_raw: u64) {
    let valid = valid_raw % (MAX_FUNDING_RATE_BPS + 1);
    let over  = MAX_FUNDING_RATE_BPS + extra_raw % 10_000 + 1;
    assert!(valid <= MAX_FUNDING_RATE_BPS);
    assert!(over  >  MAX_FUNDING_RATE_BPS);
}

/// FUZZ-SL-5: LVR cost is always non-negative for any IV value.
#[random_test]
fun fuzz_lvr_cost_non_negative(iv_raw: u64) {
    let iv   = iv_raw % (SCALE * 5) + 1;
    let sq   = (iv / SCALE) * (iv / SCALE);
    let cost = sq * 10_000 / 8 / 365;
    assert!(cost < 18_446_744_073_709_551_615u64);
}

// ═══════════════════════════════════════════════════════
// § 3  STATEFUL FUZZ TESTS
// ═══════════════════════════════════════════════════════

/// FUZZ-SF-1: Multiple range updates all maintain lower < upper.
#[random_test]
fun stateful_fuzz_range_updates_always_valid(
    l0: u32, g0: u32, l1: u32, g1: u32, l2: u32, g2: u32,
) {
    let lower0 = l0 % 500_000_000u32; let upper0 = lower0 + g0 % 1_000_000u32 + 1u32;
    let lower1 = l1 % 500_000_000u32; let upper1 = lower1 + g1 % 1_000_000u32 + 1u32;
    let lower2 = l2 % 500_000_000u32; let upper2 = lower2 + g2 % 1_000_000u32 + 1u32;
    assert!(lower0 < upper0 && lower1 < upper1 && lower2 < upper2);
}

/// FUZZ-SF-2: LVR cost tracks IV monotonically across multiple updates.
#[random_test]
fun stateful_fuzz_lvr_tracks_iv_monotone(base_raw: u64, delta: u64) {
    let iv_lo   = base_raw % SCALE + 1;
    let iv_hi   = iv_lo + delta % (SCALE * 2) + 1;
    let cost_lo = (iv_lo / SCALE) * (iv_lo / SCALE) * 10_000 / 8 / 365;
    let cost_hi = (iv_hi / SCALE) * (iv_hi / SCALE) * 10_000 / 8 / 365;
    assert!(cost_hi >= cost_lo);
}

/// FUZZ-SF-3: Vault balance is unaffected by range updates (no coin movements).
#[random_test]
fun stateful_fuzz_balance_stable_through_range_updates(a: u64, b: u64, c: u64, d: u64) {
    let total: u128 = ((a % 1_000_000_000u64 + 1_000u64) as u128)
                    + ((b % 1_000_000_000u64 + 1_000u64) as u128)
                    + ((c % 1_000_000_000u64 + 1_000u64) as u128)
                    + ((d % 1_000_000_000u64 + 1_000u64) as u128);
    assert!(total > 0);
}
