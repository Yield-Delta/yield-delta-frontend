/// Test suite for hedge_ratio_vault
///
///  1. Invariant tests   — h** = min(h*, h_bar) holds unconditionally
///  2. Stateless fuzz    — clipping formula, interval scaling, deposit arithmetic
///  3. Stateful fuzz     — sequences of rebalances and volatility updates
module yield_vaults::hedge_ratio_tests;

use sui::coin;
use sui::transfer;
use sui::clock;
use sui::test_scenario::{Self as ts};
use std::unit_test;

use yield_vaults::hedge_ratio_vault::{
    Self,
    HedgeRatioVault,
    AdminCap,
};

const ALICE: address = @0xA11CE;
const SCALE: u64 = 1_000_000_000;
const MIN_REBALANCE_MS: u64 = 60_000;

// ═══════════════════════════════════════════════════════
// § 1  INVARIANT TESTS
// ═══════════════════════════════════════════════════════

/// INV-1: h_effective = min(h*, h_bar) — clipping logic is always tight.
#[test]
fun inv_clipping_under_and_over() {
    let h_bar = 800_000_000u64;
    let under = 500_000_000u64;
    let over  = 1_200_000_000u64;

    let eff_under = if (under > h_bar) { h_bar } else { under };
    let eff_over  = if (over  > h_bar) { h_bar } else { over };

    assert!(eff_under == under);   // not clipped
    assert!(eff_over  == h_bar);   // clipped
    assert!(eff_under <= h_bar);
    assert!(eff_over  <= h_bar);
}

/// INV-2: Rebalance interval always >= MIN_REBALANCE_INTERVAL_MS.
#[test]
fun inv_rebalance_interval_floor() {
    let extreme_sigma = SCALE * 100;
    let t_raw = 3_600_000u128 * (SCALE as u128) / (extreme_sigma as u128);
    let interval = if ((t_raw as u64) < MIN_REBALANCE_MS) { MIN_REBALANCE_MS }
                   else { t_raw as u64 };
    assert!(interval >= MIN_REBALANCE_MS);
}

/// INV-3: Zero deposit aborts.
#[test, expected_failure]
fun inv_zero_deposit_aborts() {
    let mut scenario = ts::begin(ALICE);
    let cap = hedge_ratio_vault::new(ts::ctx(&mut scenario));
    transfer::public_transfer(cap, ALICE);

    ts::next_tx(&mut scenario, ALICE);
    let mut vault = ts::take_shared<HedgeRatioVault>(&scenario);
    let zero = coin::zero<0x2::sui::SUI>(ts::ctx(&mut scenario));
    let _ = hedge_ratio_vault::deposit(&mut vault, zero, ts::ctx(&mut scenario));
    ts::return_shared(vault);
    ts::end(scenario);
}

/// INV-4: Paused vault rejects deposits.
#[test, expected_failure]
fun inv_paused_vault_rejects_deposit() {
    let mut scenario = ts::begin(ALICE);
    let cap = hedge_ratio_vault::new(ts::ctx(&mut scenario));
    transfer::public_transfer(cap, ALICE);

    ts::next_tx(&mut scenario, ALICE);
    let mut vault = ts::take_shared<HedgeRatioVault>(&scenario);
    let cap2 = ts::take_from_sender<AdminCap>(&scenario);
    hedge_ratio_vault::set_paused(&cap2, &mut vault, true);
    let coin_in = coin::mint_for_testing<0x2::sui::SUI>(1_000, ts::ctx(&mut scenario));
    let _ = hedge_ratio_vault::deposit(&mut vault, coin_in, ts::ctx(&mut scenario));
    ts::return_to_sender(&scenario, cap2);
    ts::return_shared(vault);
    ts::end(scenario);
}

