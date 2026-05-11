import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Brain,
  Code2,
  Gauge,
  GitBranch,
  Network,
  ShieldCheck,
  Sparkles,
  Wallet,
  Zap,
} from 'lucide-react'
import styles from './page.module.css'

const quickStartCards = [
  {
    href: '/docs/testnet-setup',
    title: 'Testnet Setup',
    description: 'Configure SEI Atlantic-2, fund a wallet, and connect to the app.',
    icon: Wallet,
    accent: '#00f5d4',
    action: 'Setup Guide',
  },
  {
    href: '/docs/understanding-metrics',
    title: 'Understanding Metrics',
    description: 'Read APY, Sharpe, win rate, risk, and vault performance correctly.',
    icon: BarChart3,
    accent: '#9b5de5',
    action: 'Metrics Guide',
  },
  {
    href: '/docs/getting-started',
    title: 'For Developers',
    description: 'Integrate APIs, understand contracts, and build on the protocol.',
    icon: Code2,
    accent: '#10b981',
    action: 'Development Guide',
  },
  {
    href: '/docs/features',
    title: 'For Liquidity Providers',
    description: 'Learn vault workflows and how AI optimization improves yield quality.',
    icon: Gauge,
    accent: '#ff206e',
    action: 'Features Overview',
  },
]

const innovations = [
  { title: 'AI-Powered Optimization', detail: 'Machine learning continuously tunes liquidity positions.', icon: Brain },
  { title: 'SEI Network Speed', detail: '400ms finality enables rapid strategy adjustments.', icon: Zap },
  { title: 'IL Reduction', detail: 'Advanced hedging targets over 50% impermanent loss reduction.', icon: ShieldCheck },
  { title: 'Real-Time Analytics', detail: 'Live market and vault telemetry for faster decisions.', icon: BarChart3 },
]

const featureRows = [
  { href: '/docs/features/ai-rebalancing', feature: 'AI-Powered Rebalancing', description: 'Automated position optimization using ML', status: 'Live' },
  { href: '/docs/features/vaults', feature: 'Vault Management', description: 'ERC-4626 compatible yield vaults', status: 'Live' },
  { feature: 'Kairos Chat', description: 'AI assistant for DeFi strategy', status: 'Live' },
  { feature: 'Market Analytics', description: 'Real-time market data and insights', status: 'Live' },
  { href: '/', feature: 'Live Demo', description: 'Risk-free testing environment', status: 'Live' },
]

const networkRows = [
  ['Network', 'SEI Atlantic-2 (Testnet)'],
  ['Chain ID', '1328'],
  ['Native Token', 'SEI (testnet)'],
  ['Block Time', '~400ms'],
  ['RPC URL', 'https://evm-rpc-testnet.sei-apis.com'],
]

/**
 * Renders the static documentation home page for Yield Delta, including navigation, key innovations, investor highlights, quick-start guides, core features, network information, and community links.
 *
 * @returns The JSX element for the documentation home page.
 */
