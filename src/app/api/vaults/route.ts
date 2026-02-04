import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

export const runtime = 'edge';

// SEI-specific vault data schema
const VaultSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid SEI address'),
  name: z.string().min(1, 'Vault name required'),
  strategy: z.enum(['concentrated_liquidity', 'yield_farming', 'arbitrage', 'hedge', 'stable_max', 'sei_hypergrowth', 'blue_chip', 'delta_neutral']),
  tokenA: z.string(),
  tokenB: z.string(),
  fee: z.number().min(0),
  tickSpacing: z.number().min(1),
  chainId: z.number().refine(id => id === 1328, 'Must be SEI testnet (1328)')
})

const CreateVaultSchema = VaultSchema.omit({ address: true })

/**
 * Return the list of predefined vaults, optionally filtered by query parameters.
 *
 * Supports the URL search parameters:
 * - `strategy` — filter vaults by strategy key (e.g., `concentrated_liquidity`).
 * - `active` — filter by active status; use `true` or `false`.
 *
 * @returns On success, an object with `success: true`, `data` (array of vault objects), `count` (number of returned vaults), and `chainId` (1328). On failure, an object with `success: false`, an `error` message, and `chainId` (1328).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const strategy = searchParams.get('strategy')
    const active = searchParams.get('active')
    
    // VAULTS - SEI Atlantic-2 Testnet (Chain ID 1328)
    // TVL values are placeholders - actual TVL is fetched on-chain via useVaultTVL hook
    // APY values are from 90-day backtesting (validated Nov 26, 2025)
    const vaults = [
      {
        address: '0x1ec7d0E455c0Ca2Ed4F2c27bc8F7E3542eeD6565', // SEI Vault (DEPLOYED)
        name: 'Concentrated Liquidity Vault',
        strategy: 'concentrated_liquidity',
        tokenA: 'SEI',
        tokenB: 'USDC',
        fee: 0.003,
        tickSpacing: 60,
        tvl: 0,
        apy: 0.12, // 12% realistic APY (fees + rebalancing, accounting for IL mitigation)
        chainId: 1328,
        active: true,
        performance: {
          totalReturn: 0.029, // 2.9% over 90 days
          sharpeRatio: 0.8,
          maxDrawdown: 0.15, // 15% realistic max drawdown
          winRate: 0.55 // 55% win rate with active rebalancing
        },
        position: {
          lowerTick: -887220,
          upperTick: 887220,
          liquidity: '0',
          tokensOwed0: '0',
          tokensOwed1: '0'
        }
      },
      {
        address: '0xbCB883594435D92395fA72D87845f87BE78d202E', // USDC Vault (DEPLOYED)
        name: 'Stable Max Vault',
        strategy: 'stable_max',
        tokenA: 'USDC',
        tokenB: 'USDC',
        fee: 0.001,
        tickSpacing: 10,
        tvl: 0,
        apy: 0.0383, // 3.83% APY from 90-day backtest (realistic USDC lending)
        chainId: 1328,
        active: true,
        performance: {
          totalReturn: 0.0094, // 0.94% over 90 days (from backtest)
          sharpeRatio: -7.92, // Negative due to low returns vs risk-free rate
          maxDrawdown: 0.0000, // 0% - stable asset
          winRate: 0.9890 // 98.90% from backtest
        },
        position: {
          lowerTick: -100,
          upperTick: 100,
          liquidity: '0',
          tokensOwed0: '0',
          tokensOwed1: '0'
        }
      },
      {
        address: '0xB8Ab030551dabC4FA99864111AAbA7F82281EbD8', // Delta Neutral Vault (REDEPLOYED Nov 29 2025 - with P&L simulation)
        name: 'Delta Neutral Vault',
        strategy: 'delta_neutral',
        tokenA: 'SEI',
        tokenB: 'USDC',
        fee: 0.003,
        tickSpacing: 60,
        tvl: 0,
        apy: 0.07, // 7% realistic (fees minus hedging costs)
        chainId: 1328,
        active: true,
        performance: {
          totalReturn: 0.017, // 1.7% over 90 days
          sharpeRatio: 3.5, // High due to market-neutral approach
          maxDrawdown: 0.02, // 2% - very low due to hedging
          winRate: 0.90 // 90% - consistent returns
        },
        position: {
          lowerTick: -887220,
          upperTick: 887220,
          liquidity: '0',
          tokensOwed0: '0',
          tokensOwed1: '0'
        }
      },
      {
        address: '0x0Ea885EcA3c738be522b256261C4a13eF4225fD4', // Yield Farming Vault (REDEPLOYED Nov 29 2025 - with P&L simulation)
        name: 'Yield Farming Vault',
        strategy: 'yield_farming',
        tokenA: 'SEI',
        tokenB: 'USDC',
        fee: 0.001,
        tickSpacing: 10,
        tvl: 0,
        apy: 0.1223,
        chainId: 1328,
        active: true,
        performance: {
          totalReturn: 0.0292,
          sharpeRatio: 91.70,
          maxDrawdown: 0.0000,
          winRate: 0.9890
        },
        position: {
          lowerTick: -887220,
          upperTick: 887220,
          liquidity: '0',
          tokensOwed0: '0',
          tokensOwed1: '0'
        }
      },
      {
        address: '0xa079a2881233B8bBBd185DdEA5c0a5f484cD4E7b', // Active Trading Vault (REDEPLOYED Nov 29 2025 - with P&L simulation)
        name: 'Active Trading Vault',
        strategy: 'arbitrage',
        tokenA: 'SEI',
        tokenB: 'USDC',
        fee: 0,
        tickSpacing: 10,
        tvl: 0,
        apy: 0.103, // 10.3% from backtest (realistic without flash loans)
        chainId: 1328,
        active: true,
        performance: {
          totalReturn: 0.0247, // 2.47% over 90 days (from backtest)
          sharpeRatio: 10.73, // High due to consistent small wins
          maxDrawdown: 0.00, // 0% - no drawdown in backtest
          winRate: 0.5275 // 52.75% - realistic with 30% failure rate
        },
        position: {
          lowerTick: -887220,
          upperTick: 887220,
          liquidity: '0',
          tokensOwed0: '0',
          tokensOwed1: '0'
        }
      }
    ]

    // NOTE: Vault token pairs:
    // - Concentrated Liquidity: SEI/USDC ✅
    // - Stable Max: USDC/USDC (single asset stablecoin vault)
    // - Delta Neutral: SEI/USDC ✅
    // - Yield Farming: SEI/USDC ✅
    // - Active Trading: SEI/USDC ✅

    // Filter by strategy if provided
    let filteredVaults = vaults
    if (strategy) {
      filteredVaults = vaults.filter(vault => vault.strategy === strategy)
    }
    
    // Filter by active status if provided
    if (active !== null) {
      const isActive = active === 'true'
      filteredVaults = filteredVaults.filter(vault => vault.active === isActive)
    }

    return NextResponse.json(
      {
        success: true,
        data: filteredVaults,
        count: filteredVaults.length,
        chainId: 1328
      },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    )
  } catch (error) {
    console.error('Error fetching vaults:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch vaults',
        chainId: 1328
      },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validatedData = CreateVaultSchema.parse(body)
    
    // SEI-specific validation
    if (validatedData.chainId !== 1328) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid chain ID - must be SEI testnet (1328)' 
        },
        { status: 400 }
      )
    }

    // Mock vault creation - replace with actual smart contr
    // act deployment
    const newVault = {
      ...validatedData,
      address: `0x${Array.from({length: 40}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      tvl: 0,
      apy: 0,
      active: true,
      createdAt: new Date().toISOString(),
      performance: {
        totalReturn: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        winRate: 0
      }
    }

    return NextResponse.json({
      success: true,
      data: newVault,
      message: 'Vault created successfully',
      chainId: 1328
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid request data',
          details: error.errors
        },
        { status: 400 }
      )
    }

    console.error('Error creating vault:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create vault',
        chainId: 1328
      },
      { status: 500 }
    )
  }
}