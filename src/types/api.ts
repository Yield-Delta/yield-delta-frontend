// SEI DLP API Type Definitions

export interface SeiChainConfig {
  readonly CHAIN_ID: 1328
  readonly RPC_URL: string
  readonly EXPLORER_URL: string
  readonly BLOCK_TIME: number
  readonly NATIVE_TOKEN: 'SEI'
  readonly DECIMALS: 18
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  details?: Record<string, unknown>
  metadata?: Record<string, unknown>
  timestamp: string
  chainId: 1328
}

export interface PaginationParams {
  page: number
  limit: number
  offset: number
}

export interface PaginationMetadata {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

// Vault Types
export interface VaultStrategy {
  type: 'concentrated_liquidity' | 'yield_farming' | 'arbitrage' | 'hedge' | 'delta_neutral'
  parameters: Record<string, unknown>
}

export interface VaultPosition {
  lowerTick: number
  upperTick: number
  liquidity: string
  tokensOwed0: string
  tokensOwed1: string
  currentTick: number
  inRange: boolean
  utilizationRate: number
}

export interface VaultPerformance {
  totalReturn: number
  sharpeRatio: number
  maxDrawdown: number
  winRate: number
  totalTrades?: number
  avgHoldTime?: string
  profitFactor?: number
}

export interface VaultRisk {
  impermanentLoss: number
  volatility: number
  correlationRisk: number
  liquidityRisk: 'low' | 'medium' | 'high'
  concentration: number
}

export interface VaultFees {
  collected24h: number
  collected7d: number
  collected30d: number
  feeApr: number
}

export interface VaultAISignals {
  rebalanceRecommendation: 'buy' | 'sell' | 'hold' | 'rebalance'
  riskScore: number
  expectedReturn: number
  confidence: number
  nextRebalanceEstimate: string
}

export interface VaultState {
  currentTick: number
  lowerTick: number
  upperTick: number
  utilizationRate: number
  totalValueLocked: number
  impermanentLoss: number
  lastRebalance: string
}


export interface Vault {
  address: string
  name: string
  strategy: VaultStrategy['type']
  tokenA: string
  tokenB: string
  fee: number
  tickSpacing: number
  tvl: number
  apy: number
  chainId: 1328
  active: boolean
  createdAt: string
  lastRebalance?: string
  performance: VaultPerformance
  position?: VaultPosition
  risk?: VaultRisk
  fees?: VaultFees
  aiSignals?: VaultAISignals
}

export interface CreateVaultRequest {
  name: string
  strategy: VaultStrategy['type']
  tokenA: string
  tokenB: string
  fee: number
  tickSpacing: number
  chainId: 1328
}

export interface UpdateVaultRequest {
  name?: string
  strategy?: VaultStrategy['type']
  active?: boolean
  rebalanceThreshold?: number
}

// Market Data Types
export interface MarketData {
  symbol: string
  price: number
  change24h: number
  changePercent24h: number
  volume24h: number
  volumeUSD24h: number
  high24h: number
  low24h: number
  marketCap?: number
  circulatingSupply?: number
  totalSupply?: number
  liquidity?: {
    totalLocked: number
    [token: string]: number
  }
  seiMetrics?: {
    blockTime: number
    tps: number
    gasPrice: number
    validators: number
    stakingRatio: number
  }
  timestamp: string
  source: string
}

export interface HistoricalDataPoint {
  timestamp: string
  open: number
  high: number
  low: number
  close: number
  volume: number
  volumeUSD: number
  trades: number
}

export interface HistoricalMarketData {
  symbol: string
  timeframe: string
  data: HistoricalDataPoint[]
}

// AI Prediction Types
export interface OptimalRange {
  lowerPrice: number
  upperPrice: number
  lowerTick: number
  upperTick: number
  currentTick: number
  tickSpacing: number
}

export interface ExpectedReturn {
  daily: number
  weekly: number
  monthly: number
}

export interface RiskMetrics {
  impermanentLossRisk: number
  rebalanceFrequency: string
  maxDrawdown: number
  sharpeRatio: number
}

export interface SeiOptimizations {
  gasOptimized: boolean
  fastFinality: boolean
  parallelExecution: boolean
  estimatedGasCost: number
  blockConfirmations: number
}

export interface AISignals {
  action: 'narrow_range' | 'wide_range' | 'balanced'
  urgency: 'low' | 'medium' | 'high'
  nextRebalanceTime: string
  marketSentiment: 'bullish' | 'bearish' | 'neutral'
}

export interface AIPrediction {
  vaultAddress: string
  prediction: {
    optimalRange: OptimalRange
    confidence: number
    expectedReturn: ExpectedReturn
    riskMetrics: RiskMetrics
    seiOptimizations: SeiOptimizations
    signals: AISignals
  }
  metadata: {
    modelVersion: string
    features: string[]
    processingTime: string
    chainOptimized: string
  }
}

export interface PredictionRequest {
  vaultAddress: string
  marketData: {
    currentPrice: number
    volume24h: number
    volatility: number
    liquidity: number
  }
  timeframe: '1h' | '4h' | '1d' | '7d' | '30d'
  chainId: 1328
}

// Rebalancing Types
export interface RebalanceRequest {
  vaultAddress: string
  strategy: 'immediate' | 'scheduled' | 'threshold_based'
  parameters?: {
    newLowerTick?: number
    newUpperTick?: number
    slippageTolerance?: number
    maxGasPrice?: number
    deadline?: number
  }
  chainId: 1328
}

export interface RebalanceRecommendation {
  action: 'rebalance_required' | 'rebalance_suggested' | 'hold'
  urgency: 'low' | 'medium' | 'high'
  newRange: OptimalRange & { expectedUtilization: number }
  costs: {
    estimatedGasCost: number
    slippageImpact: number
    opportunityCost: number
  }
  benefits: {
    expectedAPRIncrease: number
    riskReduction: number
    capitalEfficiency: number
  }
  timing: {
    optimalWindow: string
    marketConditions: string
    gasConditions: string
  }
}

export interface RebalanceResult {
  transactionHash?: string
  scheduleId?: string
  monitoringId?: string
  status: 'pending' | 'scheduled' | 'monitoring'
  vaultAddress: string
  rebalanceDetails: Record<string, unknown>
  estimatedCompletion?: string
  seiOptimizations?: SeiOptimizations
}

// Arbitrage Types
export interface ArbitrageOpportunity {
  id: string
  pair: string
  tokenA: string
  tokenB: string
  buyExchange: {
    name: string
    price: number
    liquidity: number
  }
  sellExchange: {
    name: string
    price: number
    liquidity: number
  }
  profit: {
    absolute: number
    percentage: number
    usdValue: number
  }
  execution: {
    maxTradeSize: number
    estimatedSlippage: number
    estimatedGasCost: number
    netProfitPercentage: number
    executionTime: string
    confidence: number
  }
  seiOptimizations: {
    parallelExecution: boolean
    fastFinality: boolean
    lowGasCost: boolean
    mevProtection: boolean
  }
  risks: {
    liquidityRisk: 'low' | 'medium' | 'high'
    priceImpact: number
    competitionRisk: 'low' | 'medium' | 'high'
    executionRisk: 'low' | 'medium' | 'high'
  }
  aiScore?: {
    overall: number
    factors: {
      profitability: number
      liquidity: number
      executionSpeed: number
      riskAdjusted: number
      marketConditions: number
    }
    recommendation: 'execute' | 'monitor' | 'skip'
    confidence: number
  }
  timestamp: string
  expires: string
}

export interface ArbitrageScanRequest {
  tokens: string[]
  minProfitThreshold: number
  maxSlippage: number
  exchanges?: string[]
  chainId: 1328
}

// System Health Types
export interface SystemHealth {
  api: { status: string; responseTime: string }
  database: { status: string; latency: string }
  blockchain: { 
    status: string
    blockHeight: number
    chainId: number
  }
  ai_engine: { status: string; modelVersion: string }
  cache: { status: string; hitRate: string }
}

// Error Types
export interface ApiError {
  success: false
  error: string
  details?: Record<string, unknown>
  timestamp: string
  chainId: 1328
}

// Rate Limiting Types
export interface RateLimitInfo {
  requests: number
  windowMs: number
  remaining: number
  resetTime: number
}
