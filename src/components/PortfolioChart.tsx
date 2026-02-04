"use client"

import React, { useState, useMemo } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, Calendar } from 'lucide-react';
import { TokenPrices } from '@/hooks/useTokenPrices';

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
      <div className="bg-slate-800/95 backdrop-blur-sm border border-slate-700 rounded-lg p-4 shadow-xl">
        <p className="text-gray-400 text-sm mb-2">{data.date}</p>
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-4">
            <span className="text-blue-400 text-sm">Portfolio Value:</span>
            <span className="text-white font-semibold">${data.portfolioValue.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-gray-400 text-sm">Deposited:</span>
            <span className="text-white">${data.totalDeposited.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-green-400 text-sm">Yield Earned:</span>
            <span className="text-green-400 font-semibold">${data.yieldEarned.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between gap-4 pt-1 border-t border-slate-700">
            <span className="text-purple-400 text-sm">P&L:</span>
            <span className={`font-semibold ${data.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {data.pnl >= 0 ? '+' : ''}${data.pnl.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  if (!chartData.length) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8">
        <div className="text-center text-gray-400">
          <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No data available yet. Make a deposit to see your portfolio performance over time.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            <h3 className="text-xl font-bold text-white">Portfolio Performance</h3>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-white">${stats.current.toFixed(2)}</span>
            <span className={`text-lg font-semibold ${stats.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {stats.changePercent >= 0 ? '+' : ''}{stats.changePercent.toFixed(2)}%
            </span>
          </div>
          <p className="text-sm text-gray-400 mt-1">
            {stats.change >= 0 ? '+' : ''}${stats.change.toFixed(2)} USD
          </p>
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          {/* Time Range Selector */}
          <div className="flex gap-1 bg-slate-900/50 rounded-lg p-1">
            {(['7D', '1M', '3M', '1Y', 'ALL'] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  timeRange === range
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          {/* Chart Type Selector */}
          <div className="flex gap-1 bg-slate-900/50 rounded-lg p-1">
            <button
              onClick={() => setChartType('area')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                chartType === 'area'
                  ? 'bg-purple-500 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Area
            </button>
            <button
              onClick={() => setChartType('line')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                chartType === 'line'
                  ? 'bg-purple-500 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Line
            </button>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'area' ? (
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorDeposited" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6b7280" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#6b7280" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
              <XAxis
                dataKey="date"
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 12 }}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                tickFormatter={(value) => `$${value.toFixed(0)}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="circle"
              />
              <Area
                type="monotone"
                dataKey="totalDeposited"
                stroke="#6b7280"
                strokeWidth={2}
                fill="url(#colorDeposited)"
                name="Deposited"
              />
              <Area
                type="monotone"
                dataKey="portfolioValue"
                stroke="#3b82f6"
                strokeWidth={3}
                fill="url(#colorValue)"
                name="Portfolio Value"
              />
            </AreaChart>
          ) : (
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
              <XAxis
                dataKey="date"
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 12 }}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                tickFormatter={(value) => `$${value.toFixed(0)}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="circle"
              />
              <Line
                type="monotone"
                dataKey="totalDeposited"
                stroke="#6b7280"
                strokeWidth={2}
                dot={false}
                name="Deposited"
              />
              <Line
                type="monotone"
                dataKey="portfolioValue"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={false}
                name="Portfolio Value"
              />
              <Line
                type="monotone"
                dataKey="yieldEarned"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
                name="Yield Earned"
                strokeDasharray="5 5"
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Footer Note */}
      <div className="mt-4 pt-4 border-t border-slate-700/50">
        <p className="text-xs text-gray-500 text-center">
          <Calendar className="w-3 h-3 inline mr-1" />
          Chart shows simulated yield for testnet demonstration purposes
        </p>
      </div>
    </div>
  );
};

export default PortfolioChart;
