/**
 * Hook for ML Strategy Integration
 * Provides easy access to ML predictions in React components
 */

import { useState, useEffect, useCallback } from 'react';
import { mlStrategyService } from '@/services/mlStrategyService';
import type {
  OptimalRangeRequest,
  OptimalRangeResponse,
  MarketPredictionRequest,
  PredictionResponse,
  RebalanceRequest,
  RebalanceResponse
} from '@/services/mlStrategyService';

interface UseMLStrategyReturn {
  isEnabled: boolean;
  isHealthy: boolean;
  getOptimalRange: (request: OptimalRangeRequest) => Promise<OptimalRangeResponse | null>;
  getPrediction: (request: MarketPredictionRequest) => Promise<PredictionResponse | null>;
  checkRebalance: (request: RebalanceRequest) => Promise<RebalanceResponse | null>;
  loading: boolean;
  error: string | null;
}

export function useMLStrategy(): UseMLStrategyReturn {
  const [isHealthy, setIsHealthy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check ML service health on mount
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const status = await mlStrategyService.getHealthStatus();
        setIsHealthy(status.healthy);
      } catch (err) {
        console.error('ML health check failed:', err);
        setIsHealthy(false);
      }
    };

    checkHealth();
    // Re-check health every 5 minutes
    const interval = setInterval(checkHealth, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getOptimalRange = useCallback(async (request: OptimalRangeRequest) => {
    try {
      setLoading(true);
      setError(null);
      const response = await mlStrategyService.getOptimalRange(request);
      return response;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'ML prediction failed';
      setError(errorMsg);
      console.error('Optimal range prediction error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getPrediction = useCallback(async (request: MarketPredictionRequest) => {
    try {
      setLoading(true);
      setError(null);
      const response = await mlStrategyService.getPrediction(request);
      return response;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Market prediction failed';
      setError(errorMsg);
      console.error('Market prediction error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const checkRebalance = useCallback(async (request: RebalanceRequest) => {
    try {
      setLoading(true);
      setError(null);
      const response = await mlStrategyService.checkRebalance(request);
      return response;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Rebalance check failed';
      setError(errorMsg);
      console.error('Rebalance check error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    isEnabled: mlStrategyService.isEnabled(),
    isHealthy,
    getOptimalRange,
    getPrediction,
    checkRebalance,
    loading,
    error
  };
}

// Hook for vault-specific ML strategies
interface UseVaultMLStrategyProps {
  vaultAddress: string;
  strategy: string;
}

export function useVaultMLStrategy({ vaultAddress, strategy }: UseVaultMLStrategyProps) {
  const [optimalRange, setOptimalRange] = useState<OptimalRangeResponse | null>(null);
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [rebalanceNeeded, setRebalanceNeeded] = useState(false);
  const { getOptimalRange, getPrediction, checkRebalance, isEnabled } = useMLStrategy();

  useEffect(() => {
    if (!isEnabled || !vaultAddress) return;

    const fetchMLData = async () => {
      // Fetch optimal range for concentrated liquidity strategies
      if (strategy === 'concentrated_liquidity') {
        const range = await getOptimalRange({
          vault_address: vaultAddress,
          current_price: 100, // Replace with actual price
          volume_24h: 1000000,
          volatility: 0.15,
          liquidity: 5000000,
          timeframe: '1d'
        });
        if (range) setOptimalRange(range);
      }

      // Fetch market predictions
      const marketPrediction = await getPrediction({
        symbol: 'SEI/USDC',
        historical_data: [], // Replace with actual data
        prediction_horizon: '1h'
      });
      if (marketPrediction) setPrediction(marketPrediction);

      // Check if rebalance is needed
      const rebalance = await checkRebalance({
        vault_address: vaultAddress,
        current_lower_tick: -887220,
        current_upper_tick: 887220,
        current_price: 100,
        position_value: 10000,
        gas_price: 0.001
      });
      if (rebalance) setRebalanceNeeded(rebalance.should_rebalance);
    };

    fetchMLData();
    // Refresh every 5 minutes
    const interval = setInterval(fetchMLData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [vaultAddress, strategy, isEnabled, getOptimalRange, getPrediction, checkRebalance]);

  return {
    optimalRange,
    prediction,
    rebalanceNeeded,
    isMLEnabled: isEnabled
  };
}