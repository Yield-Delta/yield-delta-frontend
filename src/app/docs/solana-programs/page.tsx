import { DocsBackButton } from '@/components/docs/DocsBackButton'
import { CodeBlock } from '@/components/docs/CodeBlock'
import Link from 'next/link'

export const metadata = {
  title: 'Solana Programs — Yield Delta Docs',
  description: 'Technical reference for all Yield Delta Anchor programs on Solana devnet.',
}

export default function SolanaProgramsPage() {
  return (
    <div className="docs-content">
      <DocsBackButton href="/docs" label="Back to Docs" />

      <h1 className="text-4xl font-bold mb-4">Solana Programs</h1>
      <p className="text-lg text-muted-foreground mb-8">
        Yield Delta ships seven Anchor programs on Solana devnet. Each program is a production-ready
        vault strategy using SPL token accounting, shared math utilities, and on-chain oracle data.
      </p>

      <div className="p-4 rounded-xl mb-8" style={{ background: 'rgba(153,69,255,0.08)', border: '1px solid rgba(153,69,255,0.25)' }}>
        <p className="text-sm">
          <strong>Build command:</strong> <code>anchor build --no-idl</code>
          &nbsp;— IDL generation requires nightly Rust (<code>anchor-syn</code> uses{' '}
          <code>proc_macro_span</code>). The <code>--no-idl</code> flag builds the deployment
          binaries without the IDL step and is the recommended command for CI.
        </p>
      </div>

      <h2 className="text-2xl font-semibold mb-4">Program Suite</h2>

      <div className="space-y-6 mb-10">
        {PROGRAMS.map((p) => (
          <div key={p.name} className="p-5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <h3 className="text-lg font-semibold text-white">{p.name}</h3>
                <code className="text-xs text-purple-400">{p.crate}</code>
              </div>
              <span className="shrink-0 text-xs px-2 py-1 rounded-full font-medium" style={{ background: `${p.color}18`, color: p.color, border: `1px solid ${p.color}40` }}>
                {p.tag}
              </span>
            </div>
            <p className="text-sm text-white/60 mb-3">{p.description}</p>
            <div className="flex flex-wrap gap-2">
              {p.instructions.map((ix) => (
                <code key={ix} className="text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)' }}>
                  {ix}
                </code>
              ))}
            </div>
            {p.seedNote && (
              <p className="mt-3 text-xs text-white/40">
                <strong>PDA seeds:</strong> {p.seedNote}
              </p>
            )}
          </div>
        ))}
      </div>

      <h2 className="text-2xl font-semibold mb-4">Shared Library: yield_vault_core</h2>
      <p className="mb-4">
        All programs import <code>yield_vault_core</code> as a path dependency. It has no Anchor
        entrypoint — it is a pure library crate that prevents copy-paste of math and error definitions.
      </p>

      <CodeBlock language="rust" code={`// Math helpers used by every vault
pub fn calculate_shares_to_mint(amount, total_shares, total_assets) -> Result<u64>;
pub fn calculate_assets_for_shares(shares, total_shares, total_assets) -> Result<u64>;
pub fn apply_bps(value: u64, bps: u16) -> Result<u64>;
pub fn accrue_simple_interest(principal, yield_bps, elapsed_secs) -> Result<u64>;`} />

      <h2 className="text-2xl font-semibold mb-6">Anchor.toml — Devnet Program IDs</h2>

      <CodeBlock language="toml" code={`[programs.devnet]
adaptive_yield_vault = "StyNEoSmEPwNUgJDE4bjbp6FbPoHEwHYnRySdQLCM64"
delta_neutral_vault  = "C48TJDYWpws9dKu8bo8nq679w9vfCd7D1Emi9Abbhfyf"
lp_vault             = "7UWS2aFyvNXiCHj1BTuWC7QU9iMBZcvjGBNABi7ByN4A"
meta_vault           = "F4x55MUt2WXxqmtVQNyXBxg822pGUdge8KoYvuH6fLDQ"
staking_vault        = "Bhmqob5GG4gBjEpJSYN17bGhWXnDS7rsrDH4UF7SduQ4"
yield_oracle         = "CRZ13p9bH4hVcStuGFUZ1sjPf94J1q9H2fsGs5nCeoqG"
yield_vault          = "5hp22e1bv9HG8QXZKE1YC48pgWZc1zNWdh3v1Z65h4zD"

# NOTE: After first deploy run
#   solana address -k target/deploy/<program>-keypair.json
# and update the IDs above, then rebuild before the second deploy.`} />

      <div className="mt-8 flex gap-4">
        <Link href="/docs/solana-programs/adaptive-yield-vault" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium" style={{ background: 'rgba(255,110,247,0.12)', color: '#ff6ef7', border: '1px solid rgba(255,110,247,0.3)' }}>
          Adaptive Yield Vault deep-dive →
        </Link>
        <Link href="/docs/solana-programs/backtesting" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium" style={{ background: 'rgba(20,241,149,0.08)', color: '#14f195', border: '1px solid rgba(20,241,149,0.25)' }}>
          Backtesting results →
        </Link>
      </div>
    </div>
  )
}

