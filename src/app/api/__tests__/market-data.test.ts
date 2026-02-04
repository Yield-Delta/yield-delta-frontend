import { GET, POST } from '../market/data/route'
import { NextRequest } from 'next/server'

describe('/api/market/data', () => {
  describe('GET', () => {
    it('should return current market data for default symbols', async () => {
      const request = new NextRequest('http://localhost:3000/api/market/data')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(Array.isArray(data.data)).toBe(true)
      expect(data.data.length).toBeGreaterThan(0)
      expect(data.chainId).toBe(1328)
    })

    it('should return market data for specific symbols', async () => {
      const request = new NextRequest('http://localhost:3000/api/market/data?symbols=SEI-USDC,ATOM-SEI')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.length).toBe(2)
      expect(data.data[0].symbol).toBe('SEI-USDC')
      expect(data.data[1].symbol).toBe('ATOM-SEI')
    })

    it('should return market data with correct structure', async () => {
      const request = new NextRequest('http://localhost:3000/api/market/data?symbols=SEI-USDC')
      const response = await GET(request)
      const data = await response.json()

      const marketData = data.data[0]
      expect(marketData).toMatchObject({
        symbol: 'SEI-USDC',
        price: expect.any(Number),
        change24h: expect.any(Number),
        changePercent24h: expect.any(Number),
        volume24h: expect.any(Number),
        volumeUSD24h: expect.any(Number),
        high24h: expect.any(Number),
        low24h: expect.any(Number),
        timestamp: expect.any(String),
        source: 'SEI_DEX_AGGREGATOR'
      })
    })

    it('should include SEI-specific metrics', async () => {
      const request = new NextRequest('http://localhost:3000/api/market/data?symbols=SEI-USDC')
      const response = await GET(request)
      const data = await response.json()

      const marketData = data.data[0]
      expect(marketData.seiMetrics).toMatchObject({
        blockTime: 0.4,
        tps: expect.any(Number),
        gasPrice: expect.any(Number),
        validators: expect.any(Number),
        stakingRatio: expect.any(Number)
      })
    })

    it('should include liquidity information', async () => {
      const request = new NextRequest('http://localhost:3000/api/market/data?symbols=SEI-USDC')
      const response = await GET(request)
      const data = await response.json()

      const marketData = data.data[0]
      expect(marketData.liquidity).toMatchObject({
        totalLocked: expect.any(Number),
        sei: expect.any(Number),
        usdc: expect.any(Number)
      })
    })

    it('should handle unknown symbols gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/market/data?symbols=UNKNOWN-TOKEN')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data[0].symbol).toBe('UNKNOWN-TOKEN')
      expect(data.data[0].price).toBeGreaterThan(0)
    })
  })

  describe('POST', () => {
    const validHistoricalRequest = {
      symbols: ['SEI-USDC', 'ATOM-SEI'],
      timeframe: '1h' as const,
      limit: 100,
      chainId: 1328
    }

    it('should return historical market data', async () => {
      const request = new NextRequest('http://localhost:3000/api/market/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validHistoricalRequest)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(Array.isArray(data.data)).toBe(true)
      expect(data.data.length).toBe(2)
      expect(data.chainId).toBe(1328)
    })

    it('should return historical data with correct structure', async () => {
      const request = new NextRequest('http://localhost:3000/api/market/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validHistoricalRequest)
      })

      const response = await POST(request)
      const data = await response.json()

      const historicalData = data.data[0]
      expect(historicalData).toMatchObject({
        symbol: expect.any(String),
        timeframe: '1h',
        data: expect.arrayContaining([
          expect.objectContaining({
            timestamp: expect.any(String),
            open: expect.any(Number),
            high: expect.any(Number),
            low: expect.any(Number),
            close: expect.any(Number),
            volume: expect.any(Number),
            volumeUSD: expect.any(Number),
            trades: expect.any(Number)
          })
        ])
      })
    })

    it('should include metadata about the request', async () => {
      const request = new NextRequest('http://localhost:3000/api/market/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validHistoricalRequest)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.metadata).toMatchObject({
        timeframe: '1h',
        limit: 100,
        symbols: ['SEI-USDC', 'ATOM-SEI']
      })
    })

    it('should respect the limit parameter', async () => {
      const limitedRequest = { ...validHistoricalRequest, limit: 50 }
      const request = new NextRequest('http://localhost:3000/api/market/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(limitedRequest)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.data[0].data.length).toBe(50)
    })

    it('should handle different timeframes', async () => {
      const timeframes = ['1m', '5m', '15m', '1h', '4h', '1d'] as const
      
      for (const timeframe of timeframes) {
        const request = new NextRequest('http://localhost:3000/api/market/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...validHistoricalRequest, timeframe })
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.data[0].timeframe).toBe(timeframe)
      }
    })

    it('should reject request with invalid symbols array', async () => {
      const invalidRequest = { ...validHistoricalRequest, symbols: [] }
      const request = new NextRequest('http://localhost:3000/api/market/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidRequest)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })

    it('should reject request with invalid timeframe', async () => {
      const invalidRequest = { ...validHistoricalRequest, timeframe: 'invalid' }
      const request = new NextRequest('http://localhost:3000/api/market/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidRequest)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })

    it('should reject request with limit exceeding maximum', async () => {
      const invalidRequest = { ...validHistoricalRequest, limit: 2000 }
      const request = new NextRequest('http://localhost:3000/api/market/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidRequest)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })
  })
})