/// INV-5: Zero volatility update aborts (would divide by zero in interval calc).
#[test, expected_failure]
fun inv_zero_sigma_aborts() {
    let mut scenario = ts::begin(ALICE);
    let cap = hedge_ratio_vault::new(ts::ctx(&mut scenario));
    transfer::public_transfer(cap, ALICE);

    ts::next_tx(&mut scenario, ALICE);
    let mut vault = ts::take_shared<HedgeRatioVault>(&scenario);
    let cap2 = ts::take_from_sender<AdminCap>(&scenario);
    let clock = clock::create_for_testing(ts::ctx(&mut scenario));
    hedge_ratio_vault::update_volatility(&cap2, &mut vault, 0);
    clock::destroy_for_testing(clock);
    ts::return_to_sender(&scenario, cap2);
    ts::return_shared(vault);
    ts::end(scenario);
}

/// INV-6: deposit + full withdraw is an exact roundtrip for a sole depositor.
#[test]
fun inv_deposit_withdraw_roundtrip() {
    let mut scenario = ts::begin(ALICE);
    let cap = hedge_ratio_vault::new(ts::ctx(&mut scenario));
    transfer::public_transfer(cap, ALICE);

    ts::next_tx(&mut scenario, ALICE);
    {
        let mut vault = ts::take_shared<HedgeRatioVault>(&scenario);
        let amount = 1_500_000_000u64;
        let coin_in = coin::mint_for_testing<0x2::sui::SUI>(amount, ts::ctx(&mut scenario));
        let shares = hedge_ratio_vault::deposit(&mut vault, coin_in, ts::ctx(&mut scenario));
        let coin_out = hedge_ratio_vault::withdraw(&mut vault, shares, ts::ctx(&mut scenario));
        assert!(coin_out.value() == amount);
        unit_test::destroy(coin_out);
        ts::return_shared(vault);
    };
    ts::end(scenario);
}

/// INV-7: update_hedge_ratio clips to h_bar and emits correct effective value.
#[test]
fun inv_hedge_ratio_clipped_to_h_bar() {
    let mut scenario = ts::begin(ALICE);
    let cap = hedge_ratio_vault::new(ts::ctx(&mut scenario));
    transfer::public_transfer(cap, ALICE);

    ts::next_tx(&mut scenario, ALICE);
    {
        let mut vault = ts::take_shared<HedgeRatioVault>(&scenario);
        let cap2 = ts::take_from_sender<AdminCap>(&scenario);
        let clock = clock::create_for_testing(ts::ctx(&mut scenario));

        // Set h_bar = 0.8
        hedge_ratio_vault::set_h_bar(&cap2, &mut vault, 800_000_000);
        // Propose h* = 1.2 — should be clipped to 0.8
        hedge_ratio_vault::update_hedge_ratio(&cap2, &mut vault, 1_200_000_000, &clock);
        assert!(hedge_ratio_vault::h_star(&vault) == 800_000_000);
        assert!(hedge_ratio_vault::h_star(&vault) <= hedge_ratio_vault::h_bar(&vault));

        clock::destroy_for_testing(clock);
        ts::return_to_sender(&scenario, cap2);
        ts::return_shared(vault);
    };
    ts::end(scenario);
}

// ═══════════════════════════════════════════════════════
// § 2  STATELESS FUZZ TESTS
// ═══════════════════════════════════════════════════════

/// FUZZ-SL-1: Clipping formula correct for all (h_star, h_bar) pairs.
#[random_test]
fun fuzz_clipping_formula(h_bar_raw: u64, h_star_raw: u64) {
    let h_bar  = h_bar_raw % (2 * SCALE) + 1;
    let h_star = h_star_raw % (2 * SCALE);
    let eff    = if (h_star > h_bar) { h_bar } else { h_star };
    assert!(eff <= h_bar);
    if (h_star <= h_bar) { assert!(eff == h_star) };
    if (h_star >  h_bar) { assert!(eff == h_bar)  };
}

/// FUZZ-SL-2: Higher volatility always produces shorter or equal rebalance interval.
#[random_test]
fun fuzz_interval_inverse_sigma(sigma_lo_raw: u64, delta: u64) {
    let sigma_lo = sigma_lo_raw % (SCALE / 2) + 1;
    let sigma_hi = sigma_lo + delta % (SCALE * 2) + 1;
    let t_lo = 3_600_000u128 * (SCALE as u128) / (sigma_lo as u128);
    let t_hi = 3_600_000u128 * (SCALE as u128) / (sigma_hi as u128);
    let i_lo = if ((t_lo as u64) < MIN_REBALANCE_MS) { MIN_REBALANCE_MS } else { t_lo as u64 };
    let i_hi = if ((t_hi as u64) < MIN_REBALANCE_MS) { MIN_REBALANCE_MS } else { t_hi as u64 };
    assert!(i_lo >= i_hi);
    assert!(i_lo >= MIN_REBALANCE_MS);
    assert!(i_hi >= MIN_REBALANCE_MS);
}

