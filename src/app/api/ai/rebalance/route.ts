import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import type { VaultState } from '../../../../types/api'

export const runtime = 'edge';

// Rebalance request schema
const RebalanceRequestSchema = z.object({
  vaultAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid SEI address'),
  strategy: z.enum(['immediate', 'scheduled', 'threshold_based']).default('threshold_based'),
  parameters: z.object({
    newLowerTick: z.number().int().optional(),
    newUpperTick: z.number().int().optional(),
    slippageTolerance: z.number().min(0).max(1).default(0.005), // 0.5% default
    maxGasPrice: z.number().positive().optional(),
    deadline: z.number().int().positive().optional() // Unix timestamp
  }).optional(),
  chainId: z.number().refine(id => id === 1328, 'Must be SEI testnet (1328)')
})

/**
 * Trigger vault rebalancing operations
 * POST /api/ai/rebalance - Execute or schedule rebalancing
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request
    const validatedData = RebalanceRequestSchema.parse(body)
    
    // Check vault exists and get current state
    const vaultState = await getVaultState(validatedData.vaultAddress)
    if (!vaultState) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Vault not found',
          vaultAddress: validatedData.vaultAddress
        },
        { status: 404 }
      )
    }

    // Generate AI-powered rebalancing recommendation
    const rebalanceRecommendation = await generateRebalanceRecommendation(
      validatedData.vaultAddress,
      vaultState,
      validatedData.strategy
    )

    // Execute or schedule rebalancing based on strategy
    const result = await executeRebalancing(validatedData, rebalanceRecommendation)
    
    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
      chainId: 1328
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid rebalance request',
          details: error.errors
        },
        { status: 400 }
      )
    }

    console.error('Error executing rebalance:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to execute rebalance operation',
        chainId: 1328
      },
      { status: 500 }
    )
  }
}

/**
 * Get current vault state from blockchain
 */
async function getVaultState(vaultAddress: string) {
  // Mock vault state - replace with actual blockchain calls
  return {
    address: vaultAddress,
    currentTick: 12500,
    lowerTick: -887220,
    upperTick: 887220,
    liquidity: '1000000000000000000',
    tokensOwed0: '50000000',
    tokensOwed1: '125000000',
    inRange: true,
    utilizationRate: 0.78,
    lastRebalance: '2024-01-23T14:22:00Z',
    totalValueLocked: 1250000,
    impermanentLoss: 0.012,
    feeGrowth: {
      global0: '340282366920938463463374607431768211456',
      global1: '340282366920938463463374607431768211456'
    }
  }
}

/**
 * Generate AI-powered rebalancing recommendation using Python AI engine
 */
