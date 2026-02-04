import { POST } from '../ai/predict/route'
import { NextRequest } from 'next/server'

describe('/api/ai/predict', () => {
  const validPredictionData = {
    vaultAddress: '0x1234567890123456789012345678901234567890',
    marketData: {
      currentPrice: 0.485,
      volume24h: 15678234,
      volatility: 0.25,
      liquidity: 125000000
    },
    timeframe: '1d' as const,
    chainId: 1328
  }

  describe('POST', () => {
    it('should generate AI prediction with valid data', async () => {
      const request = new NextRequest('http://localhost:3000/api/ai/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validPredictionData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.chainId).toBe(1328)
      expect(data.data).toBeDefined()
      expect(data.data.vaultAddress).toBe(validPredictionData.vaultAddress)
    })

    it('should return prediction with correct structure', async () => {
      const request = new NextRequest('http://localhost:3000/api/ai/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validPredictionData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.data.prediction).toMatchObject({
        optimalRange: {
          lowerPrice: expect.any(Number),
          upperPrice: expect.any(Number),
          lowerTick: expect.any(Number),
          upperTick: expect.any(Number),
          currentTick: expect.any(Number),
          tickSpacing: expect.any(Number)
        },
        confidence: expect.any(Number),
        expectedReturn: {
          daily: expect.any(Number),
          weekly: expect.any(Number),
          monthly: expect.any(Number)
        },
        riskMetrics: {
          impermanentLossRisk: expect.any(Number),
          rebalanceFrequency: expect.any(String),
          maxDrawdown: expect.any(Number),
          sharpeRatio: expect.any(Number)
        },
        seiOptimizations: {
          gasOptimized: expect.any(Boolean),
          fastFinality: expect.any(Boolean),
          parallelExecution: expect.any(Boolean),
          estimatedGasCost: expect.any(Number),
          blockConfirmations: expect.any(Number)
        },
        signals: {
          action: expect.stringMatching(/^(narrow_range|wide_range|balanced)$/),
          urgency: expect.stringMatching(/^(low|medium|high)$/),
          nextRebalanceTime: expect.any(String),
          marketSentiment: expect.stringMatching(/^(bullish|bearish|neutral)$/)
        }
      })
    })

    it('should include metadata about AI model', async () => {
      const request = new NextRequest('http://localhost:3000/api/ai/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validPredictionData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.data.metadata).toMatchObject({
        modelVersion: expect.any(String),
        features: expect.arrayContaining([
          'price_momentum',
          'volatility_clustering',
          'liquidity_depth',
          'sei_specific_metrics'
        ]),
        processingTime: expect.any(String),
        chainOptimized: 'SEI'
      })
    })

    it('should reject prediction with invalid vault address', async () => {
      const invalidData = { ...validPredictionData, vaultAddress: 'invalid-address' }
      const request = new NextRequest('http://localhost:3000/api/ai/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Invalid prediction request')
    })

    it('should reject prediction with invalid chain ID', async () => {
      const invalidData = { ...validPredictionData, chainId: 1 }
      const request = new NextRequest('http://localhost:3000/api/ai/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })

    it('should reject prediction with missing market data', async () => {
      const invalidData = { ...validPredictionData, marketData: undefined }
      const request = new NextRequest('http://localhost:3000/api/ai/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })

    it('should reject prediction with invalid timeframe', async () => {
      const invalidData = { ...validPredictionData, timeframe: 'invalid' }
      const request = new NextRequest('http://localhost:3000/api/ai/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })

    it('should handle different timeframes correctly', async () => {
      const timeframes = ['1h', '4h', '1d', '7d', '30d'] as const
      
      for (const timeframe of timeframes) {
        const data = { ...validPredictionData, timeframe }
        const request = new NextRequest('http://localhost:3000/api/ai/predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })

        const response = await POST(request)
        const responseData = await response.json()

        expect(response.status).toBe(200)
        expect(responseData.success).toBe(true)
      }
    })
  })
})
