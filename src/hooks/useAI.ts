import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAppStore } from '@/stores/appStore'

interface AIPredictionRequest {
  vaultAddress: string
  timeframe: '1h' | '1d' | '7d' | '30d'
  marketConditions?: {
    volatility: number
    volume: number
    trend: 'bullish' | 'bearish' | 'sideways'
  }
}

interface AIPredictionResponse {
  success: boolean
  data: {
    prediction: {
      expectedReturn: number
      confidence: number
      riskScore: number
      recommendedAction: 'buy' | 'sell' | 'hold' | 'rebalance'
      optimalRange?: {
        lowerTick: number
        upperTick: number
      }
    }
    reasoning: string[]
    marketAnalysis: {
      volatility: number
      momentum: number
      liquidity: number
    }
  }
}

interface AIRebalanceRequest {
  vaultAddress: string
  currentPosition: {
    lowerTick: number
    upperTick: number
    liquidity: string
  }
  marketData: {
    currentPrice: number
    volatility: number
    volume24h: number
  }
}

interface AIRebalanceResponse {
  success: boolean
  data: {
    shouldRebalance: boolean
    newPosition?: {
      lowerTick: number
      upperTick: number
      expectedGasOptimal: boolean
    }
    reasoning: string[]
    estimatedGas: number
    expectedImprovement: number
  }
}

export const AI_QUERY_KEYS = {
  all: ['ai'] as const,
  predictions: () => [...AI_QUERY_KEYS.all, 'predictions'] as const,
  prediction: (vaultAddress: string, timeframe: string) => 
    [...AI_QUERY_KEYS.predictions(), vaultAddress, timeframe] as const,
  rebalance: (vaultAddress: string) => [...AI_QUERY_KEYS.all, 'rebalance', vaultAddress] as const,
}

// Get AI prediction for a vault
export const useAIPrediction = (
  vaultAddress: string,
  timeframe: '1h' | '1d' | '7d' | '30d' = '1d',
  marketConditions?: AIPredictionRequest['marketConditions']
) => {
  const addNotification = useAppStore((state) => state.addNotification)

  return useQuery({
    queryKey: AI_QUERY_KEYS.prediction(vaultAddress, timeframe),
    queryFn: async (): Promise<AIPredictionResponse['data']> => {
      try {
        const requestBody: AIPredictionRequest = {
          vaultAddress,
          timeframe,
          marketConditions,
        }

        const response = await fetch('/api/ai/predict', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        })

        if (!response.ok) {
          throw new Error(`AI prediction failed: ${response.statusText}`)
        }

        const result: AIPredictionResponse = await response.json()

        if (!result.success) {
          throw new Error('AI prediction request failed')
        }

        return result.data
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'AI prediction failed'
        addNotification({
          type: 'error',
          title: 'AI Prediction Error',
          message: errorMessage,
        })
        throw error
      }
    },
    enabled: !!vaultAddress,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  })
}

// Get AI rebalance recommendation
export const useAIRebalanceRecommendation = () => {
  const queryClient = useQueryClient()
  const addNotification = useAppStore((state) => state.addNotification)

  return useMutation({
    mutationFn: async (request: AIRebalanceRequest): Promise<AIRebalanceResponse['data']> => {
      try {
        const response = await fetch('/api/ai/rebalance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        })

        if (!response.ok) {
          throw new Error(`AI rebalance analysis failed: ${response.statusText}`)
        }

        const result: AIRebalanceResponse = await response.json()

        if (!result.success) {
          throw new Error('AI rebalance analysis failed')
        }

        return result.data
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'AI rebalance analysis failed'
        addNotification({
          type: 'error',
          title: 'AI Rebalance Error',
          message: errorMessage,
        })
        throw error
      }
    },
    onSuccess: (data, variables) => {
      // Invalidate prediction cache for this vault
      queryClient.invalidateQueries({ 
        queryKey: AI_QUERY_KEYS.prediction(variables.vaultAddress, '1d') 
      })

      if (data.shouldRebalance) {
        addNotification({
          type: 'info',
          title: 'Rebalance Recommended',
          message: `AI suggests rebalancing for ${variables.vaultAddress.slice(0, 8)}... - Expected improvement: ${data.expectedImprovement.toFixed(2)}%`,
        })
      }
    },
  })
}

// Execute AI-recommended rebalance
export const useExecuteAIRebalance = () => {
  const queryClient = useQueryClient()
  const addNotification = useAppStore((state) => state.addNotification)

  return useMutation({
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    mutationFn: async (_params: { 
      vaultAddress: string
      newPosition: { lowerTick: number; upperTick: number }
    }): Promise<{ gasUsed?: number }> => {
      // This would integrate with smart contracts to execute the rebalance
      // For now, simulating the transaction
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ 
            gasUsed: Math.floor(Math.random() * 200000) + 100000,
          })
        }, 3000) // Simulate transaction time
      })
    },
    onMutate: ({ vaultAddress }) => {
      addNotification({
        type: 'info',
        title: 'Rebalance Started',
        message: `Executing AI-recommended rebalance for vault ${vaultAddress.slice(0, 8)}...`,
      })
    },
    onSuccess: (data: { gasUsed?: number }, variables) => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: AI_QUERY_KEYS.prediction(variables.vaultAddress, '1d') })
      queryClient.invalidateQueries({ queryKey: ['vaults', 'detail', variables.vaultAddress] })

      addNotification({
        type: 'success',
        title: 'Rebalance Complete',
        message: `Successfully rebalanced vault. Gas used: ${data.gasUsed?.toLocaleString()}`,
      })
    },
    onError: (error, variables) => {
      const errorMessage = error instanceof Error ? error.message : 'Rebalance failed'
      addNotification({
        type: 'error',
        title: 'Rebalance Failed',
        message: `Failed to rebalance vault ${variables.vaultAddress.slice(0, 8)}...: ${errorMessage}`,
      })
    },
  })
}

// Hook for continuous AI monitoring
export const useAIMonitoring = (vaultAddresses: string[]) => {
  const addNotification = useAppStore((state) => state.addNotification)

  return useQuery({
    queryKey: [...AI_QUERY_KEYS.all, 'monitoring', vaultAddresses],
    queryFn: async () => {
      // This would typically connect to a WebSocket or polling service
      // that monitors all vaults and sends alerts when AI detects opportunities
      const alerts = vaultAddresses.map(address => ({
        vaultAddress: address,
        alertType: 'rebalance_opportunity' as const,
        confidence: Math.random() * 100,
        urgency: Math.random() > 0.7 ? 'high' : 'medium' as const,
        message: `AI detected ${Math.random() > 0.5 ? 'optimization' : 'risk mitigation'} opportunity`,
        timestamp: Date.now(),
      }))

      // Filter for high-confidence alerts
      const highConfidenceAlerts = alerts.filter(alert => alert.confidence > 75)

      // Send notifications for new high-confidence alerts
      highConfidenceAlerts.forEach(alert => {
        if (alert.urgency === 'high') {
          addNotification({
            type: 'warning',
            title: 'AI Alert',
            message: `${alert.message} for vault ${alert.vaultAddress.slice(0, 8)}...`,
          })
        }
      })

      return alerts
    },
    enabled: vaultAddresses.length > 0,
    refetchInterval: 30 * 1000, // 30 seconds
    staleTime: 20 * 1000, // 20 seconds
  })
}