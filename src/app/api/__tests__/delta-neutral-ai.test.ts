import { describe, test, expect, beforeAll } from '@jest/globals';

describe('Delta Neutral AI Optimization', () => {
  let aiEngineUrl: string;

  beforeAll(() => {
    aiEngineUrl = process.env.AI_ENGINE_URL || 'http://localhost:8000';
  });

  test('delta neutral optimization endpoint works', async () => {
    const requestBody = {
      pair: 'ETH/USDC',
      position_size: 10000,
      current_price: 2500,
      volatility: 0.25,
      market_conditions: {
        funding_rate: 0.01,
        liquidity_depth: 5000000
      }
    };

    const response = await fetch(`${aiEngineUrl}/predict/delta-neutral-optimization`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.hedge_ratio).toBeGreaterThan(0.8);
    expect(data.hedge_ratio).toBeLessThan(1.0);
    expect(data.expected_neutrality).toBeGreaterThan(0.9);
    expect(data.expected_apr).toBeGreaterThan(0.1);
    expect(data.lower_tick).toBeLessThan(data.upper_tick);
    expect(data.revenue_breakdown).toHaveProperty('lp_fees');
    expect(data.revenue_breakdown).toHaveProperty('funding_rates');
    expect(data.revenue_breakdown).toHaveProperty('volatility_capture');
  });

  test('delta neutral optimization handles edge cases', async () => {
    const requestBody = {
      pair: 'ETH/USDC',
      position_size: 0,
      current_price: -100,
      volatility: 2.0
    };

    const response = await fetch(`${aiEngineUrl}/predict/delta-neutral-optimization`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    // Should handle gracefully with defaults or validation errors
    expect([200, 400, 422]).toContain(response.status);
  });
});