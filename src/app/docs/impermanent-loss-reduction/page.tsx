import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Brain,
  Gauge,
  LineChart,
  ShieldCheck,
  Sigma,
  Sparkles,
  Zap,
} from 'lucide-react'
import styles from './page.module.css'

const backtestRows = [
  ['ETH/USDC', '69.2%', '-5.2%', '-1.6%'],
  ['WBTC/ETH', '68.5%', '-4.8%', '-1.5%'],
  ['SEI/USDC', '70.1%', '-5.6%', '-1.7%'],
  ['SOL/USDC', '67.9%', '-6.1%', '-2.0%'],
]

const methodCards = [
  {
    title: 'Predictive Price Movement',
    icon: Brain,
    accent: '#00f5d4',
    copy: 'Order flow, volatility regimes, cross-pair correlation, and sentiment signals forecast short-horizon divergence before ranges drift out of shape.',
  },
  {
    title: 'Dynamic Range Control',
    icon: Gauge,
    accent: '#9b5de5',
    copy: 'Liquidity ranges tighten during calm markets, widen during volatility, and rebalance toward the highest expected fee capture zones.',
  },
  {
    title: 'Hedged Exposure',
    icon: ShieldCheck,
    accent: '#10b981',
    copy: 'Delta checks, synthetic hedge logic, and venue-aware execution reduce directional drag without abandoning yield capture.',
  },
]

const comparisonRows = [
  ['Average IL, 30d', '-5.2%', '-1.6%', '69.2%'],
  ['Max drawdown', '-12.8%', '-4.1%', '68.0%'],
  ['Sharpe ratio', '0.82', '2.41', '+194%'],
  ['Fee capture', '62%', '89%', '+43.5%'],
  ['Rebalance cadence', 'Manual', '~12/day', 'Automated'],
]

