'use client'

import Link from 'next/link'
import { DocsBackButton } from '@/components/docs/DocsBackButton'

/**
 * Renders the "Core Features" documentation page for Yield Delta.
 *
 * This component displays sections describing vault management, AI-powered rebalancing,
 * the Kairos Chat Assistant, market analytics, liquidity provision, SEI network advantages,
 * security, performance metrics, cross-chain features, UX, integrations, demo mode, a feature
 * comparison table, and a getting started guide.
 *
 * @returns A React element containing the styled documentation content for the Core Features page.
 */
export default function FeaturesPage() {
  // Glassmorphic card styles
  const cardStyle = {
    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.5) 0%, rgba(15, 23, 42, 0.4) 100%)',
    border: '1px solid rgba(148, 163, 184, 0.15)',
    backdropFilter: 'blur(12px)',
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.1)',
  };

  // Gradient heading styles
  const gradientHeadingStyle = {
    background: 'linear-gradient(135deg, rgb(59, 130, 246) 0%, rgb(147, 51, 234) 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  };

  // List item base styles
  const listItemStyle = {
    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(147, 51, 234, 0.05) 100%)',
    border: '1px solid rgba(148, 163, 184, 0.1)',
  };

  const handleListItemHover = (e: React.MouseEvent<HTMLLIElement>, isEnter: boolean) => {
    if (isEnter) {
      e.currentTarget.style.transform = 'translateX(8px)';
      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%)';
      e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
    } else {
      e.currentTarget.style.transform = 'translateX(0)';
      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(147, 51, 234, 0.05) 100%)';
      e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.1)';
    }
  };

  const renderListItem = (content: React.ReactNode) => (
    <li
      className="group rounded-lg p-3 transition-all duration-300"
      style={listItemStyle}
      onMouseEnter={(e) => handleListItemHover(e, true)}
      onMouseLeave={(e) => handleListItemHover(e, false)}
    >
      <span className="inline-block mr-2" style={{ color: 'rgb(59, 130, 246)' }}>→</span>
      {content}
    </li>
  );

  return (
    <div className="docs-content rounded-2xl p-8"
      style={{
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.3) 100%)',
        border: '1px solid rgba(148, 163, 184, 0.15)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
      }}
    >
      <DocsBackButton />

      <h1 className="text-4xl font-bold mb-8">Core Features</h1>

      <p className="text-lg text-muted-foreground mb-8">
        Yield Delta combines cutting-edge AI with the lightning-fast SEI blockchain to deliver unprecedented DeFi experiences.
      </p>

      {/* Vault Management Section */}
      <div className="rounded-xl p-6 mb-8" style={cardStyle}>
        <h2 className="text-2xl font-semibold mb-4" style={gradientHeadingStyle}>
          🏦 Vault Management
        </h2>

        <p className="mb-4"><strong>ERC-4626 Compatible Yield Vaults</strong></p>

        <p className="mb-4">Our vault system provides secure, gas-optimized yield generation:</p>

        <ul className="space-y-3 mb-6">
          {renderListItem(<><strong>Multiple Strategies</strong>: Concentrated liquidity, yield farming, arbitrage, hedge</>)}
          {renderListItem(<><strong>Auto-Compounding</strong>: Rewards automatically reinvested</>)}
          {renderListItem(<><strong>Risk Management</strong>: AI-powered risk assessment and mitigation</>)}
          {renderListItem(<><strong>Transparent Fees</strong>: Clear fee structure with performance incentives</>)}
        </ul>

        <p>
          <a href="/docs/features/vaults" className="text-primary hover:text-primary/80 inline-flex items-center gap-2">
            Learn more about Vaults →
          </a>
        </p>
      </div>

      {/* AI-Powered Rebalancing Section */}
      <div className="rounded-xl p-6 mb-8" style={cardStyle}>
        <h2 className="text-2xl font-semibold mb-4" style={gradientHeadingStyle}>
          🤖 AI-Powered Rebalancing
        </h2>

        <p className="mb-4"><strong>Machine Learning Optimization</strong></p>

        <p className="mb-4">Advanced AI algorithms continuously optimize your positions:</p>

        <ul className="space-y-3 mb-6">
          {renderListItem(<><strong>Real-time Analysis</strong>: Market conditions analyzed every block</>)}
          {renderListItem(<><strong>Optimal Ranges</strong>: ML-calculated tick ranges for maximum efficiency</>)}
          {renderListItem(<><strong>Risk Assessment</strong>: Sophisticated risk modeling and prediction</>)}
          {renderListItem(<><strong>Execution Timing</strong>: Perfect timing leveraging SEI&apos;s 400ms finality</>)}
        </ul>

        <p>
          <a href="/docs/features/ai-rebalancing" className="text-primary hover:text-primary/80 inline-flex items-center gap-2">
            Explore AI Rebalancing →
          </a>
        </p>
      </div>

      {/* Kairos Chat Assistant Section */}
      <div className="rounded-xl p-6 mb-8" style={cardStyle}>
        <h2 className="text-2xl font-semibold mb-4" style={gradientHeadingStyle}>
          💬 Kairos Chat Assistant
        </h2>

        <p className="mb-4"><strong>ElizaOS-Powered AI Agent</strong></p>

        <p className="mb-4">Your personal DeFi strategy advisor:</p>

        <ul className="space-y-3 mb-6">
          {renderListItem(<><strong>Natural Language</strong>: Ask questions in plain English</>)}
          {renderListItem(<><strong>Strategy Recommendations</strong>: Personalized advice based on your portfolio</>)}
          {renderListItem(<><strong>Market Insights</strong>: Real-time market analysis and trends</>)}
          {renderListItem(<><strong>Educational</strong>: Learn DeFi concepts through conversation</>)}
        </ul>
      </div>

      {/* Market Analytics Section */}
      <div className="rounded-xl p-6 mb-8" style={cardStyle}>
        <h2 className="text-2xl font-semibold mb-4" style={gradientHeadingStyle}>
          📊 Market Analytics
        </h2>

        <p className="mb-4"><strong>Real-time Data & Insights</strong></p>

        <p className="mb-4">Comprehensive market intelligence:</p>

        <ul className="space-y-3 mb-6">
          {renderListItem(<><strong>Live Price Feeds</strong>: Real-time prices across SEI ecosystem</>)}
          {renderListItem(<><strong>Liquidity Metrics</strong>: TVL, utilization rates, yield data</>)}
          {renderListItem(<><strong>Arbitrage Detection</strong>: Cross-DEX opportunity identification</>)}
          {renderListItem(<><strong>Historical Analysis</strong>: Trend analysis and backtesting</>)}
        </ul>
      </div>

      {/* Advanced Liquidity Provision Section */}
      <div className="rounded-xl p-6 mb-8" style={cardStyle}>
        <h2 className="text-2xl font-semibold mb-4" style={gradientHeadingStyle}>
          💧 Advanced Liquidity Provision
        </h2>

        <p className="mb-4"><strong>Concentrated Liquidity Optimization</strong></p>

        <p className="mb-4">Next-generation liquidity provision:</p>

        <ul className="space-y-3 mb-6">
          {renderListItem(<><strong>Tick Range Optimization</strong>: AI-calculated optimal ranges</>)}
          {renderListItem(<><strong>Impermanent Loss Protection</strong>: Advanced hedging strategies</>)}
          {renderListItem(<><strong>Capital Efficiency</strong>: Maximize returns with minimal capital</>)}
          {renderListItem(<><strong>Auto-Rebalancing</strong>: Maintain optimal positions automatically</>)}
        </ul>
      </div>

      {/* SEI Network Advantages Section */}
      <div className="rounded-xl p-6 mb-8" style={cardStyle}>
        <h2 className="text-2xl font-semibold mb-4" style={gradientHeadingStyle}>
          🔥 SEI Network Advantages
        </h2>

        <p className="mb-4"><strong>Built for Speed & Efficiency</strong></p>

        <p className="mb-4">Leveraging SEI&apos;s unique advantages:</p>

        <ul className="space-y-3 mb-6">
          {renderListItem(<><strong>400ms Finality</strong>: Lightning-fast transaction confirmation</>)}
          {renderListItem(<><strong>Low Gas Costs</strong>: Minimal fees (typically 0.001-0.005 SEI)</>)}
          {renderListItem(<><strong>Parallel Execution</strong>: Multiple transactions processed simultaneously</>)}
          {renderListItem(<><strong>MEV Protection</strong>: Built-in MEV resistance mechanisms</>)}
          {renderListItem(<><strong>EVM Compatibility</strong>: Ethereum tooling and contracts work seamlessly</>)}
        </ul>
      </div>

      {/* Security Features Section */}
      <div className="rounded-xl p-6 mb-8" style={cardStyle}>
        <h2 className="text-2xl font-semibold mb-4" style={gradientHeadingStyle}>
          🛡️ Security Features
        </h2>

        <p className="mb-4"><strong>Enterprise-Grade Security</strong></p>

        <p className="mb-4">Multi-layered security approach:</p>

        <ul className="space-y-3 mb-6">
          {renderListItem(<><strong>Smart Contract Audits</strong>: Comprehensive security reviews</>)}
          {renderListItem(<><strong>Time Locks</strong>: Protection against governance attacks</>)}
          {renderListItem(<><strong>Emergency Pauses</strong>: Circuit breakers for unusual conditions</>)}
          {renderListItem(<><strong>Formal Verification</strong>: Mathematical proof of contract correctness</>)}
          {renderListItem(<><strong>Bug Bounty</strong>: Ongoing security research incentives</>)}
        </ul>
      </div>

      {/* Performance Metrics Section */}
      <div className="rounded-xl p-6 mb-8" style={cardStyle}>
        <h2 className="text-2xl font-semibold mb-4" style={gradientHeadingStyle}>
          🎯 Performance Metrics
        </h2>

        <p className="mb-4"><strong>Transparent & Verifiable</strong></p>

        <p className="mb-4">Real-time performance tracking:</p>

        <ul className="space-y-3 mb-6">
          {renderListItem(<><strong>APY Calculation</strong>: Accurate yield calculations</>)}
          {renderListItem(<><strong>Risk Metrics</strong>: Sharpe ratio, maximum drawdown, volatility</>)}
          {renderListItem(<><strong>Benchmark Comparison</strong>: Performance vs market indices</>)}
          {renderListItem(<><strong>Historical Performance</strong>: Long-term track record</>)}
          {renderListItem(<><strong>Fee Transparency</strong>: All costs clearly displayed</>)}
        </ul>
      </div>

      {/* Cross-Chain Features Section */}
      <div className="rounded-xl p-6 mb-8" style={cardStyle}>
        <h2 className="text-2xl font-semibold mb-4" style={gradientHeadingStyle}>
          🌐 Cross-Chain Features
        </h2>

        <p className="mb-4"><strong>Multi-Chain Compatibility</strong></p>

        <p className="mb-4">Expanding beyond SEI:</p>

        <ul className="space-y-3 mb-6">
          {renderListItem(<><strong>Bridge Integration</strong>: Seamless asset bridging</>)}
          {renderListItem(<><strong>Cross-Chain Arbitrage</strong>: Profit from price differences</>)}
          {renderListItem(<><strong>Unified Interface</strong>: Manage positions across chains</>)}
          {renderListItem(<><strong>Yield Aggregation</strong>: Find best yields anywhere</>)}
        </ul>
      </div>

      {/* User Experience Section */}
      <div className="rounded-xl p-6 mb-8" style={cardStyle}>
        <h2 className="text-2xl font-semibold mb-4" style={gradientHeadingStyle}>
          📱 User Experience
        </h2>

        <p className="mb-4"><strong>Intuitive & Beautiful</strong></p>

        <p className="mb-4">Modern, responsive interface:</p>

        <ul className="space-y-3 mb-6">
          {renderListItem(<><strong>3D Visualizations</strong>: Beautiful vault and portfolio displays</>)}
          {renderListItem(<><strong>Real-time Updates</strong>: Live data without page refreshes</>)}
          {renderListItem(<><strong>Mobile Optimized</strong>: Full functionality on all devices</>)}
          {renderListItem(<><strong>Dark/Light Mode</strong>: Customizable appearance</>)}
          {renderListItem(<><strong>Accessibility</strong>: WCAG 2.1 compliant</>)}
        </ul>
      </div>

      {/* Integration Features Section */}
      <div className="rounded-xl p-6 mb-8" style={cardStyle}>
        <h2 className="text-2xl font-semibold mb-4" style={gradientHeadingStyle}>
          🔗 Integration Features
        </h2>

        <p className="mb-4"><strong>Developer-Friendly APIs</strong></p>

        <p className="mb-4">Easy integration for builders:</p>

        <ul className="space-y-3 mb-6">
          {renderListItem(<><strong>RESTful APIs</strong>: Standard HTTP endpoints</>)}
          {renderListItem(<><strong>WebSocket Streams</strong>: Real-time data feeds</>)}
          {renderListItem(<><strong>GraphQL</strong>: Flexible data querying</>)}
          {renderListItem(<><strong>SDKs</strong>: Official libraries for popular languages</>)}
          {renderListItem(<><strong>Webhooks</strong>: Event notifications</>)}
        </ul>
      </div>

      {/* Demo Mode Section */}
      <div className="rounded-xl p-6 mb-8" style={cardStyle}>
        <h2 className="text-2xl font-semibold mb-4" style={gradientHeadingStyle}>
          🎮 Demo Mode
        </h2>

        <p className="mb-4"><strong>Risk-Free Testing</strong></p>

        <p className="mb-4">Try everything safely:</p>

        <ul className="space-y-3 mb-6">
          {renderListItem(<><strong>Realistic Simulations</strong>: Full UX without blockchain interaction</>)}
          {renderListItem(<><strong>Educational Tool</strong>: Learn strategies safely</>)}
          {renderListItem(<><strong>Demo Videos</strong>: Perfect for presentations</>)}
          {renderListItem(<><strong>Development Testing</strong>: Test integrations safely</>)}
        </ul>

        <p>
          <Link href="/" className="text-primary hover:text-primary/80 inline-flex items-center gap-2">
            View Live Demo →
          </Link>
        </p>
      </div>

      {/* Gradient Divider */}
      <div className="relative my-12">
        <div
          className="h-px w-full"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(59, 130, 246, 0.3) 25%, rgba(147, 51, 234, 0.5) 50%, rgba(59, 130, 246, 0.3) 75%, transparent 100%)',
          }}
        />
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full"
          style={{
            background: 'linear-gradient(135deg, rgb(59, 130, 246) 0%, rgb(147, 51, 234) 100%)',
            boxShadow: '0 0 20px rgba(59, 130, 246, 0.6), 0 0 40px rgba(147, 51, 234, 0.4)',
          }}
        />
      </div>

      {/* Feature Comparison Table */}
      <div className="rounded-xl p-6 mb-8" style={cardStyle}>
        <h2 className="text-2xl font-semibold mb-6" style={gradientHeadingStyle}>
          Feature Comparison
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr
                className="rounded-t-lg"
                style={{
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(147, 51, 234, 0.2) 100%)',
                }}
              >
                <th className="px-4 py-3 text-left font-semibold" style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.15)' }}>
                  Feature
                </th>
                <th className="px-4 py-3 text-left font-semibold" style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.15)' }}>
                  Traditional DeFi
                </th>
                <th className="px-4 py-3 text-left font-semibold" style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.15)' }}>
                  Yield Delta
                </th>
              </tr>
            </thead>
            <tbody style={{
              background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.3) 0%, rgba(15, 23, 42, 0.2) 100%)',
            }}>
              <tr className="transition-all duration-200 hover:bg-white/5" style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.1)' }}>
                <td className="px-4 py-3 font-medium">Rebalancing</td>
                <td className="px-4 py-3 text-muted-foreground">Manual</td>
                <td className="px-4 py-3">
                  <span style={{
                    background: 'linear-gradient(135deg, rgb(59, 130, 246) 0%, rgb(147, 51, 234) 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    fontWeight: 600,
                  }}>
                    AI-Automated
                  </span>
                </td>
              </tr>
              <tr className="transition-all duration-200 hover:bg-white/5" style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.1)' }}>
                <td className="px-4 py-3 font-medium">Speed</td>
                <td className="px-4 py-3 text-muted-foreground">12s+ finality</td>
                <td className="px-4 py-3">
                  <span style={{
                    background: 'linear-gradient(135deg, rgb(59, 130, 246) 0%, rgb(147, 51, 234) 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    fontWeight: 600,
                  }}>
                    400ms finality
                  </span>
                </td>
              </tr>
              <tr className="transition-all duration-200 hover:bg-white/5" style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.1)' }}>
                <td className="px-4 py-3 font-medium">Gas Costs</td>
                <td className="px-4 py-3 text-muted-foreground">High ($5-50)</td>
                <td className="px-4 py-3">
                  <span style={{
                    background: 'linear-gradient(135deg, rgb(59, 130, 246) 0%, rgb(147, 51, 234) 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    fontWeight: 600,
                  }}>
                    Low ($0.001)
                  </span>
                </td>
              </tr>
              <tr className="transition-all duration-200 hover:bg-white/5" style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.1)' }}>
                <td className="px-4 py-3 font-medium">Strategy</td>
                <td className="px-4 py-3 text-muted-foreground">Static</td>
                <td className="px-4 py-3">
                  <span style={{
                    background: 'linear-gradient(135deg, rgb(59, 130, 246) 0%, rgb(147, 51, 234) 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    fontWeight: 600,
                  }}>
                    Dynamic AI
                  </span>
                </td>
              </tr>
              <tr className="transition-all duration-200 hover:bg-white/5" style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.1)' }}>
                <td className="px-4 py-3 font-medium">Risk Management</td>
                <td className="px-4 py-3 text-muted-foreground">Manual</td>
                <td className="px-4 py-3">
                  <span style={{
                    background: 'linear-gradient(135deg, rgb(59, 130, 246) 0%, rgb(147, 51, 234) 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    fontWeight: 600,
                  }}>
                    AI-Powered
                  </span>
                </td>
              </tr>
              <tr className="transition-all duration-200 hover:bg-white/5" style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.1)' }}>
                <td className="px-4 py-3 font-medium">User Experience</td>
                <td className="px-4 py-3 text-muted-foreground">Complex</td>
                <td className="px-4 py-3">
                  <span style={{
                    background: 'linear-gradient(135deg, rgb(59, 130, 246) 0%, rgb(147, 51, 234) 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    fontWeight: 600,
                  }}>
                    Intuitive
                  </span>
                </td>
              </tr>
              <tr className="transition-all duration-200 hover:bg-white/5" style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.1)' }}>
                <td className="px-4 py-3 font-medium">Analytics</td>
                <td className="px-4 py-3 text-muted-foreground">Basic</td>
                <td className="px-4 py-3">
                  <span style={{
                    background: 'linear-gradient(135deg, rgb(59, 130, 246) 0%, rgb(147, 51, 234) 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    fontWeight: 600,
                  }}>
                    Advanced AI
                  </span>
                </td>
              </tr>
              <tr className="transition-all duration-200 hover:bg-white/5">
                <td className="px-4 py-3 font-medium">Support</td>
                <td className="px-4 py-3 text-muted-foreground">Community</td>
                <td className="px-4 py-3">
                  <span style={{
                    background: 'linear-gradient(135deg, rgb(59, 130, 246) 0%, rgb(147, 51, 234) 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    fontWeight: 600,
                  }}>
                    AI Assistant
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Getting Started Section */}
      <div className="rounded-xl p-6 mb-8" style={cardStyle}>
        <h2 className="text-2xl font-semibold mb-6" style={gradientHeadingStyle}>
          Getting Started
        </h2>

        <p className="mb-6">Ready to experience the future of DeFi?</p>

        <div className="space-y-4">
          {/* Step 1 */}
          <div
            className="flex items-start gap-4 p-4 rounded-lg transition-all duration-300 group"
            style={{
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(147, 51, 234, 0.05) 100%)',
              border: '1px solid rgba(148, 163, 184, 0.1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%)';
              e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(59, 130, 246, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(147, 51, 234, 0.05) 100%)';
              e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div
              className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-white"
              style={{
                background: 'linear-gradient(135deg, rgb(59, 130, 246) 0%, rgb(147, 51, 234) 100%)',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
              }}
            >
              1
            </div>
            <div className="flex-1">
              <Link href="/docs/getting-started" className="text-primary hover:text-primary/80">
                <strong className="text-lg">Setup Development Environment</strong>
              </Link>
              <p className="text-muted-foreground mt-1">Get up and running in minutes</p>
            </div>
          </div>

          {/* Step 2 */}
          <div
            className="flex items-start gap-4 p-4 rounded-lg transition-all duration-300 group"
            style={{
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(147, 51, 234, 0.05) 100%)',
              border: '1px solid rgba(148, 163, 184, 0.1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%)';
              e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(59, 130, 246, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(147, 51, 234, 0.05) 100%)';
              e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div
              className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-white"
              style={{
                background: 'linear-gradient(135deg, rgb(59, 130, 246) 0%, rgb(147, 51, 234) 100%)',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
              }}
            >
              2
            </div>
            <div className="flex-1">
              <Link href="/" className="text-primary hover:text-primary/80">
                <strong className="text-lg">View Live Demo</strong>
              </Link>
              <p className="text-muted-foreground mt-1">Experience features risk-free</p>
            </div>
          </div>

          {/* Step 3 */}
          <div
            className="flex items-start gap-4 p-4 rounded-lg transition-all duration-300 group"
            style={{
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(147, 51, 234, 0.05) 100%)',
              border: '1px solid rgba(148, 163, 184, 0.1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%)';
              e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(59, 130, 246, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(147, 51, 234, 0.05) 100%)';
              e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div
              className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-white"
              style={{
                background: 'linear-gradient(135deg, rgb(59, 130, 246) 0%, rgb(147, 51, 234) 100%)',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
              }}
            >
              3
            </div>
            <div className="flex-1">
              <Link href="/docs/features/vaults" className="text-primary hover:text-primary/80">
                <strong className="text-lg">Deploy Your First Vault</strong>
              </Link>
              <p className="text-muted-foreground mt-1">Start earning optimized yields</p>
            </div>
          </div>

          {/* Step 4 */}
          <div
            className="flex items-start gap-4 p-4 rounded-lg transition-all duration-300 group"
            style={{
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(147, 51, 234, 0.05) 100%)',
              border: '1px solid rgba(148, 163, 184, 0.1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%)';
              e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(59, 130, 246, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(147, 51, 234, 0.05) 100%)';
              e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div
              className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-white"
              style={{
                background: 'linear-gradient(135deg, rgb(59, 130, 246) 0%, rgb(147, 51, 234) 100%)',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
              }}
            >
              4
            </div>
            <div className="flex-1">
              <strong className="text-lg">Chat with Kairos</strong>
              <p className="text-muted-foreground mt-1">Get personalized strategy advice</p>
            </div>
          </div>
        </div>
      </div>

      {/* Gradient Divider */}
      <div className="relative my-12">
        <div
          className="h-px w-full"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(59, 130, 246, 0.3) 25%, rgba(147, 51, 234, 0.5) 50%, rgba(59, 130, 246, 0.3) 75%, transparent 100%)',
          }}
        />
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full"
          style={{
            background: 'linear-gradient(135deg, rgb(59, 130, 246) 0%, rgb(147, 51, 234) 100%)',
            boxShadow: '0 0 20px rgba(59, 130, 246, 0.6), 0 0 40px rgba(147, 51, 234, 0.4)',
          }}
        />
      </div>

      <p className="text-center text-muted-foreground italic">
        Experience the power of Yield Delta - AI-optimized DeFi on SEI Network
      </p>
    </div>
  );
}
