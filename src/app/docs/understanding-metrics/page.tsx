import Link from 'next/link';
import { DocsBackButton } from '@/components/docs/DocsBackButton'

export default function UnderstandingMetricsPage() {
  return (
    <div className="docs-content">
      <DocsBackButton />

      <h1 className="text-4xl font-bold mb-8">Understanding Vault Metrics</h1>

      <p className="text-lg text-muted-foreground mb-8">
        Learn how to interpret the key performance metrics used to evaluate vault performance and risk on Yield Delta.
      </p>

      <h2 className="text-2xl font-semibold mb-4">📊 Key Performance Indicators</h2>

      <h3 className="text-xl font-semibold mb-4">Sharpe Ratio</h3>

      <div className="bg-muted p-6 rounded-lg mb-6">
        <p className="text-lg font-semibold mb-2">What is the Sharpe Ratio?</p>
        <p className="mb-4">
          The <strong>Sharpe Ratio</strong> is a measure of risk-adjusted return. It tells you how much excess return you receive for the extra volatility (risk) you endure by holding a risky asset instead of a risk-free asset.
        </p>
        <p className="text-sm text-muted-foreground italic">
          Formula: Sharpe Ratio = (Return - Risk-free Rate) / Standard Deviation of Return
        </p>
      </div>

      <h4 className="font-semibold mb-3">How to Interpret Sharpe Ratio</h4>

      <div className="overflow-x-auto mb-6">
        <table className="w-full border-collapse border border-border">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="border border-border px-4 py-3 text-left">Sharpe Ratio</th>
              <th className="border border-border px-4 py-3 text-left">Rating</th>
              <th className="border border-border px-4 py-3 text-left">Interpretation</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border">
              <td className="border border-border px-4 py-2">
                <span className="font-mono text-red-400">&lt; 0</span>
              </td>
              <td className="border border-border px-4 py-2">Poor</td>
              <td className="border border-border px-4 py-2">
                Returns are below the risk-free rate. You&apos;d be better off with a risk-free investment.
              </td>
            </tr>
            <tr className="border-b border-border">
              <td className="border border-border px-4 py-2">
                <span className="font-mono text-orange-400">0 - 1</span>
              </td>
              <td className="border border-border px-4 py-2">Sub-optimal</td>
              <td className="border border-border px-4 py-2">
                Returns exceed risk-free rate, but the risk may not be adequately compensated.
              </td>
            </tr>
            <tr className="border-b border-border">
              <td className="border border-border px-4 py-2">
                <span className="font-mono text-yellow-400">1 - 2</span>
              </td>
              <td className="border border-border px-4 py-2">Good</td>
              <td className="border border-border px-4 py-2">
                Acceptable risk-adjusted returns. The investment is reasonably efficient.
              </td>
            </tr>
            <tr className="border-b border-border">
              <td className="border border-border px-4 py-2">
                <span className="font-mono text-green-400">2 - 3</span>
              </td>
              <td className="border border-border px-4 py-2">Very Good</td>
              <td className="border border-border px-4 py-2">
                Strong risk-adjusted performance. High returns relative to volatility.
              </td>
            </tr>
            <tr className="border-b border-border">
              <td className="border border-border px-4 py-2">
                <span className="font-mono text-blue-400">&gt; 3</span>
              </td>
              <td className="border border-border px-4 py-2">Excellent</td>
              <td className="border border-border px-4 py-2">
                Exceptional risk-adjusted returns. Rare and highly desirable performance.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-lg mb-8">
        <p className="text-sm">
          <strong>💡 Pro Tip:</strong> A higher Sharpe Ratio indicates better risk-adjusted performance. When comparing vaults, prefer those with higher Sharpe Ratios, as they offer more return per unit of risk taken.
        </p>
      </div>

      <h4 className="font-semibold mb-3">Practical Example</h4>

      <div className="bg-muted p-6 rounded-lg mb-8">
        <p className="mb-4">Let&apos;s compare two vaults:</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="border border-border p-4 rounded-lg">
            <p className="font-semibold mb-2">🔵 Vault A</p>
            <ul className="space-y-1 text-sm">
              <li>APY: <strong>25%</strong></li>
              <li>Volatility: <strong>15%</strong></li>
              <li>Sharpe Ratio: <strong>1.5</strong></li>
            </ul>
          </div>

          <div className="border border-border p-4 rounded-lg">
            <p className="font-semibold mb-2">🟢 Vault B</p>
            <ul className="space-y-1 text-sm">
              <li>APY: <strong>35%</strong></li>
              <li>Volatility: <strong>30%</strong></li>
              <li>Sharpe Ratio: <strong>1.0</strong></li>
            </ul>
          </div>
        </div>

        <p className="text-sm">
          <strong>Analysis:</strong> While Vault B has a higher APY (35% vs 25%), Vault A has a better Sharpe Ratio (1.5 vs 1.0). This means Vault A provides better risk-adjusted returns - you get more return for each unit of risk you take. For risk-conscious investors, Vault A is the better choice.
        </p>
      </div>

      <h3 className="text-xl font-semibold mb-4">Annual Percentage Yield (APY)</h3>

      <div className="bg-muted p-6 rounded-lg mb-6">
        <p className="text-lg font-semibold mb-2">What is APY?</p>
        <p className="mb-4">
          <strong>APY (Annual Percentage Yield)</strong> represents the total return on your investment over one year, including compound interest. It accounts for how frequently returns are reinvested.
        </p>
      </div>

      <h4 className="font-semibold mb-3">APY vs APR</h4>

      <ul className="space-y-2 mb-6">
        <li>
          <strong>APR (Annual Percentage Rate)</strong>: Simple interest rate without compounding
        </li>
        <li>
          <strong>APY (Annual Percentage Yield)</strong>: Effective rate including compounding effects
        </li>
      </ul>

      <div className="bg-muted p-4 rounded-lg mb-8">
        <p className="text-sm mb-2"><strong>Example:</strong></p>
        <p className="text-sm mb-2">A vault with 12% APR compounded monthly:</p>
        <p className="text-sm font-mono">APY = (1 + 0.12/12)^12 - 1 = 12.68%</p>
        <p className="text-sm text-muted-foreground mt-2">
          The extra 0.68% comes from earning interest on your interest throughout the year.
        </p>
      </div>

      <h3 className="text-xl font-semibold mb-4">Total Value Locked (TVL)</h3>

      <div className="bg-muted p-6 rounded-lg mb-6">
        <p className="text-lg font-semibold mb-2">What is TVL?</p>
        <p className="mb-4">
          <strong>Total Value Locked (TVL)</strong> is the total amount of assets deposited in a vault or protocol, measured in USD. It&apos;s a key indicator of a vault&apos;s popularity and liquidity.
        </p>
      </div>

      <h4 className="font-semibold mb-3">Why TVL Matters</h4>

      <ul className="space-y-2 mb-8">
        <li>
          <strong>Liquidity</strong>: Higher TVL generally means easier deposits and withdrawals
        </li>
        <li>
          <strong>Trust</strong>: More capital indicates user confidence in the strategy
        </li>
        <li>
          <strong>Efficiency</strong>: Larger vaults can execute strategies more cost-effectively
        </li>
        <li>
          <strong>Risk</strong>: Very high TVL can indicate market saturation or over-concentration risk
        </li>
      </ul>

      <h3 className="text-xl font-semibold mb-4">Volatility / Standard Deviation</h3>

      <div className="bg-muted p-6 rounded-lg mb-6">
        <p className="text-lg font-semibold mb-2">What is Volatility?</p>
        <p className="mb-4">
          <strong>Volatility</strong> measures how much a vault&apos;s returns fluctuate over time. Higher volatility means more uncertainty and larger price swings.
        </p>
      </div>

      <div className="overflow-x-auto mb-8">
        <table className="w-full border-collapse border border-border">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="border border-border px-4 py-3 text-left">Volatility Level</th>
              <th className="border border-border px-4 py-3 text-left">Risk Profile</th>
              <th className="border border-border px-4 py-3 text-left">Suitable For</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border">
              <td className="border border-border px-4 py-2">
                <span className="font-mono text-green-400">Low (&lt; 10%)</span>
              </td>
              <td className="border border-border px-4 py-2">Conservative</td>
              <td className="border border-border px-4 py-2">Risk-averse investors seeking stable returns</td>
            </tr>
            <tr className="border-b border-border">
              <td className="border border-border px-4 py-2">
                <span className="font-mono text-yellow-400">Medium (10-25%)</span>
              </td>
              <td className="border border-border px-4 py-2">Moderate</td>
              <td className="border border-border px-4 py-2">Balanced portfolios with mixed risk tolerance</td>
            </tr>
            <tr className="border-b border-border">
              <td className="border border-border px-4 py-2">
                <span className="font-mono text-red-400">High (&gt; 25%)</span>
              </td>
              <td className="border border-border px-4 py-2">Aggressive</td>
              <td className="border border-border px-4 py-2">Risk-tolerant investors seeking maximum growth</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 className="text-2xl font-semibold mb-4">🎯 How to Use These Metrics</h2>

      <h3 className="text-xl font-semibold mb-4">Step 1: Define Your Risk Tolerance</h3>

      <div className="space-y-4 mb-6">
        <div className="border border-border p-4 rounded-lg">
          <p className="font-semibold mb-2">🛡️ Conservative Investor</p>
          <ul className="text-sm space-y-1">
            <li>Focus on: Sharpe Ratio &gt; 1.5, Low Volatility (&lt; 15%)</li>
            <li>Strategy: Stable stablecoin vaults, delta-neutral strategies</li>
          </ul>
        </div>

        <div className="border border-border p-4 rounded-lg">
          <p className="font-semibold mb-2">⚖️ Balanced Investor</p>
          <ul className="text-sm space-y-1">
            <li>Focus on: Sharpe Ratio &gt; 1.0, Moderate Volatility (15-25%)</li>
            <li>Strategy: Mixed portfolio of concentrated liquidity and farming</li>
          </ul>
        </div>

        <div className="border border-border p-4 rounded-lg">
          <p className="font-semibold mb-2">🚀 Aggressive Investor</p>
          <ul className="text-sm space-y-1">
            <li>Focus on: High APY, Acceptable Sharpe Ratio &gt; 0.8</li>
            <li>Strategy: High-yield farms, volatile pairs, arbitrage opportunities</li>
          </ul>
        </div>
      </div>

      <h3 className="text-xl font-semibold mb-4">Step 2: Compare Vaults</h3>

      <div className="bg-muted p-6 rounded-lg mb-6">
        <p className="mb-4">When choosing between vaults, consider:</p>
        <ol className="space-y-2 list-decimal list-inside">
          <li><strong>Sharpe Ratio first</strong> - Best risk-adjusted returns</li>
          <li><strong>APY second</strong> - Total expected yield</li>
          <li><strong>TVL third</strong> - Liquidity and trust indicator</li>
          <li><strong>Volatility fourth</strong> - Matches your risk tolerance</li>
          <li><strong>Strategy type</strong> - Understand the underlying mechanics</li>
        </ol>
      </div>

      <h3 className="text-xl font-semibold mb-4">Step 3: Monitor Performance</h3>

      <ul className="space-y-2 mb-8">
        <li>Check vault metrics weekly to spot trends</li>
        <li>Use the <Link href="/dashboard" className="text-primary hover:text-primary/80">Dashboard</Link> to track your portfolio performance</li>
        <li>Leverage <a href="/portfolio/rebalance" className="text-primary hover:text-primary/80">AI Rebalancing</a> for optimization suggestions</li>
        <li>Set up alerts for significant metric changes (coming soon)</li>
      </ul>

      <h2 className="text-2xl font-semibold mb-4">⚠️ Important Considerations</h2>

      <div className="space-y-4 mb-8">
        <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-lg">
          <p className="font-semibold mb-2">Historical Performance ≠ Future Results</p>
          <p className="text-sm">
            Past Sharpe Ratios and APYs don&apos;t guarantee future performance. Market conditions change, and DeFi strategies can experience sudden shifts in returns and risk.
          </p>
        </div>

        <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-lg">
          <p className="font-semibold mb-2">Smart Contract Risk</p>
          <p className="text-sm">
            All DeFi vaults carry smart contract risk. Even high Sharpe Ratio vaults can experience total loss from exploits. Always DYOR and never invest more than you can afford to lose.
          </p>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-lg">
          <p className="font-semibold mb-2">Impermanent Loss</p>
          <p className="text-sm">
            Liquidity provision strategies can experience impermanent loss. Check the vault&apos;s IL protection mechanisms and historical IL statistics.
          </p>
        </div>
      </div>

      <h2 className="text-2xl font-semibold mb-4">📚 Further Reading</h2>

      <ul className="space-y-2 mb-8">
        <li>
          <a href="/docs/features/vaults" className="text-primary hover:text-primary/80">
            Vault Strategies
          </a> - Learn about different vault types and their risk profiles
        </li>
        <li>
          <a href="/docs/features/ai-rebalancing" className="text-primary hover:text-primary/80">
            AI Rebalancing
          </a> - How our AI optimizes your portfolio based on these metrics
        </li>
        <li>
          <a href="/market" className="text-primary hover:text-primary/80">
            Market Analytics
          </a> - Real-time metrics for all available vaults
        </li>
      </ul>

      <hr className="my-8" />

      <p className="text-center text-muted-foreground italic">
        Understanding these metrics empowers you to make informed investment decisions. 📊
      </p>
    </div>
  );
}

export const metadata = {
  title: 'Understanding Vault Metrics - Yield Delta Documentation',
  description: 'Learn how to interpret Sharpe Ratio, APY, TVL, and other key metrics to evaluate vault performance and risk.',
};
