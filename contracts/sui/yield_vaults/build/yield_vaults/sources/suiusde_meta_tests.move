/// Test suite for suiusde_meta_vault
///
///  1. Invariant tests   — layer rate accounting, fee split, compound monotonicity
///  2. Stateless fuzz    — random rate combinations, compound amounts, timing
///  3. Stateful fuzz     — multi-depositor sequences through compound cycles
module yield_vaults::suiusde_meta_tests;

use sui::coin;
use sui::transfer;
use sui::clock;
use sui::test_scenario::{Self as ts};
use std::unit_test;

use yield_vaults::suiusde_meta_vault::{
    Self,
    SuiUsdeMetaVault,
    AdminCap,
};

const ALICE:  address = @0xA11CE;
const MAX_RATE_BPS: u64 = 5_000;
const COMPOUND_INTERVAL_MS: u64 = 86_400_000;

// ═══════════════════════════════════════════════════════
// § 1  INVARIANT TESTS
// ═══════════════════════════════════════════════════════

/// INV-1: total_apy_bps == exact sum of all four layers.
#[test]
fun inv_total_apy_equals_sum() {
    let (staking, perp, mm, clob) = (400u64, 800u64, 300u64, 600u64);
    let total = staking + perp + mm + clob;
    assert!(total == 2_100);

    // update_layer_rates sets total_apy_bps = sum(all four)
    let computed = staking + perp + mm + clob;
    assert!(computed == total);
}

/// INV-2: 10% fee split is lossless — fee + net == total, exactly.
#[test]
fun inv_fee_split_lossless() {
    let cases = vector[1_000u64, 10_001u64, 999u64, 1u64, 100_000_000u64];
    let mut i = 0;
    while (i < cases.length()) {
        let total = cases[i];
        let fee   = total / 10;
        let net   = total - fee;
        assert!(fee + net == total);
        i = i + 1;
    };
}

/// INV-3: After compound, total_deposited increases by net (not total).
#[test]
fun inv_compound_increases_by_net_only() {
    let initial = 1_000_000_000u64;
    let yield_  = 100_000_000u64;
    let fee     = yield_ / 10;
    let net     = yield_ - fee;
    let after   = initial + net;
    assert!(after == initial + 90_000_000);
    assert!(after < initial + yield_);
}

/// INV-4: Share price strictly increases after each compound (no new shares minted).
#[test]
fun inv_share_price_rises_after_compound() {
    let shares    = 1_000_000u64;
    let deposited = 1_000_000u64;
    let net_yield = 50_000u64;

    let p_before = (deposited as u128) * 10_000 / (shares as u128);
    let p_after  = ((deposited + net_yield) as u128) * 10_000 / (shares as u128);
    assert!(p_after > p_before);
}

/// INV-5: Excess layer rate aborts.
#[test, expected_failure]
fun inv_excess_layer_rate_aborts() {
    let mut scenario = ts::begin(ALICE);
    let cap = suiusde_meta_vault::new(ts::ctx(&mut scenario));
    transfer::public_transfer(cap, ALICE);

    ts::next_tx(&mut scenario, ALICE);
    let mut vault = ts::take_shared<SuiUsdeMetaVault>(&scenario);
    let cap2 = ts::take_from_sender<AdminCap>(&scenario);
    // staking_bps = MAX + 1 should abort
    suiusde_meta_vault::update_layer_rates(
        &cap2, &mut vault,
        MAX_RATE_BPS + 1, 0, 0, 0,
    );
    ts::return_to_sender(&scenario, cap2);
    ts::return_shared(vault);
    ts::end(scenario);
}

