import { NextRequest, NextResponse } from 'next/server'
import type { ArbitrageOpportunity } from '../../../../types/api'
import { z } from 'zod'

export const runtime = 'edge';

// Arbitrage scan request schema
const ArbitrageScanSchema = z.object({
  tokens: z.array(z.string()).min(1, 'At least one token required'),
  minProfitThreshold: z.number().min(0).default(0.005), // 0.5% minimum profit
  maxSlippage: z.number().min(0).max(1).default(0.01), // 1% max slippage
  exchanges: z.array(z.string()).optional(),
  chainId: z.number().refine(id => id === 1328, 'Must be SEI chain (1328)')
})

/**
 * Scan for arbitrage opportunities across SEI DEXs
 * GET /api/market/arbitrage - Get current arbitrage opportunities
 * POST /api/market/arbitrage - Scan with custom parameters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tokens = searchParams.get('tokens')?.split(',') || ['SEI', 'USDC', 'ATOM']
    const minProfit = parseFloat(searchParams.get('minProfit') || '0.005')
    
    // Scan for arbitrage opportunities
    const opportunities = await scanArbitrageOpportunities(tokens, minProfit)
    
    return NextResponse.json({
      success: true,
      data: opportunities,
      scan: {
        tokens,
        minProfitThreshold: minProfit,
        exchangesScanned: ['DragonSwap', 'SeiSwap', 'AstroPort', 'WhiteWhale'],
        scanTime: new Date().toISOString()
      },
      chainId: 1328
    })

  } catch (error) {
    console.error('Error scanning arbitrage:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to scan arbitrage opportunities',
        chainId: 1328
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request
    const validatedData = ArbitrageScanSchema.parse(body)
    
    // Advanced arbitrage scanning with custom parameters
    const opportunities = await scanArbitrageOpportunities(
      validatedData.tokens,
      validatedData.minProfitThreshold,
      validatedData.maxSlippage,
      validatedData.exchanges
    )
    
    // AI-enhanced opportunity ranking
    const rankedOpportunities = await rankOpportunitiesWithAI(opportunities)
    
    return NextResponse.json({
      success: true,
      data: rankedOpportunities,
      scan: {
        parameters: validatedData,
        exchangesScanned: validatedData.exchanges || ['DragonSwap', 'SeiSwap', 'AstroPort', 'WhiteWhale'],
        opportunitiesFound: rankedOpportunities.length,
        scanTime: new Date().toISOString(),
        aiEnhanced: true
      },
      chainId: 1328
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid arbitrage scan request',
          details: error.errors
        },
        { status: 400 }
      )
    }

    console.error('Error scanning arbitrage:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to scan arbitrage opportunities',
        chainId: 1328
      },
      { status: 500 }
    )
  }
}

/**
 * Scan for arbitrage opportunities across SEI DEXs
 */
