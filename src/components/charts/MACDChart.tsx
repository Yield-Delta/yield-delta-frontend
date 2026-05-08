'use client';

import React, { useEffect, useRef, useCallback, useState, forwardRef, useImperativeHandle } from 'react';
import { createChart, IChartApi, ISeriesApi, LineData, HistogramData, Time, ColorType, CrosshairMode, LineSeries, HistogramSeries } from 'lightweight-charts';

export interface MACDChartRef {
  updateData: (macd: LineData<Time>[], signal: LineData<Time>[], histogram: HistogramData<Time>[]) => void;
  getChart: () => IChartApi | null;
  resize: (width: number, height: number) => void;
}

interface MACDChartProps {
  macdData: LineData<Time>[];
  signalData: LineData<Time>[];
  histogramData: HistogramData<Time>[];
  height?: number;
  fastPeriod?: number;
  slowPeriod?: number;
  signalPeriod?: number;
  showGrid?: boolean;
  onValueChange?: (macd: number | null, signal: number | null, histogram: number | null) => void;
  className?: string;
}

export const MACDChart = forwardRef<MACDChartRef, MACDChartProps>(({
  macdData,
  signalData,
  histogramData,
  height = 150,
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9,
  showGrid = true,
  onValueChange,
  className = '',
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const macdSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const signalSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const histogramSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const zeroLineRef = useRef<ISeriesApi<'Line'> | null>(null);

  const [isInitialized, setIsInitialized] = useState(false);
  const [currentValues, setCurrentValues] = useState<{
    macd: number | null;
    signal: number | null;
    histogram: number | null;
  }>({ macd: null, signal: null, histogram: null });

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
        vertLine: { color: 'rgba(6, 182, 212, 0.3)', width: 1, style: 2 },
        horzLine: { color: 'rgba(6, 182, 212, 0.3)', width: 1, style: 2 },
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        timeVisible: true,
        visible: true,
      },
      handleScroll: false,
      handleScale: false,
    });

    chartRef.current = chart;

    // Histogram
    const histogramSeries = chart.addSeries(HistogramSeries, {
      color: '#10b981',
      priceFormat: { type: 'price', precision: 4 },
    });

    histogramSeriesRef.current = histogramSeries;

    // MACD line
    const macdSeries = chart.addSeries(LineSeries, {
      color: '#06b6d4',
      lineWidth: 2,
      title: 'MACD',
    });

    macdSeriesRef.current = macdSeries;

    // Signal line
    const signalSeries = chart.addSeries(LineSeries, {
      color: '#f59e0b',
      lineWidth: 2,
      title: 'Signal',
    });

    signalSeriesRef.current = signalSeries;

    // Zero line
    const zeroLine = chart.addSeries(LineSeries, {
      color: 'rgba(255, 255, 255, 0.15)',
      lineWidth: 1,
      lineStyle: 0,
      title: 'Zero',
    });

    zeroLineRef.current = zeroLine;

    // Subscribe to crosshair
    chart.subscribeCrosshairMove((param) => {
      if (param.seriesData.size > 0) {
        const macd = param.seriesData.get(macdSeriesRef.current!) as LineData<Time> | undefined;
        const signal = param.seriesData.get(signalSeriesRef.current!) as LineData<Time> | undefined;
        const hist = param.seriesData.get(histogramSeriesRef.current!) as HistogramData<Time> | undefined;

        setCurrentValues({
          macd: macd && 'value' in macd ? (macd.value as number) : null,
          signal: signal && 'value' in signal ? (signal.value as number) : null,
          histogram: hist && 'value' in hist ? (hist.value as number) : null,
        });

        onValueChange?.(
          macd && 'value' in macd ? (macd.value as number) : null,
          signal && 'value' in signal ? (signal.value as number) : null,
          hist && 'value' in hist ? (hist.value as number) : null
        );
      } else {
        setCurrentValues({ macd: null, signal: null, histogram: null });
        onValueChange?.(null, null, null);
      }
    });

    setIsInitialized(true);
  }, [showGrid, onValueChange]);

  // Set data
  const setData = useCallback((
    macd: LineData<Time>[],
    signal: LineData<Time>[],
    histogram: HistogramData<Time>[]
  ) => {
    if (!macdSeriesRef.current || !signalSeriesRef.current || !histogramSeriesRef.current || !zeroLineRef.current) return;

    macdSeriesRef.current.setData(macd);
    signalSeriesRef.current.setData(signal);

    // Set histogram with colors
    const coloredHistogram = histogram.map(d => ({
      ...d,
      color: d.value >= 0 ? 'rgba(16, 185, 129, 0.7)' : 'rgba(239, 68, 68, 0.7)',
    }));
    histogramSeriesRef.current.setData(coloredHistogram);

    // Set zero line
    if (macd.length > 0) {
      const zeroData = macd.map(d => ({ time: d.time, value: 0 }));
      zeroLineRef.current.setData(zeroData);
    }

    // Update current values
    if (macd.length > 0 && signal.length > 0 && histogram.length > 0) {
      setCurrentValues({
        macd: macd[macd.length - 1].value,
        signal: signal[signal.length - 1].value,
        histogram: histogram[histogram.length - 1].value,
      });
    }

    chartRef.current?.timeScale().fitContent();
  }, []);

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
    if (isInitialized && macdData.length > 0) {
      setData(macdData, signalData, histogramData);
    }
  }, [isInitialized, macdData, signalData, histogramData, setData]);

  // Get signal based on MACD
  const getSignal = (): string => {
    if (currentValues.macd === null || currentValues.signal === null) return 'neutral';
    if (currentValues.macd > currentValues.signal && currentValues.histogram !== null && currentValues.histogram > 0) {
      return 'bullish';
    }
    return 'bearish';
  };

  const signal = getSignal();

  return (
    <div className={`relative ${className}`}>
      {/* Chart container */}
      <div
        ref={containerRef}
        className="w-full rounded-xl overflow-hidden"
        style={{ height: `${height}px` }}
      />

      {/* Header */}
      <div className="absolute top-2 left-3 flex items-center gap-3">
        <span className="text-xs font-mono font-medium text-cyan-400">MACD({fastPeriod},{slowPeriod},{signalPeriod})</span>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400" />
          <span className="text-[10px] font-mono text-cyan-400/60">
            {currentValues.macd?.toFixed(4) ?? '--'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-400" />
          <span className="text-[10px] font-mono text-amber-400/60">
            {currentValues.signal?.toFixed(4) ?? '--'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400" />
          <span className="text-[10px] font-mono text-green-400/60">
            {currentValues.histogram?.toFixed(4) ?? '--'}
          </span>
        </div>
      </div>

      {/* Signal badge */}
      {currentValues.macd !== null && (
        <div
          className={`absolute bottom-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
            signal === 'bullish' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
          }`}
        >
          {signal}
        </div>
      )}

      {/* Loading overlay */}
      {!isInitialized && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/30">
          <div className="w-5 h-5 border border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
});

MACDChart.displayName = 'MACDChart';

// Helper functions for MACD calculation
export function calculateEMA(data: { time: number; close: number }[], period: number): LineData<Time>[] {
  const result: LineData<Time>[] = [];
  const multiplier = 2 / (period + 1);

  if (data.length < period) return result;

  let ema = data.slice(0, period).reduce((acc, d) => acc + d.close, 0) / period;
  result.push({ time: data[period - 1].time as Time, value: parseFloat(ema.toFixed(4)) });

  for (let i = period; i < data.length; i++) {
    ema = (data[i].close - ema) * multiplier + ema;
    result.push({ time: data[i].time as Time, value: parseFloat(ema.toFixed(4)) });
  }

  return result;
}

export function calculateMACD(
  ohlcData: { time: number; close: number }[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): { macd: LineData<Time>[]; signal: LineData<Time>[]; histogram: HistogramData<Time>[] } {
  const ema12 = calculateEMA(ohlcData, fastPeriod);
  const ema26 = calculateEMA(ohlcData, slowPeriod);

  // Calculate MACD line
  const macdLine: LineData<Time>[] = [];
  const offset = fastPeriod - slowPeriod;

  for (let i = 0; i < ema26.length; i++) {
    const ema12Index = i + offset;
    if (ema12Index >= 0 && ema12Index < ema12.length) {
      macdLine.push({
        time: ema26[i].time,
        value: parseFloat((ema12[ema12Index].value - ema26[i].value).toFixed(4)),
      });
    }
  }

  // Calculate Signal line (9-period EMA of MACD)
  const signalLine: LineData<Time>[] = [];
  const signalMultiplier = 2 / (signalPeriod + 1);

  if (macdLine.length < signalPeriod) {
    return { macd: macdLine, signal: [], histogram: [] };
  }

  let signal = macdLine.slice(0, signalPeriod).reduce((acc, d) => acc + d.value, 0) / signalPeriod;
  signalLine.push({ time: macdLine[signalPeriod - 1].time, value: parseFloat(signal.toFixed(4)) });

  // Calculate histogram
  const histogram: HistogramData<Time>[] = [];

  for (let i = signalPeriod - 1; i < macdLine.length; i++) {
    if (i === signalPeriod - 1) {
      signal = macdLine[i].value;
    } else {
      signal = (macdLine[i].value - signal) * signalMultiplier + signal;
      signalLine.push({ time: macdLine[i].time, value: parseFloat(signal.toFixed(4)) });
    }

    const histValue = macdLine[i].value - signal;
    histogram.push({
      time: macdLine[i].time,
      value: parseFloat(histValue.toFixed(4)),
      color: histValue >= 0 ? 'rgba(16, 185, 129, 0.7)' : 'rgba(239, 68, 68, 0.7)',
    });
  }

  return { macd: macdLine, signal: signalLine, histogram };
}

export default MACDChart;