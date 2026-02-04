import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

export const runtime = 'edge';

// Prediction request schema
const PredictionRequestSchema = z.object({
  vaultAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid SEI address'),
  marketData: z.object({
    currentPrice: z.number().positive(),
    volume24h: z.number().nonnegative(),
    volatility: z.number().nonnegative(),
    liquidity: z.number().positive()
  }),
  timeframe: z.enum(['1h', '4h', '1d', '7d', '30d']).default('1d'),
  chainId: z.number().refine(id => id === 1328, 'Must be SEI testnet (1328)')
})

/**
 * Get AI-powered liquidity range predictions
 * POST /api/ai/predict - Generate optimal range predictions
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request
    const validatedData = PredictionRequestSchema.parse(body)
    
    // Mock AI prediction call - replace with actual Python AI engine integration
    // In production, this would call your Python AI engine via HTTP or message queue
    const prediction = await generateAIPrediction(validatedData)
    
    return NextResponse.json({
      success: true,
      data: prediction,
      timestamp: new Date().toISOString(),
      chainId: 1328
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid prediction request',
          details: error.errors
        },
        { status: 400 }
      )
    }

    console.error('Error generating prediction:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate AI prediction',
        chainId: 1328
      },
      { status: 500 }
    )
  }
}

/**
 * AI prediction function - integrates with Python AI engine
 */
