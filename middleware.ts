import { NextRequest, NextResponse } from 'next/server'
import { 
  checkRateLimit, 
  getCorsHeaders, 
  createErrorResponse,
  validateApiKey 
} from '@/lib/api-utils'

/**
 * API Middleware for SEI DLP Core
 * Handles subdomain routing, CORS, rate limiting, authentication, and error handling
 */
export async function middleware(request: NextRequest) {
  const host = request.headers.get('host') || ''
  const { pathname } = request.nextUrl

  // ===================
  // SUBDOMAIN ROUTING
  // ===================
  
  // app.yielddelta.xyz → /vaults
  if (host.startsWith('app.')) {
    if (pathname === '/' || pathname === '') {
      const url = request.nextUrl.clone()
      url.pathname = '/vaults'
      return NextResponse.rewrite(url)
    }
  }
  
  // docs.yielddelta.xyz → /docs
  if (host.startsWith('docs.')) {
    if (pathname === '/' || pathname === '') {
      const url = request.nextUrl.clone()
      url.pathname = '/docs'
      return NextResponse.rewrite(url)
    }
  }

  // ===================
  // API MIDDLEWARE (only for /api routes)
  // ===================
  
  if (!pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: getCorsHeaders()
    })
  }

  // Skip middleware for health check
  if (pathname === '/api/health') {
    return NextResponse.next()
  }

  // Rate limiting
  if (!checkRateLimit(request)) {
    return createErrorResponse(
      'Rate limit exceeded. Please try again later.',
      429,
      { 
        limit: 100,
        window: '1 minute',
        suggestion: 'Consider implementing request batching or caching'
      }
    )
  }

  // API key validation (optional for public endpoints)
  const isPublicEndpoint = isPublicPath(pathname)
  if (!isPublicEndpoint && !validateApiKey(request)) {
    return createErrorResponse(
      'Invalid or missing API key',
      401,
      { 
        hint: 'Include X-API-Key header with your request',
        documentation: '/docs/authentication'
      }
    )
  }

  // Add CORS headers to all responses
  const response = NextResponse.next()
  Object.entries(getCorsHeaders()).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  return response
}

/**
 * Check if endpoint is public (doesn't require API key)
 */
function isPublicPath(pathname: string): boolean {
  const publicPaths = [
    '/api/health',
    '/api/market/data',
    '/api/vaults',
  ]
  
  return publicPaths.some(path => pathname.startsWith(path))
}

/**
 * Configure middleware to run on API routes AND root for subdomain handling
 */
export const config = {
  matcher: [
    '/',
    '/api/:path*'
  ]
}
