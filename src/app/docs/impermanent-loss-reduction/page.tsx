import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Brain,
  Clock3,
  Gauge,
  LineChart,
  ShieldCheck,
  Sigma,
  Sparkles,
  Zap,
} from 'lucide-react'
import styles from './page.module.css'

const resultCards = [
  { label: 'IL reduction', value: '52%', detail: '$772 passive IL to $372 active IL', accent: '#00f5d4' },
  { label: 'Net return', value: '+$215', detail: '2.14% over 90 days after costs', accent: '#10b981' },
  { label: 'Annualized APY', value: '8.91%', detail: 'Positive after IL, fees, and gas', accent: '#f59e0b' },
  { label: 'In-range time', value: '94%', detail: '13 rebalances across 90 days', accent: '#9b5de5' },
]

const comparisonRows = [
  ['Initial capital', '$10,000', '$10,000', '-'],
  ['Fees earned', '$538', '$589', '+9.5%'],
  ['Impermanent loss', '-$772', '-$372', '52% lower'],
  ['Gas cost', '$0', '-$3.25', 'SEI cost advantage'],
  ['Final net', '-$234', '+$215', '+$449'],
  ['APY', '-9.4%', '8.91%', '+18.3 pts'],
]

const methodCards = [
  {
    title: 'Tighter Active Ranges',
    icon: Gauge,
    accent: '#00f5d4',
    copy: 'Yield Delta concentrates liquidity in narrower ranges, increasing fee density while monitoring when that range stops being efficient.',
  },
  {
    title: 'IL-Aware Rebalancing',
    icon: Brain,
    accent: '#10b981',
    copy: 'The strategy resets position exposure when price exits range or modeled IL crosses the risk threshold.',
  },
  {
    title: 'Low-Cost Execution',
    icon: Zap,
    accent: '#f59e0b',
    copy: 'Frequent rebalancing only works when transaction costs are small. SEI-style execution makes the cadence economically plausible.',
  },
]

const assumptions = [
  ['Test period', '90 days'],
  ['Initial capital', '$10,000'],
  ['Trading fee tier', '0.30%'],
  ['Gas cost', '$0.25 / tx'],
  ['Rebalance trigger', 'Range exit or 2% IL'],
  ['Total rebalances', '13'],
]

export const metadata = {
  title: 'Impermanent Loss Reduction - Yield Delta',
  description: 'Backtest methodology and results for Yield Delta active liquidity rebalancing.',
}

export default function ImpermanentLossReductionPage() {
  return (
    <main className={styles.page}>
      <div className={styles.gridLayer} aria-hidden />

      <Link href="/docs" className={styles.backLink}>
        <ArrowLeft />
        Back to Docs
      </Link>

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <div className={styles.kicker}>
            <Sparkles />
            Backtested Methodology
          </div>
          <h1>Impermanent loss reduction, measured against passive LPs.</h1>
          <p>
            Yield Delta actively re-centers liquidity ranges before stale positions compound losses. In the 90-day model, active management reduced IL by 52% while turning a passive loss into positive net return.
          </p>
          <div className={styles.heroActions}>
            <Link href="/backtest" className={styles.primaryAction}>
              Open Snapshot <ArrowRight />
            </Link>
            <a href="#methodology" className={styles.secondaryAction}>
              Review Methodology
            </a>
          </div>
        </div>

        <aside className={styles.proofPanel} aria-label="Backtest proof summary">
          <div className={styles.panelHeader}>
            <LineChart />
            <span>90-day modeled result</span>
          </div>
          <div className={styles.proofNumber}>52%</div>
          <p>Lower impermanent loss versus unmanaged concentrated liquidity.</p>
          <div className={styles.ilBars}>
            <div>
              <span>Passive LP</span>
              <strong>-$772</strong>
              <i className={styles.passiveBar} />
            </div>
            <div>
              <span>Yield Delta</span>
              <strong>-$372</strong>
              <i className={styles.activeBar} />
            </div>
          </div>
        </aside>
      </section>

      <section className={styles.resultGrid} aria-label="Backtest headline metrics">
        {resultCards.map((card) => (
          <article key={card.label} className={styles.resultCard} style={{ '--accent': card.accent } as React.CSSProperties}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
            <p>{card.detail}</p>
          </article>
        ))}
      </section>

      <section className={styles.comparisonSection}>
        <div className={styles.sectionIntro}>
          <div className={styles.kicker}>
            <BarChart3 />
            Proof
          </div>
          <h2>Passive LP vs Yield Delta</h2>
          <p>
            The key result is not just lower IL. The strategy preserved enough fee capture to move the vault from negative net return to positive net return after modeled gas costs.
          </p>
        </div>

        <div className={styles.comparisonTable}>
          <table>
            <thead>
              <tr>
                <th>Metric</th>
                <th>Passive LP</th>
                <th>Yield Delta</th>
                <th>Change</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map(([metric, passive, yd, change]) => (
                <tr key={metric}>
                  <td>{metric}</td>
                  <td>{passive}</td>
                  <td>{yd}</td>
                  <td>{change}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="methodology" className={styles.methodSection}>
        <div className={styles.sectionIntro}>
          <div className={styles.kicker}>
            <ShieldCheck />
            Method
          </div>
          <h2>How the strategy changes the loss curve</h2>
        </div>

        <div className={styles.methodGrid}>
          {methodCards.map((card) => (
            <article key={card.title} className={styles.methodCard} style={{ '--accent': card.accent } as React.CSSProperties}>
              <div>
                <card.icon />
              </div>
              <h3>{card.title}</h3>
              <p>{card.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.modelSection}>
        <div className={styles.modelCopy}>
          <div className={styles.kicker}>
            <Sigma />
            Model Foundation
          </div>
          <h2>Position resets are the core mechanic.</h2>
          <p>
            A passive LP carries IL from the original entry price. Yield Delta closes and reopens ranges around updated market prices, converting large accumulated IL into smaller, bounded losses while keeping capital in fee-producing bands.
          </p>
          <div className={styles.formulaBox}>
            <code>IL = 2 * sqrt(price_ratio) / (1 + price_ratio) - 1</code>
            <code>rebalance when range_exit || modeled_IL &gt; threshold</code>
          </div>
        </div>

        <div className={styles.assumptionPanel}>
          <div className={styles.panelHeader}>
            <Clock3 />
            <span>Assumptions</span>
          </div>
          <dl>
            {assumptions.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className={styles.riskSection}>
        <article>
          <LineChart />
          <h2>What this proves</h2>
          <p>
            The model shows that active liquidity management can reduce IL enough to change the return profile of LP positions, especially on chains where execution costs do not overwhelm rebalancing.
          </p>
        </article>
        <article>
          <ShieldCheck />
          <h2>What it does not prove</h2>
          <p>
            Backtests are not guarantees. Performance can degrade under liquidity shocks, extreme volatility, oracle issues, or if live execution costs exceed assumptions.
          </p>
        </article>
      </section>

      <section className={styles.cta}>
        <div>
          <h2>Use the clean proof visual in the pitch deck.</h2>
          <p>The detailed page explains the method. The `/backtest` route is the screenshot-friendly version for investors.</p>
        </div>
        <Link href="/backtest" className={styles.primaryAction}>
          View Backtest Snapshot <ArrowRight />
        </Link>
      </section>
    </main>
  )
}
