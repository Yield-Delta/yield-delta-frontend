import { GET, POST } from '../vaults/route'
import { NextRequest } from 'next/server'
import type { Vault } from '../../../types/api'

describe('/api/vaults', () => {
  describe('GET', () => {
    it('should return all 8 strategies including delta neutral', async () => {
      const request = new NextRequest('http://localhost:3000/api/vaults')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(8) // 7 existing + 1 delta neutral
      expect(data.chainId).toBe(1328)

      // Verify delta neutral vault exists
      const deltaNeutralVault = data.data.find((vault: Vault) => vault.strategy === 'delta_neutral')
      expect(deltaNeutralVault).toBeDefined()
      expect(deltaNeutralVault.name).toBe('Delta Neutral LP Vault')
      expect(deltaNeutralVault.active).toBe(true)
      expect(deltaNeutralVault.performance.sharpeRatio).toBeGreaterThan(1.5)
    })

    it('should filter vaults by strategy', async () => {
      const request = new NextRequest('http://localhost:3000/api/vaults?strategy=concentrated_liquidity')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.every((vault: { strategy: string }) => vault.strategy === 'concentrated_liquidity')).toBe(true)
    })

    it('should filter vaults by active status', async () => {
      const request = new NextRequest('http://localhost:3000/api/vaults?active=true')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.every((vault: { active: boolean }) => vault.active === true)).toBe(true)
    })

    it('can filter by delta neutral strategy', async () => {
      const request = new NextRequest('http://localhost:3000/api/vaults?strategy=delta_neutral')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data).toHaveLength(1)
      expect(data.data[0].strategy).toBe('delta_neutral')
    })

    it('returns correct strategy types', async () => {
      const request = new NextRequest('http://localhost:3000/api/vaults')
      const response = await GET(request)
      const data = await response.json()

      const strategies = data.data.map((vault: Vault) => vault.strategy)
      const expectedStrategies = [
        'concentrated_liquidity',
        'yield_farming', 
        'arbitrage',
        'hedge',
        'stable_max',
        'sei_hypergrowth',
        'blue_chip',
        'delta_neutral'
      ]

      expectedStrategies.forEach(strategy => {
        expect(strategies).toContain(strategy)
      })
    })

    it('should return vault with correct structure', async () => {
      const request = new NextRequest('http://localhost:3000/api/vaults')
      const response = await GET(request)
      const data = await response.json()

      const vault = data.data[0]
      expect(vault).toMatchObject({
        address: expect.stringMatching(/^0x[a-fA-F0-9]{40}$/),
        name: expect.any(String),
        strategy: expect.stringMatching(/^(concentrated_liquidity|yield_farming|arbitrage|hedge|stable_max|sei_hypergrowth|blue_chip|delta_neutral)$/),
        tokenA: expect.any(String),
        tokenB: expect.any(String),
        fee: expect.any(Number),
        tickSpacing: expect.any(Number),
        tvl: expect.any(Number),
        apy: expect.any(Number),
        chainId: 1328,
        active: expect.any(Boolean),
        performance: expect.objectContaining({
          totalReturn: expect.any(Number),
          sharpeRatio: expect.any(Number),
          maxDrawdown: expect.any(Number),
          winRate: expect.any(Number)
        })
      })
    })
  })

  describe('POST', () => {
    const validVaultData = {
      name: 'Test Vault',
      strategy: 'concentrated_liquidity' as const,
      tokenA: 'SEI',
      tokenB: 'USDC',
      fee: 0.003,
      tickSpacing: 60,
      chainId: 1328
    }

    it('should create a new vault with valid data', async () => {
      const request = new NextRequest('http://localhost:3000/api/vaults', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validVaultData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data).toMatchObject({
        ...validVaultData,
        address: expect.stringMatching(/^0x[a-fA-F0-9]{40}$/),
        tvl: 0,
        apy: 0,
        active: true,
        createdAt: expect.any(String)
      })
    })

    it('should reject vault with invalid chain ID', async () => {
      const invalidData = { ...validVaultData, chainId: 1 }
      const request = new NextRequest('http://localhost:3000/api/vaults', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Invalid request data')
    })

    it('should reject vault with missing required fields', async () => {
      const invalidData = { name: 'Test Vault' }
      const request = new NextRequest('http://localhost:3000/api/vaults', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.details).toBeDefined()
    })

    it('should reject vault with invalid strategy', async () => {
      const invalidData = { ...validVaultData, strategy: 'invalid_strategy' }
      const request = new NextRequest('http://localhost:3000/api/vaults', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })
  })
})
