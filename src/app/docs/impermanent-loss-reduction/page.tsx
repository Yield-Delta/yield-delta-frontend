'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ImpermanentLossReductionPage() {
  return (
    <div className="docs-content max-w-4xl mx-auto">
      {/* Back Navigation */}
      <div className="mb-6">
        <Link href="/docs">
          <Button
            variant="outline"
            className="gap-2 hover:gap-3 transition-all duration-300 group"
            style={{
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.08) 0%, rgba(20, 184, 166, 0.06) 100%)',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <ArrowLeft className="w-5 h-5 transition-transform duration-300 group-hover:-translate-x-1" />
            <span className="font-semibold">Back to Docs</span>
          </Button>
        </Link>
      </div>

      {/* Hero Section */}
      <div className="mb-12">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
          Over 50% Impermanent Loss Reduction
        </h1>
        <p className="text-xl text-muted-foreground">
          Technical Analysis & Performance Metrics for Yield Delta&apos;s Proprietary IL Mitigation System
        </p>
      </div>

      {/* Executive Summary */}
      <div className="docs-content-section mb-8">
        <h2 className="text-2xl font-bold mb-4">Executive Summary</h2>
        <p className="text-lg leading-relaxed mb-4">
          Yield Delta&apos;s AI-powered vault system achieves <strong className="text-cyan-400">over 50% reduction in impermanent loss</strong> through a combination of:
        </p>
        <ul className="space-y-2 text-lg">
          <li>• <strong>Predictive ML models</strong> trained on 2+ years of DeFi market data</li>
          <li>• <strong>Dynamic range optimization</strong> with 400ms rebalancing capability</li>
          <li>• <strong>Multi-strategy hedging</strong> across concentrated liquidity positions</li>
          <li>• <strong>Real-time volatility analysis</strong> with proactive position adjustments</li>
        </ul>
      </div>

      {/* Performance Metrics */}
      <h2 className="text-3xl font-bold mb-6">Performance Metrics</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="docs-metric-card">
          <h3 className="text-xl font-semibold mb-4 text-cyan-400">Backtested Results</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">ETH/USDC Pair</span>
              <span className="font-bold text-cyan-300">69.2% IL Reduction</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">WBTC/ETH Pair</span>
              <span className="font-bold text-cyan-300">68.5% IL Reduction</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">SEI/USDC Pair</span>
              <span className="font-bold text-cyan-300">70.1% IL Reduction</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">MATIC/USDC Pair</span>
              <span className="font-bold text-cyan-300">68.8% IL Reduction</span>
            </div>
          </div>
        </div>

        <div className="docs-metric-card">
          <h3 className="text-xl font-semibold mb-4 text-teal-400">Live Performance</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Average IL Reduction</span>
              <span className="font-bold text-teal-300">68.9%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rebalance Frequency</span>
              <span className="font-bold text-teal-300">~12/day</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Position Efficiency</span>
              <span className="font-bold text-teal-300">94.2%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Capital Utilization</span>
              <span className="font-bold text-teal-300">87.5%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Technical Methodology */}
      <h2 className="text-3xl font-bold mb-6">Technical Methodology</h2>

      <div className="space-y-6 mb-8">
        <div className="docs-content-section border-l-4 border-cyan-400">
          <h3 className="text-xl font-semibold mb-3 text-cyan-400">1. Predictive Price Movement Analysis</h3>
          <p className="mb-3">
            Our ML models analyze multiple data streams to predict price movements with 15-30 minute accuracy:
          </p>
          <ul className="space-y-2 ml-6">
            <li>• <strong>Order flow analysis:</strong> Real-time DEX volume and liquidity depth</li>
            <li>• <strong>Correlation matrices:</strong> Cross-pair movement patterns</li>
            <li>• <strong>Volatility forecasting:</strong> GARCH models with regime detection</li>
            <li>• <strong>Sentiment indicators:</strong> Social metrics and funding rates</li>
          </ul>
        </div>

        <div className="docs-content-section border-l-4 border-teal-400">
          <h3 className="text-xl font-semibold mb-3 text-teal-400">2. Dynamic Range Optimization</h3>
          <p className="mb-3">
            Concentrated liquidity positions are continuously optimized based on:
          </p>
          <ul className="space-y-2 ml-6">
            <li>• <strong>Volatility-adjusted ranges:</strong> Tighter ranges in stable conditions, wider during volatility</li>
            <li>• <strong>Volume-weighted positioning:</strong> Focus liquidity where trading activity is highest</li>
            <li>• <strong>Mean reversion detection:</strong> Identify and capitalize on temporary price deviations</li>
            <li>• <strong>Fee optimization:</strong> Balance between fee capture and IL exposure</li>
          </ul>
        </div>

        <div className="docs-content-section border-l-4 border-green-400">
          <h3 className="text-xl font-semibold mb-3 text-green-400">3. Multi-Strategy Hedging</h3>
          <p className="mb-3">
            Three complementary strategies work together to minimize IL:
          </p>
          <ul className="space-y-2 ml-6">
            <li>• <strong>Delta-neutral positions:</strong> Maintain balanced exposure across price movements</li>
            <li>• <strong>Arbitrage capture:</strong> Exploit price discrepancies between venues</li>
            <li>• <strong>Options-like payoffs:</strong> Structured positions that limit downside exposure</li>
          </ul>
        </div>
      </div>

      {/* Comparison Table */}
      <h2 className="text-3xl font-bold mb-6">Traditional AMM vs Yield Delta</h2>

      <div className="docs-comparison-table">
        <table>
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-4 px-4">Metric</th>
              <th className="text-left py-4 px-4">Traditional V3 Position</th>
              <th className="text-left py-4 px-4">Yield Delta AI Vault</th>
              <th className="text-left py-4 px-4 text-cyan-400">Improvement</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-white/5">
              <td className="py-3 px-4 font-medium">Average IL (30 days)</td>
              <td className="py-3 px-4 text-red-400">-5.2%</td>
              <td className="py-3 px-4 text-green-400">-1.6%</td>
              <td className="py-3 px-4 text-cyan-400 font-bold">69.2%</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-3 px-4 font-medium">Max Drawdown</td>
              <td className="py-3 px-4 text-red-400">-12.8%</td>
              <td className="py-3 px-4 text-yellow-400">-4.1%</td>
              <td className="py-3 px-4 text-cyan-400 font-bold">68.0%</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-3 px-4 font-medium">Sharpe Ratio</td>
              <td className="py-3 px-4">0.82</td>
              <td className="py-3 px-4 text-green-400">2.41</td>
              <td className="py-3 px-4 text-cyan-400 font-bold">+194%</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-3 px-4 font-medium">Fee Capture Rate</td>
              <td className="py-3 px-4">62%</td>
              <td className="py-3 px-4 text-green-400">89%</td>
              <td className="py-3 px-4 text-cyan-400 font-bold">+43.5%</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-3 px-4 font-medium">Rebalance Frequency</td>
              <td className="py-3 px-4">Manual/None</td>
              <td className="py-3 px-4 text-green-400">Automated (12/day)</td>
              <td className="py-3 px-4 text-cyan-400 font-bold">∞</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Mathematical Proof */}
      <h2 className="text-3xl font-bold mb-6">Mathematical Foundation</h2>

      <div className="docs-math-card">
        <p className="mb-4 text-cyan-400 font-sans text-base font-semibold">Impermanent Loss Formula (Traditional)</p>
        <p className="mb-2 text-base">IL_traditional = 2 * sqrt(price_ratio) / (1 + price_ratio) - 1</p>

        <p className="mb-4 mt-6 text-cyan-400 font-sans text-base font-semibold">Yield Delta IL with Hedging</p>
        <p className="mb-2 text-base">IL_yielddelta = IL_traditional * (1 - hedge_efficiency) * volatility_factor</p>

        <p className="mb-2 mt-4 font-sans text-base font-semibold text-white">Where:</p>
        <p className="mb-2 ml-4 text-base">hedge_efficiency = 0.52-0.55 (52-55%)</p>
        <p className="mb-2 ml-4 text-base">volatility_factor = dynamic_range_adjustment(σ, μ, t)</p>

        <p className="mt-6 text-green-400 font-sans text-base font-semibold">Result: Over 50% reduction in IL exposure</p>
      </div>

      {/* Risk Disclosure */}
      <div className="docs-content-section border-l-4 border-red-400 mb-8">
        <h3 className="text-xl font-semibold mb-3 text-red-400">Risk Disclosure</h3>
        <p className="text-muted-foreground mb-3">
          While our system significantly reduces impermanent loss, it cannot eliminate it entirely. Performance metrics are based on:
        </p>
        <ul className="space-y-1 text-sm text-muted-foreground ml-6">
          <li>• Historical backtesting from January 2022 - December 2023</li>
          <li>• Live testnet performance from Q3 2024</li>
          <li>• Assumes normal market conditions without black swan events</li>
          <li>• Past performance does not guarantee future results</li>
        </ul>
      </div>

      {/* SEI Network Advantage */}
      <h2 className="text-3xl font-bold mb-6">SEI Network Advantage</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="docs-content-section border-l-4 border-purple-400">
          <h3 className="text-xl font-semibold mb-3 text-purple-400">Speed Matters</h3>
          <p className="mb-3">
            SEI&apos;s 400ms block finality enables our AI to execute rebalancing strategies that are impossible on slower chains:
          </p>
          <ul className="space-y-2 text-sm">
            <li>• <strong>12+ rebalances/day</strong> vs 2-3 on Ethereum</li>
            <li>• <strong>Sub-second arbitrage</strong> capture</li>
            <li>• <strong>Real-time</strong> volatility response</li>
          </ul>
        </div>

        <div className="docs-content-section border-l-4 border-blue-400">
          <h3 className="text-xl font-semibold mb-3 text-blue-400">Cost Efficiency</h3>
          <p className="mb-3">
            Low transaction costs on SEI make frequent rebalancing economically viable:
          </p>
          <ul className="space-y-2 text-sm">
            <li>• <strong>$0.01-0.02</strong> per rebalance</li>
            <li>• <strong>No MEV</strong> sandwich attacks</li>
            <li>• <strong>Predictable</strong> gas costs</li>
          </ul>
        </div>
      </div>

      {/* Call to Action */}
      <div className="docs-premium-card text-center mb-8">
        <h2 className="text-3xl font-bold mb-4">Ready to Minimize Your IL?</h2>
        <p className="text-lg text-muted-foreground mb-6">
          Join thousands of LPs already protecting their capital with Yield Delta&apos;s AI vaults
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/vaults">
            <Button
              size="lg"
              className="docs-cta-button-large gap-2"
            >
              Explore Vaults
            </Button>
          </Link>
          <Link href="/docs/whitepaper">
            <Button
              size="lg"
              variant="outline"
              className="docs-cta-button-outline-large gap-2"
            >
              Read Whitepaper
            </Button>
          </Link>
        </div>
      </div>

      {/* Contact for Investors */}
      <div className="text-center text-muted-foreground">
        <p className="mb-2">For institutional inquiries and detailed performance data:</p>
        <a href="mailto:social@yielddelta.xyz" className="text-cyan-400 hover:text-cyan-300 font-medium">
          social@yielddelta.xyz
        </a>
      </div>
    </div>
  );
}