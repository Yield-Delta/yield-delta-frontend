import { DocsBackButton } from '@/components/docs/DocsBackButton'
import { CodeBlock } from '@/components/docs/CodeBlock'
import Link from 'next/link'

export const metadata = {
  title: 'Adaptive Yield Vault — Yield Delta Docs',
  description: 'Deep-dive into the volatility-reactive Adaptive Yield Vault Anchor program.',
}

export default function AdaptiveYieldVaultPage() {
  return (
    <div className="docs-content">
      <DocsBackButton href="/docs/solana-programs" label="Back to Solana Programs" />

      <div className="flex items-center gap-3 mb-4">
        <h1 className="text-4xl font-bold">Adaptive Yield Vault</h1>
        <span className="text-sm px-3 py-1 rounded-full font-bold" style={{ background: 'rgba(255,110,247,0.12)', color: '#ff6ef7', border: '1px solid rgba(255,110,247,0.3)' }}>
          EXPERIMENTAL
        </span>
      </div>

      <p className="text-lg text-muted-foreground mb-8">
        The Adaptive Yield Vault is a Solana-native experimental program that reads the live{' '}
        <code>VolatilityRegime</code> from the on-chain <code>yield_oracle</code> and adjusts its
        yield rate in real time — without any off-chain data feeds or keeper contracts.
      </p>

      <h2 className="text-2xl font-semibold mb-4">Why This Is Different</h2>

      <p className="mb-4">
        Every other vault in the suite uses a static <code>yield_bps</code> set at initialization.
        The Adaptive Vault instead computes an <strong>effective yield</strong> each time{' '}
        <code>accrue_adaptive</code> is called, based on the current oracle signal:
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {REGIME_CARDS.map((c) => (
          <div key={c.regime} className="p-4 rounded-2xl text-center" style={{ background: `${c.color}10`, border: `1px solid ${c.color}30` }}>
            <p className="text-xs font-bold tracking-widest mb-1" style={{ color: c.color }}>{c.regime} VOLATILITY</p>
            <p className="text-2xl font-bold text-white mb-1">{c.apy}</p>
            <p className="text-xs text-white/50">{c.multiplier}</p>
          </div>
        ))}
      </div>

      <p className="mb-8 text-sm text-white/60">
        Example with <code>base_yield_bps = 1200</code> (12%), <code>low_mult_bps = 7000</code>,{' '}
        <code>high_mult_bps = 15000</code>.
      </p>

      <h2 className="text-2xl font-semibold mb-4">Solana-Native Features Used</h2>

      <div className="space-y-4 mb-8">
        {NATIVE_FEATURES.map((f) => (
          <div key={f.title} className="flex gap-4 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <span className="text-2xl shrink-0">{f.icon}</span>
            <div>
              <p className="font-semibold text-white mb-1">{f.title}</p>
              <p className="text-sm text-white/55">{f.description}</p>
            </div>
          </div>
        ))}
      </div>

      <h2 className="text-2xl font-semibold mb-4">Program State</h2>

      <CodeBlock language="rust" code={`#[account]
pub struct AdaptiveVaultState {
    pub authority:                  Pubkey,  // vault admin / AI keeper
    pub token_mint:                 Pubkey,  // SPL mint users deposit
    pub vault_mint:                 Pubkey,  // share token mint
    pub vault_token_account:        Pubkey,  // ATA holding deposits
    pub oracle_signal:              Pubkey,  // yield_oracle SignalAccount to watch
    pub total_shares:               u64,
    pub total_assets:               u64,
    pub base_yield_bps:             u16,     // baseline APY e.g. 1200 = 12%
    pub low_mult_bps:               u16,     // Low-regime multiplier e.g. 7000 = 0.70×
    pub high_mult_bps:              u16,     // High-regime multiplier e.g. 15000 = 1.50×
    pub lock_slots_high:            u64,     // withdrawal lock after High-regime entry
    pub high_regime_started_at_slot: u64,   // slot of most recent High transition
    pub current_regime:             VolatilityRegime,
    pub last_accrual:               i64,
    pub bump:                       u8,
}`} />

      <h2 className="text-2xl font-semibold mb-4 mt-8">accrue_adaptive Instruction</h2>
      <p className="mb-4">
        This is the core instruction that makes the vault adaptive. It is authority-gated and
        called periodically by the AI keeper.
      </p>

      <CodeBlock language="rust" code={`pub fn handler(ctx: Context<AccrueAdaptive>, _strategy_id: u8) -> Result<()> {
    let signal = &ctx.accounts.oracle_signal;
    let now    = Clock::get()?.unix_timestamp;

    // 1. Require a fresh oracle signal (posted within 2 hours)
    require!(now - signal.posted_at < 7_200, AdaptiveVaultError::StaleOracleSignal);

    // 2. Update regime — record transition slot if entering High
    let new_regime = signal.volatility_regime.clone();
    if matches!(new_regime, VolatilityRegime::High)
        && !matches!(vault.current_regime, VolatilityRegime::High)
    {
        vault.high_regime_started_at_slot = Clock::get()?.slot;
    }
    vault.current_regime = new_regime;

    // 3. Accrue at vol-adjusted rate
    let effective_bps = vault.effective_yield_bps(); // 840 | 1200 | 1800
    let yield_earned  = accrue_simple_interest(vault.total_assets, effective_bps, elapsed)?;
    vault.total_assets += yield_earned;
    vault.last_accrual  = now;
}`} />

      <h2 className="text-2xl font-semibold mb-4 mt-8">Withdrawal Slot-Lock</h2>
      <p className="mb-4">
        When the oracle transitions to <code>High</code> volatility, withdrawals are blocked for{' '}
        <code>lock_slots_high</code> slots. At Solana&apos;s ~400 ms/slot, 150 slots ≈ 60 seconds.
        This prevents users from front-running a High-regime entry to capture the 1.5× yield boost
        and immediately exit.
      </p>

      <CodeBlock language="rust" code={`// In withdraw handler:
if matches!(vault.current_regime, VolatilityRegime::High) {
    let current_slot = Clock::get()?.slot;
    let lock_until   = vault.high_regime_started_at_slot
        .saturating_add(vault.lock_slots_high);
    require!(
        current_slot >= lock_until,
        AdaptiveVaultError::WithdrawLockedHighVolatility
    );
}`} />

      <h2 className="text-2xl font-semibold mb-4 mt-8">Oracle Account Verification</h2>
      <p className="mb-4">
        The oracle <code>SignalAccount</code> is passed as a read-only account in the{' '}
        <code>AccrueAdaptive</code> context. Anchor verifies the PDA derivation against the{' '}
        <code>yield_oracle</code> program ID — no CPI required, just an account read:
      </p>

      <CodeBlock language="rust" code={`#[account(
    constraint = oracle_signal.key() == vault_state.oracle_signal
        @ AdaptiveVaultError::OracleMismatch,
    seeds = [b"signal", strategy_id.to_le_bytes().as_ref()],
    bump  = oracle_signal.bump,
    seeds::program = yield_oracle::ID,   // verified against oracle program
)]
pub oracle_signal: Account<'info, SignalAccount>,`} />

      <div className="mt-10 flex gap-4">
        <Link href="/docs/solana-programs/backtesting" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium" style={{ background: 'rgba(20,241,149,0.08)', color: '#14f195', border: '1px solid rgba(20,241,149,0.25)' }}>
          View backtesting results →
        </Link>
        <Link href="/docs/solana-programs" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}>
          ← All programs
        </Link>
      </div>
    </div>
  )
}