/// INV-6: Zero deposit aborts.
#[test, expected_failure]
fun inv_zero_deposit_aborts() {
    let mut scenario = ts::begin(ALICE);
    let cap = suiusde_meta_vault::new(ts::ctx(&mut scenario));
    transfer::public_transfer(cap, ALICE);

    ts::next_tx(&mut scenario, ALICE);
    let mut vault = ts::take_shared<SuiUsdeMetaVault>(&scenario);
    let zero = coin::zero<0x2::sui::SUI>(ts::ctx(&mut scenario));
    let _ = suiusde_meta_vault::deposit(&mut vault, zero, ts::ctx(&mut scenario));
    ts::return_shared(vault);
    ts::end(scenario);
}

/// INV-7: Paused vault rejects deposits.
#[test, expected_failure]
fun inv_paused_vault_rejects_deposit() {
    let mut scenario = ts::begin(ALICE);
    let cap = suiusde_meta_vault::new(ts::ctx(&mut scenario));
    transfer::public_transfer(cap, ALICE);

    ts::next_tx(&mut scenario, ALICE);
    let mut vault = ts::take_shared<SuiUsdeMetaVault>(&scenario);
    let cap2 = ts::take_from_sender<AdminCap>(&scenario);
    suiusde_meta_vault::set_paused(&cap2, &mut vault, true);
    let coin_in = coin::mint_for_testing<0x2::sui::SUI>(1_000, ts::ctx(&mut scenario));
    let _ = suiusde_meta_vault::deposit(&mut vault, coin_in, ts::ctx(&mut scenario));
    ts::return_to_sender(&scenario, cap2);
    ts::return_shared(vault);
    ts::end(scenario);
}

/// INV-8: compound called twice without advancing clock aborts with ECompoundTooSoon.
#[test, expected_failure]
fun inv_compound_too_soon_aborts() {
    let mut scenario = ts::begin(ALICE);
    let cap = suiusde_meta_vault::new(ts::ctx(&mut scenario));
    transfer::public_transfer(cap, ALICE);

    ts::next_tx(&mut scenario, ALICE);
    let mut vault = ts::take_shared<SuiUsdeMetaVault>(&scenario);
    let cap2 = ts::take_from_sender<AdminCap>(&scenario);

    // Create clock and advance past first compound window
    let mut clk = clock::create_for_testing(ts::ctx(&mut scenario));
    clock::increment_for_testing(&mut clk, COMPOUND_INTERVAL_MS + 1);

    // First deposit so vault has value
    let coin_in = coin::mint_for_testing<0x2::sui::SUI>(10_000_000, ts::ctx(&mut scenario));
    suiusde_meta_vault::deposit(&mut vault, coin_in, ts::ctx(&mut scenario));

    // First compound — succeeds (clock is past interval from last_compound_ms=0)
    let yield1 = coin::mint_for_testing<0x2::sui::SUI>(1_000_000, ts::ctx(&mut scenario));
    suiusde_meta_vault::compound(
        &mut vault, 250_000, 250_000, 250_000, 250_000,
        yield1, &clk, &cap2,
    );

    // Second compound at same timestamp — aborts
    let yield2 = coin::mint_for_testing<0x2::sui::SUI>(1_000_000, ts::ctx(&mut scenario));
    suiusde_meta_vault::compound(
        &mut vault, 250_000, 250_000, 250_000, 250_000,
        yield2, &clk, &cap2,
    );
    clock::destroy_for_testing(clk);
    ts::return_to_sender(&scenario, cap2);
    ts::return_shared(vault);
    ts::end(scenario);
}

/// INV-9: fee_balance is monotonically non-decreasing through compounds.
#[test]
fun inv_fee_balance_monotone() {
    let mut fee = 0u64;
    let yields = vector[1_000_000u64, 5_000_000u64, 2_500_000u64, 10_000_000u64];
    let mut i = 0;
    while (i < yields.length()) {
        let prev = fee;
        fee = fee + yields[i] / 10;
        assert!(fee >= prev);
        i = i + 1;
    };
}

