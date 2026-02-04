import { NextRequest, NextResponse } from 'next/server'

// Rate limiting configuration
const rateLimitMap = new Map<string, { count: number; lastReset: number }>()

// SEI Chain configuration
export const SEI_CONFIG = {
  CHAIN_ID: 1328,
  RPC_URL: 'https://evm-rpc-testnet.sei-apis.com',
  EXPLORER_URL: 'https://seitrace.com/atlantic-2',
  BLOCK_TIME: 400, // 400ms
  NATIVE_TOKEN: 'SEI',
  DECIMALS: 18
} as const

// API configuration
export const API_CONFIG = {
  RATE_LIMIT: {
    requests: 100,
    windowMs: 60 * 1000 // 1 minute
  },
  DEFAULT_PAGINATION: {
    limit: 50,
    maxLimit: 1000
  },
  CACHE_TTL: {
    market_data: 30, // 30 seconds
    vault_data: 60, // 1 minute
    ai_predictions: 300 // 5 minutes
  }
} as const

/**
 * Rate limiting middleware
 */
export function checkRateLimit(request: NextRequest): boolean {
  const ip = request.headers.get('x-forwarded-for') ||
             request.headers.get('x-real-ip') ||
             request.headers.get('cf-connecting-ip') ||
             'unknown'
  const now = Date.now()
  const windowMs = API_CONFIG.RATE_LIMIT.windowMs
  
  const record = rateLimitMap.get(ip)
  
  if (!record || now - record.lastReset > windowMs) {
    rateLimitMap.set(ip, { count: 1, lastReset: now })
    return true
  }
  
  if (record.count >= API_CONFIG.RATE_LIMIT.requests) {
    return false
  }
  
  record.count++
  return true
}

/**
 * CORS headers for API responses
 */
export function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
    'Access-Control-Max-Age': '86400',
  }
}

/**
 * Standard API error response
 */
export function createErrorResponse(
  error: string, 
  status: number = 500, 
  details?: Record<string, unknown>
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error,
      details,
      timestamp: new Date().toISOString(),
      chainId: SEI_CONFIG.CHAIN_ID
    },
    { 
      status,
      headers: getCorsHeaders()
    }
  )
}

/**
 * Standard API success response
 */
export function createSuccessResponse(
  data: unknown, 
  metadata?: Record<string, unknown>,
  status: number = 200
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
      metadata,
      timestamp: new Date().toISOString(),
      chainId: SEI_CONFIG.CHAIN_ID
    },
    { 
      status,
      headers: getCorsHeaders()
    }
  )
}

/**
 * Validate SEI address format
 */
export function validateSeiAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

/**
 * Validate API key (mock implementation)
 */
export function validateApiKey(request: NextRequest): boolean {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _apiKey = request.headers.get('X-API-Key')
  // In production, implement proper API key validation
  return true // Allow all for now
}

/**
 * Parse pagination parameters
 */
export function parsePagination(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(
    API_CONFIG.DEFAULT_PAGINATION.maxLimit,
    Math.max(1, parseInt(searchParams.get('limit') || '50'))
  )
  const offset = (page - 1) * limit
  
  return { page, limit, offset }
}

/**
 * Cache key generator
 */
export function generateCacheKey(prefix: string, params: Record<string, unknown>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&')
  
  return `${prefix}:${sortedParams}`
}

/**
 * SEI-specific gas estimation
 */
export function estimateSeiGasCost(operation: string): number {
  const gasCosts = {
    'swap': 0.001,
    'add_liquidity': 0.002,
    'remove_liquidity': 0.002,
    'rebalance': 0.003,
    'claim_fees': 0.001,
    'vault_creation': 0.005
  }
  
  return gasCosts[operation as keyof typeof gasCosts] || 0.002
}

/**
 * Format token amount with proper decimals
 */
export function formatTokenAmount(amount: string | number, decimals: number = 18): string {
  const value = typeof amount === 'string' ? parseFloat(amount) : amount
  return (value / Math.pow(10, decimals)).toFixed(6)
}

/**
 * Calculate APR from fee data
 */
export function calculateAPR(
  feesCollected: number, 
  timeframeDays: number, 
  tvl: number
): number {
  if (tvl === 0 || timeframeDays === 0) return 0
  
  const dailyFees = feesCollected / timeframeDays
  const annualFees = dailyFees * 365
  
  return annualFees / tvl
}

/**
 * SEI-specific tick calculations
 */
export function tickToPrice(tick: number): number {
  return Math.pow(1.0001, tick)
}

export function priceToTick(price: number): number {
  return Math.log(price) / Math.log(1.0001)
}

export function alignToTickSpacing(tick: number, tickSpacing: number): number {
  return Math.floor(tick / tickSpacing) * tickSpacing
}

/**
 * Validate chain ID for SEI
 */
export function validateChainId(chainId: number): boolean {
  return chainId === SEI_CONFIG.CHAIN_ID
}

/**
 * Health check utility
 */
export async function checkSystemHealth() {
  // In production, check actual system components
  return {
    api: { status: 'healthy', responseTime: '< 100ms' },
    database: { status: 'healthy', latency: '< 50ms' },
    blockchain: { 
      status: 'healthy', 
      blockHeight: Math.floor(Date.now() / 400), // Mock block height
      chainId: SEI_CONFIG.CHAIN_ID
    },
    ai_engine: { status: 'healthy', modelVersion: '2.1.0' },
    cache: { status: 'healthy', hitRate: '95%' }
  }
}
