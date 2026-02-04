import {
  validateSeiAddress,
  validateChainId,
  estimateSeiGasCost,
  formatTokenAmount,
  calculateAPR,
  tickToPrice,
  priceToTick,
  alignToTickSpacing,
  parsePagination,
  generateCacheKey
} from '@/lib/api-utils'

describe('API Utilities', () => {
  describe('validateSeiAddress', () => {
    it('should validate correct SEI addresses', () => {
      const validAddresses = [
        '0x1234567890123456789012345678901234567890',
        '0xabcdefABCDEF1234567890123456789012345678',
        '0x0000000000000000000000000000000000000000'
      ]

      validAddresses.forEach(address => {
        expect(validateSeiAddress(address)).toBe(true)
      })
    })

    it('should reject invalid SEI addresses', () => {
      const invalidAddresses = [
        '0x123', // Too short
        '1234567890123456789012345678901234567890', // Missing 0x
        '0x12345678901234567890123456789012345678901', // Too long
        '0xGHIJ567890123456789012345678901234567890', // Invalid characters
        '', // Empty
        null,
        undefined
      ]

      invalidAddresses.forEach(address => {
        expect(validateSeiAddress(address as string)).toBe(false)
      })
    })
  })

  describe('validateChainId', () => {
    it('should validate SEI chain ID', () => {
      expect(validateChainId(713715)).toBe(true)
    })

    it('should reject other chain IDs', () => {
      const invalidChainIds = [1, 137, 56, 43114, 250, 713714, 713716]
      
      invalidChainIds.forEach(chainId => {
        expect(validateChainId(chainId)).toBe(false)
      })
    })
  })

  describe('estimateSeiGasCost', () => {
    it('should return correct gas estimates for different operations', () => {
      const operations = {
        'swap': 0.001,
        'add_liquidity': 0.002,
        'remove_liquidity': 0.002,
        'rebalance': 0.003,
        'claim_fees': 0.001,
        'vault_creation': 0.005
      }

      Object.entries(operations).forEach(([operation, expectedCost]) => {
        expect(estimateSeiGasCost(operation)).toBe(expectedCost)
      })
    })

    it('should return default gas cost for unknown operations', () => {
      expect(estimateSeiGasCost('unknown_operation')).toBe(0.002)
    })
  })

  describe('formatTokenAmount', () => {
    it('should format token amounts correctly', () => {
      expect(formatTokenAmount('1000000000000000000', 18)).toBe('1.000000')
      expect(formatTokenAmount('500000000000000000', 18)).toBe('0.500000')
      expect(formatTokenAmount('1000000', 6)).toBe('1.000000')
      expect(formatTokenAmount(1000000000000000000, 18)).toBe('1.000000')
    })

    it('should handle different decimal places', () => {
      expect(formatTokenAmount('1000000', 6)).toBe('1.000000')
      expect(formatTokenAmount('1000000000', 9)).toBe('1.000000')
      expect(formatTokenAmount('100000000000000', 14)).toBe('1.000000')
    })
  })

  describe('calculateAPR', () => {
    it('should calculate APR correctly', () => {
      const feesCollected = 1000 // $1000 in fees
      const timeframeDays = 30 // Over 30 days
      const tvl = 100000 // $100,000 TVL

      const apr = calculateAPR(feesCollected, timeframeDays, tvl)
      const expectedAPR = (1000 / 30) * 365 / 100000 // Should be ~0.1217
      
      expect(apr).toBeCloseTo(expectedAPR, 4)
    })

    it('should return 0 for invalid inputs', () => {
      expect(calculateAPR(1000, 0, 100000)).toBe(0)
      expect(calculateAPR(1000, 30, 0)).toBe(0)
      expect(calculateAPR(0, 30, 100000)).toBe(0)
    })
  })

  describe('tickToPrice', () => {
    it('should convert ticks to prices correctly', () => {
      expect(tickToPrice(0)).toBeCloseTo(1, 6)
      expect(tickToPrice(6931)).toBeCloseTo(2, 1) // Approximately 2
      expect(tickToPrice(-6931)).toBeCloseTo(0.5, 1) // Approximately 0.5
    })

    it('should handle large tick values', () => {
      const largePositiveTick = 887220
      const largeNegativeTick = -887220
      
      expect(tickToPrice(largePositiveTick)).toBeGreaterThan(1)
      expect(tickToPrice(largeNegativeTick)).toBeLessThan(1)
      expect(tickToPrice(largeNegativeTick)).toBeGreaterThan(0)
    })
  })

  describe('priceToTick', () => {
    it('should convert prices to ticks correctly', () => {
      expect(priceToTick(1)).toBeCloseTo(0, 0)
      expect(priceToTick(2)).toBeCloseTo(6932, 0)
      expect(priceToTick(0.5)).toBeCloseTo(-6932, 0)
    })

    it('should be inverse of tickToPrice', () => {
      const testTicks = [0, 1000, -1000, 50000, -50000]
      
      testTicks.forEach(tick => {
        const price = tickToPrice(tick)
        const convertedTick = priceToTick(price)
        expect(convertedTick).toBeCloseTo(tick, 0)
      })
    })
  })

  describe('alignToTickSpacing', () => {
    it('should align ticks to spacing correctly', () => {
      expect(alignToTickSpacing(100, 10)).toBe(100)
      expect(alignToTickSpacing(105, 10)).toBe(100)
      expect(alignToTickSpacing(195, 10)).toBe(190)
      expect(alignToTickSpacing(-105, 10)).toBe(-110)
    })

    it('should handle SEI standard tick spacing', () => {
      const seiTickSpacing = 60
      expect(alignToTickSpacing(100, seiTickSpacing)).toBe(60)
      expect(alignToTickSpacing(150, seiTickSpacing)).toBe(120)
      expect(alignToTickSpacing(-100, seiTickSpacing)).toBe(-120)
    })
  })

  describe('parsePagination', () => {
    it('should parse pagination parameters correctly', () => {
      const searchParams = new URLSearchParams('page=2&limit=25')
      const pagination = parsePagination(searchParams)

      expect(pagination).toEqual({
        page: 2,
        limit: 25,
        offset: 25
      })
    })

    it('should use default values for missing parameters', () => {
      const searchParams = new URLSearchParams('')
      const pagination = parsePagination(searchParams)

      expect(pagination).toEqual({
        page: 1,
        limit: 50,
        offset: 0
      })
    })

    it('should enforce minimum and maximum limits', () => {
      const searchParams = new URLSearchParams('limit=0')
      const pagination = parsePagination(searchParams)
      expect(pagination.limit).toBe(1)

      const searchParams2 = new URLSearchParams('limit=2000')
      const pagination2 = parsePagination(searchParams2)
      expect(pagination2.limit).toBe(1000)
    })

    it('should enforce minimum page number', () => {
      const searchParams = new URLSearchParams('page=0')
      const pagination = parsePagination(searchParams)
      expect(pagination.page).toBe(1)

      const searchParams2 = new URLSearchParams('page=-5')
      const pagination2 = parsePagination(searchParams2)
      expect(pagination2.page).toBe(1)
    })
  })

  describe('generateCacheKey', () => {
    it('should generate consistent cache keys', () => {
      const params1 = { symbol: 'SEI-USDC', timeframe: '1h' }
      const params2 = { timeframe: '1h', symbol: 'SEI-USDC' }

      const key1 = generateCacheKey('market', params1)
      const key2 = generateCacheKey('market', params2)

      expect(key1).toBe(key2)
      expect(key1).toBe('market:symbol=SEI-USDC&timeframe=1h')
    })

    it('should handle different parameter types', () => {
      const params = { 
        string: 'value',
        number: 123,
        boolean: true
      }

      const key = generateCacheKey('test', params)
      expect(key).toBe('test:boolean=true&number=123&string=value')
    })

    it('should handle empty parameters', () => {
      const key = generateCacheKey('empty', {})
      expect(key).toBe('empty:')
    })
  })
})
