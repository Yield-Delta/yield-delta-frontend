import { NextResponse } from 'next/server'

export const runtime = 'edge';

/**
 * API Documentation endpoint
 * GET /api/docs - Get comprehensive API documentation
 */
export async function GET() {
  const documentation = {
    title: 'Yield Delta API',
    version: '1.0.0',
    description: 'RESTful API for Yield Delta - AI-powered yield optimization platform',
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
    chainId: 1328,
    chain: 'SEI Network',
    
    authentication: {
      type: 'API Key',
      header: 'X-API-Key',
      description: 'Include your API key in the X-API-Key header for authenticated endpoints',
      publicEndpoints: [
        'GET /health',
        'GET /market/data',
        'GET /vaults'
      ]
    },

    rateLimiting: {
      requests: 100,
      window: '1 minute',
      headers: {
        'X-RateLimit-Limit': 'Total request limit',
        'X-RateLimit-Remaining': 'Remaining requests',
        'X-RateLimit-Reset': 'Reset timestamp'
      }
    },

    endpoints: {
      health: {
        'GET /health': {
          description: 'Health check endpoint',
          parameters: {},
          response: {
            status: 'string',
            timestamp: 'string',
            version: 'string',
            chain: 'string',
            chainId: 1328,
            services: 'object'
          },
          example: {
            status: 'healthy',
            timestamp: '2024-01-23T15:30:00Z',
            version: '1.0.0',
            chain: 'SEI',
            chainId: 1328,
            services: {
              api: 'operational',
              ai_engine: 'operational',
              blockchain: 'operational'
            }
          }
        }
      },

      vaults: {
        'GET /vaults': {
          description: 'List all vaults with optional filtering',
          parameters: {
            strategy: 'concentrated_liquidity | yield_farming | arbitrage | hedge',
            active: 'boolean',
            page: 'number (default: 1)',
            limit: 'number (default: 50, max: 1000)'
          },
          response: {
            success: 'boolean',
            data: 'Vault[]',
            count: 'number',
            chainId: 1328
          }
        },

        'POST /vaults': {
          description: 'Create a new vault',
          body: {
            name: 'string (required)',
            strategy: 'concentrated_liquidity | yield_farming | arbitrage | hedge',
            tokenA: 'string (required)',
            tokenB: 'string (required)',
            fee: 'number (required)',
            tickSpacing: 'number (required)',
            chainId: 1328
          },
          response: {
            success: 'boolean',
            data: 'Vault',
            message: 'string',
            chainId: 1328
          }
        },

        'GET /vaults/{address}': {
          description: 'Get detailed vault information',
          parameters: {
            address: 'string (SEI address, required)'
          },
          response: {
            success: 'boolean',
            data: 'VaultDetails',
            chainId: 1328
          }
        },

        'PATCH /vaults/{address}': {
          description: 'Update vault configuration',
          parameters: {
            address: 'string (SEI address, required)'
          },
          body: {
            name: 'string (optional)',
            strategy: 'string (optional)',
            active: 'boolean (optional)',
            rebalanceThreshold: 'number (optional)'
          },
          response: {
            success: 'boolean',
            data: 'Vault',
            message: 'string',
            chainId: 1328
          }
        },

        'DELETE /vaults/{address}': {
          description: 'Delete/deactivate a vault',
          parameters: {
            address: 'string (SEI address, required)'
          },
          response: {
            success: 'boolean',
            message: 'string',
            address: 'string',
            chainId: 1328
          }
        }
      },

      ai: {
        'POST /ai/predict': {
          description: 'Generate AI-powered liquidity range predictions',
          body: {
            vaultAddress: 'string (SEI address, required)',
            marketData: {
              currentPrice: 'number (required)',
              volume24h: 'number (required)',
              volatility: 'number (required)',
              liquidity: 'number (required)'
            },
            timeframe: '1h | 4h | 1d | 7d | 30d (default: 1d)',
            chainId: 1328
          },
          response: {
            success: 'boolean',
            data: 'AIPrediction',
            timestamp: 'string',
            chainId: 1328
          }
        },

        'POST /ai/rebalance': {
          description: 'Trigger or schedule vault rebalancing',
          body: {
            vaultAddress: 'string (SEI address, required)',
            strategy: 'immediate | scheduled | threshold_based (default: threshold_based)',
            parameters: {
              newLowerTick: 'number (optional)',
              newUpperTick: 'number (optional)',
              slippageTolerance: 'number (default: 0.005)',
              maxGasPrice: 'number (optional)',
              deadline: 'number (Unix timestamp, optional)'
            },
            chainId: 1328
          },
          response: {
            success: 'boolean',
            data: 'RebalanceResult',
            timestamp: 'string',
            chainId: 1328
          }
        }
      },

      market: {
        'GET /market/data': {
          description: 'Get current market data for SEI ecosystem tokens',
          parameters: {
            symbols: 'string (comma-separated, e.g., "SEI-USDC,ATOM-SEI")',
            timeframe: '1m | 5m | 15m | 1h | 4h | 1d (default: 1h)'
          },
          response: {
            success: 'boolean',
            data: 'MarketData[]',
            timestamp: 'string',
            chainId: 1328
          }
        },

        'POST /market/data': {
          description: 'Get historical market data',
          body: {
            symbols: 'string[] (required)',
            timeframe: '1m | 5m | 15m | 1h | 4h | 1d (default: 1h)',
            limit: 'number (default: 100, max: 1000)',
            chainId: 1328
          },
          response: {
            success: 'boolean',
            data: 'HistoricalMarketData[]',
            metadata: 'object',
            timestamp: 'string',
            chainId: 1328
          }
        },

        'GET /market/arbitrage': {
          description: 'Scan for arbitrage opportunities',
          parameters: {
            tokens: 'string (comma-separated)',
            minProfit: 'number (minimum profit threshold, default: 0.005)'
          },
          response: {
            success: 'boolean',
            data: 'ArbitrageOpportunity[]',
            scan: 'object',
            chainId: 1328
          }
        },

        'POST /market/arbitrage': {
          description: 'Advanced arbitrage scanning with AI ranking',
          body: {
            tokens: 'string[] (required)',
            minProfitThreshold: 'number (default: 0.005)',
            maxSlippage: 'number (default: 0.01)',
            exchanges: 'string[] (optional)',
            chainId: 1328
          },
          response: {
            success: 'boolean',
            data: 'ArbitrageOpportunity[]',
            scan: 'object',
            chainId: 1328
          }
        }
      }
    },

    dataTypes: {
      Vault: {
        address: 'string (SEI address)',
        name: 'string',
        strategy: 'concentrated_liquidity | yield_farming | arbitrage | hedge',
        tokenA: 'string',
        tokenB: 'string',
        fee: 'number',
        tickSpacing: 'number',
        tvl: 'number (USD)',
        apy: 'number (annual percentage yield)',
        chainId: 1328,
        active: 'boolean',
        performance: 'VaultPerformance',
        position: 'VaultPosition (optional)',
        risk: 'VaultRisk (optional)',
        fees: 'VaultFees (optional)',
        aiSignals: 'VaultAISignals (optional)'
      },

      VaultPerformance: {
        totalReturn: 'number',
        sharpeRatio: 'number',
        maxDrawdown: 'number',
        winRate: 'number',
        totalTrades: 'number (optional)',
        avgHoldTime: 'string (optional)',
        profitFactor: 'number (optional)'
      },

      MarketData: {
        symbol: 'string',
        price: 'number',
        change24h: 'number',
        changePercent24h: 'number',
        volume24h: 'number',
        volumeUSD24h: 'number',
        high24h: 'number',
        low24h: 'number',
        liquidity: 'object (optional)',
        seiMetrics: 'object (optional)',
        timestamp: 'string',
        source: 'string'
      },

      AIPrediction: {
        vaultAddress: 'string',
        prediction: {
          optimalRange: 'OptimalRange',
          confidence: 'number (0-1)',
          expectedReturn: 'ExpectedReturn',
          riskMetrics: 'RiskMetrics',
          seiOptimizations: 'SeiOptimizations',
          signals: 'AISignals'
        },
        metadata: 'object'
      }
    },

    seiSpecific: {
      chainId: 1328,
      features: [
        'Fast finality (400ms)',
        'Parallel execution',
        'Low gas costs',
        'MEV protection',
        'EVM compatibility'
      ],
      gasEstimates: {
        swap: '0.001 SEI',
        addLiquidity: '0.002 SEI',
        removeLiquidity: '0.002 SEI',
        rebalance: '0.003 SEI',
        vaultCreation: '0.005 SEI'
      }
    },

    examples: {
      createVault: {
        request: {
          method: 'POST',
          url: '/api/vaults',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': 'your-api-key'
          },
          body: {
            name: 'SEI-USDC Concentrated LP',
            strategy: 'concentrated_liquidity',
            tokenA: 'SEI',
            tokenB: 'USDC',
            fee: 0.003,
            tickSpacing: 60,
            chainId: 1328
          }
        }
      },

      getPrediction: {
        request: {
          method: 'POST',
          url: '/api/ai/predict',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': 'your-api-key'
          },
          body: {
            vaultAddress: '0x1234567890123456789012345678901234567890',
            marketData: {
              currentPrice: 0.485,
              volume24h: 15678234,
              volatility: 0.25,
              liquidity: 125000000
            },
            timeframe: '1d',
            chainId: 1328
          }
        }
      }
    },

    errorCodes: {
      400: 'Bad Request - Invalid request data',
      401: 'Unauthorized - Invalid or missing API key',
      404: 'Not Found - Resource not found',
      429: 'Too Many Requests - Rate limit exceeded',
      500: 'Internal Server Error - Server error'
    },

    supportedTokens: [
      'SEI',
      'USDC', 
      'USDT',
      'ATOM',
      'ETH',
      'BTC'
    ],

    supportedExchanges: [
      'DragonSwap',
      'SeiSwap', 
      'AstroPort',
      'WhiteWhale'
    ]
  }

  return NextResponse.json(documentation, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
    }
  })
}
