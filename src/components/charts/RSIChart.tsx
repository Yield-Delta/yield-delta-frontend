'use client';

import React, { useEffect, useRef, useCallback, useState, forwardRef, useImperativeHandle } from 'react';
import { createChart, IChartApi, ISeriesApi, LineData, Time, ColorType, CrosshairMode, LineSeries } from 'lightweight-charts';

export interface RSIChartRef {
  updateData: (data: LineData<Time>[]) => void;
  getChart: () => IChartApi | null;
  resize: (width: number, height: number) => void;
}

interface RSIChartProps {
  data: LineData<Time>[];
  height?: number;
  period?: number;
  overboughtLevel?: number;
  oversoldLevel?: number;
  lineColor?: string;
  showGrid?: boolean;
  onValueChange?: (value: number | null) => void;
  className?: string;
}

export const RSIChart = forwardRef<RSIChartRef, RSIChartProps>(({
  data,
  height = 120,
  period = 14,
  overboughtLevel = 70,
  oversoldLevel = 30,
  lineColor = '#8b5cf6',
  showGrid = true,
  onValueChange,
  className = '',
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const rsiSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const overboughtSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const oversoldSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);

  const [isInitialized, setIsInitialized] = useState(false);
  const [currentValue, setCurrentValue] = useState<number | null>(null);

  // Initialize chart
  const initChart = useCallback(() => {
    if (!containerRef.current) return;

    if (chartRef.current) {
      chartRef.current.remove();
    }

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: 'rgba(255, 255, 255, 0.5)',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10,
      },
      grid: {
        vertLines: { color: showGrid ? 'rgba(255, 255, 255, 0.03)' : 'transparent' },
        horzLines: { color: showGrid ? 'rgba(255, 255, 255, 0.03)' : 'transparent' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: 'rgba(139, 92, 246, 0.3)', width: 1, style: 2 },
        horzLine: { color: 'rgba(139, 92, 246, 0.3)', width: 1, style: 2 },
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        scaleMargins: { top: 0.1, bottom: 0.1 },
        entireTextOnly: true,
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        visible: false,
      },
      handleScroll: false,
      handleScale: false,
    });

    chartRef.current = chart;

    // RSI line
    const rsiSeries = chart.addSeries(LineSeries, {
      color: lineColor,
      lineWidth: 2,
      title: `RSI(${period})`,
    });

    rsiSeriesRef.current = rsiSeries;

    // Overbought line
    const overboughtSeries = chart.addSeries(LineSeries, {
      color: 'rgba(239, 68, 68, 0.4)',
      lineWidth: 1,
      lineStyle: 2,
      title: 'Overbought',
    });

    overboughtSeriesRef.current = overboughtSeries;

    // Oversold line
    const oversoldSeries = chart.addSeries(LineSeries, {
      color: 'rgba(16, 185, 129, 0.4)',
      lineWidth: 1,
      lineStyle: 2,
      title: 'Oversold',
    });

    oversoldSeriesRef.current = oversoldSeries;

    // Subscribe to crosshair
    chart.subscribeCrosshairMove((param) => {
      if (param.seriesData.size > 0 && rsiSeriesRef.current) {
        const rsiData = param.seriesData.get(rsiSeriesRef.current) as LineData<Time> | undefined;
        if (rsiData && 'value' in rsiData) {
          setCurrentValue(rsiData.value as number);
          onValueChange?.(rsiData.value as number);
        }
      } else {
        setCurrentValue(null);
        onValueChange?.(null);
      }
    });

    setIsInitialized(true);
  }, [period, lineColor, showGrid, onValueChange]);

  // Set data
  const setData = useCallback((rsiData: LineData<Time>[]) => {
    if (!rsiSeriesRef.current || !overboughtSeriesRef.current || !oversoldSeriesRef.current) return;

    rsiSeriesRef.current.setData(rsiData);

    // Set overbought/oversold lines
    const levels = rsiData.map(d => ({ time: d.time, value: overboughtLevel }));
    overboughtSeriesRef.current.setData(levels);

    const levelsLow = rsiData.map(d => ({ time: d.time, value: oversoldLevel }));
    oversoldSeriesRef.current.setData(levelsLow);

    // Update current value
    if (rsiData.length > 0) {
      setCurrentValue(rsiData[rsiData.length - 1].value);
      onValueChange?.(rsiData[rsiData.length - 1].value);
    }

    chartRef.current?.timeScale().fitContent();
  }, [overboughtLevel, oversoldLevel, onValueChange]);

  // Handle resize
  const handleResize = useCallback(() => {
    if (!containerRef.current || !chartRef.current) return;

    const { width } = containerRef.current.getBoundingClientRect();
    chartRef.current.applyOptions({ width, height });
  }, [height]);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    updateData: setData,
    getChart: () => chartRef.current,
    resize: (width: number, height: number) => {
      chartRef.current?.applyOptions({ width, height });
    },
  }), [setData]);

  // Initialize on mount
  useEffect(() => {
    initChart();
    handleResize();

    const resizeObserver = new ResizeObserver(handleResize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [initChart, handleResize]);

  // Update data when it changes
  useEffect(() => {
    if (isInitialized && data.length > 0) {
      setData(data);
    }
  }, [data, isInitialized, setData]);

  // Get signal based on RSI value
  const getSignal = (value: number | null): string => {
    if (value === null) return 'neutral';
    if (value >= overboughtLevel) return 'overbought';
    if (value <= oversoldLevel) return 'oversold';
    if (value > 50) return 'bullish';
    return 'bearish';
  };

  const signal = getSignal(currentValue);

  return (
    <div className={`relative ${className}`}>
      {/* Chart container */}
      <div
        ref={containerRef}
        className="w-full rounded-xl overflow-hidden"
        style={{ height: `${height}px` }}
      />

      {/* Header */}
      <div className="absolute top-2 left-3 flex items-center gap-2">
        <span className="text-xs font-mono font-medium text-purple-400">RSI({period})</span>
        {currentValue !== null && (
          <span
            className={`text-xs font-mono font-bold ${
              signal === 'overbought' ? 'text-red-400' :
              signal === 'oversold' ? 'text-green-400' :
              signal === 'bullish' ? 'text-emerald-400' :
              'text-red-400'
            }`}
          >
            {currentValue.toFixed(1)}
          </span>
        )}
      </div>

      {/* Zone indicators */}
      <div className="absolute top-2 right-3 flex items-center gap-2">
        <span className="text-[10px] font-mono text-red-400/60">OB {overboughtLevel}</span>
        <span className="text-[10px] font-mono text-green-400/60">OS {oversoldLevel}</span>
      </div>

      {/* Signal badge */}
      {currentValue !== null && (
        <div
          className={`absolute bottom-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
            signal === 'overbought' ? 'bg-red-500/20 text-red-400' :
            signal === 'oversold' ? 'bg-green-500/20 text-green-400' :
            signal === 'bullish' ? 'bg-emerald-500/20 text-emerald-400' :
            'bg-red-500/20 text-red-400'
          }`}
        >
          {signal}
        </div>
      )}

      {/* Loading overlay */}
      {!isInitialized && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/30">
          <div className="w-5 h-5 border border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
});

RSIChart.displayName = 'RSIChart';

// Helper to calculate RSI from OHLC
export function calculateRSI(
  ohlcData: { time: number; close: number }[],
  period: number = 14
): LineData<Time>[] {
  const result: LineData<Time>[] = [];
  const gains: number[] = [];
  const losses: number[] = [];

  if (ohlcData.length < period + 1) return result;

  for (let i = 1; i < ohlcData.length; i++) {
    const change = ohlcData[i].close - ohlcData[i - 1].close;
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }

  for (let i = period; i < gains.length; i++) {
    const avgGain = gains.slice(i - period, i).reduce((a, b) => a + b, 0) / period;
    const avgLoss = losses.slice(i - period, i).reduce((a, b) => a + b, 0) / period;

    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));

    result.push({
      time: ohlcData[i + 1].time as Time,
      value: parseFloat(rsi.toFixed(2)),
    });
  }

  return result;
}

export default RSIChart;