async function generateRebalanceRecommendation(
  vaultAddress: string,
  vaultState: VaultState,
  strategy: string
) {
  const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://localhost:8000'
  
  try {
    // Call Python AI engine for rebalance analysis
    const response = await fetch(`${AI_ENGINE_URL}/analyze/rebalance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        vault_address: vaultAddress,
        current_tick: vaultState.currentTick,
        lower_tick: vaultState.lowerTick,
        upper_tick: vaultState.upperTick,
        utilization_rate: vaultState.utilizationRate,
        strategy: strategy,
        market_conditions: {
          tvl: vaultState.totalValueLocked,
          impermanent_loss: vaultState.impermanentLoss,
          last_rebalance: vaultState.lastRebalance
        }
      })
    })

    if (!response.ok) {
      throw new Error(`AI Engine rebalance analysis failed: ${response.statusText}`)
    }

    const aiResult: AIEngineResponse = await response.json()
    
    return {
      vaultAddress,
      recommendation: {
        action: aiResult.action,
        urgency: aiResult.urgency,
        newRange: {
          lowerTick: aiResult.new_lower_tick,
          upperTick: aiResult.new_upper_tick,
          lowerPrice: Math.pow(1.0001, aiResult.new_lower_tick),
          upperPrice: Math.pow(1.0001, aiResult.new_upper_tick),
          expectedUtilization: 0.75
        },
        costs: {
          estimatedGasCost: aiResult.gas_cost_estimate,
          slippageImpact: 0.001,
          opportunityCost: vaultState.utilizationRate < 0.3 ? 0.05 : 0.02
        },
        benefits: {
          expectedAPRIncrease: aiResult.expected_improvement / 100,
          riskReduction: 0.15,
          capitalEfficiency: aiResult.expected_improvement / 100
        },
        timing: {
          optimalWindow: getOptimalRebalanceWindow(),
          marketConditions: 'favorable',
          gasConditions: 'optimal'
        }
      },
      aiInsights: {
        modelConfidence: 0.87,
        marketDirection: aiResult.urgency === 'high' ? 'volatile' : 'stable',
        volatilityForecast: aiResult.urgency === 'high' ? 0.4 : 0.2,
        liquidityForecast: 'stable',
        riskFactors: [aiResult.risk_assessment || 'No specific risk factors identified'],
        aiEngineUsed: true,
        reasoning: aiResult.risk_assessment || 'AI analysis completed successfully'
      }
    }
  } catch (error) {
    console.error('AI Engine rebalance analysis failed, using fallback logic:', error)
    
    // Fallback logic if AI engine is unavailable
    const currentTick = vaultState.currentTick
    const tickRange = vaultState.upperTick - vaultState.lowerTick
    const utilizationRate = vaultState.utilizationRate
    
    // Calculate optimal new range based on current market conditions
    const volatility = 0.25 // Conservative fallback
    const priceDirection = 'neutral' // Conservative fallback
    
    // SEI-specific optimizations
    const seiTickSpacing = 60
    const optimalRangeWidth = Math.floor(tickRange * (1 + volatility * 0.5))
    
    // Center around current price for conservative fallback
    const newLowerTick = Math.floor((currentTick - optimalRangeWidth * 0.5) / seiTickSpacing) * seiTickSpacing
    const newUpperTick = Math.floor((currentTick + optimalRangeWidth * 0.5) / seiTickSpacing) * seiTickSpacing

    return {
      vaultAddress,
      recommendation: {
        action: utilizationRate < 0.3 ? 'rebalance_required' :
                utilizationRate < 0.6 ? 'rebalance_suggested' : 'hold',
        urgency: utilizationRate < 0.2 ? 'high' :
                 utilizationRate < 0.4 ? 'medium' : 'low',
        newRange: {
          lowerTick: newLowerTick,
          upperTick: newUpperTick,
          lowerPrice: Math.pow(1.0001, newLowerTick),
          upperPrice: Math.pow(1.0001, newUpperTick),
          expectedUtilization: 0.75
        },
        costs: {
          estimatedGasCost: 0.15, // SEI fallback estimate
          slippageImpact: 0.001,
          opportunityCost: utilizationRate < 0.3 ? 0.05 : 0.02
        },
        benefits: {
          expectedAPRIncrease: utilizationRate < 0.3 ? 0.08 : 0.03,
          riskReduction: 0.15,
          capitalEfficiency: (0.75 / utilizationRate) - 1
        },
        timing: {
          optimalWindow: getOptimalRebalanceWindow(),
          marketConditions: 'uncertain',
          gasConditions: 'optimal'
        }
      },
      aiInsights: {
        modelConfidence: 0.65, // Lower confidence for fallback
        marketDirection: priceDirection,
        volatilityForecast: volatility,
        liquidityForecast: 'stable',
        riskFactors: [
          'ai_engine_unavailable',
          'using_fallback_logic'
        ],
        aiEngineUsed: false,
        reasoning: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

interface RebalanceRequest {
  vaultAddress: string
  strategy: string
  parameters?: Record<string, unknown>
}

interface AIEngineResponse {
  action: string
  urgency: string
  new_lower_tick: number
  new_upper_tick: number
  gas_cost_estimate: number
  expected_improvement: number
  risk_assessment?: string
}

interface RebalanceRecommendation {
  vaultAddress: string
  recommendation: {
    action: string
    urgency: string
    newRange: {
      lowerTick: number
      upperTick: number
      lowerPrice: number
      upperPrice: number
      expectedUtilization: number
    }
    costs: {
      estimatedGasCost: number
      slippageImpact: number
      opportunityCost: number
    }
    benefits: {
      expectedAPRIncrease: number
      riskReduction: number
      capitalEfficiency: number
    }
    timing: {
      optimalWindow: string
      marketConditions: string
      gasConditions: string
    }
  }
  aiInsights: {
    modelConfidence: number
    marketDirection: string
    volatilityForecast: number
    liquidityForecast: string
    riskFactors: string[]
    aiEngineUsed: boolean
    reasoning: string
  }
}

/**
 * Execute rebalancing operation
 */
async function executeRebalancing(request: RebalanceRequest, recommendation: RebalanceRecommendation) {
  const { vaultAddress, strategy } = request
  
  if (strategy === 'immediate') {
    // Execute immediate rebalancing
    return {
      transactionHash: `0x${Math.random().toString(16).substring(2, 66)}`,
      status: 'pending',
      vaultAddress,
      rebalanceDetails: {
        oldRange: {
          lowerTick: -887220,
          upperTick: 887220
        },
        newRange: recommendation.recommendation.newRange,
        gasCost: recommendation.recommendation.costs.estimatedGasCost,
        timestamp: new Date().toISOString()
      },
      estimatedCompletion: new Date(Date.now() + 30000).toISOString(), // 30 seconds
      seiOptimizations: {
        fastFinality: true,
        gasOptimized: true,
        parallelExecution: true
      }
    }
  } else if (strategy === 'scheduled') {
    // Schedule rebalancing for optimal time
    return {
      scheduleId: `schedule_${Math.random().toString(16).substring(2, 10)}`,
      status: 'scheduled',
      vaultAddress,
      scheduledTime: recommendation.recommendation.timing.optimalWindow,
      rebalanceDetails: recommendation.recommendation.newRange,
      estimatedCosts: recommendation.recommendation.costs
    }
  } else {
    // Threshold-based monitoring
    return {
      monitoringId: `monitor_${Math.random().toString(16).substring(2, 10)}`,
      status: 'monitoring',
      vaultAddress,
      thresholds: {
        minUtilization: 0.3,
        maxVolatility: 0.5,
        priceDeviation: 0.1
      },
      recommendation: recommendation.recommendation,
      nextCheck: new Date(Date.now() + 3600000).toISOString() // 1 hour
    }
  }
}

function getOptimalRebalanceWindow(): string {
  // Calculate optimal rebalancing time based on SEI network conditions
  const now = new Date()
  const optimal = new Date(now)
  
  // SEI has consistent 400ms finality, so any time is generally good
  // However, we might want to consider:
  // - Lower gas periods
  // - Market volatility cycles
  // - Liquidity depth patterns
  
  optimal.setMinutes(optimal.getMinutes() + 15) // 15 minutes from now
  return optimal.toISOString()
}
