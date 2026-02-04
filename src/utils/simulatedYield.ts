/**
 * Simulated Yield Generation for Testnet Demo
 *
 * This utility generates realistic-looking yield accumulation for demonstration purposes.
 * The yield is calculated based on:
 * - Deposit amount
 * - Time since deposit
 * - APY (with realistic daily fluctuations)
 * - Compounding
 *
 * NOTE: This is for DEMO/TESTNET purposes only. Real yield will be tracked on-chain.
 */

export interface SimulatedYieldResult {
  totalYield: number;           // Total yield accumulated (in token units)
  totalYieldUSD: number;         // Total yield in USD
  dailyYield: number;            // Estimated daily yield
  effectiveAPY: number;          // Actual APY with compounding
  daysSinceDeposit: number;      // Days position has been active
  lastYieldTimestamp: number;    // Last time yield was calculated
  isSimulated: true;             // Flag indicating this is simulated
}

/**
 * Calculate simulated yield for a position
 * Uses realistic compounding and daily fluctuations
 */
export function calculateSimulatedYield(
  depositAmount: number,          // Amount deposited (in token units)
  depositTimestamp: number,       // Unix timestamp of deposit
  baseAPY: number,                // Base APY (e.g., 0.15 for 15%)
  currentTimestamp: number = Date.now()
): SimulatedYieldResult {
  // Calculate days since deposit
  const millisecondsSinceDeposit = currentTimestamp - depositTimestamp;
  const daysSinceDeposit = Math.max(0, millisecondsSinceDeposit / (1000 * 60 * 60 * 24));

  // If just deposited, return zero yield
  if (daysSinceDeposit < 0.001) {
    return {
      totalYield: 0,
      totalYieldUSD: 0,
      dailyYield: 0,
      effectiveAPY: baseAPY,
      daysSinceDeposit: 0,
      lastYieldTimestamp: currentTimestamp,
      isSimulated: true,
    };
  }

  // Add realistic daily fluctuation (±5% of base APY)
  // Use deposit timestamp as seed for consistent but varying results
  const seed = depositTimestamp % 1000;
  const fluctuation = Math.sin(seed + daysSinceDeposit) * 0.05;
  const effectiveAPY = baseAPY * (1 + fluctuation);

  // Calculate daily rate with compounding
  const dailyRate = Math.pow(1 + effectiveAPY, 1/365) - 1;

  // Calculate accumulated value with compounding
  const accumulatedValue = depositAmount * Math.pow(1 + dailyRate, daysSinceDeposit);
  const totalYield = accumulatedValue - depositAmount;

  // Calculate daily yield (what would be earned today)
  const dailyYield = (depositAmount + totalYield) * dailyRate;

  return {
    totalYield,
    totalYieldUSD: totalYield, // Caller should convert using token price
    dailyYield,
    effectiveAPY,
    daysSinceDeposit,
    lastYieldTimestamp: currentTimestamp,
    isSimulated: true,
  };
}

/**
 * Calculate portfolio-wide simulated yield
 */
export function calculatePortfolioSimulatedYield(
  positions: Array<{
    depositAmount: number;
    depositTimestamp: number;
    apy: number;
    tokenSymbol: string;
  }>,
  tokenPrices: Record<string, number>
): {
  totalYieldUSD: number;
  dailyYieldUSD: number;
  avgEffectiveAPY: number;
  positions: Array<SimulatedYieldResult & { tokenSymbol: string }>;
} {
  const now = Date.now();
  let totalYieldUSD = 0;
  let dailyYieldUSD = 0;
  let weightedAPYSum = 0;
  let totalValueUSD = 0;

  const positionYields = positions.map(pos => {
    const yieldData = calculateSimulatedYield(
      pos.depositAmount,
      pos.depositTimestamp,
      pos.apy / 100, // Convert percentage to decimal
      now
    );

    // Convert to USD using token price
    const tokenPrice = tokenPrices[pos.tokenSymbol] || 1;
    const yieldUSD = yieldData.totalYield * tokenPrice;
    const dailyYieldUSD_pos = yieldData.dailyYield * tokenPrice;
    const posValueUSD = pos.depositAmount * tokenPrice;

    totalYieldUSD += yieldUSD;
    dailyYieldUSD += dailyYieldUSD_pos;
    weightedAPYSum += yieldData.effectiveAPY * posValueUSD;
    totalValueUSD += posValueUSD;

    return {
      ...yieldData,
      tokenSymbol: pos.tokenSymbol,
      totalYieldUSD: yieldUSD,
    };
  });

  const avgEffectiveAPY = totalValueUSD > 0 ? weightedAPYSum / totalValueUSD : 0;

  return {
    totalYieldUSD,
    dailyYieldUSD,
    avgEffectiveAPY,
    positions: positionYields,
  };
}

/**
 * Format yield for display with appropriate precision
 */
export function formatYield(
  yieldAmount: number,
  tokenSymbol: string,
  showUSD: boolean = false
): string {
  const decimals = ['USDC', 'USDT', 'ATOM'].includes(tokenSymbol) ? 2 : 4;

  if (showUSD) {
    return `$${yieldAmount.toFixed(2)}`;
  }

  if (yieldAmount < 0.0001) {
    return `< 0.0001 ${tokenSymbol}`;
  }

  return `${yieldAmount.toFixed(decimals)} ${tokenSymbol}`;
}

/**
 * Generate realistic APY variation over time (for charts)
 */
export function generateHistoricalAPY(
  baseAPY: number,
  days: number,
  dataPoints: number = 30
): Array<{ date: Date; apy: number }> {
  const result: Array<{ date: Date; apy: number }> = [];
  const now = Date.now();
  const interval = (days * 24 * 60 * 60 * 1000) / dataPoints;

  for (let i = 0; i < dataPoints; i++) {
    const timestamp = now - (dataPoints - i) * interval;
    const date = new Date(timestamp);

    // Add realistic variation (±10% of base APY)
    const variation = Math.sin((i / dataPoints) * Math.PI * 4) * 0.1;
    const apy = baseAPY * (1 + variation);

    result.push({ date, apy });
  }

  return result;
}

/**
 * Calculate projected yield for different time periods
 */
export function calculateProjectedYield(
  currentValue: number,
  apy: number,
  periods: number[] = [7, 30, 90, 365] // days
): Array<{ days: number; projectedYield: number; totalValue: number }> {
  return periods.map(days => {
    const dailyRate = Math.pow(1 + apy, 1/365) - 1;
    const totalValue = currentValue * Math.pow(1 + dailyRate, days);
    const projectedYield = totalValue - currentValue;

    return {
      days,
      projectedYield,
      totalValue,
    };
  });
}

/**
 * Helper to check if yield calculation is recent (within last hour)
 */
export function isYieldFresh(lastCalculationTimestamp: number): boolean {
  const oneHour = 60 * 60 * 1000;
  return Date.now() - lastCalculationTimestamp < oneHour;
}