export default function DocsHomePage() {
  return (
    <main className={styles.docsShell}>
      <div className={styles.gridLayer} aria-hidden />

      <div className={styles.backRow}>
        <Link href="/vaults" className={styles.backButton}>
          <ArrowLeft />
          Back to Vaults
        </Link>
      </div>

      <section className={styles.hero}>
        <div>
          <div className={styles.liveBadge}>
            <span />
            Protocol Documentation
          </div>
          <h1>Yield Delta Documentation</h1>
          <p>
            A technical command center for the AI-powered yield optimization protocol on SEI Network.
          </p>
        </div>

        <div className={styles.heroConsole}>
          <Sparkles />
          <strong>50%+</strong>
          <span>Target impermanent loss reduction through predictive rebalancing and multi-strategy hedging.</span>
        </div>
      </section>

      <section className={styles.innovationGrid}>
        {innovations.map((item) => (
          <article key={item.title} className={styles.innovationCard}>
            <item.icon />
            <h2>{item.title}</h2>
            <p>{item.detail}</p>
          </article>
        ))}
      </section>

      <section className={styles.highlightPanel}>
        <div className={styles.panelHeader}>
          <span className={styles.kicker}>Investor Highlight</span>
          <h2>Over 50% reduction in impermanent loss</h2>
          <p>
            Yield Delta combines dynamic range adjustment, predictive rebalancing, and SEI&apos;s fast finality to reduce IL exposure compared with unmanaged AMM positions.
          </p>
        </div>

        <div className={styles.metricGrid}>
          <div><strong>50%+</strong><span>IL Reduction</span></div>
          <div><strong>400ms</strong><span>Rebalance Speed</span></div>
          <div><strong>24/7</strong><span>AI Monitoring</span></div>
        </div>

        <div className={styles.strategyGrid}>
          {[
            ['Dynamic Range Adjustment', 'Liquidity ranges adapt to price action, volatility, and volume.'],
            ['Predictive Rebalancing', 'Models anticipate divergence and rebalance before risk compounds.'],
            ['Multi-Strategy Hedging', 'Concentrated liquidity, delta-neutral logic, and arbitrage work together.'],
            ['SEI Speed Advantage', 'Fast finality makes rapid position adjustment practical.'],
          ].map(([title, detail]) => (
            <div key={title}>
              <h3>{title}</h3>
              <p>{detail}</p>
            </div>
          ))}
        </div>

        <Link href="/docs/impermanent-loss-reduction" className={styles.textLink}>
          View Detailed Technical Analysis
          <ArrowRight />
        </Link>
      </section>

      <section className={styles.sectionBlock}>
        <div className={styles.sectionTitle}>
          <span className={styles.kicker}>Quick Start</span>
          <h2>Choose your path</h2>
        </div>
        <div className={styles.quickGrid}>
          {quickStartCards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className={styles.quickCard}
              style={{ '--accent': card.accent } as React.CSSProperties}
            >
              <card.icon />
              <h3>{card.title}</h3>
              <p>{card.description}</p>
              <span>{card.action}<ArrowRight /></span>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.featurePanel}>
        <div className={styles.sectionTitle}>
          <span className={styles.kicker}>Core Features</span>
          <h2>Protocol surfaces</h2>
        </div>
        <div className={styles.tableWrap}>
          <table>
            <thead>
              <tr>
                <th>Feature</th>
                <th>Description</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {featureRows.map((row) => (
                <tr key={row.feature}>
                  <td>
                    {row.href ? <Link href={row.href}>{row.feature}</Link> : row.feature}
                  </td>
                  <td>{row.description}</td>
                  <td><span className={styles.statusPill}><i />{row.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.infoGrid}>
        <article className={styles.networkPanel}>
          <div className={styles.sectionTitle}>
            <span className={styles.kicker}>Network</span>
            <h2><Network /> SEI Testnet</h2>
          </div>
          <p>Yield Delta is deployed on SEI Atlantic-2 Testnet. Configure your wallet before connecting.</p>
          <dl>
            {networkRows.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <Link href="/docs/testnet-setup" className={styles.textLink}>Follow Testnet Setup <ArrowRight /></Link>
        </article>

        <article className={styles.networkPanel}>
          <div className={styles.sectionTitle}>
            <span className={styles.kicker}>Community</span>
            <h2><GitBranch /> Support</h2>
          </div>
          <div className={styles.communityLinks}>
            <a href="https://discord.gg/TWNybCBr">Discord</a>
            <a href="https://github.com/yield-delta/yield-delta-protocol">GitHub</a>
            <a href="https://x.com/yielddelta">Twitter</a>
            <a href="https://seitrace.com" target="_blank" rel="noopener noreferrer">SeiTrace</a>
            <a href="https://atlantic-2.app.sei.io/faucet" target="_blank" rel="noopener noreferrer">Faucet</a>
          </div>
        </article>
      </section>
    </main>
  );
}

export const metadata = {
  title: 'Documentation Home - Yield Delta',
  description: 'Comprehensive documentation for Yield Delta - the next-generation AI-powered DeFi platform built on SEI Network.',
};
