"use client"

import React, { useState, useMemo } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, Calendar } from 'lucide-react';
import { TokenPrices } from '@/hooks/useTokenPrices';
import styles from './PortfolioChart.module.css';

interface ChartDataPoint {
  timestamp: number;
  date: string;
  portfolioValue: number;
  totalDeposited: number;
  yieldEarned: number;
  pnl: number;
}

interface PortfolioChartProps {
  vaultPositions: Array<{
    address: string;
    totalDeposited: string;
    depositTime: string;
    apy: number;
    shareValue: string;
  }>;
  tokenPrices: TokenPrices | Record<string, never>;
  vaults?: Array<{
    address: string;
    tokenA: string;
    apy: number;
  }>;
}

type TimeRange = '7D' | '1M' | '3M' | '1Y' | 'ALL';

const PortfolioChart: React.FC<PortfolioChartProps> = ({ vaultPositions, tokenPrices, vaults }) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('1M');
  const [chartType, setChartType] = useState<'area' | 'line'>('area');

  // Generate historical data points based on vault positions
  const chartData = useMemo(() => {
    if (!vaultPositions.length || !tokenPrices || !vaults) return [];

    // Determine the time range in days
    const daysMap: Record<TimeRange, number> = {
      '7D': 7,
      '1M': 30,
      '3M': 90,
      '1Y': 365,
      'ALL': 365, // Default to 1 year for ALL
    };

    const days = daysMap[timeRange];
    const now = Date.now();
    const startTime = now - (days * 24 * 60 * 60 * 1000);

    // Find earliest deposit time
    const earliestDeposit = Math.min(...vaultPositions.map(p => parseInt(p.depositTime) * 1000));
    const actualStartTime = Math.max(startTime, earliestDeposit);

    // Generate data points (one per day)
    const dataPoints: ChartDataPoint[] = [];
    const numPoints = Math.min(days, Math.ceil((now - actualStartTime) / (24 * 60 * 60 * 1000)));

    for (let i = 0; i <= numPoints; i++) {
      const timestamp = actualStartTime + (i * (now - actualStartTime) / numPoints);
      let totalValue = 0;
      let totalDeposited = 0;
      let totalYield = 0;

      vaultPositions.forEach(position => {
        const vault = vaults.find(v => v.address === position.address);
        if (!vault) return;

        const depositTimestamp = parseInt(position.depositTime) * 1000;

        // Only include this position if it existed at this timestamp
        if (timestamp >= depositTimestamp) {
          // Import token utilities
          const getTokenInfo = (address: string) => {
            const tokens = {
              'sei': { symbol: 'SEI', decimals: 18 },
              'usdc': { symbol: 'USDC', decimals: 6 },
              'atom': { symbol: 'ATOM', decimals: 6 },
            };
            const key = Object.keys(tokens).find(k => address.toLowerCase().includes(k));
            return key ? tokens[key as keyof typeof tokens] : { symbol: 'SEI', decimals: 18 };
          };

          const tokenInfo = getTokenInfo(vault.tokenA);
          const tokenSymbol = tokenInfo.symbol;
          const tokenPrice = tokenPrices[tokenSymbol as keyof typeof tokenPrices] || 0;

          // Calculate deposited amount in tokens
          const deposited = parseFloat(position.totalDeposited) / Math.pow(10, tokenInfo.decimals);

          // Calculate days since deposit at this timestamp
          const daysSinceDeposit = (timestamp - depositTimestamp) / (1000 * 60 * 60 * 24);

          // Calculate simulated yield
          const dailyRate = vault.apy / 365;
          const yieldAmount = deposited * dailyRate * daysSinceDeposit;
          const currentValue = deposited + yieldAmount;

          // Convert to USD
          totalValue += currentValue * tokenPrice;
          totalDeposited += deposited * tokenPrice;
          totalYield += yieldAmount * tokenPrice;
        }
      });

      const pnl = totalValue - totalDeposited;

      dataPoints.push({
        timestamp,
        date: new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        portfolioValue: parseFloat(totalValue.toFixed(2)),
        totalDeposited: parseFloat(totalDeposited.toFixed(2)),
        yieldEarned: parseFloat(totalYield.toFixed(2)),
        pnl: parseFloat(pnl.toFixed(2)),
      });
    }

    return dataPoints;
  }, [vaultPositions, tokenPrices, vaults, timeRange]);

  const stats = useMemo(() => {
    if (!chartData.length) return { change: 0, changePercent: 0, current: 0 };

    const first = chartData[0];
    const last = chartData[chartData.length - 1];
    const change = last.portfolioValue - first.portfolioValue;
    const changePercent = first.portfolioValue > 0 ? (change / first.portfolioValue) * 100 : 0;

    return {
      change,
      changePercent,
      current: last.portfolioValue,
    };
  }, [chartData]);

  interface TooltipProps {
    active?: boolean;
    payload?: Array<{
      payload: ChartDataPoint;
    }>;
  }

  const CustomTooltip = ({ active, payload }: TooltipProps) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;

    return (
      <div className={styles.tooltip}>
        <p className={styles.tooltipDate}>{data.date}</p>
        <div className={styles.tooltipRows}>
          <div className={styles.tooltipRow}>
            <span className={styles.tooltipLabel}>Portfolio Value</span>
            <span className={styles.tooltipValue}>${data.portfolioValue.toFixed(2)}</span>
          </div>
          <div className={styles.tooltipRow}>
            <span className={styles.tooltipLabel}>Deposited</span>
            <span className={styles.tooltipValue}>${data.totalDeposited.toFixed(2)}</span>
          </div>
          <div className={styles.tooltipRow}>
            <span className={styles.tooltipLabel}>Yield Earned</span>
            <span className={`${styles.tooltipValue} ${styles.tooltipPositive}`}>${data.yieldEarned.toFixed(2)}</span>
          </div>
          <div className={`${styles.tooltipRow} ${styles.tooltipDivider}`}>
            <span className={styles.tooltipLabel}>P&L</span>
            <span className={`${styles.tooltipValue} ${data.pnl >= 0 ? styles.tooltipPositive : ''}`}>
              {data.pnl >= 0 ? '+' : ''}${data.pnl.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  if (!chartData.length) {
    return (
      <div className={`${styles.card} ${styles.emptyCard}`}>
        <div className={styles.emptyState}>
          <TrendingUp className={styles.emptyIcon} />
          <p className={styles.emptyText}>No data available yet. Make a deposit to see your portfolio performance over time.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <div className={styles.content}>
      <div className={styles.header}>
        <div>
          <div className={styles.eyebrow}>
            <TrendingUp />
            Live Position
          </div>
          <h3 className={styles.title}>Portfolio Performance</h3>
          <div className={styles.valueRow}>
            <span className={styles.currentValue}>${stats.current.toFixed(2)}</span>
            <span className={styles.changePill} data-negative={stats.changePercent < 0}>
              {stats.changePercent >= 0 ? '+' : ''}{stats.changePercent.toFixed(2)}%
            </span>
          </div>
          <p className={styles.changeText}>
            {stats.change >= 0 ? '+' : ''}${stats.change.toFixed(2)} USD
          </p>
        </div>

        <div className={styles.controls}>
          <div className={styles.segmented}>
            {(['7D', '1M', '3M', '1Y', 'ALL'] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`${styles.segment} ${timeRange === range ? styles.segmentActive : ''}`}
              >
                {range}
              </button>
            ))}
          </div>

          <div className={styles.segmented}>
            <button
              onClick={() => setChartType('area')}
              className={`${styles.segment} ${chartType === 'area' ? styles.segmentActive : ''}`}
            >
              Area
            </button>
            <button
              onClick={() => setChartType('line')}
              className={`${styles.segment} ${chartType === 'line' ? styles.segmentActive : ''}`}
            >
              Line
            </button>
          </div>
        </div>
      </div>

      <div className={styles.chartShell}>
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'area' ? (
            <AreaChart data={chartData} margin={{ top: 16, right: 18, left: 2, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#68f1dd" stopOpacity={0.34}/>
                  <stop offset="95%" stopColor="#68f1dd" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorDeposited" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7a8498" stopOpacity={0.22}/>
                  <stop offset="95%" stopColor="#7a8498" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 12" stroke="rgba(255,255,255,0.14)" vertical={false} />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'rgba(255,255,255,0.48)', fontSize: 12, fontFamily: 'var(--font-mono)' }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'rgba(255,255,255,0.48)', fontSize: 12, fontFamily: 'var(--font-mono)' }}
                tickFormatter={(value) => `$${value.toFixed(0)}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: '18px', color: 'rgba(255,255,255,0.58)', fontSize: 12, fontFamily: 'var(--font-mono)' }}
                iconType="circle"
              />
              <Area
                type="monotone"
                dataKey="totalDeposited"
                stroke="#7a8498"
                strokeWidth={2}
                fill="url(#colorDeposited)"
                name="Deposited"
              />
              <Area
                type="monotone"
                dataKey="portfolioValue"
                stroke="#68f1dd"
                strokeWidth={3}
                fill="url(#colorValue)"
                name="Portfolio Value"
              />
            </AreaChart>
          ) : (
            <LineChart data={chartData} margin={{ top: 16, right: 18, left: 2, bottom: 0 }}>
              <CartesianGrid strokeDasharray="4 12" stroke="rgba(255,255,255,0.14)" vertical={false} />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'rgba(255,255,255,0.48)', fontSize: 12, fontFamily: 'var(--font-mono)' }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'rgba(255,255,255,0.48)', fontSize: 12, fontFamily: 'var(--font-mono)' }}
                tickFormatter={(value) => `$${value.toFixed(0)}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: '18px', color: 'rgba(255,255,255,0.58)', fontSize: 12, fontFamily: 'var(--font-mono)' }}
                iconType="circle"
              />
              <Line
                type="monotone"
                dataKey="totalDeposited"
                stroke="#7a8498"
                strokeWidth={2}
                dot={false}
                name="Deposited"
              />
              <Line
                type="monotone"
                dataKey="portfolioValue"
                stroke="#68f1dd"
                strokeWidth={3}
                dot={false}
                name="Portfolio Value"
              />
              <Line
                type="monotone"
                dataKey="yieldEarned"
                stroke="#57d28f"
                strokeWidth={2}
                dot={false}
                name="Yield Earned"
                strokeDasharray="5 5"
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      <div className={styles.footer}>
        <p className={styles.footerText}>
          <Calendar />
          Chart shows simulated yield for testnet demonstration purposes
        </p>
      </div>
      </div>
    </div>
  );
};

export default PortfolioChart;