async function scanArbitrageOpportunities(
  tokens: string[], 
  minProfitThreshold: number, 
  maxSlippage: number = 0.01,
  exchanges?: string[]
) {
  // Mock DEX price data - replace with actual DEX API calls
  console.log('[Arbitrage] Scanning opportunities for exchanges:', exchanges || 'all supported');
  const dexPrices = {
    'DragonSwap': {
      'SEI-USDC': 0.485,
      'ATOM-USDC': 14.25,
      'SEI-ATOM': 0.034,
      'USDC-SEI': 2.061
    },
    'SeiSwap': {
      'SEI-USDC': 0.487,
      'ATOM-USDC': 14.18,
      'SEI-ATOM': 0.0343,
      'USDC-SEI': 2.053
    },
    'AstroPort': {
      'SEI-USDC': 0.483,
      'ATOM-USDC': 14.31,
      'SEI-ATOM': 0.0337,
      'USDC-SEI': 2.070
    },
    'WhiteWhale': {
      'SEI-USDC': 0.489,
      'ATOM-USDC': 14.22,
      'SEI-ATOM': 0.0344,
      'USDC-SEI': 2.045
    }
  }

  const opportunities: ArbitrageOpportunity[] = []
  
  // Generate all possible token pairs
  const pairs = generateTokenPairs(tokens)
  
  for (const pair of pairs) {
    const [tokenA, tokenB] = pair
    const pairSymbol = `${tokenA}-${tokenB}`
    
    // Find price differences across exchanges
    const exchangePrices: { exchange: string; price: number; liquidity: number }[] = []
    
    Object.entries(dexPrices).forEach(([exchange, prices]) => {
      const price = prices[pairSymbol as keyof typeof prices]
      if (price) {
        exchangePrices.push({
          exchange,
          price,
          liquidity: Math.random() * 10000000 + 1000000 // Mock liquidity
        })
      }
    })
    
    if (exchangePrices.length < 2) continue
    
    // Sort by price to find best buy/sell opportunities
    exchangePrices.sort((a, b) => a.price - b.price)
    
    const buyExchange = exchangePrices[0]
    const sellExchange = exchangePrices[exchangePrices.length - 1]
    
    const priceDiff = sellExchange.price - buyExchange.price
    const profitPercent = priceDiff / buyExchange.price
    
    if (profitPercent >= minProfitThreshold) {
      // Calculate optimal trade size based on liquidity and slippage
      const maxTradeSize = Math.min(
        buyExchange.liquidity * 0.1, // Max 10% of liquidity
        sellExchange.liquidity * 0.1
      )
      
      const estimatedSlippage = calculateSlippage(maxTradeSize, buyExchange.liquidity)
      
      if (estimatedSlippage <= maxSlippage) {
        opportunities.push({
          id: `arb_${Date.now()}_${Math.random().toString(16).substring(2, 10)}`,
          pair: pairSymbol,
          tokenA,
          tokenB,
          buyExchange: {
            name: buyExchange.exchange,
            price: buyExchange.price,
            liquidity: buyExchange.liquidity
          },
          sellExchange: {
            name: sellExchange.exchange,
            price: sellExchange.price,
            liquidity: sellExchange.liquidity
          },
          profit: {
            absolute: priceDiff,
            percentage: profitPercent,
            usdValue: priceDiff * maxTradeSize
          },
          execution: {
            maxTradeSize,
            estimatedSlippage,
            estimatedGasCost: 0.002, // SEI
            netProfitPercentage: profitPercent - estimatedSlippage - 0.0001, // Minus gas
            executionTime: '2-3 blocks', // SEI fast finality
            confidence: 0.85
          },
          seiOptimizations: {
            parallelExecution: true,
            fastFinality: true,
            lowGasCost: true,
            mevProtection: true
          },
          risks: {
            liquidityRisk: buyExchange.liquidity < 5000000 ? 'high' : 'low',
            priceImpact: estimatedSlippage,
            competitionRisk: profitPercent > 0.02 ? 'high' : 'medium',
            executionRisk: 'low' // SEI fast finality
          },
          timestamp: new Date().toISOString(),
          expires: new Date(Date.now() + 30000).toISOString() // 30 seconds
        })
      }
    }
  }
  
  return opportunities.sort((a, b) => b.profit.percentage - a.profit.percentage)
}

/**
 * AI-enhanced opportunity ranking
 */
async function rankOpportunitiesWithAI(opportunities: ArbitrageOpportunity[]) {
  // Simulate AI processing
  await new Promise(resolve => setTimeout(resolve, 200))
  
  return opportunities.map((opp, index) => ({
    ...opp,
    aiScore: {
      overall: 0.9 - (index * 0.05), // Higher score for better opportunities
      factors: {
        profitability: Math.min(opp.profit.percentage * 20, 1),
        liquidity: Math.min(Math.log(opp.buyExchange.liquidity) / Math.log(10000000), 1),
        executionSpeed: 0.95, // SEI advantage
        riskAdjusted: 1 - (opp.execution.estimatedSlippage * 10),
        marketConditions: 0.8
      },
      recommendation: index < 3 ? 'execute' : index < 6 ? 'monitor' : 'skip',
      confidence: 0.85 + (Math.random() * 0.1)
    }
  }))
}

/**
 * Generate all possible token pairs
 */
function generateTokenPairs(tokens: string[]): string[][] {
  const pairs: string[][] = []
  
  for (let i = 0; i < tokens.length; i++) {
    for (let j = i + 1; j < tokens.length; j++) {
      pairs.push([tokens[i], tokens[j]])
      pairs.push([tokens[j], tokens[i]]) // Both directions
    }
  }
  
  return pairs
}

/**
 * Calculate slippage based on trade size and liquidity
 */
function calculateSlippage(tradeSize: number, liquidity: number): number {
  // Simple slippage model - replace with more sophisticated calculation
  const liquidityRatio = tradeSize / liquidity
  return Math.sqrt(liquidityRatio) * 0.1 // Square root price impact
}
