/**
 * ML Strategy Service
 * Connects to the Python AI Engine for ML-powered strategy optimization
 * Feature-flagged for mainnet deployment
 */

interface MLConfig {
  enabled: boolean;
  apiUrl: string;
  timeout: number;
  mockMode: boolean;
}

interface OptimalRangeRequest {
  vault_address: string;
  current_price: number;
  volume_24h: number;
  volatility: number;
  liquidity: number;
  timeframe?: string;
  chain_id?: number;
}

interface OptimalRangeResponse {
  lower_tick: number;
  upper_tick: number;
  lower_price: number;
  upper_price: number;
  confidence: number;
  expected_apr: number;
  risk_score: number;
  reasoning: string;
}

interface MarketPredictionRequest {
  symbol: string;
  historical_data: Array<{
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;
  prediction_horizon?: string;
  confidence_threshold?: number;
}

interface PredictionResponse {
  symbol: string;
  predicted_price: number;
  confidence: number;
  direction: 'up' | 'down' | 'neutral';
  magnitude: number;
  risk_level: 'low' | 'medium' | 'high';
  reasoning: string;
  metadata: {
    model_version: string;
    timestamp: string;
  };
}

interface RebalanceRequest {
  vault_address: string;
  current_lower_tick: number;
  current_upper_tick: number;
  current_price: number;
  position_value: number;
  gas_price: number;
}

interface RebalanceResponse {
  should_rebalance: boolean;
  new_lower_tick?: number;
  new_upper_tick?: number;
  expected_gas_cost: number;
  expected_profit: number;
  confidence: number;
  reasoning: string;
}

class MLStrategyService {
  private config: MLConfig;

  constructor() {
    // Load configuration from environment
    this.config = {
      enabled: process.env.NEXT_PUBLIC_ENABLE_ML_STRATEGIES === 'true',
      apiUrl: process.env.NEXT_PUBLIC_ML_API_URL || 'http://localhost:8000',
      timeout: 10000,
      mockMode: process.env.NEXT_PUBLIC_ML_MOCK_MODE === 'true'
    };
  }

  /**
   * Check if ML strategies are enabled
   */
  isEnabled(): boolean {
    return this.config.enabled && !this.config.mockMode;
  }

  /**
   * Get optimal liquidity range using ML
   */
  async getOptimalRange(request: OptimalRangeRequest): Promise<OptimalRangeResponse> {
    // Return mock data in test/development mode
    if (this.config.mockMode || !this.config.enabled) {
      return this.getMockOptimalRange(request);
    }

    try {
      const response = await fetch(`${this.config.apiUrl}/predict/optimal-range`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...request,
          chain_id: request.chain_id || 1328, // SEI testnet
          timeframe: request.timeframe || '1d'
        }),
        signal: AbortSignal.timeout(this.config.timeout)
      });

      if (!response.ok) {
        throw new Error(`ML API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('ML Strategy Service Error:', error);
      // Fallback to mock data on error
      return this.getMockOptimalRange(request);
    }
  }

  /**
   * Get market predictions using ML
   */
  async getPrediction(request: MarketPredictionRequest): Promise<PredictionResponse> {
    if (this.config.mockMode || !this.config.enabled) {
      return this.getMockPrediction(request);
    }

    try {
      const response = await fetch(`${this.config.apiUrl}/predict/market`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...request,
          prediction_horizon: request.prediction_horizon || '1h',
          confidence_threshold: request.confidence_threshold || 0.7
        }),
        signal: AbortSignal.timeout(this.config.timeout)
      });

      if (!response.ok) {
        throw new Error(`ML API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('ML Prediction Error:', error);
      return this.getMockPrediction(request);
    }
  }