export default function ImpermanentLossReductionPage() {
  return (
    <main className={`${styles.analysisPage} relative mx-auto max-w-6xl overflow-hidden px-4 pb-20 sm:px-6 lg:px-8`}>
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_0%,rgba(0,245,212,0.12),transparent_34%),radial-gradient(circle_at_82%_14%,rgba(155,93,229,0.16),transparent_36%)]" />

      <Link href="/docs" className={`${styles.backLink} mb-8 inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold text-white/70 transition hover:text-white`}>
        <ArrowLeft className="h-4 w-4" />
        Back to Docs
      </Link>

      <section className={`${styles.heroPanel} relative overflow-hidden rounded-[28px] p-5 sm:p-8 lg:p-10`}>
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300 to-transparent" />
        <div className="absolute -right-20 -top-28 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="grid gap-8 lg:grid-cols-[1.35fr_0.65fr] lg:items-end">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-cyan-200">
              <Sparkles className="h-3.5 w-3.5" />
              Technical Analysis
            </div>
            <h1 className="max-w-4xl text-balance text-4xl font-bold leading-[0.98] text-white sm:text-5xl lg:text-6xl" style={{ fontFamily: 'var(--font-display)' }}>
              Impermanent loss reduction, engineered for active liquidity.
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-white/58 sm:text-lg">
              Yield Delta combines predictive rebalancing, dynamic range placement, and hedged exposure controls to target more than 50% lower IL versus unmanaged concentrated liquidity positions.
            </p>
          </div>

          <div className={`${styles.signalPanel} rounded-3xl p-5`}>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-cyan-200/70">Backtest Signal</p>
            <div className="mt-3 flex items-end gap-3">
              <strong className="text-5xl font-black text-cyan-200">68.9%</strong>
              <span className="pb-2 text-sm text-white/45">average IL reduction</span>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2 text-sm">
              <Metric label="Cadence" value="~12/day" />
              <Metric label="Efficiency" value="94.2%" />
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {backtestRows.map(([pair, reduction, traditional, yd]) => (
          <article key={pair} className={`${styles.statCard} rounded-3xl p-5`} style={{ '--accent': '#00f5d4' } as React.CSSProperties}>
            <p className="text-sm text-white/42">{pair}</p>
            <strong className="mt-2 block text-3xl text-cyan-200">{reduction}</strong>
            <div className="mt-4 flex justify-between gap-3 text-xs text-white/48">
              <span>AMM {traditional}</span>
              <span className="text-emerald-300">YD {yd}</span>
            </div>
          </article>
        ))}
      </section>

      <section className="mt-10 grid gap-5 lg:grid-cols-3">
        {methodCards.map((card) => (
          <article key={card.title} className={`${styles.methodCard} rounded-[24px] p-6`} style={{ '--accent': card.accent } as React.CSSProperties}>
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border" style={{ borderColor: `${card.accent}40`, background: `${card.accent}18`, color: card.accent }}>
              <card.icon className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-white">{card.title}</h2>
            <p className="mt-3 text-sm leading-6 text-white/52">{card.copy}</p>
          </article>
        ))}
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className={`${styles.modelPanel} rounded-[28px] p-6`}>
          <div className="mb-5 flex items-center gap-3">
            <Sigma className="h-6 w-6 text-cyan-200" />
            <h2 className="text-2xl font-bold text-white">Model Foundation</h2>
          </div>
          <div className={`${styles.formulaBox} space-y-4 rounded-2xl p-4 font-mono text-sm leading-7 text-white/70`}>
            <p><span className="text-cyan-200">IL_traditional</span> = 2 * sqrt(price_ratio) / (1 + price_ratio) - 1</p>
            <p><span className="text-emerald-300">IL_yielddelta</span> = IL_traditional * (1 - hedge_efficiency) * volatility_factor</p>
            <p className="text-white/42">hedge_efficiency = 0.52-0.55, adjusted by volatility regime and rebalance cost.</p>
          </div>
        </div>

        <div className={`${styles.comparisonPanel} overflow-hidden rounded-[28px]`}>
          <div className={`${styles.comparisonHeader} flex items-center gap-3 p-5`}>
            <BarChart3 className="h-5 w-5 text-emerald-300" />
            <h2 className="text-xl font-bold text-white">Traditional AMM vs Yield Delta</h2>
          </div>
          <div className="overflow-x-auto">
            <table className={`${styles.comparisonTable} w-full min-w-[620px] text-left text-sm`}>
              <thead className="text-xs uppercase tracking-[0.14em] text-white/35">
                <tr>
                  <th className="px-5 py-4">Metric</th>
                  <th className="px-5 py-4">Traditional</th>
                  <th className="px-5 py-4">Yield Delta</th>
                  <th className="px-5 py-4">Change</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {comparisonRows.map(([metric, traditional, yd, change]) => (
                  <tr key={metric} className="text-white/66">
                    <td className="px-5 py-4 font-semibold text-white">{metric}</td>
                    <td className="px-5 py-4 text-red-300/85">{traditional}</td>
                    <td className="px-5 py-4 text-emerald-300">{yd}</td>
                    <td className="px-5 py-4 font-bold text-cyan-200">{change}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="mt-10 grid gap-5 lg:grid-cols-2">
        <article className={`${styles.insightPanel} rounded-[24px] p-6`} style={{ '--accent': '#9b5de5' } as React.CSSProperties}>
          <Zap className="mb-4 h-7 w-7 text-purple-200" />
          <h2 className="text-2xl font-bold text-white">SEI Speed Advantage</h2>
          <p className="mt-3 text-sm leading-6 text-white/55">Fast finality and low execution cost make frequent rebalancing practical, allowing the AI engine to respond while liquidity risk is still forming.</p>
        </article>
        <article className={`${styles.insightPanel} rounded-[24px] p-6`} style={{ '--accent': '#f59e0b' } as React.CSSProperties}>
          <LineChart className="mb-4 h-7 w-7 text-amber-200" />
          <h2 className="text-2xl font-bold text-white">Risk Disclosure</h2>
          <p className="mt-3 text-sm leading-6 text-white/55">Backtests model historical and testnet conditions. IL can be reduced, not eliminated, and future performance can diverge during extreme volatility or liquidity shocks.</p>
        </article>
      </section>

      <section className={`${styles.ctaPanel} mt-10 rounded-[28px] p-6 text-center sm:p-8`}>
        <h2 className="text-3xl font-bold text-white">Explore the vaults built around this engine</h2>
        <p className="mx-auto mt-3 max-w-2xl text-white/55">Compare strategies, risk levels, and allocation behavior across Yield Delta vaults.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/vaults" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-cyan-300 px-5 font-bold text-black transition hover:bg-cyan-200">
            Explore Vaults <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/docs/testnet-setup" className={`${styles.backLink} inline-flex min-h-12 items-center gap-2 rounded-full px-5 font-bold text-white/75 transition hover:text-white`}>
            Setup Testnet
          </Link>
        </div>
      </section>
    </main>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className={`${styles.metricMini} rounded-2xl p-3`}>
      <span className="block text-xs text-white/35">{label}</span>
      <strong className="text-lg text-white">{value}</strong>
    </div>
  )
}
