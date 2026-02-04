import { NextRequest, NextResponse } from 'next/server'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-utils'

export const runtime = 'edge';

/**
 * API Test endpoint for development and debugging
 * GET /api/test - Simple test endpoint
 * POST /api/test - Echo test with request data
 */
export async function GET() {
  try {
    console.log('[Test API] GET endpoint called - NextResponse available:', !!NextResponse);
    return createSuccessResponse({
      message: 'SEI DLP Core API is running successfully!',
      timestamp: new Date().toISOString(),
      endpoints: [
        'GET /api/health - Health check',
        'GET /api/docs - API documentation',
        'GET /api/vaults - List vaults',
        'POST /api/ai/predict - AI predictions',
        'GET /api/market/data - Market data',
        'GET /api/market/arbitrage - Arbitrage opportunities'
      ],
      chainInfo: {
        name: 'SEI Network',
        chainId: 1328,
        blockTime: '400ms',
        features: ['Fast finality', 'Parallel execution', 'Low gas costs']
      }
    })
  } catch (error) {
    console.error('[Test API] GET error:', error);
    return createErrorResponse('Test endpoint failed', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    return createSuccessResponse({
      message: 'Echo test successful',
      receivedData: body,
      requestInfo: {
        method: request.method,
        url: request.url,
        headers: Object.fromEntries(request.headers.entries()),
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('[Test API] POST error:', error);
    return createErrorResponse('Failed to parse request body', 400)
  }
}
