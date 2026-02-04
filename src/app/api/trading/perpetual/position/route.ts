import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

export const runtime = 'edge';

// Perpetual position request schema matching elizaos_client.py expectations
const PerpPositionSchema = z.object({
  asset: z.string(),
  side: z.enum(['long', 'short']),
  size: z.string(),
  leverage: z.number().min(1).max(10),
  order_type: z.enum(['market', 'limit']).default('market'),
  limit_price: z.string().optional(),
  agent_id: z.string().optional()
})

/**
 * Execute perpetual futures trade
 * POST /api/trading/perpetual/position
 *
 * Used by ai-engine for delta hedging in vault strategies
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = PerpPositionSchema.parse(body)

    console.log('[Perpetual] Position request:', validatedData)

    // In production, this would:
    // 1. Check margin requirements
    // 2. Calculate liquidation price
    // 3. Submit order to perpetual DEX
    // 4. Track position for delta-neutral strategy

    // Mock prices
    const mockPrices: Record<string, number> = {
      'SEI': 0.42,
      'ETH': 2340.50,
      'BTC': 43250.00,
      'ATOM': 8.00
    }

    const entryPrice = mockPrices[validatedData.asset] || 1.0
    const size = parseFloat(validatedData.size)
    const notionalValue = size * entryPrice * validatedData.leverage

    // Calculate liquidation price based on side and leverage
    const liquidationBuffer = 1 / validatedData.leverage
    const liquidationPrice = validatedData.side === 'long'
      ? entryPrice * (1 - liquidationBuffer)
      : entryPrice * (1 + liquidationBuffer)

    const positionId = `pos_${Date.now()}_${Math.random().toString(16).substring(2, 10)}`
    const txHash = `0x${Math.random().toString(16).substring(2)}${Date.now().toString(16)}`

    return NextResponse.json({
      success: true,
      position: {
        id: positionId,
        asset: validatedData.asset,
        side: validatedData.side,
        size: validatedData.size,
        entry_price: entryPrice.toString(),
        leverage: validatedData.leverage,
        notional_value: notionalValue.toString(),
        liquidation_price: liquidationPrice.toString(),
        margin_used: (notionalValue / validatedData.leverage).toString(),
        unrealized_pnl: '0',
        funding_payments: '0'
      },
      transaction: {
        hash: txHash,
        status: 'confirmed',
        blockNumber: Math.floor(Date.now() / 1000)
      },
      execution: {
        order_type: validatedData.order_type,
        fill_price: entryPrice.toString(),
        fees: (notionalValue * 0.0005).toString(), // 0.05% fee
        timestamp: new Date().toISOString()
      },
      risk_metrics: {
        max_loss: (notionalValue / validatedData.leverage).toString(),
        margin_ratio: (1 / validatedData.leverage).toString(),
        health_factor: 1.5
      },
      agent_id: validatedData.agent_id
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid position request',
          details: error.errors
        },
        { status: 400 }
      )
    }

    console.error('Perpetual trade failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Position execution failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * Get current perpetual positions
 * GET /api/trading/perpetual/position
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get('agent_id')

    // In production, fetch actual positions from perpetual protocol
    // For now, return empty or mock positions

    return NextResponse.json({
      success: true,
      positions: [],
      total_unrealized_pnl: '0',
      total_margin_used: '0',
      timestamp: new Date().toISOString(),
      agent_id: agentId
    })

  } catch (error) {
    console.error('Error fetching positions:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch positions'
      },
      { status: 500 }
    )
  }
}
