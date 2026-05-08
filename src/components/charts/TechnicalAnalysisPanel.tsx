'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Activity, Target, Zap, Gauge } from 'lucide-react';
import { LineData, Time } from 'lightweight-charts';

interface TechnicalAnalysisPanelProps {
  ohlcData: { time: Time; open: number; high: number; low: number; close: number; volume: number }[];
  rsiData?: LineData<Time>[];
  macdData?: { macd: number; signal: number; histogram: number };
  className?: string;
}

interface AnalysisCard {
  title: string;
  icon: React.ReactNode;
  signals: {
    label: string;
    value: string;
    status: 'bullish' | 'bearish' | 'neutral';
    strength?: number;
  }[];
  overallSignal: 'bullish' | 'bearish' | 'neutral';
}

export default function TechnicalAnalysisPanel({
  ohlcData,
  rsiData,
  macdData,
  className = '',
}: TechnicalAnalysisPanelProps) {
  const [animatedValues, setAnimatedValues] = useState<Record<string, number>>({});

  // Calculate analysis data
  const analysis = useMemo(() => {
    if (ohlcData.length < 2) return null;

    const latestCandle = ohlcData[ohlcData.length - 1];
    const prevCandle = ohlcData[ohlcData.length - 2];

    // Price change
    const priceChange = latestCandle.close - prevCandle.close;
    const priceChangePercent = (priceChange / prevCandle.close) * 100;

    // Calculate SMA
    const sma20 = ohlcData.slice(-20).reduce((sum, c) => sum + c.close, 0) / Math.min(20, ohlcData.length);
    const sma50 = ohlcData.slice(-50).reduce((sum, c) => sum + c.close, 0) / Math.min(50, ohlcData.length);

    // RSI
    const currentRSI = rsiData?.[rsiData.length - 1]?.value ?? 50;

    // Trend
    const aboveSMA20 = latestCandle.close > sma20;
    const aboveSMA50 = latestCandle.close > sma50;

    // High/Low range
    const high24h = Math.max(...ohlcData.slice(-24).map(c => c.high));
    const low24h = Math.min(...ohlcData.slice(-24).map(c => c.low));
    const range24h = ((high24h - low24h) / low24h) * 100;

    // Volume
    const avgVolume = ohlcData.slice(-20).reduce((sum, c) => sum + c.volume, 0) / 20;
    const currentVolume = latestCandle.volume;
    const volumeRatio = currentVolume / avgVolume;

    return {
      priceChange,
      priceChangePercent,
      currentPrice: latestCandle.close,
      sma20,
      sma50,
      currentRSI,
      aboveSMA20,
      aboveSMA50,
      high24h,
      low24h,
      range24h,
      volumeRatio,
      macdData,
    };
  }, [ohlcData, rsiData, macdData]);

  // Animate values on data change
  useEffect(() => {
    if (!analysis) return;

    const newValues: Record<string, number> = {
      rsi: analysis.currentRSI,
      volume: analysis.volumeRatio * 100,
    };

    Object.entries(newValues).forEach(([key, target]) => {
      setAnimatedValues(prev => ({ ...prev, [key]: target }));
    });
  }, [analysis]);

  if (!analysis) {
    return (
      <div className={`flex items-center justify-center h-40 ${className}`}>
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Determine overall signal
  const getOverallSignal = (): 'bullish' | 'bearish' | 'neutral' => {
    let score = 0;

    // RSI
    if (analysis.currentRSI < 30) score += 2;
    else if (analysis.currentRSI > 70) score -= 2;
    else if (analysis.currentRSI > 50) score += 1;
    else score -= 1;

    // Trend
    if (analysis.aboveSMA20 && analysis.aboveSMA50) score += 2;
    else if (!analysis.aboveSMA20 && !analysis.aboveSMA50) score -= 2;

    // Price change
    if (analysis.priceChangePercent > 2) score += 1;
    else if (analysis.priceChangePercent < -2) score -= 1;

    // MACD
    if (macdData) {
      if (macdData.histogram > 0) score += 1;
      else score -= 1;
    }

    if (score > 2) return 'bullish';
    if (score < -2) return 'bearish';
    return 'neutral';
  };

  const overallSignal = getOverallSignal();

  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${className}`}>
      {/* Trend Analysis Card */}
      <AnalysisCard
        title="Trend Analysis"
        icon={<TrendingUp className="w-5 h-5" />}
        signalColor="#10b981"
        overallSignal={analysis.aboveSMA20 && analysis.aboveSMA50 ? 'bullish' : !analysis.aboveSMA20 && !analysis.aboveSMA50 ? 'bearish' : 'neutral'}
        signals={[
          {
            label: 'Price Action',
            value: analysis.priceChangePercent >= 0 ? `+${analysis.priceChangePercent.toFixed(2)}%` : `${analysis.priceChangePercent.toFixed(2)}%`,
            status: analysis.priceChangePercent >= 0 ? 'bullish' : 'bearish',
          },
          {
            label: 'SMA 20',
            value: analysis.aboveSMA20 ? 'Above' : 'Below',
            status: analysis.aboveSMA20 ? 'bullish' : 'bearish',
          },
          {
            label: 'SMA 50',
            value: analysis.aboveSMA50 ? 'Above' : 'Below',
            status: analysis.aboveSMA50 ? 'bullish' : 'bearish',
          },
        ]}
      />

      {/* Momentum Card */}
      <AnalysisCard
        title="Momentum"
        icon={<Activity className="w-5 h-5" />}
        signalColor="#8b5cf6"
        overallSignal={analysis.currentRSI < 30 ? 'bullish' : analysis.currentRSI > 70 ? 'bearish' : 'neutral'}
        signals={[
          {
            label: 'RSI (14)',
            value: analysis.currentRSI.toFixed(1),
            status: analysis.currentRSI < 30 ? 'bullish' : analysis.currentRSI > 70 ? 'bearish' : 'neutral',
            strength: Math.abs(50 - analysis.currentRSI) / 50,
          },
          {
            label: 'MACD',
            value: macdData?.histogram ? (macdData.histogram >= 0 ? 'Positive' : 'Negative') : 'N/A',
            status: macdData?.histogram ? (macdData.histogram >= 0 ? 'bullish' : 'bearish') : 'neutral',
          },
          {
            label: 'Signal',
            value: macdData && macdData.macd > macdData.signal ? 'Bullish Cross' : macdData && macdData.macd < macdData.signal ? 'Bearish Cross' : 'Neutral',
            status: macdData && macdData.macd > macdData.signal ? 'bullish' : macdData && macdData.macd < macdData.signal ? 'bearish' : 'neutral',
          },
        ]}
      />

      {/* Volatility Card */}
      <AnalysisCard
        title="Volatility"
        icon={<Gauge className="w-5 h-5" />}
        signalColor="#f59e0b"
        overallSignal={analysis.range24h < 3 ? 'bullish' : analysis.range24h > 8 ? 'bearish' : 'neutral'}
        signals={[
          {
            label: 'Daily Range',
            value: `${analysis.range24h.toFixed(2)}%`,
            status: analysis.range24h < 3 ? 'bullish' : analysis.range24h > 8 ? 'bearish' : 'neutral',
          },
          {
            label: 'Volume Activity',
            value: analysis.volumeRatio > 1.5 ? 'High' : analysis.volumeRatio < 0.5 ? 'Low' : 'Normal',
            status: analysis.volumeRatio > 1.5 ? 'bullish' : analysis.volumeRatio < 0.5 ? 'neutral' : 'neutral',
          },
          {
            label: '24h High/Low',
            value: `${((analysis.high24h - analysis.low24h) / analysis.low24h * 100).toFixed(1)}% spread`,
            status: 'neutral',
          },
        ]}
      />
    </div>
  );
}

// Analysis Card Component
interface AnalysisCardProps {
  title: string;
  icon: React.ReactNode;
  signalColor: string;
  overallSignal: 'bullish' | 'bearish' | 'neutral';
  signals: {
    label: string;
    value: string;
    status: 'bullish' | 'bearish' | 'neutral';
    strength?: number;
  }[];
}

function AnalysisCard({ title, icon, signalColor, overallSignal, signals }: AnalysisCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'bullish': return 'text-green-400';
      case 'bearish': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'bullish': return 'bg-green-500/10 border-green-500/20';
      case 'bearish': return 'bg-red-500/10 border-red-500/20';
      default: return 'bg-gray-500/10 border-gray-500/20';
    }
  };

  return (
    <motion.div
      className="rounded-xl p-4 relative overflow-hidden"
      style={{
        background: 'rgba(10, 10, 15, 0.8)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Glow effect */}
      <div
        className="absolute top-0 right-0 w-32 h-32 rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${signalColor}15 0%, transparent 70%)`,
        }}
      />

      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div
          className="p-2 rounded-lg"
          style={{ background: `${signalColor}20`, color: signalColor }}
        >
          {icon}
        </div>
        <div>
          <h3 className="font-semibold text-white text-sm">{title}</h3>
          <div
            className={`text-[10px] font-bold uppercase ${
              overallSignal === 'bullish' ? 'text-green-400' :
              overallSignal === 'bearish' ? 'text-red-400' :
              'text-gray-400'
            }`}
          >
            {overallSignal} Signal
          </div>
        </div>
      </div>

      {/* Signals */}
      <div className="space-y-2">
        {signals.map((signal, index) => (
          <div
            key={index}
            className={`flex items-center justify-between px-3 py-2 rounded-lg border ${getStatusBg(signal.status)}`}
          >
            <span className="text-xs text-gray-400">{signal.label}</span>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-mono font-medium ${getStatusColor(signal.status)}`}>
                {signal.value}
              </span>
              {signal.strength !== undefined && (
                <div className="w-8 h-1 rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: signal.status === 'bullish' ? '#10b981' : signal.status === 'bearish' ? '#ef4444' : '#6366f1' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${signal.strength * 100}%` }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// Animated progress ring component
interface ProgressRingProps {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
}

export function ProgressRing({
  value,
  max,
  size = 60,
  strokeWidth = 4,
  color = '#00f5d4',
  label,
}: ProgressRingProps) {
  const [animatedValue, setAnimatedValue] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (animatedValue / max) * circumference;

  useEffect(() => {
    const timeout = setTimeout(() => {
      setAnimatedValue(value);
    }, 100);
    return () => clearTimeout(timeout);
  }, [value]);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            filter: `drop-shadow(0 0 4px ${color})`,
          }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </svg>
      {label && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-mono font-bold" style={{ color }}>{label}</span>
        </div>
      )}
    </div>
  );
}