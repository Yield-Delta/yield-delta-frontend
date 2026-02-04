/**
 * Hook to fetch token prices from CoinGecko
 * Returns prices in USD for various tokens with caching
 */

import { useQuery } from '@tanstack/react-query';

export interface TokenPrices {
  SEI: number;
  USDC: number;
  USDT: number;
  ETH: number;
  BTC: number;
  ATOM: number;
  DAI: number;
}

interface CoinGeckoPriceResponse {
  [key: string]: {
    usd: number;
  };
}

/**
 * Fetch token prices from CoinGecko
 */
async function fetchTokenPrices(): Promise<TokenPrices> {
  try {
    // Map token symbols to CoinGecko IDs
    const coinGeckoIds = {
      'sei-network': 'SEI',
      'usd-coin': 'USDC',
      'tether': 'USDT',
      'ethereum': 'ETH',
      'bitcoin': 'BTC',
      'cosmos': 'ATOM',
      'dai': 'DAI',
    };

    const ids = Object.keys(coinGeckoIds).join(',');
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`;

    const response = await fetch(url);

    if (!response.ok) {
      console.warn('[useTokenPrices] CoinGecko API error, using fallback prices');
      return getFallbackPrices();
    }

    const data: CoinGeckoPriceResponse = await response.json();

    // Build price object
    const prices: Partial<TokenPrices> = {};
    Object.entries(coinGeckoIds).forEach(([coinGeckoId, symbol]) => {
      if (data[coinGeckoId]?.usd) {
        prices[symbol as keyof TokenPrices] = data[coinGeckoId].usd;
      }
    });

    // Ensure stablecoins default to $1.00 if not in response
    if (!prices.USDC) prices.USDC = 1.00;
    if (!prices.USDT) prices.USDT = 1.00;
    if (!prices.DAI) prices.DAI = 1.00;

    return prices as TokenPrices;
  } catch (error) {
    console.error('[useTokenPrices] Error fetching prices:', error);
    return getFallbackPrices();
  }
}

/**
 * Fallback prices if CoinGecko fails
 */
function getFallbackPrices(): TokenPrices {
  return {
    SEI: 0.50,
    USDC: 1.00,
    USDT: 1.00,
    ETH: 2500.00,
    BTC: 43000.00,
    ATOM: 8.00,
    DAI: 1.00,
  };
}

/**
 * Hook to get current token prices in USD
 * Caches for 1 minute to avoid excessive API calls
 */
export function useTokenPrices() {
  return useQuery({
    queryKey: ['token-prices'],
    queryFn: fetchTokenPrices,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes cache
    refetchOnWindowFocus: true,
    refetchInterval: 60 * 1000, // Refetch every minute
    retry: 2,
  });
}

/**
 * Helper to convert token amount to USD
 */
export function convertToUSD(amount: number, tokenSymbol: string, prices: TokenPrices | undefined): number {
  if (!prices) return 0;

  const price = prices[tokenSymbol as keyof TokenPrices];
  if (!price) {
    console.warn(`[convertToUSD] No price found for ${tokenSymbol}, returning 0`);
    return 0;
  }

  return amount * price;
}
