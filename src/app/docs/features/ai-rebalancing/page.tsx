import { DocsBackButton } from '@/components/docs/DocsBackButton'
import { CodeBlock } from '@/components/docs/CodeBlock'

export default function AIRebalancingPage() {
  return (
    <div className="docs-content">
      <DocsBackButton href="/docs/features" label="Back to Features" />

      <h1 className="text-4xl font-bold mb-8">AI-Powered Rebalancing</h1>
      
      <p className="text-lg text-muted-foreground mb-8">
        Yield Delta&apos;s AI rebalancing system uses machine learning to automatically optimize liquidity positions, maximizing yields while minimizing risk on the SEI Network.
      </p>

      <h2 className="text-2xl font-semibold mb-4">Overview</h2>
      
      <p className="mb-6">
        Our AI engine continuously analyzes market conditions, price movements, and liquidity dynamics to determine optimal rebalancing strategies. Unlike static positions, AI rebalancing adapts to changing market conditions in real-time.
      </p>

      <h3 className="text-xl font-semibold mb-4">Key Benefits</h3>
      
      <ul className="space-y-2 mb-8">
        <li><strong>Automated Optimization</strong>: No manual intervention required</li>
        <li><strong>Real-time Analysis</strong>: Market conditions analyzed every block (~400ms)</li>
        <li><strong>Risk Management</strong>: Built-in risk controls and position limits</li>
        <li><strong>Gas Efficiency</strong>: Optimized for SEI&apos;s low-cost, high-speed network</li>
        <li><strong>Performance Tracking</strong>: Transparent metrics and historical analysis</li>
      </ul>

      <h2 className="text-2xl font-semibold mb-4">How AI Rebalancing Works</h2>

      <h3 className="text-xl font-semibold mb-4">1. Data Collection</h3>
      
      <p className="mb-4">The AI system continuously collects market data:</p>
      
      <CodeBlock language="typescript" code={`interface MarketData {
  prices: {
    current: number;
    high24h: number;
    low24h: number;
    change24h: number;
  };
  volume: {
    current: number;
    average24h: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  };
  liquidity: {
    tvl: number;
    utilization: number;
    depth: LiquidityDepth;
  };
  volatility: {
    realized: number;
    implied: number;
    garch: number;  // GARCH model prediction
  };
}`} />

      <h3 className="text-xl font-semibold mb-4">2. Model Prediction</h3>
      
      <p className="mb-4">Multiple ML models work together to generate predictions:</p>
      
      <CodeBlock language="typescript" code={`class RebalancingPredictor:
    def __init__(self):
        self.price_model = load_model('price_prediction.onnx')
        self.volatility_model = load_model('volatility_prediction.onnx')
        self.yield_model = load_model('yield_optimization.onnx')
        
    def predict_optimal_range(self, market_data: MarketData) -> OptimalRange:
        # Price prediction (next 24 hours)
        price_forecast = self.price_model.predict([
            market_data.prices.current,
            market_data.volume.current,
            market_data.volatility.realized
        ])
        
        # Volatility prediction
        volatility_forecast = self.volatility_model.predict([
            market_data.volatility.realized,
            market_data.volume.trend,
            market_data.prices.change24h
        ])
        
        # Optimal range calculation
        optimal_range = self.yield_model.predict([
            price_forecast,
            volatility_forecast,
            market_data.liquidity.utilization
        ])
        
        return OptimalRange(
            lower_tick=int(optimal_range[0]),
            upper_tick=int(optimal_range[1]),
            confidence=optimal_range[2],
            expected_apy=optimal_range[3]
        )`} />

      <h3 className="text-xl font-semibold mb-4">3. Decision Making</h3>
      
      <p className="mb-4">The AI evaluates whether rebalancing is profitable:</p>
      
      <CodeBlock language="typescript" code={`interface RebalancingDecision {
  shouldRebalance: boolean;
  confidence: number;
  expectedImprovement: number;
  riskLevel: 'low' | 'medium' | 'high';
  
  proposal: {
    newRange: {
      lowerTick: number;
      upperTick: number;
    };
    estimatedCost: {
      gasUsed: number;
      gasCostSEI: number;
      slippage: number;
    };
    expectedBenefit: {
      additionalAPY: number;
      timeHorizon: number; // Hours to break even
    };
  };
}`} />

      <h3 className="text-xl font-semibold mb-4">4. Execution Strategy</h3>
      
      <p className="mb-4">When rebalancing is determined to be profitable:</p>
      
      <CodeBlock language="solidity" code={`function executeAIRebalancing(
    RebalanceParams calldata params,
    bytes calldata signature
) external nonReentrant {
    // Verify AI signature
    require(verifyAISignature(params, signature), "Invalid AI signature");

    // Check time constraints
    require(
        block.timestamp >= lastRebalance + rebalanceInterval,
        "Too soon to rebalance"
    );

    // Risk checks
    require(params.maxSlippage <= maxAllowedSlippage, "Slippage too high");
    require(params.gasLimit <= maxGasLimit, "Gas limit exceeded");

    // Execute rebalancing
    _executeRebalance(params);

    // Update state
    lastRebalance = block.timestamp;
    emit AIRebalanceExecuted(params.newLowerTick, params.newUpperTick);
}`} />

      <h2 className="text-2xl font-semibold mb-4">Rebalancing Strategies</h2>

      <h3 className="text-xl font-semibold mb-4">Concentrated Liquidity Optimization</h3>
      
      <p className="mb-4"><strong>Objective</strong>: Maximize fee collection by maintaining optimal tick ranges</p>
      
      <ul className="space-y-2 mb-6">
        <li>Calculate current position efficiency</li>
        <li>Model different range scenarios</li>
        <li>Score each scenario based on expected returns</li>
        <li>Select optimal scenario with best risk-adjusted returns</li>
      </ul>

      <h3 className="text-xl font-semibold mb-4">Dynamic Range Adjustment</h3>
      
      <p className="mb-4">The AI continuously adjusts ranges based on market conditions:</p>
      
      <ul className="space-y-2 mb-8">
        <li><strong>Volatility Adjustment</strong>: Wider ranges during high volatility</li>
        <li><strong>Volume Adjustment</strong>: Tighter ranges during high volume</li>
        <li><strong>Trend Adjustment</strong>: Bias ranges in direction of strong trends</li>
        <li><strong>Liquidity Adjustment</strong>: Optimize for current liquidity depth</li>
      </ul>

      <h2 className="text-2xl font-semibold mb-4">Risk Management</h2>

      <h3 className="text-xl font-semibold mb-4">Automated Risk Controls</h3>
      
      <CodeBlock language="typescript" code={`interface RiskControls {
  maxPositionSize: number;     // Maximum position as % of total
  maxDailyRebalances: number;  // Limit rebalancing frequency
  minProfitThreshold: number;  // Minimum expected improvement
  maxSlippage: number;         // Maximum acceptable slippage
  
  stopLoss: {
    enabled: boolean;
    threshold: number;         // % loss to trigger stop
    cooldown: number;          // Time before re-entering
  };
  
  volatilityLimits: {
    maxVolatility: number;     // Pause if volatility exceeds
    lookbackPeriod: number;    // Hours to calculate volatility
  };
}`} />

      <h3 className="text-xl font-semibold mb-4">Circuit Breakers</h3>
      
      <p className="mb-4">Automatic halts during extreme market conditions:</p>
      
      <ul className="space-y-2 mb-8">
        <li>Extreme price movements ({'>'}10% in 1 hour)</li>
        <li>Low liquidity conditions</li>
        <li>High gas price environment</li>
        <li>Network congestion or instability</li>
      </ul>

      <h2 className="text-2xl font-semibold mb-4">Performance Metrics</h2>

      <h3 className="text-xl font-semibold mb-4">Real-time Tracking</h3>
      
      <CodeBlock language="typescript" code={`interface RebalancingMetrics {
  execution: {
    totalRebalances: number;
    successRate: number;
    averageGasCost: number;
    averageSlippage: number;
  };
  
  performance: {
    additionalYield: number;    // Extra yield from rebalancing
    sharpeImprovement: number;  // Risk-adjusted improvement
    maxDrawdownReduction: number;
  };
  
  accuracy: {
    predictionAccuracy: number; // % of predictions within tolerance
    rangeUtilization: number;   // % of time price stays in range
    falseSenalRate: number;     // % of unnecessary rebalances
  };
}`} />

      <h3 className="text-xl font-semibold mb-4">Backtesting Results</h3>
      
      <p className="mb-4">Historical performance analysis shows consistent improvements:</p>
      
      <div className="bg-muted p-4 rounded-lg mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold mb-2">Static Range Strategy</h4>
            <ul className="space-y-1">
              <li>APY: 12.4%</li>
              <li>Max Drawdown: -8.7%</li>
              <li>Sharpe Ratio: 1.23</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">AI-Powered Strategy</h4>
            <ul className="space-y-1">
              <li>APY: 18.9% (+52% improvement)</li>
              <li>Max Drawdown: -5.2% (-40% reduction)</li>
              <li>Sharpe Ratio: 1.67 (+36% improvement)</li>
            </ul>
          </div>
        </div>
      </div>

      <h2 className="text-2xl font-semibold mb-4">Configuration</h2>

      <h3 className="text-xl font-semibold mb-4">AI Settings</h3>
      
      <p className="mb-4">Users can customize AI behavior:</p>
      
      <CodeBlock language="typescript" code={`interface AIConfiguration {
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  rebalanceFrequency: 'low' | 'medium' | 'high';
  gasOptimization: boolean;
  
  thresholds: {
    minImprovement: number;    // Minimum % improvement required
    maxSlippage: number;       // Maximum acceptable slippage
    maxGasCost: number;        // Maximum gas cost in SEI
  };
  
  restrictions: {
    maxDailyRebalances: number;
    pauseDuringVolatility: boolean;
    respectManualOverrides: boolean;
  };
}`} />

      <h3 className="text-xl font-semibold mb-4">Strategy Selection</h3>
      
      <p className="mb-4">Different AI strategies for different market conditions:</p>
      
      <ul className="space-y-2 mb-8">
        <li><strong>Trend Following</strong>: Optimizes for trending markets</li>
        <li><strong>Mean Reversion</strong>: Optimizes for ranging markets</li>
        <li><strong>Volatility Targeting</strong>: Maintains constant volatility exposure</li>
        <li><strong>Adaptive</strong>: Automatically switches between strategies</li>
      </ul>

      <hr className="my-8" />

      <p className="text-center text-muted-foreground italic">
        AI-powered rebalancing transforms static positions into dynamic, intelligent yield generators.
      </p>
    </div>
  );
}

export const metadata = {
  title: 'AI-Powered Rebalancing - Yield Delta Documentation',
  description: 'Learn how Yield Delta&apos;s AI engine automatically optimizes liquidity positions using machine learning for maximum yield generation.',
};