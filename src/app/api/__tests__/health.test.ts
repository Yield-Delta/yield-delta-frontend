import { GET } from '../health/route'

// Mock NextResponse.json to work in test environment
jest.mock('next/server', () => {
  const originalModule = jest.requireActual('next/server');
  return {
    ...originalModule,
    NextResponse: {
      ...originalModule.NextResponse,
      json: jest.fn((data) => {
        return {
          ...originalModule.NextResponse.json(data),
          async json() {
            return data;
          }
        };
      })
    }
  };
});

describe('/api/health', () => {
  describe('GET', () => {
    it('should return healthy status', async () => {
      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toMatchObject({
        status: 'healthy',
        version: '1.0.0',
        chain: 'SEI',
        chainId: 1328,
        services: expect.any(Object)
      })
      expect(data.timestamp).toBeDefined()
      expect(data.services.api).toBe('operational')
      expect(data.services.ai_engine).toBe('operational')
      expect(data.services.blockchain).toBe('operational')
    })

    it('should have valid timestamp format', async () => {
      const response = await GET()
      const data = await response.json()

      const timestamp = new Date(data.timestamp)
      expect(timestamp.toISOString()).toBe(data.timestamp)
    })

    it('should include correct SEI chain configuration', async () => {
      const response = await GET()
      const data = await response.json()

      expect(data.chainId).toBe(1328)
      expect(data.chain).toBe('SEI')
    })
  })
})
