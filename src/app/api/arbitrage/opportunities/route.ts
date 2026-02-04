import { NextResponse } from 'next/server'

export const runtime = 'edge';

/**
 * Get funding rate arbitrage opportunities
 * GET /api/arbitrage/opportunities
 *
 * Returns opportunities in the format expected by ai-engine's elizaos_client.py
 */
export async function GET() {
  try {
    console.log('[Arbitrage] Fetching funding rate opportunities')

    // Get funding rate arbitrage opportunities
    const opportunities = await getFundingRateOpportunities()

    return NextResponse.json({
      opportunities,
      scan_time: new Date().toISOString(),
      exchanges_scanned: ['DragonSwap', 'Jellyverse', 'Levana', 'Binance'],
      total_found: opportunities.length
    })

  } catch (error) {
    console.error('Error fetching arbitrage opportunities:', error)
    return NextResponse.json(
      {
        opportunities: [],
        error: 'Failed to fetch arbitrage opportunities'
      },
      { status: 500 }
    )
  }
}

/**
 * Get funding rate arbitrage opportunities across exchanges
 */
async function getFundingRateOpportunities() {
  // Mock funding rates from different exchanges
  // In production, fetch from actual perp protocols
  const fundingRates: Record<string, Record<string, number>> = {
    'SEI': {
      'DragonSwap': 0.024,
      'Jellyverse': 0.018,
      'Levana': 0.031,
      'Binance': 0.015
    },
    'ETH': {
      'DragonSwap': -0.012,
      'Jellyverse': -0.008,
      'Levana': -0.015,
      'Binance': -0.010
    },
    'BTC': {
      'DragonSwap': 0.018,
      'Jellyverse': 0.022,
      'Levana': 0.016,
      'Binance': 0.020
    },
    'ATOM': {
      'DragonSwap': 0.015,
      'Jellyverse': 0.028,
      'Levana': 0.012,
      'Binance': 0.019
    }
  }

  const opportunities = []

  for (const [asset, rates] of Object.entries(fundingRates)) {
    const exchanges = Object.keys(rates)
    const rateValues = Object.values(rates)

    const maxRate = Math.max(...rateValues)
    const minRate = Math.min(...rateValues)
    const spread = maxRate - minRate

    // Only include if spread is significant (> 0.5%)
    if (spread > 0.005) {
      const riskScore = Math.min(spread * 10, 1) // Higher spread = higher risk
      const potentialProfit = spread * 10000 // Assuming $10K position

      opportunities.push({
        asset,
        exchanges,
        funding_rates: Object.fromEntries(
          Object.entries(rates).map(([ex, rate]) => [ex, rate.toString()])
        ),
        spread: spread.toString(),
        potential_profit: potentialProfit.toString(),
        risk_score: riskScore,
        execution_complexity: exchanges.length > 3 ? 4 : 2,
        timestamp: new Date().toISOString(),
        strategy: {
          long_exchange: exchanges[rateValues.indexOf(minRate)],
          short_exchange: exchanges[rateValues.indexOf(maxRate)],
          direction: maxRate > 0 ? 'short_pays_long' : 'long_pays_short'
        }
      })
    }
  }

  // Sort by potential profit
  return opportunities.sort((a, b) =>
    parseFloat(b.potential_profit) - parseFloat(a.potential_profit)
  )
}