const REGIME_CARDS = [
  { regime: 'LOW', apy: '8.4% APY', multiplier: '0.70× base — conservative', color: '#14f195' },
  { regime: 'MEDIUM', apy: '12.0% APY', multiplier: '1.00× base — standard', color: '#9945ff' },
  { regime: 'HIGH', apy: '18.0% APY', multiplier: '1.50× base — vol-premium harvest', color: '#ff6ef7' },
]

const NATIVE_FEATURES = [
  {
    icon: '🔗',
    title: 'Cross-program account deserialization',
    description: 'The vault reads yield_oracle\'s SignalAccount directly by passing it as an account in the transaction context. Anchor verifies the PDA seeds against the oracle program ID — no CPI call needed, making reads essentially free.',
  },
  {
    icon: '🕐',
    title: 'Slot-clock withdrawal lock',
    description: 'Uses Clock::get()?.slot to enforce a circuit breaker when volatility spikes. On Solana, slot reads are synchronous and cost nothing — a pattern impossible on EVM chains without an external oracle.',
  },
  {
    icon: '📦',
    title: 'Shared math library via path dependency',
    description: 'yield_vault_core is a pure Rust library crate shared across all seven programs. Solana\'s lack of a global package registry makes path dependencies the cleanest way to avoid duplicating checked arithmetic.',
  },
  {
    icon: '⚡',
    title: 'Sub-second regime responsiveness',
    description: 'At 400 ms/slot, the vault can respond to a new oracle signal within one slot of accrue_adaptive being called. On a 12-second EVM chain this would require a multi-block lag.',
  },
]
