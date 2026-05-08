'use client';

import React, { useEffect, useRef, useCallback, useState, forwardRef, useImperativeHandle } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData, HistogramData, LineData, Time, ColorType, CrosshairMode, CandlestickSeries, HistogramSeries, LineSeries } from 'lightweight-charts';

export interface OHLCData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface EnhancedCandlestickChartRef {
  updateData: (data: OHLCData[]) => void;
  addCandle: (candle: OHLCData) => void;
  updateLastCandle: (candle: Partial<OHLCData>) => void;
  getChart: () => IChartApi | null;
  resize: (width: number, height: number) => void;
}

interface EnhancedCandlestickChartProps {
  data: OHLCData[];
  symbol?: string;
  height?: number;
  showVolume?: boolean;
  showGrid?: boolean;
  upColor?: string;
  downColor?: string;
  crosshairColor?: string;
  onCrosshairMove?: (price: number | null, time: number | null) => void;
  onChartClick?: (price: number | null, time: number | null) => void;
  className?: string;
}

export const EnhancedCandlestickChart = forwardRef<EnhancedCandlestickChartRef, EnhancedCandlestickChartProps>(({
  data,
  symbol = 'Chart',
  height = 450,
  showVolume = true,
  showGrid = true,
  upColor = '#10b981',
  downColor = '#ef4444',
  crosshairColor = 'rgba(0, 245, 212, 0.5)',
  onCrosshairMove,
  onChartClick,
  className = '',
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);

  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize chart
  const initChart = useCallback(() => {
    if (!containerRef.current) return;

    if (chartRef.current) {
      chartRef.current.remove();
    }

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: 'rgba(255, 255, 255, 0.7)',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: showGrid ? 'rgba(255, 255, 255, 0.05)' : 'transparent' },
        horzLines: { color: showGrid ? 'rgba(255, 255, 255, 0.05)' : 'transparent' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: crosshairColor,
          width: 1,
          style: 2,
          labelBackgroundColor: '#00f5d4',
        },
        horzLine: {
          color: crosshairColor,
          width: 1,
          style: 2,
          labelBackgroundColor: '#00f5d4',
        },
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        scaleMargins: {
          top: 0.1,
          bottom: showVolume ? 0.2 : 0.05,
        },
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        timeVisible: true,
        secondsVisible: false,
        tickMarkFormatter: (time: Time) => {
          const date = new Date((time as number) * 1000);
          return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        },
      },
      handleScroll: { vertTouchDrag: false },
      handleScale: { axisPressedMouseMove: true },
    });

    chartRef.current = chart;

    // Candlestick series
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: upColor,
      downColor: downColor,
      borderUpColor: upColor,
      borderDownColor: downColor,
      wickUpColor: upColor,
      wickDownColor: downColor,
    });

    candleSeriesRef.current = candleSeries;

    // Subscribe to crosshair move
    chart.subscribeCrosshairMove((param) => {
      if (param.point) {
        const seriesData = param.seriesData.get(candleSeries);
        if (seriesData && 'close' in seriesData) {
          onCrosshairMove?.((seriesData as CandlestickData<Time>).close as number, param.time as number);
        }
      } else {
        onCrosshairMove?.(null, null);
      }
    });

    // Subscribe to click
    chart.subscribeClick((param) => {
      if (param.point && param.time) {
        const seriesData = param.seriesData.get(candleSeries);
        if (seriesData && 'close' in seriesData) {
          onChartClick?.((seriesData as CandlestickData<Time>).close as number, param.time as number);
        } else {
          onChartClick?.(null, param.time as number);
        }
      } else {
        onChartClick?.(null, null);
      }
    });

    // Volume series
    if (showVolume) {
      const volumeSeries = chart.addSeries(HistogramSeries, {
        color: '#6366f1',
        priceFormat: { type: 'volume' },
        priceScaleId: '',
      });

      volumeSeries.priceScale().applyOptions({
        scaleMargins: { top: 0.85, bottom: 0 },
      });

      volumeSeriesRef.current = volumeSeries;
    }

    setIsInitialized(true);
  }, [showVolume, showGrid, crosshairColor, upColor, downColor, onCrosshairMove, onChartClick]);

  // Set data to chart
  const setData = useCallback((chartData: OHLCData[]) => {
    if (!candleSeriesRef.current) return;

    const candleData: CandlestickData<Time>[] = chartData.map(d => ({
      time: d.time as Time,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));

    candleSeriesRef.current.setData(candleData);

    // Update volume if visible
    if (volumeSeriesRef.current) {
      const volumeData: HistogramData<Time>[] = chartData.map(d => ({
        time: d.time as Time,
        value: d.volume || 0,
        color: d.close >= d.open ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)',
      }));
      volumeSeriesRef.current.setData(volumeData);
    }

    chartRef.current?.timeScale().fitContent();
  }, []);

  // Add new candle
  const addCandle = useCallback((candle: OHLCData) => {
    if (!candleSeriesRef.current) return;

    candleSeriesRef.current.update({
      time: candle.time as Time,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
    });

    if (volumeSeriesRef.current && candle.volume !== undefined) {
      volumeSeriesRef.current.update({
        time: candle.time as Time,
        value: candle.volume,
        color: candle.close >= candle.open ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)',
      });
    }
  }, []);

  // Update last candle (for real-time updates)
  const updateLastCandle = useCallback((update: Partial<OHLCData>) => {
    if (!candleSeriesRef.current || data.length === 0) return;

    const lastData = data[data.length - 1];
    if (lastData) {
      candleSeriesRef.current.update({
        time: lastData.time as Time,
        open: update.open ?? lastData.open,
        high: update.high ?? lastData.high,
        low: update.low ?? lastData.low,
        close: update.close ?? lastData.close,
      });
    }
  }, [data]);

  // Handle resize
  const handleResize = useCallback(() => {
    if (!containerRef.current || !chartRef.current) return;

    const { width } = containerRef.current.getBoundingClientRect();
    chartRef.current.applyOptions({ width, height });
  }, [height]);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    updateData: setData,
    addCandle,
    updateLastCandle,
    getChart: () => chartRef.current,
    resize: (width: number, height: number) => {
      chartRef.current?.applyOptions({ width, height });
    },
  }), [setData, addCandle, updateLastCandle]);

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

  return (
    <div className={`relative ${className}`}>
      {/* Chart container */}
      <div
        ref={containerRef}
        className="w-full rounded-xl overflow-hidden"
        style={{ height: `${height}px` }}
      />

      {/* Loading overlay */}
      {!isInitialized && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-muted-foreground">Loading chart...</span>
          </div>
        </div>
      )}

      {/* Symbol badge */}
      <div className="absolute top-3 left-3 px-2 py-1 rounded-md bg-black/50 backdrop-blur-sm border border-white/10">
        <span className="text-xs font-mono font-medium text-primary">{symbol}</span>
      </div>
    </div>
  );
});

EnhancedCandlestickChart.displayName = 'EnhancedCandlestickChart';

export default EnhancedCandlestickChart;