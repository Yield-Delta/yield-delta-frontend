'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, BarChart3, Activity, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { OHLCData } from './EnhancedCandlestickChart';

interface PriceStatsGridProps {
  ohlcData: OHLCData[];
  symbol?: string;
  className?: string;
}

interface StatCard {
  label: string;
  value: string;
  subValue?: string;
  icon: React.ReactNode;
  color: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

export default function PriceStatsGrid({
  ohlcData,
  symbol = '',
  className = '',
}: PriceStatsGridProps) {
  const [animatedValues, setAnimatedValues] = useState<Record<string, number>>({});

  // Calculate stats
  const stats = useMemo(() => {
    if (ohlcData.length < 2) {
      return {
        currentPrice: 0,
        priceChange: 0,
        priceChangePercent: 0,
        high24h: 0,
        low24h: 0,
        volume24h: 0,
        avgVolume: 0,
        support: 0,
        resistance: 0,
        openPrice: 0,
      };
    }

    const latest = ohlcData[ohlcData.length - 1];
    const prev = ohlcData[ohlcData.length - 2];

    const last24 = ohlcData.slice(-24);
    const high24h = Math.max(...last24.map(c => c.high));
    const low24h = Math.min(...last24.map(c => c.low));
    const volume24h = last24.reduce((sum, c) => sum + (c.volume || 0), 0);
    const avgVolume = ohlcData.slice(-20).reduce((sum, c) => sum + (c.volume || 0), 0) / 20;

    // Support/Resistance using recent highs/lows
    const lookback = Math.min(20, ohlcData.length);
    const recentHighs = ohlcData.slice(-lookback).map(c => c.high);
    const recentLows = ohlcData.slice(-lookback).map(c => c.low);

    const resistance = Math.max(...recentHighs);
    const support = Math.min(...recentLows);

    return {
      currentPrice: latest.close,
      priceChange: latest.close - prev.close,
      priceChangePercent: ((latest.close - prev.close) / prev.close) * 100,
      high24h,
      low24h,
      volume24h,
      avgVolume,
      support,
      resistance,
      openPrice: latest.open,
    };
  }, [ohlcData]);

  // Animate values
  useEffect(() => {
    Object.entries(stats).forEach(([key, value]) => {
      if (typeof value === 'number') {
        setAnimatedValues(prev => ({ ...prev, [key]: value }));
      }
    });
  }, [stats]);

  // Format functions
  const formatPrice = (price: number) => {
    if (price >= 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (price >= 1) return price.toFixed(4);
    return price.toFixed(6);
  };

  const formatVolume = (vol: number) => {
    if (vol >= 1e9) return `$${(vol / 1e9).toFixed(2)}B`;
    if (vol >= 1e6) return `$${(vol / 1e6).toFixed(2)}M`;
    if (vol >= 1e3) return `$${(vol / 1e3).toFixed(2)}K`;
    return `$${vol.toFixed(2)}`;
  };

  const formatPercent = (val: number) => {
    const sign = val >= 0 ? '+' : '';
    return `${sign}${val.toFixed(2)}%`;
  };

  const statCards: StatCard[] = [
    {
      label: '24h High',
      value: formatPrice(stats.high24h),
      icon: <TrendingUp className="w-4 h-4" />,
      color: '#10b981',
      trend: 'up',
    },
    {
      label: '24h Low',
      value: formatPrice(stats.low24h),
      icon: <TrendingDown className="w-4 h-4" />,
      color: '#ef4444',
      trend: 'down',
    },
    {
      label: '24h Volume',
      value: formatVolume(stats.volume24h),
      subValue: `Avg: ${formatVolume(stats.avgVolume)}`,
      icon: <BarChart3 className="w-4 h-4" />,
      color: '#6366f1',
      trend: stats.volume24h > stats.avgVolume ? 'up' : 'down',
      trendValue: formatPercent(((stats.volume24h - stats.avgVolume) / stats.avgVolume) * 100),
    },
    {
      label: 'Support',
      value: formatPrice(stats.support),
      icon: <ArrowDownRight className="w-4 h-4" />,
      color: '#10b981',
    },
    {
      label: 'Resistance',
      value: formatPrice(stats.resistance),
      icon: <ArrowUpRight className="w-4 h-4" />,
      color: '#f59e0b',
    },
    {
      label: 'Open',
      value: formatPrice(stats.openPrice),
      icon: <DollarSign className="w-4 h-4" />,
      color: '#8b5cf6',
    },
  ];

  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 ${className}`}>
      {statCards.map((stat, index) => (
        <motion.div
          key={stat.label}
          className="relative rounded-xl p-3 overflow-hidden group"
          style={{
            background: 'rgba(10, 10, 15, 0.6)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: index * 0.05 }}
          whileHover={{
            scale: 1.02,
            borderColor: `${stat.color}40`,
          }}
        >
          {/* Glow effect */}
          <div
            className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{
              background: `radial-gradient(circle at center, ${stat.color}10 0%, transparent 70%)`,
            }}
          />

          {/* Content */}
          <div className="relative">
            {/* Icon and label */}
            <div className="flex items-center gap-2 mb-2">
              <div
                className="p-1 rounded-md"
                style={{ background: `${stat.color}20`, color: stat.color }}
              >
                {stat.icon}
              </div>
              <span className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">
                {stat.label}
              </span>
            </div>

            {/* Value */}
            <motion.div
              className="text-lg font-bold font-mono text-white"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              key={stat.value}
            >
              {stat.value}
            </motion.div>

            {/* Sub value or trend */}
            {(stat.subValue || stat.trendValue) && (
              <div className="flex items-center gap-1 mt-1">
                {stat.trendValue && (
                  <span
                    className={`text-[10px] font-mono font-medium ${
                      stat.trend === 'up' ? 'text-green-400' :
                      stat.trend === 'down' ? 'text-red-400' :
                      'text-gray-400'
                    }`}
                  >
                    {stat.trendValue}
                  </span>
                )}
                {stat.subValue && (
                  <span className="text-[10px] text-gray-500 font-mono">
                    {stat.subValue}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Decorative corner */}
          <div
            className="absolute top-0 right-0 w-12 h-12 rounded-bl-full opacity-20"
            style={{
              background: `linear-gradient(135deg, ${stat.color} 0%, transparent 100%)`,
            }}
          />
        </motion.div>
      ))}
    </div>
  );
}

// Mini sparkline component for inline charts
interface SparklineProps {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}

export function Sparkline({ data, color = '#00f5d4', width = 60, height = 20 }: SparklineProps) {
  const path = useMemo(() => {
    if (data.length < 2) return '';

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const points = data.map((value, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    });

    return `M${points.join(' L')}`;
  }, [data, width, height]);

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`sparkline-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Fill */}
      <path
        d={path + ` L${width},${height} L0,${height} Z`}
        fill={`url(#sparkline-${color.replace('#', '')})`}
      />
      {/* Line */}
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}