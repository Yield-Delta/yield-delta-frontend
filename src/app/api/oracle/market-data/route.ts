import { NextRequest, NextResponse } from 'next/server'

// Use edge runtime for Cloudflare Pages
export const runtime = 'edge';

// Pyth price feed IDs
const PYTH_PRICE_FEEDS: Record<string, string> = {
  SEI: '0x53614f1cb0c031d4af66c04cb9c756234adad0e1cee85303795091499a4084eb',
  USDC: '0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a',
  ETH: '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
  BTC: '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
  ATOM: '0xb00b60f88b03a6a625a8d1c048c3f66653edf217439cb-2ab-f1-2c-cc-89-5b-8f-f5',
  OSMO: '0x5867f5683c757393a0670ef0f701490950fe93fdb006d181c8265a831ac0c5c6',
}

/**
 * Market data endpoint for AI Engine integration
 * GET /api/oracle/market-data?assets=SEI,USDC,ETH
 *
 * Returns market data in the format expected by ai-engine's elizaos_client.py
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const assetsParam = searchParams.get('assets') || 'SEI,USDC'
    const assets = assetsParam.split(',').map(a => a.trim().toUpperCase())

    console.log('[Oracle Market Data] Fetching data for assets:', assets)

    // Get market data for requested assets
    const marketData = await getMarketDataForAssets(assets)

    return NextResponse.json({
      market_data: marketData,
      timestamp: new Date().toISOString(),
      source: 'pyth_sei_oracle'
    })

  } catch (error) {
    console.error('Error fetching oracle market data:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch market data',
        market_data: []
      },
      { status: 500 }
    )
  }
}

/**
 * Fetch price from Pyth Hermes API
 */
async function fetchPythPrice(priceFeedId: string): Promise<{ price: number; confidence: number } | null> {
  try {
    const response = await fetch(
      `https://hermes.pyth.network/api/latest_price_feeds?ids[]=${priceFeedId}`,
      { next: { revalidate: 10 } } // Cache for 10 seconds
    )

    if (!response.ok) {
      console.error(`Pyth API error: ${response.status}`)
      return null
    }

    const data = await response.json()
    if (data && data.length > 0) {
      const priceData = data[0].price
      const price = parseFloat(priceData.price) * Math.pow(10, priceData.expo)
      const confidence = parseFloat(priceData.conf) * Math.pow(10, priceData.expo)
      return { price, confidence }
    }

    return null
  } catch (error) {
    console.error(`Error fetching Pyth price:`, error)
    return null
  }
}

// Coinbase trading pair mappings
const COINBASE_PAIRS: Record<string, string> = {
  SEI: 'SEI-USD',
  ETH: 'ETH-USD',
  BTC: 'BTC-USD',
  ATOM: 'ATOM-USD',
  USDC: 'USDC-USD',
}


/**
 * Fetch price from Coinbase public API
 */
async function fetchCoinbasePrice(asset: string): Promise<{ price: number; volume: number } | null> {
  const pair = COINBASE_PAIRS[asset]
  if (!pair) return null

  try {
    // Use only public API endpoints (no JWT)
    const response = await fetch(
      `https://api.coinbase.com/v2/prices/${pair}/spot`,
      {
        headers: { 'Content-Type': 'application/json' },
        next: { revalidate: 10 }
      }
    )

    if (!response.ok) {
      console.error(`Coinbase API error for ${pair}: ${response.status}`)
      return null
    }

    const data = await response.json()
    if (data && data.data && data.data.amount) {
      const price = parseFloat(data.data.amount)

      // Also try to get 24h volume from ticker
      let volume = 0
      try {
        const tickerResponse = await fetch(
          `https://api.exchange.coinbase.com/products/${pair}/stats`,
          { next: { revalidate: 60 } }
        )
        if (tickerResponse.ok) {
          const tickerData = await tickerResponse.json()
          volume = parseFloat(tickerData.volume || '0') * price
        }
      } catch {
        // Volume fetch is optional
      }

      console.log(`[Coinbase] ${asset} price: $${price.toFixed(4)} (public)`)
      return { price, volume }
    }

    return null
  } catch (error) {
    console.error(`Error fetching Coinbase price for ${asset}:`, error)
    return null
  }
}

/**
 * Get market data in ai-engine compatible format
 */
async function getMarketDataForAssets(assets: string[]) {
  // Fallback data in case Pyth is unavailable (Dec 2024 prices)
  const fallbackData: Record<string, {
    price: number;
    volume_24h: number;
    price_change_24h: number;
    funding_rate: number | null;
  }> = {
    'SEI': { price: 0.42, volume_24h: 14200000, price_change_24h: 2.3, funding_rate: 0.024 },
    'USDC': { price: 1.0, volume_24h: 50000000, price_change_24h: 0.01, funding_rate: null },
    'ETH': { price: 2340.50, volume_24h: 8100000000, price_change_24h: -1.2, funding_rate: -0.012 },
    'BTC': { price: 43250.00, volume_24h: 12400000000, price_change_24h: 3.1, funding_rate: 0.018 },
    'ATOM': { price: 8.00, volume_24h: 80000000, price_change_24h: 6.67, funding_rate: 0.015 },
    'OSMO': { price: 1.20, volume_24h: 60000000, price_change_24h: 7.14, funding_rate: 0.022 },
  }

  const results = await Promise.all(
    assets.map(async (asset) => {
      const feedId = PYTH_PRICE_FEEDS[asset]
      let price = 0
      let confidenceScore = 0
      let source = 'fallback'
      let volume_24h = 0

      // Priority 1: Try Pyth oracle
      if (feedId) {
        const pythData = await fetchPythPrice(feedId)
        if (pythData && pythData.price > 0) {
          price = pythData.price
          confidenceScore = Math.max(0, Math.min(1, 1 - (pythData.confidence / pythData.price)))
          source = 'pyth_hermes'
          console.log(`[Oracle] ${asset} price from Pyth: $${price.toFixed(4)}`)
        }
      }

      // Priority 2: Try Coinbase if Pyth failed
      if (price === 0) {
        const coinbaseData = await fetchCoinbasePrice(asset)
        if (coinbaseData && coinbaseData.price > 0) {
          price = coinbaseData.price
          volume_24h = coinbaseData.volume
          confidenceScore = 0.95 // Coinbase is highly reliable
          source = 'coinbase'
          console.log(`[Oracle] ${asset} price from Coinbase: $${price.toFixed(4)}`)
        }
      }

      // Priority 3: Use fallback
      const fallback = fallbackData[asset]
      if (price === 0 && fallback) {
        price = fallback.price
        confidenceScore = 0.8 // Fallback has lower confidence
        source = 'fallback'
        console.log(`[Oracle] ${asset} using fallback price: $${price.toFixed(4)}`)
      }

      // Use fallback volume if not from Coinbase
      if (volume_24h === 0 && fallback) {
        volume_24h = fallback.volume_24h
      }

      return {
        symbol: asset,
        price: price.toString(),
        volume_24h: volume_24h.toString(),
        price_change_24h: (fallback?.price_change_24h || 0).toString(),
        funding_rate: fallback?.funding_rate?.toString() || null,
        confidence_score: confidenceScore,
        timestamp: new Date().toISOString(),
        source,
      }
    })
  )

  return results
}