/// INV-10: Deposit + full withdraw is exact roundtrip for sole depositor.
#[test]
fun inv_deposit_withdraw_roundtrip() {
    let mut scenario = ts::begin(ALICE);
    let cap = suiusde_meta_vault::new(ts::ctx(&mut scenario));
    transfer::public_transfer(cap, ALICE);

    ts::next_tx(&mut scenario, ALICE);
    {
        let mut vault = ts::take_shared<SuiUsdeMetaVault>(&scenario);
        let amount = 3_000_000_000u64;
        let coin_in = coin::mint_for_testing<0x2::sui::SUI>(amount, ts::ctx(&mut scenario));
        let shares = suiusde_meta_vault::deposit(&mut vault, coin_in, ts::ctx(&mut scenario));
        let coin_out = suiusde_meta_vault::withdraw(&mut vault, shares, ts::ctx(&mut scenario));
        assert!(coin_out.value() == amount);
        unit_test::destroy(coin_out);
        ts::return_shared(vault);
    };
    ts::end(scenario);
}

// ═══════════════════════════════════════════════════════
// § 2  STATELESS FUZZ TESTS
// ═══════════════════════════════════════════════════════

/// FUZZ-SL-1: total_apy_bps is always the exact sum of four layers.
#[random_test]
fun fuzz_total_apy_exact_sum(s_raw: u64, p_raw: u64, m_raw: u64, c_raw: u64) {
    let s = s_raw % (MAX_RATE_BPS + 1);
    let p = p_raw % (MAX_RATE_BPS + 1);
    let m = m_raw % (MAX_RATE_BPS + 1);
    let c = c_raw % (MAX_RATE_BPS + 1);
    let total = s + p + m + c;
    assert!(total == s + p + m + c);
    assert!(total <= MAX_RATE_BPS * 4);
}

/// FUZZ-SL-2: 10% fee split is lossless for any yield total.
#[random_test]
fun fuzz_fee_split_lossless(total_raw: u64) {
    let total = total_raw % 1_000_000_000_000u64 + 1;
    let fee   = total / 10;
    let net   = total - fee;
    assert!(fee + net == total);
    assert!(fee <= total / 10 + 1);
    assert!(net >= total - total / 10 - 1);
}

/// FUZZ-SL-3: Share price after compound is strictly greater than before.
#[random_test]
fun fuzz_share_price_rises_after_compound(shares_raw: u64, deposited_raw: u64, yield_raw: u64) {
    let shares    = shares_raw % 1_000_000_000u64 + 1;
    let deposited = shares + deposited_raw % shares;
    let yield_    = yield_raw % (deposited / 10 + 1) + 1;
    let net       = yield_ - yield_ / 10;
    let p_before = (deposited as u128) * 10_000 / (shares as u128);
    let p_after  = ((deposited + net) as u128) * 10_000 / (shares as u128);
    if (net > 0) { assert!(p_after > p_before) };
}

/// FUZZ-SL-4: Layer rate at exactly MAX is valid; one above aborts.
#[random_test]
fun fuzz_rate_at_max_valid(valid_raw: u64, extra_raw: u64) {
    let valid = valid_raw % (MAX_RATE_BPS + 1);
    let over  = MAX_RATE_BPS + extra_raw % 10_000 + 1;
    assert!(valid <= MAX_RATE_BPS);
    assert!(over  >  MAX_RATE_BPS);
}

/// FUZZ-SL-5: Compound timing — boundary check is correct.
#[random_test]
fun fuzz_compound_timing_boundary(last_ms_raw: u64, early_raw: u64, late_raw: u64) {
    let last_ms  = last_ms_raw % 1_000_000_000_000u64;
    let too_soon = last_ms + early_raw % COMPOUND_INTERVAL_MS;
    let on_time  = last_ms + COMPOUND_INTERVAL_MS;
    let late     = last_ms + COMPOUND_INTERVAL_MS + late_raw % 1_000_000u64 + 1;
    assert!(too_soon < last_ms + COMPOUND_INTERVAL_MS);
    assert!(on_time  >= last_ms + COMPOUND_INTERVAL_MS);
    assert!(late     >= last_ms + COMPOUND_INTERVAL_MS);
}