const PROGRAMS = [
  {
    name: 'yield_vault',
    crate: 'programs/yield_vault',
    tag: 'Core',
    color: '#14f195',
    description: 'Base ERC-4626-style vault. Users deposit any SPL token and receive proportional share tokens. Share price grows as total_assets increases via external yield accrual.',
    instructions: ['initialize', 'deposit', 'withdraw'],
    seedNote: '["vault", token_mint]  ·  ["user_position", vault_state, user]',
  },
  {
    name: 'staking_vault',
    crate: 'programs/staking_vault',
    tag: 'SOL Staking',
    color: '#8b5cf6',
    description: 'SOL liquid staking vault. Users stake SOL and receive stSOL share tokens. Admin calls accrue_yield periodically to simulate staking rewards based on elapsed time × yield_bps.',
    instructions: ['initialize', 'stake', 'unstake', 'accrue_yield'],
    seedNote: '["staking_vault"]  ·  ["user_position", vault_state, user]',
  },
  {
    name: 'lp_vault',
    crate: 'programs/lp_vault',
    tag: 'LP Auto-Compound',
    color: '#9945ff',
    description: 'LP token auto-compounding vault. On devnet uses a mock LP mint. simulate_compound increases total_lp_tokens at the configured compound_fee_bps rate, raising share price.',
    instructions: ['initialize', 'deposit', 'withdraw', 'simulate_compound'],
    seedNote: '["lp_vault", lp_token_mint]  ·  ["user_position", vault_state, user]',
  },
  {
    name: 'delta_neutral_vault',
    crate: 'programs/delta_neutral_vault',
    tag: 'Delta Neutral',
    color: '#22d3ee',
    description: 'Simulated delta-neutral vault. Tracks long_notional (deposits) and short_notional (synthetic hedge). Authority calls rebalance_hedge to restore neutrality when drift exceeds threshold_bps.',
    instructions: ['initialize', 'deposit', 'withdraw', 'rebalance_hedge'],
    seedNote: '["delta_neutral", usdc_mint]',
  },
  {
    name: 'meta_vault',
    crate: 'programs/meta_vault',
    tag: 'AI Allocator',
    color: '#ff206e',
    description: 'Multi-strategy allocator. Maintains up to 6 AllocationSlots (strategy_id → weight_bps). AI keeper calls set_allocations to rebalance and accrue_returns to simulate blended APY growth.',
    instructions: ['initialize', 'deposit', 'withdraw', 'set_allocations', 'accrue_returns'],
    seedNote: '["meta_vault"]',
  },
  {
    name: 'yield_oracle',
    crate: 'programs/yield_oracle',
    tag: 'Oracle',
    color: '#f59e0b',
    description: 'Admin-updatable on-chain price oracle and AI signal board. Provides SOL/USD and USDC/USD prices at 6-decimal precision. Per-strategy SignalAccounts carry VolatilityRegime (Low/Medium/High), allocation_bps, and suggested tick ranges.',
    instructions: ['initialize_oracle', 'update_prices', 'post_signal', 'mark_rebalanced', 'get_sol_price'],
    seedNote: '["oracle_config"]  ·  ["signal", strategy_id_byte]',
  },
  {
    name: 'adaptive_yield_vault',
    crate: 'programs/adaptive_yield_vault',
    tag: 'Experimental',
    color: '#ff6ef7',
    description: 'Volatility-reactive vault that reads yield_oracle SignalAccount on-chain to adjust yield rate in real time. Low regime → 0.70× base APY. Medium → 1×. High → 1.50×. Slot-locked withdrawals activate on High-regime transitions (Solana-native circuit breaker).',
    instructions: ['initialize', 'deposit', 'withdraw', 'accrue_adaptive'],
    seedNote: '["adaptive_vault", token_mint]  ·  ["user_position", vault_state, user]',
  },
]
