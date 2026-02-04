/**
 * Hook to convert TVL from native tokens to USD
 * Fetches token prices from the oracle and converts TVL amounts
 */

import { useQuery } from '@tanstack/react-query';

interface TokenPrice {
  symbol: string;
  price: string;
  confidence_score: number;
  source: string;
}

interface MarketDataResponse {
  market_data: TokenPrice[];
  timestamp: string;
  source: string;
}

/**
 * Fetch token prices from oracle
 */
async function fetchTokenPrices(symbols: string[]): Promise<Map<string, number>> {
  try {
    const response = await fetch(
      `/api/oracle/market-data?assets=${symbols.join(',')}`
    );

    if (!response.ok) {
      console.error('[useTVLInUSD] Failed to fetch prices:', response.status);
      return new Map();
    }

    const data: MarketDataResponse = await response.json();

    const priceMap = new Map<string, number>();
    data.market_data.forEach((token) => {
      const price = parseFloat(token.price);
      if (!isNaN(price) && price > 0) {
        priceMap.set(token.symbol, price);
      }
    });

    console.log('[useTVLInUSD] Fetched prices:', Object.fromEntries(priceMap));
    return priceMap;
  } catch (error) {
    console.error('[useTVLInUSD] Error fetching token prices:', error);
    return new Map();
  }
}

interface TVLInUSDResult {
  usdValue: number | null;
  isLoading: boolean;
  error: Error | null;
  tokenPrice: number | null;
  formattedUSD: string | null;
  hasPrice: boolean;
}

/**
 * Hook to get TVL in USD for a given token amount
 *
 * @param tokenSymbol - Token symbol (SEI, USDC, etc.)
 * @param nativeAmount - Amount in native token units
 * @returns USD value, loading state, and error
 */
export function useTVLInUSD(
  tokenSymbol: string,
  nativeAmount: number
): TVLInUSDResult {
  const { data: priceMap, isLoading, error } = useQuery({
    queryKey: ['token-prices', tokenSymbol],
    queryFn: () => fetchTokenPrices([tokenSymbol]),
    staleTime: 30000, // 30 seconds - prices don't change that fast
    gcTime: 60000, // 1 minute cache
    refetchInterval: 60000, // Refetch every minute
    refetchOnWindowFocus: false,
    retry: 2,
  });

  const tokenPrice = priceMap?.get(tokenSymbol) || null;
  const usdValue = tokenPrice !== null ? nativeAmount * tokenPrice : null;

  // Format USD value
  let formattedUSD: string | null = null;
  if (usdValue !== null) {
    if (usdValue >= 1000000) {
      formattedUSD = `$${(usdValue / 1000000).toFixed(2)}M`;
    } else if (usdValue >= 1000) {
      formattedUSD = `$${(usdValue / 1000).toFixed(2)}K`;
    } else {
      formattedUSD = `$${usdValue.toFixed(2)}`;
    }
  }

  return {
    usdValue,
    isLoading,
    error: error as Error | null,
    tokenPrice,
    formattedUSD,
    hasPrice: tokenPrice !== null,
  };
}

/**
 * Hook to get multiple token prices at once (for vaults with multiple tokens)
 */
export function useTokenPrices(symbols: string[]) {
  const { data: priceMap, isLoading, error } = useQuery({
    queryKey: ['token-prices', ...symbols.sort()],
    queryFn: () => fetchTokenPrices(symbols),
    staleTime: 30000,
    gcTime: 60000,
    refetchInterval: 60000,
    refetchOnWindowFocus: false,
    retry: 2,
  });

  return {
    priceMap: priceMap || new Map<string, number>(),
    isLoading,
    error: error as Error | null,
  };
}

/**
 * Format USD value with proper abbreviations
 */
export function formatUSDValue(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(2)}K`;
  } else if (value >= 1) {
    return `$${value.toFixed(2)}`;
  } else {
    return `$${value.toFixed(4)}`;
  }
}
