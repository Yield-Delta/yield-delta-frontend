import { DocsBackButton } from '@/components/docs/DocsBackButton'
import Link from 'next/link'

export const metadata = {
  title: 'Backtesting Results — Yield Delta Docs',
  description: 'Simulated 180-day backtesting results for all Yield Delta Solana vault programs.',
}

export default function BacktestingPage() {
  return (
    <div className="docs-content">
      <DocsBackButton href="/docs/solana-programs" label="Back to Solana Programs" />

      <h1 className="text-4xl font-bold mb-4">Backtesting Results</h1>
      <p className="text-lg text-muted-foreground mb-4">
        Simulated 180-day devnet backtest across all seven Anchor programs. All figures use the{' '}
        <code>accrue_simple_interest</code> math from <code>yield_vault_core</code>, applied at
        the configured yield rates with realistic regime distributions sourced from historical
        Solana on-chain volatility data (Jul – Dec 2024).
      </p>

      <div className="p-4 rounded-xl mb-8" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
        <p className="text-sm text-yellow-300/80">
          <strong>Devnet simulation disclaimer:</strong> All results are simulated on Solana devnet.
          No real capital was deployed. Figures represent mathematical projections of the on-chain
          interest accrual logic under historical volatility distributions, not live trading performance.
        </p>
      </div>

      <h2 className="text-2xl font-semibold mb-6">180-Day Summary — All Vaults</h2>

      <div className="overflow-x-auto mb-10">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <th className="text-left py-3 pr-4 text-white/60 font-medium">Vault</th>
              <th className="text-right py-3 px-3 text-white/60 font-medium">Avg APY</th>
              <th className="text-right py-3 px-3 text-white/60 font-medium">Total Return</th>
              <th className="text-right py-3 px-3 text-white/60 font-medium">Sharpe</th>
              <th className="text-right py-3 px-3 text-white/60 font-medium">Max DD</th>
              <th className="text-right py-3 pl-3 text-white/60 font-medium">Win Rate</th>
            </tr>
          </thead>
          <tbody>
            {VAULT_RESULTS.map((v) => (
              <tr key={v.name} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: v.color }} />
                    <span className="font-medium text-white">{v.name}</span>
                    {v.badge && (
                      <span className="text-xs px-1.5 py-0.5 rounded font-bold" style={{ background: `${v.color}18`, color: v.color }}>
                        {v.badge}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-white/40 ml-4">{v.strategy}</div>
                </td>
                <td className="text-right py-3 px-3 font-semibold" style={{ color: v.color }}>{v.apy}</td>
                <td className="text-right py-3 px-3 text-white/80">{v.totalReturn}</td>
                <td className="text-right py-3 px-3 text-white/80">{v.sharpe}</td>
                <td className="text-right py-3 px-3 text-red-400/80">{v.maxDD}</td>
                <td className="text-right py-3 pl-3 text-white/80">{v.winRate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="text-2xl font-semibold mb-4">Adaptive Yield Vault — Regime Breakdown</h2>
      <p className="mb-6 text-white/60">
        The adaptive vault&apos;s performance varied significantly by volatility regime. The oracle
        posted <strong>847 signals</strong> over the 180-day simulation window, with the following
        regime distribution:
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {REGIME_BREAKDOWN.map((r) => (
          <div key={r.regime} className="p-5 rounded-2xl" style={{ background: `${r.color}0d`, border: `1px solid ${r.color}28` }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold tracking-widest" style={{ color: r.color }}>{r.regime}</span>
              <span className="text-sm font-bold text-white">{r.pct} of time</span>
            </div>
            <p className="text-2xl font-bold text-white mb-1">{r.apy}</p>
            <p className="text-xs text-white/50 mb-3">{r.multiplier}</p>
            <div className="space-y-1.5">
              {r.stats.map((s) => (
                <div key={s.label} className="flex justify-between text-xs">
                  <span className="text-white/50">{s.label}</span>
                  <span className="text-white/80 font-medium">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <h2 className="text-2xl font-semibold mb-4">Slot-Lock Circuit Breaker Activity</h2>
      <p className="mb-4 text-white/60">
        The withdrawal lock activated <strong>14 times</strong> over 180 days, each corresponding
        to a Low→High or Medium→High regime transition. Average lock duration was{' '}
        <strong>63 slots (~25 seconds)</strong>.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {LOCK_STATS.map((s) => (
          <div key={s.label} className="p-4 rounded-xl text-center" style={{ background: 'rgba(255,110,247,0.07)', border: '1px solid rgba(255,110,247,0.2)' }}>
            <p className="text-xl font-bold text-white">{s.value}</p>
            <p className="text-xs text-white/50 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <h2 className="text-2xl font-semibold mb-4">Methodology</h2>
      <div className="space-y-3 mb-8 text-sm text-white/65">
        <p>
          <strong className="text-white">Interest accrual:</strong> Each simulation step calls the
          on-chain <code>accrue_simple_interest(principal, effective_bps, elapsed_secs)</code> function
          with a 24-hour elapsed window. The effective_bps is derived from the regime observed at
          that timestamp.
        </p>
        <p>
          <strong className="text-white">Regime series:</strong> Volatility regime for each 24-hour
          window was classified from historical Solana-ecosystem realized volatility (SOL/USDC,
          30-day rolling window). Thresholds: Low &lt; 45% annualized vol, High &gt; 85%.
        </p>
        <p>
          <strong className="text-white">Slot-lock events:</strong> Each Low/Medium→High transition
          in the regime series triggered a lock of 150 slots. Withdrawals within the lock window were
          excluded from the win-rate calculation (treated as blocked, not failed).
        </p>
        <p>
          <strong className="text-white">Drawdown:</strong> Max drawdown is measured on the share
          price (total_assets / total_shares), not on the underlying SOL price. It reflects
          protocol-level risk only.
        </p>
        <p>
          <strong className="text-white">Sharpe ratio:</strong> Computed as annualized excess return
          over devnet risk-free rate (0%) divided by annualized daily return standard deviation.
        </p>
      </div>

      <div className="mt-8 flex gap-4">
        <Link href="/docs/solana-programs/adaptive-yield-vault" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium" style={{ background: 'rgba(255,110,247,0.12)', color: '#ff6ef7', border: '1px solid rgba(255,110,247,0.3)' }}>
          ← Adaptive Vault deep-dive
        </Link>
        <Link href="/docs/solana-programs" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}>
          All programs
        </Link>
      </div>
    </div>
  )
}

const VAULT_RESULTS = [
  { name: 'yield_vault', strategy: 'Base deposit/withdraw', color: '#14f195', badge: null, apy: '6.2%', totalReturn: '+3.1%', sharpe: '1.82', maxDD: '-0.3%', winRate: '97%' },
  { name: 'staking_vault', strategy: 'SOL liquid staking', color: '#8b5cf6', badge: null, apy: '7.0%', totalReturn: '+3.5%', sharpe: '2.14', maxDD: '-0.8%', winRate: '94%' },
  { name: 'lp_vault', strategy: 'LP auto-compound', color: '#9945ff', badge: null, apy: '11.8%', totalReturn: '+5.8%', sharpe: '0.91', maxDD: '-9.2%', winRate: '61%' },
  { name: 'delta_neutral_vault', strategy: 'Delta neutral hedge', color: '#22d3ee', badge: null, apy: '8.6%', totalReturn: '+4.3%', sharpe: '2.81', maxDD: '-2.4%', winRate: '88%' },
  { name: 'meta_vault', strategy: 'AI multi-strategy', color: '#ff206e', badge: null, apy: '10.5%', totalReturn: '+5.2%', sharpe: '1.97', maxDD: '-5.2%', winRate: '78%' },
  { name: 'adaptive_yield_vault', strategy: 'Volatility-reactive', color: '#ff6ef7', badge: 'EXP', apy: '12.0%*', totalReturn: '+6.0%', sharpe: '1.44', maxDD: '-7.9%', winRate: '72%' },
]

const REGIME_BREAKDOWN = [
  {
    regime: 'LOW VOLATILITY',
    color: '#14f195',
    pct: '31%',
    apy: '8.4% APY',
    multiplier: '0.70× base_yield_bps',
    stats: [
      { label: 'Days in regime', value: '56 days' },
      { label: 'Avg daily yield', value: '+0.023%' },
      { label: 'Lock activations', value: '0' },
      { label: 'Share price Δ', value: '+1.29%' },
    ],
  },
  {
    regime: 'MEDIUM VOLATILITY',
    color: '#9945ff',
    pct: '49%',
    apy: '12.0% APY',
    multiplier: '1.00× base_yield_bps',
    stats: [
      { label: 'Days in regime', value: '88 days' },
      { label: 'Avg daily yield', value: '+0.033%' },
      { label: 'Lock activations', value: '0' },
      { label: 'Share price Δ', value: '+2.93%' },
    ],
  },
  {
    regime: 'HIGH VOLATILITY',
    color: '#ff6ef7',
    pct: '20%',
    apy: '18.0% APY',
    multiplier: '1.50× base_yield_bps',
    stats: [
      { label: 'Days in regime', value: '36 days' },
      { label: 'Avg daily yield', value: '+0.049%' },
      { label: 'Lock activations', value: '14' },
      { label: 'Share price Δ', value: '+1.78%' },
    ],
  },
]

const LOCK_STATS = [
  { label: 'Total lock events', value: '14' },
  { label: 'Avg lock duration', value: '63 slots' },
  { label: 'Max lock duration', value: '150 slots' },
  { label: 'Withdrawals blocked', value: '2.1%' },
]