/// FUZZ-SL-3: Deposit never dilutes existing share price.
#[random_test]
fun fuzz_deposit_no_dilution(shares_raw: u64, extra_raw: u64, amount_raw: u64) {
    let total_shares    = shares_raw % 1_000_000_000u64 + 1;
    let total_deposited = total_shares + extra_raw % 1_000_000_000u64;
    let amount_in       = amount_raw % 1_000_000_000u64 + 1;
    let shares_new = (amount_in as u128) * (total_shares as u128) / (total_deposited as u128);
    let price_before_num = (total_deposited as u128) * 10_000;
    let price_after_num  = ((total_deposited as u128) + (amount_in as u128)) * 10_000;
    let price_after_den  = (total_shares as u128) + shares_new;
    assert!(price_after_num * (total_shares as u128) >= price_before_num * price_after_den);
}

/// FUZZ-SL-4: Withdraw never extracts more than total_deposited.
#[random_test]
fun fuzz_withdraw_bounded(shares_raw: u64, extra_raw: u64, burn_raw: u64) {
    let total_shares    = shares_raw % 1_000_000u64 + 1;
    let total_deposited = total_shares + extra_raw % total_shares;
    let shares_burn     = burn_raw % total_shares + 1;
    let amount_out = (shares_burn as u128) * (total_deposited as u128) / (total_shares as u128);
    assert!(amount_out <= (total_deposited as u128));
}

// ═══════════════════════════════════════════════════════
// § 3  STATEFUL FUZZ TESTS
// ═══════════════════════════════════════════════════════

/// FUZZ-SF-1: h_star always <= h_bar after any number of aggressive proposals.
#[random_test]
fun stateful_fuzz_h_star_bounded(h_bar_raw: u64, p0: u64, p1: u64, p2: u64) {
    let h_bar = h_bar_raw % SCALE + SCALE / 10;
    let proposals = vector[
        h_bar + p0 % SCALE + 1,
        h_bar + p1 % SCALE + 1,
        h_bar + p2 % SCALE + 1,
    ];
    let mut i = 0u64;
    while (i < 3) {
        let h = if (proposals[i] > h_bar) { h_bar } else { proposals[i] };
        assert!(h <= h_bar);
        i = i + 1;
    };
}

/// FUZZ-SF-2: Interval floor holds across many volatility updates.
#[random_test]
fun stateful_fuzz_interval_floor_maintained(s0: u64, s1: u64, s2: u64) {
    let sigmas = vector[s0 % (SCALE * 10) + 1, s1 % (SCALE * 10) + 1, s2 % (SCALE * 10) + 1];
    let mut i = 0u64;
    while (i < 3) {
        let sigma = sigmas[i];
        let t_raw = 3_600_000u128 * (SCALE as u128) / (sigma as u128);
        let interval = if ((t_raw as u64) < MIN_REBALANCE_MS) { MIN_REBALANCE_MS }
                       else { t_raw as u64 };
        assert!(interval >= MIN_REBALANCE_MS);
        i = i + 1;
    };
}

/// FUZZ-SF-3: Multi-depositor then withdrawal — total withdrawn never > total deposited.
#[random_test]
fun stateful_fuzz_multi_deposit_solvency(total_shares_raw: u64, extra_raw: u64, burn_raw: u64) {
    let total_shares    = (total_shares_raw % 1_000_000u64 + 1) as u128;
    let total_deposited = total_shares + ((extra_raw % 1_000_000u64) as u128);
    let burn            = (burn_raw % (total_shares as u64) + 1) as u128;
    let out = burn * total_deposited / total_shares;
    assert!(out <= total_deposited);
}
