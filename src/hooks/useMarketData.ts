import { useQuery } from '@tanstack/react-query'
import { useVaultStore } from '@/stores/vaultStore'
import { useAppStore } from '@/stores/appStore'

interface MarketDataPoint {
  symbol: string
  price: number
  change24h: number
  volume24h: number
  marketCap?: number
  high24h: number
  low24h: number
  timestamp: number
}

interface MarketDataResponse {
  success: boolean
  data: MarketDataPoint[]
  timestamp: number
}

export const MARKET_QUERY_KEYS = {
  all: ['market'] as const,
  data: (symbols: string[]) => [...MARKET_QUERY_KEYS.all, 'data', symbols] as const,
  arbitrage: () => [...MARKET_QUERY_KEYS.all, 'arbitrage'] as const,
}

// Fetch market data for specific symbols
export const useMarketData = (symbols: string[]) => {
  const updatePrices = useVaultStore((state) => state.updatePrices)
  const addNotification = useAppStore((state) => state.addNotification)

  return useQuery({
    queryKey: MARKET_QUERY_KEYS.data(symbols),
    queryFn: async (): Promise<MarketDataPoint[]> => {
      try {
        const symbolsParam = symbols.join(',')
        const response = await fetch(`/api/market/data?symbols=${symbolsParam}`)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch market data: ${response.statusText}`)
        }
        
        const result: MarketDataResponse = await response.json()
        
        if (!result.success) {
          throw new Error('Failed to fetch market data')
        }
        
        // Update price store with latest data
        const priceUpdates = result.data.reduce((acc, item) => {
          acc[item.symbol] = {
            price: item.price,
            change24h: item.change24h,
          }
          return acc
        }, {} as Record<string, { price: number; change24h: number }>)
        
        updatePrices(priceUpdates)
        
        return result.data
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch market data'
        addNotification({
          type: 'error',
          title: 'Market Data Error',
          message: errorMessage,
        })
        throw error
      }
    },
    enabled: symbols.length > 0,
    staleTime: 10 * 1000, // 10 seconds
    refetchInterval: 15 * 1000, // 15 seconds
    retry: 2,
  })
}

// Fetch SEI ecosystem tokens
export const useSeiMarketData = () => {
  const seiTokens = ['SEI-USDC', 'ATOM-SEI', 'OSMO-SEI', 'WETH-SEI']
  return useMarketData(seiTokens)
}

// Fetch arbitrage opportunities
export const useArbitrageData = () => {
  const addNotification = useAppStore((state) => state.addNotification)

  return useQuery({
    queryKey: MARKET_QUERY_KEYS.arbitrage(),
    queryFn: async () => {
      try {
        const response = await fetch('/api/market/arbitrage')
        
        if (!response.ok) {
          throw new Error(`Failed to fetch arbitrage data: ${response.statusText}`)
        }
        
        const result = await response.json()
        
        if (!result.success) {
          throw new Error('Failed to fetch arbitrage data')
        }
        
        return result.data
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch arbitrage data'
        addNotification({
          type: 'error',
          title: 'Arbitrage Data Error',
          message: errorMessage,
        })
        throw error
      }
    },
    staleTime: 5 * 1000, // 5 seconds
    refetchInterval: 10 * 1000, // 10 seconds
    retry: 2,
  })
}

// Custom hook for real-time price tracking
export const usePriceTracker = (symbols: string[]) => {
  const priceUpdates = useVaultStore((state) => state.priceUpdates)
  
  // Get market data (this will update the store)
  const { data: marketData, isLoading } = useMarketData(symbols)
  
  // Return current prices from store and market data
  return {
    prices: priceUpdates,
    marketData,
    isLoading,
    getPriceChange: (symbol: string) => priceUpdates[symbol]?.change24h || 0,
    getCurrentPrice: (symbol: string) => priceUpdates[symbol]?.price || 0,
    isStale: (symbol: string, maxAge = 30000) => {
      const priceData = priceUpdates[symbol]
      if (!priceData) return true
      return Date.now() - priceData.timestamp > maxAge
    },
  }
}