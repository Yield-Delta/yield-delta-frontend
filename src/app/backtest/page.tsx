import Link from 'next/link'
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  LineChart,
  ShieldCheck,
  Zap,
} from 'lucide-react'
import styles from './page.module.css'

const headlineMetrics = [
  { label: 'Impermanent loss reduction', value: '52%', detail: '$772 passive IL vs $372 active IL' },
  { label: 'Net 90d return', value: '+2.14%', detail: '8.91% annualized after costs' },
  { label: 'Time in range', value: '94%', detail: '13 rebalances over 90 days' },
]

const pairRows = [
  ['Passive LP', '-$234', '$538', '-$772'],
  ['Yield Delta', '+$215', '$589', '-$372'],
  ['Improvement', '+$449', '+9.5%', '52% lower'],
  ['Gas cost', '-$3.25', '13 tx', '$0.25/tx'],
]

const timeline = [
  ['01', 'Detect volatility regime shift'],
  ['02', 'Re-center concentrated range'],
  ['03', 'Reset IL accumulation window'],
  ['04', 'Keep capital in fee-dense bands'],
]

export const metadata = {
  title: 'Backtest Snapshot - Yield Delta',
  description: 'Pitch-deck ready backtest snapshot for Yield Delta impermanent loss reduction.',
}

export default function BacktestSnapshotPage() {
  return (
    <main className={styles.shell}>
      <div className={styles.grid} aria-hidden />

      <section className={styles.frame} aria-label="Yield Delta backtest snapshot">
        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>Yield Delta Backtest</p>
            <h1>AI rebalancing reduced modeled IL by 52%.</h1>
          </div>
          <div className={styles.badge}>
            <CheckCircle2 />
            Pitch snapshot
          </div>
        </header>

        <div className={styles.heroGrid}>
          <div className={styles.mainMetric}>
            <span>Average IL reduction</span>
            <strong>52%</strong>
            <p>Passive concentrated liquidity incurred $772 of impermanent loss. Yield Delta active rebalancing reduced modeled IL to $372 while preserving positive net yield.</p>
          </div>

          <div className={styles.chartPanel}>
            <div className={styles.chartHeader}>
              <LineChart />
              <span>Passive LP vs Yield Delta IL</span>
            </div>
            <div className={styles.chart}>
              <div className={styles.zeroLine} />
              <div className={styles.passiveLine} />
              <div className={styles.activeLine} />
              <span className={styles.passiveLabel}>Passive -$772</span>
              <span className={styles.activeLabel}>YD -$372</span>
            </div>
          </div>
        </div>

        <section className={styles.metricRow} aria-label="Headline metrics">
          {headlineMetrics.map((metric) => (
            <article key={metric.label} className={styles.metricCard}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
              <p>{metric.detail}</p>
            </article>
          ))}
        </section>

        <section className={styles.lowerGrid}>
          <div className={styles.tablePanel}>
            <div className={styles.panelTitle}>
              <BarChart3 />
              <h2>90-Day Backtest</h2>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Case</th>
                  <th>Net</th>
                  <th>Fees</th>
                  <th>IL / Cost</th>
                </tr>
              </thead>
              <tbody>
                {pairRows.map(([pair, reduction, amm, yd]) => (
                  <tr key={pair}>
                    <td>{pair}</td>
                    <td>{reduction}</td>
                    <td>{amm}</td>
                    <td>{yd}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.methodPanel}>
            <div className={styles.panelTitle}>
              <ShieldCheck />
              <h2>Rebalance Logic</h2>
            </div>
            <div className={styles.timeline}>
              {timeline.map(([step, copy]) => (
                <div key={step}>
                  <span>{step}</span>
                  <p>{copy}</p>
                </div>
              ))}
            </div>
            <div className={styles.callout}>
              <Zap />
              <p>Modeled for SEI-style low-cost execution, where frequent range updates are economically practical.</p>
            </div>
          </div>
        </section>

        <footer className={styles.footer}>
          <p>Backtests model historical and simulated market conditions. Results are not a guarantee of future performance.</p>
          <Link href="/docs/impermanent-loss-reduction">
            Full methodology
            <ArrowRight />
          </Link>
        </footer>
      </section>
    </main>
  )
}
