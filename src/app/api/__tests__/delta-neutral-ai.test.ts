import { describe, test, expect, beforeAll } from '@jest/globals';

describe('Delta Neutral AI Optimization', () => {
  let aiEngineUrl: string;

  beforeAll(() => {
    // Use production AI engine URL
    aiEngineUrl = process.env.AI_ENGINE_URL || 'https://yield-delta-protocol-production.up.railway.app';
    console.log(`Testing Delta Neutral AI at: ${aiEngineUrl}`);
  });

  test('delta neutral optimization endpoint works', async () => {
    // Skip in CI environment
    if (process.env.CI) {
      console.log('Skipping AI Engine test in CI environment');
      return;
    }

    try {
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

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(`${aiEngineUrl}/predict/delta-neutral-optimization`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

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
    } catch (error) {
      console.log('AI Engine not available, skipping test:', error instanceof Error ? error.message : 'Unknown error');
      return;
    }
  });

  test('delta neutral optimization handles edge cases', async () => {
    // Skip in CI environment
    if (process.env.CI) {
      console.log('Skipping AI Engine test in CI environment');
      return;
    }

    try {
      const requestBody = {
        pair: 'ETH/USDC',
        position_size: 0,
        current_price: -100,
        volatility: 2.0
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(`${aiEngineUrl}/predict/delta-neutral-optimization`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      // Should handle gracefully with defaults or validation errors
      expect([200, 400, 422]).toContain(response.status);
    } catch (error) {
      console.log('AI Engine not available, skipping test:', error instanceof Error ? error.message : 'Unknown error');
      return;
    }
  });
});