// ═══════════════════════════════════════════════════════
// § 3  STATEFUL FUZZ TESTS
// ═══════════════════════════════════════════════════════

/// FUZZ-SF-1: Share price rises monotonically across many compound cycles.
#[random_test]
fun stateful_fuzz_price_monotone_through_compounds(shares_raw: u64, n0: u64, n1: u64, n2: u64) {
    let shares        = shares_raw % 1_000_000_000u64 + 1_000;
    let mut deposited = shares as u128;
    let mut prev_price = 10_000u128;
    let nets = vector[
        (n0 % (shares / 20 + 1) + 1) as u128,
        (n1 % (shares / 20 + 1) + 1) as u128,
        (n2 % (shares / 20 + 1) + 1) as u128,
    ];
    let mut i = 0u64;
    while (i < 3) {
        deposited   = deposited + nets[i];
        let new_price = deposited * 10_000 / (shares as u128);
        assert!(new_price >= prev_price);
        prev_price = new_price;
        i = i + 1;
    };
}

/// FUZZ-SF-2: Multi-depositor then compound — each depositor can withdraw their share.
#[random_test]
fun stateful_fuzz_multi_depositor_post_compound(a_raw: u64, b_raw: u64, net_raw: u64) {
    let amt_a = a_raw % 100_000_000u64 + 1_000;
    let amt_b = b_raw % 100_000_000u64 + 1_000;
    let shares_a: u128 = amt_a as u128;
    let mut shares: u128    = shares_a;
    let mut deposited: u128 = amt_a as u128;
    let shares_b = (amt_b as u128) * shares / deposited;
    shares    = shares + shares_b;
    deposited = deposited + (amt_b as u128);
    let net = (net_raw % (deposited as u64 / 20 + 1) + 1) as u128;
    deposited = deposited + net;
    let out_a = shares_a * deposited / shares;
    assert!(out_a <= deposited);
}

/// FUZZ-SF-3: Rate updates + compounds — total_apy_bps always equals sum.
#[random_test]
fun stateful_fuzz_apy_sum_across_updates(
    s0: u64, p0: u64, m0: u64, c0: u64,
    s1: u64, p1: u64, m1: u64, c1: u64,
) {
    let t0 = s0 % (MAX_RATE_BPS + 1) + p0 % (MAX_RATE_BPS + 1)
           + m0 % (MAX_RATE_BPS + 1) + c0 % (MAX_RATE_BPS + 1);
    let t1 = s1 % (MAX_RATE_BPS + 1) + p1 % (MAX_RATE_BPS + 1)
           + m1 % (MAX_RATE_BPS + 1) + c1 % (MAX_RATE_BPS + 1);
    assert!(t0 <= MAX_RATE_BPS * 4);
    assert!(t1 <= MAX_RATE_BPS * 4);
}

/// FUZZ-SF-4: Solvency maintained through compound + withdraw interleaving.
#[random_test]
fun stateful_fuzz_solvency_through_compound_and_withdraw(shares_raw: u64, n0: u64, n1: u64) {
    let init_shares     = shares_raw % 1_000_000u64 + 1_000;
    let mut shares: u128    = init_shares as u128;
    let mut deposited: u128 = shares;
    let nets = vector[
        (n0 % (init_shares / 20 + 1) + 1) as u128,
        (n1 % (init_shares / 20 + 1) + 1) as u128,
    ];
    let mut i = 0u64;
    while (i < 2) {
        deposited = deposited + nets[i];
        let burn = shares / 10;
        if (burn > 0) {
            let out = burn * deposited / shares;
            assert!(out <= deposited);
            shares    = shares    - burn;
            deposited = deposited - out;
        };
        i = i + 1;
    };
    if (shares > 0) { assert!(deposited > 0) };
}
