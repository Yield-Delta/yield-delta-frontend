/**
 * Hook to calculate total TVL in USD across all vaults
 * Fetches token prices from CoinGecko with 24-hour caching
 */

import { useQuery } from '@tanstack/react-query';
import { VaultData } from '@/stores/vaultStore';
import { getPrimaryDepositToken } from '@/utils/tokenUtils';

interface CoinGeckoPriceResponse {
  [key: string]: {
    usd: number;
  };
}

/**
 * Fetch token prices from CoinGecko
 * Maps our token symbols to CoinGecko IDs
 */
async function fetchCoinGeckoPrices(tokens: string[]): Promise<Map<string, number>> {
  try {
    // Map token symbols to CoinGecko IDs
    const coinGeckoIds: Record<string, string> = {
      'SEI': 'sei-network',
      'USDC': 'usd-coin',
      'USDT': 'tether',
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      'ATOM': 'cosmos',
      'DAI': 'dai',
    };

    // Get unique token symbols and their CoinGecko IDs
    const uniqueTokens = [...new Set(tokens)];
    const ids = uniqueTokens
      .map(symbol => coinGeckoIds[symbol])
      .filter(id => id !== undefined)
      .join(',');

    if (!ids) {
      console.warn('[useTotalTVLInUSD] No valid CoinGecko IDs found for tokens:', tokens);
      return new Map();
    }

    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`;
    console.log('[useTotalTVLInUSD] Fetching prices from CoinGecko:', url);

    const response = await fetch(url);

    if (!response.ok) {
      console.error('[useTotalTVLInUSD] CoinGecko API error:', response.status, response.statusText);
      return new Map();
    }

    const data: CoinGeckoPriceResponse = await response.json();
    console.log('[useTotalTVLInUSD] CoinGecko response:', data);

    // Create reverse mapping from CoinGecko ID to symbol
    const idToSymbol: Record<string, string> = {};
    Object.entries(coinGeckoIds).forEach(([symbol, id]) => {
      idToSymbol[id] = symbol;
    });

    // Build price map
    const priceMap = new Map<string, number>();
    Object.entries(data).forEach(([coinGeckoId, priceData]) => {
      const symbol = idToSymbol[coinGeckoId];
      if (symbol && priceData.usd) {
        priceMap.set(symbol, priceData.usd);
      }
    });

    // USDC, USDT, and DAI are stablecoins - default to $1.00 if not in response
    ['USDC', 'USDT', 'DAI'].forEach(stablecoin => {
      if (!priceMap.has(stablecoin)) {
        priceMap.set(stablecoin, 1.00);
      }
    });

    console.log('[useTotalTVLInUSD] Price map:', Object.fromEntries(priceMap));
    return priceMap;
  } catch (error) {
    console.error('[useTotalTVLInUSD] Error fetching CoinGecko prices:', error);
    return new Map();
  }
}

interface TotalTVLInUSDResult {
  totalUSD: number;
  isLoading: boolean;
  error: Error | null;
  formattedUSD: string;
  priceMap: Map<string, number>;
}

/**
 * Hook to calculate total TVL in USD across all vaults
 *
 * @param vaults - Array of vault data
 * @param tvlMap - Map of vault addresses to TVL amounts in native tokens
 * @returns Total TVL in USD, loading state, and formatted USD string
 */
export function useTotalTVLInUSD(
  vaults: VaultData[],
  tvlMap: Map<string, number>
): TotalTVLInUSDResult {
  // Get unique token symbols from all vaults
  const tokenSymbols = Array.from(
    new Set(
      vaults.map(vault => {
        try {
          return getPrimaryDepositToken(vault).symbol;
        } catch {
          return 'SEI'; // Fallback to SEI if token detection fails
        }
      })
    )
  );

  // Fetch prices from CoinGecko with 24-hour cache
  const { data: priceMap, isLoading, error } = useQuery({
    queryKey: ['coingecko-prices', ...tokenSymbols.sort()],
    queryFn: () => fetchCoinGeckoPrices(tokenSymbols),
    staleTime: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    gcTime: 24 * 60 * 60 * 1000, // 24 hours cache
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 2,
  });

  // Calculate total TVL in USD
  let totalUSD = 0;

  if (priceMap && priceMap.size > 0) {
    vaults.forEach(vault => {
      const tvl = tvlMap.get(vault.address.toLowerCase());
      if (tvl !== undefined && tvl > 0) {
        try {
          const primaryToken = getPrimaryDepositToken(vault);
          const tokenPrice = priceMap.get(primaryToken.symbol);

          if (tokenPrice) {
            const vaultUSD = tvl * tokenPrice;
            totalUSD += vaultUSD;
            console.log(
              `[useTotalTVLInUSD] Vault ${vault.name}: ${tvl.toFixed(4)} ${primaryToken.symbol} × $${tokenPrice} = $${vaultUSD.toFixed(2)}`
            );
          }
        } catch (error) {
          console.error(`[useTotalTVLInUSD] Error calculating USD for vault ${vault.name}:`, error);
        }
      }
    });
  }

  // Format USD value
  let formattedUSD = '$0.00';
  if (totalUSD >= 1000000) {
    formattedUSD = `$${(totalUSD / 1000000).toFixed(2)}M`;
  } else if (totalUSD >= 1000) {
    formattedUSD = `$${(totalUSD / 1000).toFixed(2)}K`;
  } else if (totalUSD > 0) {
    formattedUSD = `$${totalUSD.toFixed(2)}`;
  }

  console.log('[useTotalTVLInUSD] Total TVL in USD:', formattedUSD, `(${totalUSD})`);

  return {
    totalUSD,
    isLoading,
    error: error as Error | null,
    formattedUSD,
    priceMap: priceMap || new Map(),
  };
}
