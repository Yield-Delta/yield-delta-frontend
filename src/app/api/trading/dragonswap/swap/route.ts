import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

export const runtime = 'edge';

// Swap request schema matching elizaos_client.py expectations
const SwapRequestSchema = z.object({
  from_asset: z.string(),
  to_asset: z.string(),
  amount: z.string(),
  max_slippage: z.number().min(0).max(1).default(0.005),
  agent_id: z.string().optional()
})

/**
 * Execute DragonSwap trade
 * POST /api/trading/dragonswap/swap
 *
 * Used by ai-engine for automated vault rebalancing trades
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = SwapRequestSchema.parse(body)

    console.log('[DragonSwap] Swap request:', validatedData)

    // In production, this would:
    // 1. Get optimal route from DragonSwap router
    // 2. Calculate expected output with slippage
    // 3. Submit transaction to backend-signer
    // 4. Wait for confirmation

    // Mock swap execution
    const fromAmount = parseFloat(validatedData.amount)
    const mockPrices: Record<string, number> = {
      'SEI': 0.42,
      'USDC': 1.0,
      'ETH': 2340.50,
      'BTC': 43250.00,
      'ATOM': 8.00,
      'OSMO': 1.20
    }

    const fromPrice = mockPrices[validatedData.from_asset] || 1.0
    const toPrice = mockPrices[validatedData.to_asset] || 1.0

    const toAmount = (fromAmount * fromPrice / toPrice) * (1 - validatedData.max_slippage)
    const effectiveSlippage = validatedData.max_slippage * 0.6 // Simulated actual slippage

    const txHash = `0x${Math.random().toString(16).substring(2)}${Date.now().toString(16)}`

    return NextResponse.json({
      success: true,
      transaction: {
        hash: txHash,
        status: 'confirmed',
        blockNumber: Math.floor(Date.now() / 1000)
      },
      swap: {
        from_asset: validatedData.from_asset,
        to_asset: validatedData.to_asset,
        from_amount: validatedData.amount,
        to_amount: toAmount.toString(),
        effective_slippage: effectiveSlippage,
        price_impact: effectiveSlippage * 0.5,
        route: [`${validatedData.from_asset}/${validatedData.to_asset}`]
      },
      execution: {
        exchange: 'DragonSwap',
        gas_used: '150000',
        gas_price: '0.000001',
        timestamp: new Date().toISOString()
      },
      agent_id: validatedData.agent_id
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid swap request',
          details: error.errors
        },
        { status: 400 }
      )
    }

    console.error('DragonSwap trade failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Swap execution failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
