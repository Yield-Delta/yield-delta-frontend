import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';

describe('Python AI Engine Integration', () => {
  let aiEngineUrl: string;

  beforeAll(() => {
    aiEngineUrl = process.env.AI_ENGINE_URL || 'http://localhost:8000';
  });

  test('AI engine health endpoint responds correctly', async () => {
    const response = await fetch(`${aiEngineUrl}/health`);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.status).toBe('healthy');
    expect(data.service).toBe('SEI DLP AI Engine Bridge');
    expect(data.version).toBe('1.0.0');
  });

  test('optimal range prediction endpoint works', async () => {
    const requestBody = {
      vault_address: '0x1234567890123456789012345678901234567890',
      current_price: 1.5,
      volatility: 0.3,
      volume_24h: 1000000,
      liquidity: 500000,
      timeframe: '1d',
      chain_id: 1328
    };

    const response = await fetch(`${aiEngineUrl}/predict/optimal-range`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.lower_tick).toBeDefined();
    expect(data.upper_tick).toBeDefined();
    expect(data.confidence).toBeGreaterThan(0.5);
    expect(data.expected_apr).toBeGreaterThan(0);
    expect(data.lower_tick).toBeLessThan(data.upper_tick);
  });

  test('market prediction endpoint works', async () => {
    const requestBody = {
      symbol: 'ETH',
      historical_data: [
        { close: 2000, volume: 1000000, timestamp: '2024-08-01' },
        { close: 2050, volume: 1100000, timestamp: '2024-08-02' }
      ],
      prediction_horizon: '1h',
      confidence_threshold: 0.7
    };

    const response = await fetch(`${aiEngineUrl}/predict/market`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.prediction).toBeDefined();
    expect(data.confidence).toBeGreaterThan(0);
    expect(data.trend).toMatch(/bullish|bearish|neutral/);
    expect(Array.isArray(data.support_levels)).toBe(true);
    expect(Array.isArray(data.resistance_levels)).toBe(true);
  });

  afterAll(() => {
    // Cleanup any test data or connections if needed
    console.log('AI Engine tests completed');
  });
});