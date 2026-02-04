import { NextResponse } from 'next/server'

export const runtime = 'edge';

/**
 * Health check endpoint for SEI DLP API
 * GET /api/health
 */
export async function GET() {
  try {
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      chain: 'SEI',
      chainId: 1328,
      services: {
        api: 'operational',
        ai_engine: 'operational',
        blockchain: 'operational'
      }
    })
  } catch (error) {
    console.error('[Health] Health check error:', error);
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Health check failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