async function generateAIPrediction(data: z.infer<typeof PredictionRequestSchema>) {
  const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://localhost:8000'
  
  try {
    // Call Python AI engine for optimal range prediction
    const response = await fetch(`${AI_ENGINE_URL}/predict/optimal-range`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        vault_address: data.vaultAddress,
        current_price: data.marketData.currentPrice,
        volume_24h: data.marketData.volume24h,
        volatility: data.marketData.volatility,
        liquidity: data.marketData.liquidity,
        timeframe: data.timeframe,
        chain_id: data.chainId
      })
    })

    if (!response.ok) {
      throw new Error(`AI Engine error: ${response.statusText}`)
    }

    const aiResult = await response.json()
    
    // Transform AI engine response to match UI expectations
    const { marketData, timeframe, vaultAddress } = data
    const rangeMultiplier = getTimeframeMultiplier(timeframe)
    console.log('[AI Predict] Range multiplier for timeframe', timeframe, ':', rangeMultiplier)
    
    return {
      vaultAddress,
      prediction: {
        optimalRange: {
          lowerPrice: aiResult.lower_price,
          upperPrice: aiResult.upper_price,
          lowerTick: aiResult.lower_tick,
          upperTick: aiResult.upper_tick,
          currentTick: Math.log(marketData.currentPrice / aiResult.lower_price) / Math.log(1.0001),
          tickSpacing: 60
        },
        confidence: aiResult.confidence,
        expectedReturn: {
          daily: aiResult.expected_apr / 365,
          weekly: aiResult.expected_apr / 52,
          monthly: aiResult.expected_apr / 12
        },
        riskMetrics: {
          impermanentLossRisk: aiResult.risk_score * 0.6,
          rebalanceFrequency: calculateRebalanceFrequency(marketData.volatility, timeframe),
          maxDrawdown: aiResult.risk_score * 0.4,
          sharpeRatio: Math.max(0.5, 2.0 - aiResult.risk_score)
        },
        seiOptimizations: {
          gasOptimized: true,
          fastFinality: true, // 400ms finality
          parallelExecution: true,
          estimatedGasCost: 0.001, // SEI
          blockConfirmations: 1 // Fast finality
        },
        signals: {
          action: determineAction(marketData.volatility, Math.log(marketData.liquidity) / Math.log(10)),
          urgency: calculateUrgency(marketData.volatility),
          nextRebalanceTime: getNextRebalanceTime(marketData.volatility, timeframe),
          marketSentiment: aiResult.confidence > 0.8 ? 'bullish' : aiResult.confidence < 0.6 ? 'bearish' : 'neutral'
        }
      },
      metadata: {
        modelVersion: '2.1.0',
        features: [
          'price_momentum',
          'volatility_clustering',
          'liquidity_depth',
          'sei_specific_metrics',
          'ai_engine_integration'
        ],
        processingTime: '~500ms',
        chainOptimized: 'SEI',
        aiEngineUsed: true,
        reasoning: aiResult.reasoning
      }
    }
  } catch (error) {
    console.error('AI Engine integration failed, using fallback logic:', error)
    
    // Fallback to simplified logic if AI engine is unavailable
    const { marketData, timeframe, vaultAddress } = data
    const { currentPrice, volatility, liquidity } = marketData
    
    const volatilityAdjustment = Math.min(volatility * 1.2, 0.5)
    const liquidityDepth = Math.log(liquidity) / Math.log(10)
    const rangeMultiplier = getTimeframeMultiplier(timeframe)
    
    const lowerBound = currentPrice * (1 - volatilityAdjustment * rangeMultiplier)
    const upperBound = currentPrice * (1 + volatilityAdjustment * rangeMultiplier)
    
    const tickSpacing = 60
    const lowerTick = Math.floor(Math.log(lowerBound / currentPrice) / Math.log(1.0001) / tickSpacing) * tickSpacing
    const upperTick = Math.ceil(Math.log(upperBound / currentPrice) / Math.log(1.0001) / tickSpacing) * tickSpacing
    
    return {
      vaultAddress,
      prediction: {
        optimalRange: {
          lowerPrice: currentPrice * Math.pow(1.0001, lowerTick),
          upperPrice: currentPrice * Math.pow(1.0001, upperTick),
          lowerTick,
          upperTick,
          currentTick: 0,
          tickSpacing
        },
        confidence: 0.75, // Lower confidence for fallback
        expectedReturn: {
          daily: 0.0012 + (liquidityDepth * 0.0002),
          weekly: 0.0084 + (liquidityDepth * 0.0014),
          monthly: 0.036 + (liquidityDepth * 0.006)
        },
        riskMetrics: {
          impermanentLossRisk: volatilityAdjustment * 0.6,
          rebalanceFrequency: calculateRebalanceFrequency(volatility, timeframe),
          maxDrawdown: volatilityAdjustment * 0.3,
          sharpeRatio: 1.2 + (liquidityDepth * 0.1) - (volatilityAdjustment * 0.5)
        },
        seiOptimizations: {
          gasOptimized: true,
          fastFinality: true,
          parallelExecution: true,
          estimatedGasCost: 0.001,
          blockConfirmations: 1
        },
        signals: {
          action: determineAction(volatility, liquidityDepth),
          urgency: calculateUrgency(volatility),
          nextRebalanceTime: getNextRebalanceTime(volatility, timeframe),
          marketSentiment: 'neutral' // Conservative fallback
        }
      },
      metadata: {
        modelVersion: '2.1.0-fallback',
        features: ['basic_calculations'],
        processingTime: 'instant',
        chainOptimized: 'SEI',
        aiEngineUsed: false,
        fallbackReason: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

function getTimeframeMultiplier(timeframe: string): number {
  const multipliers = {
    '1h': 0.1,
    '4h': 0.25,
    '1d': 0.5,
    '7d': 1.0,
    '30d': 1.5
  }
  return multipliers[timeframe as keyof typeof multipliers] || 0.5
}

function calculateRebalanceFrequency(volatility: number, timeframe: string): string {
  const baseFrequency = volatility > 0.3 ? 'high' : volatility > 0.15 ? 'medium' : 'low'
  const timeframeAdjustment = timeframe === '1h' ? 'very_high' : 
                              timeframe === '4h' ? 'high' : baseFrequency
  return timeframeAdjustment
}

function determineAction(volatility: number, liquidityDepth: number): string {
  if (volatility > 0.4) return 'narrow_range'
  if (volatility < 0.1 && liquidityDepth > 8) return 'wide_range'
  return 'balanced'
}

function calculateUrgency(volatility: number): string {
  if (volatility > 0.5) return 'high'
  if (volatility > 0.25) return 'medium'
  return 'low'
}

function getNextRebalanceTime(volatility: number, timeframe: string): string {
  const baseHours = volatility > 0.3 ? 4 : volatility > 0.15 ? 12 : 24
  const adjustment = timeframe === '1h' ? 0.5 : timeframe === '4h' ? 0.75 : 1
  const hours = Math.floor(baseHours * adjustment)
  
  const nextRebalance = new Date()
  nextRebalance.setHours(nextRebalance.getHours() + hours)
  
  return nextRebalance.toISOString()
}