  /**
   * Check if rebalancing is needed
   */
  async checkRebalance(request: RebalanceRequest): Promise<RebalanceResponse> {
    if (this.config.mockMode || !this.config.enabled) {
      return this.getMockRebalance(request);
    }

    try {
      const response = await fetch(`${this.config.apiUrl}/analyze/rebalance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(this.config.timeout)
      });

      if (!response.ok) {
        throw new Error(`ML API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Rebalance Check Error:', error);
      return this.getMockRebalance(request);
    }
  }

  /**
   * Get ML service health status
   */
  async getHealthStatus(): Promise<{ healthy: boolean; version: string }> {
    if (this.config.mockMode || !this.config.enabled) {
      return { healthy: true, version: 'mock-1.0.0' };
    }

    try {
      const response = await fetch(`${this.config.apiUrl}/health`, {
        signal: AbortSignal.timeout(5000)
      });

      const data = await response.json();
      return {
        healthy: data.status === 'healthy',
        version: data.version || '1.0.0'
      };
    } catch (error) {
      console.error('Health check failed:', error);
      return { healthy: false, version: 'error' };
    }
  }

  // Mock data methods for testing/development
  private getMockOptimalRange(request: OptimalRangeRequest): OptimalRangeResponse {
    const volatilityFactor = Math.min(request.volatility, 1.0);
    const priceBuffer = request.current_price * volatilityFactor * 0.1;
    const tickSpacing = 60;
    const currentTick = Math.floor(request.current_price * 10000);

    const rangeWidth = Math.floor(priceBuffer * 10000 / tickSpacing) * tickSpacing;
    const lowerTick = currentTick - rangeWidth / 2;
    const upperTick = currentTick + rangeWidth / 2;

    return {
      lower_tick: Math.floor(lowerTick / tickSpacing) * tickSpacing,
      upper_tick: Math.floor(upperTick / tickSpacing) * tickSpacing,
      lower_price: lowerTick / 10000,
      upper_price: upperTick / 10000,
      confidence: 0.85 - volatilityFactor * 0.2,
      expected_apr: 0.12 + (request.volume_24h / 1000000) * 0.05,
      risk_score: volatilityFactor * 0.6,
      reasoning: `Mock: Optimal range for ${request.volatility.toFixed(1)}% volatility`
    };
  }

  private getMockPrediction(request: MarketPredictionRequest): PredictionResponse {
    const lastPrice = request.historical_data[request.historical_data.length - 1]?.close || 100;
    const randomDirection = Math.random() > 0.5;
    const magnitude = Math.random() * 5;

    return {
      symbol: request.symbol,
      predicted_price: lastPrice * (1 + (randomDirection ? magnitude : -magnitude) / 100),
      confidence: 0.7 + Math.random() * 0.2,
      direction: randomDirection ? 'up' : 'down',
      magnitude: magnitude,
      risk_level: magnitude > 3 ? 'high' : magnitude > 1 ? 'medium' : 'low',
      reasoning: 'Mock prediction based on random simulation',
      metadata: {
        model_version: 'mock-1.0.0',
        timestamp: new Date().toISOString()
      }
    };
  }

  private getMockRebalance(request: RebalanceRequest): RebalanceResponse {
    const priceOutOfRange =
      request.current_price < request.current_lower_tick / 10000 ||
      request.current_price > request.current_upper_tick / 10000;

    return {
      should_rebalance: priceOutOfRange,
      new_lower_tick: priceOutOfRange ? request.current_lower_tick - 600 : undefined,
      new_upper_tick: priceOutOfRange ? request.current_upper_tick + 600 : undefined,
      expected_gas_cost: request.gas_price * 150000,
      expected_profit: priceOutOfRange ? request.position_value * 0.02 : 0,
      confidence: 0.75,
      reasoning: priceOutOfRange ? 'Price out of range, rebalance recommended' : 'Position is optimal'
    };
  }
}

// Export singleton instance
export const mlStrategyService = new MLStrategyService();

// Export types
export type {
  OptimalRangeRequest,
  OptimalRangeResponse,
  MarketPredictionRequest,
  PredictionResponse,
  RebalanceRequest,
  RebalanceResponse
};