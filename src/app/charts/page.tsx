"use client"

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Navigation from '@/components/Navigation';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  Clock,
  Layers,
  Target,
  Zap,
  ChevronDown,
  RefreshCw,
  Crosshair,
  Maximize2
} from 'lucide-react';
import {
  createChart,
  IChartApi,
  ISeriesApi,
  CandlestickData,
  LineData,
  HistogramData,
  Time,
  CandlestickSeries,
  LineSeries,
  HistogramSeries,
} from 'lightweight-charts';

// Types for technical indicators
interface OHLCData {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

interface IndicatorConfig {
  name: string;
  enabled: boolean;
  color: string;
  period?: number;
}

// Fetch current price from CoinGecko API
const fetchCurrentPrice = async (coingeckoId: string): Promise<number> => {
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coingeckoId}&vs_currencies=usd`,
      { cache: 'no-store' }
    );
    if (response.ok) {
      const data = await response.json();
      return data[coingeckoId]?.usd || getFallbackPrice(coingeckoId);
    }
  } catch (error) {
    console.warn('Failed to fetch price from CoinGecko:', error);
  }
  return getFallbackPrice(coingeckoId);
};

// Fallback prices matching API route
const getFallbackPrice = (coingeckoId: string): number => {
  const fallbackPrices: Record<string, number> = {
    'sei-network': 0.42,
    'ethereum': 2340.50,
    'bitcoin': 43250.00,
    'usd-coin': 1.00,
  };
  return fallbackPrices[coingeckoId] || 1.0;
};

// Generate OHLC data based on real price
const generateOHLCData = (days: number = 90, currentPrice: number): OHLCData[] => {
  const data: OHLCData[] = [];
  const now = new Date();

  let price = currentPrice;
  const priceHistory: number[] = [price];

  for (let i = 1; i <= days; i++) {
    const volatility = 0.025 + Math.random() * 0.015;
    const meanReversion = (currentPrice - price) * 0.02;
    const change = (Math.random() - 0.5) * volatility + meanReversion;
    price = price * (1 - change);
    priceHistory.unshift(price);
  }

  for (let i = 0; i <= days; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - (days - i));

    const basePrice = priceHistory[i];
    const nextPrice = priceHistory[i + 1] || basePrice;

    const open = basePrice;
    const close = nextPrice;
    const highVariance = 1 + Math.random() * 0.015;
    const lowVariance = 1 - Math.random() * 0.015;
    const high = Math.max(open, close) * highVariance;
    const low = Math.min(open, close) * lowVariance;
    const volume = 1000000 + Math.random() * 5000000;

    data.push({
      time: (date.getTime() / 1000) as Time,
      open: parseFloat(open.toFixed(4)),
      high: parseFloat(high.toFixed(4)),
      low: parseFloat(low.toFixed(4)),
      close: parseFloat(close.toFixed(4)),
      volume: Math.floor(volume),
    });
  }

  return data;
};

// Calculate Simple Moving Average
const calculateSMA = (data: OHLCData[], period: number): LineData[] => {
  const result: LineData[] = [];
  for (let i = period - 1; i < data.length; i++) {
    const sum = data.slice(i - period + 1, i + 1).reduce((acc, d) => acc + d.close, 0);
    result.push({
      time: data[i].time,
      value: parseFloat((sum / period).toFixed(4)),
    });
  }
  return result;
};

// Calculate Exponential Moving Average
const calculateEMA = (data: OHLCData[], period: number): LineData[] => {
  const result: LineData[] = [];
  const multiplier = 2 / (period + 1);

  let ema = data.slice(0, period).reduce((acc, d) => acc + d.close, 0) / period;

  for (let i = period - 1; i < data.length; i++) {
    if (i === period - 1) {
      result.push({ time: data[i].time, value: parseFloat(ema.toFixed(4)) });
    } else {
      ema = (data[i].close - ema) * multiplier + ema;
      result.push({ time: data[i].time, value: parseFloat(ema.toFixed(4)) });
    }
  }
  return result;
};

// Calculate RSI
const calculateRSI = (data: OHLCData[], period: number = 14): LineData[] => {
  const result: LineData[] = [];
  const gains: number[] = [];
  const losses: number[] = [];

  for (let i = 1; i < data.length; i++) {
    const change = data[i].close - data[i - 1].close;
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }

  for (let i = period; i < gains.length; i++) {
    const avgGain = gains.slice(i - period, i).reduce((a, b) => a + b, 0) / period;
    const avgLoss = losses.slice(i - period, i).reduce((a, b) => a + b, 0) / period;

    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));

    result.push({
      time: data[i + 1].time,
      value: parseFloat(rsi.toFixed(2)),
    });
  }

  return result;
};

// Calculate MACD
const calculateMACD = (data: OHLCData[]): { macd: LineData[]; signal: LineData[]; histogram: HistogramData[] } => {
  const ema12 = calculateEMA(data, 12);
  const ema26 = calculateEMA(data, 26);

  const macdLine: LineData[] = [];
  const signalLine: LineData[] = [];
  const histogram: HistogramData[] = [];

  const startIndex = 26 - 12;
  for (let i = startIndex; i < ema12.length; i++) {
    const ema26Index = i - startIndex;
    if (ema26Index >= 0 && ema26Index < ema26.length) {
      macdLine.push({
        time: ema12[i].time,
        value: parseFloat((ema12[i].value - ema26[ema26Index].value).toFixed(4)),
      });
    }
  }

  if (macdLine.length >= 9) {
    const multiplier = 2 / 10;
    let signal = macdLine.slice(0, 9).reduce((acc, d) => acc + d.value, 0) / 9;

    for (let i = 8; i < macdLine.length; i++) {
      if (i === 8) {
        signalLine.push({ time: macdLine[i].time, value: parseFloat(signal.toFixed(4)) });
      } else {
        signal = (macdLine[i].value - signal) * multiplier + signal;
        signalLine.push({ time: macdLine[i].time, value: parseFloat(signal.toFixed(4)) });
      }

      const histValue = macdLine[i].value - (signalLine[signalLine.length - 1]?.value || 0);
      histogram.push({
        time: macdLine[i].time,
        value: parseFloat(histValue.toFixed(4)),
        color: histValue >= 0 ? '#ccff00' : '#ff003c', // Cyberpunk green and red
      });
    }
  }

  return { macd: macdLine, signal: signalLine, histogram };
};

// Calculate Bollinger Bands
const calculateBollingerBands = (data: OHLCData[], period: number = 20, stdDev: number = 2) => {
  const sma = calculateSMA(data, period);
  const upper: LineData[] = [];
  const lower: LineData[] = [];

  for (let i = 0; i < sma.length; i++) {
    const dataIndex = i + period - 1;
    const slice = data.slice(dataIndex - period + 1, dataIndex + 1);
    const mean = sma[i].value;

    const variance = slice.reduce((acc, d) => acc + Math.pow(d.close - mean, 2), 0) / period;
    const std = Math.sqrt(variance);

    upper.push({ time: sma[i].time, value: parseFloat((mean + stdDev * std).toFixed(4)) });
    lower.push({ time: sma[i].time, value: parseFloat((mean - stdDev * std).toFixed(4)) });
  }

  return { middle: sma, upper, lower };
};

const TOKENS = [
  { symbol: 'SEI', name: 'SEI Network', color: '#ff003c', coingeckoId: 'sei-network' },
  { symbol: 'ETH', name: 'Ethereum', color: '#00f0ff', coingeckoId: 'ethereum' },
  { symbol: 'BTC', name: 'Bitcoin', color: '#ccff00', coingeckoId: 'bitcoin' },
  { symbol: 'USDC', name: 'USD Coin', color: '#ffffff', coingeckoId: 'usd-coin' },
];

const TIMEFRAMES = [
  { label: '1H', value: '1h', days: 7 },
  { label: '4H', value: '4h', days: 30 },
  { label: '1D', value: '1d', days: 90 },
  { label: '1W', value: '1w', days: 365 },
];

const ChartsPage = () => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const rsiContainerRef = useRef<HTMLDivElement>(null);
  const macdContainerRef = useRef<HTMLDivElement>(null);

  const mainChartRef = useRef<IChartApi | null>(null);
  const rsiChartRef = useRef<IChartApi | null>(null);
  const macdChartRef = useRef<IChartApi | null>(null);

  const candleSeriesRef = useRef<ISeriesApi<'Candlestick', Time> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram', Time> | null>(null);

  const [selectedToken, setSelectedToken] = useState(TOKENS[0]);
  const [selectedTimeframe, setSelectedTimeframe] = useState(TIMEFRAMES[2]);
  const [ohlcData, setOhlcData] = useState<OHLCData[]>([]);
  const [showTokenDropdown, setShowTokenDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Cyberpunk inspired colors
  const colors = {
    bg: '#050505',
    text: '#e0e0e0',
    grid: '#1a1a1a',
    up: '#ccff00',
    down: '#ff003c',
    accent1: '#00f0ff',
    accent2: '#ff00ff',
    muted: '#4a4a4a'
  };

  const [indicators, setIndicators] = useState<IndicatorConfig[]>([
    { name: 'SMA 20', enabled: true, color: colors.accent1, period: 20 },
    { name: 'SMA 50', enabled: true, color: colors.accent2, period: 50 },
    { name: 'EMA 12', enabled: false, color: '#ffb000', period: 12 },
    { name: 'EMA 26', enabled: false, color: '#8a2be2', period: 26 },
    { name: 'Bollinger Bands', enabled: true, color: colors.muted },
    { name: 'Volume', enabled: true, color: colors.muted },
  ]);

  const [showRSI, setShowRSI] = useState(true);
  const [showMACD, setShowMACD] = useState(true);

  // Current price stats
  const currentPrice = ohlcData.length > 0 ? ohlcData[ohlcData.length - 1].close : 0;
  const previousPrice = ohlcData.length > 1 ? ohlcData[ohlcData.length - 2].close : currentPrice;
  const priceChange = currentPrice - previousPrice;
  const priceChangePercent = previousPrice > 0 ? (priceChange / previousPrice) * 100 : 0;
  const high24h = ohlcData.length > 0 ? Math.max(...ohlcData.slice(-24).map(d => d.high)) : 0;
  const low24h = ohlcData.length > 0 ? Math.min(...ohlcData.slice(-24).map(d => d.low)) : 0;
  const volume24h = ohlcData.length > 0 ? ohlcData.slice(-24).reduce((sum, d) => sum + (d.volume || 0), 0) : 0;

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setIsLoading(true);
      try {
        const currentPrice = await fetchCurrentPrice(selectedToken.coingeckoId);

        if (isMounted) {
          const data = generateOHLCData(selectedTimeframe.days, currentPrice);
          setOhlcData(data);
        }
      } catch (error) {
        console.error('Error loading chart data:', error);
        if (isMounted) {
          const fallbackPrice = getFallbackPrice(selectedToken.coingeckoId);
          const data = generateOHLCData(selectedTimeframe.days, fallbackPrice);
          setOhlcData(data);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [selectedToken, selectedTimeframe]);

  const initMainChart = useCallback(() => {
    if (!chartContainerRef.current || ohlcData.length === 0) return;

    if (mainChartRef.current) {
      mainChartRef.current.remove();
      mainChartRef.current = null;
    }

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: 'transparent' },
        textColor: colors.text,
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      },
      grid: {
        vertLines: { color: colors.grid, style: 1 },
        horzLines: { color: colors.grid, style: 1 },
      },
      crosshair: {
        mode: 1,
        vertLine: { color: colors.accent1, width: 1, style: 3 },
        horzLine: { color: colors.accent1, width: 1, style: 3 },
      },
      rightPriceScale: {
        borderColor: colors.grid,
        scaleMargins: { top: 0.1, bottom: 0.2 },
      },
      timeScale: {
        borderColor: colors.grid,
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: { vertTouchDrag: false },
    });

    mainChartRef.current = chart;

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: colors.up,
      downColor: colors.down,
      borderUpColor: colors.up,
      borderDownColor: colors.down,
      wickUpColor: colors.up,
      wickDownColor: colors.down,
    });

    candleSeries.setData(ohlcData as CandlestickData<Time>[]);
    candleSeriesRef.current = candleSeries;

    if (indicators.find(i => i.name === 'Volume')?.enabled) {
      const volumeSeries = chart.addSeries(HistogramSeries, {
        color: colors.muted,
        priceFormat: { type: 'volume' },
        priceScaleId: '',
      });

      volumeSeries.priceScale().applyOptions({
        scaleMargins: { top: 0.85, bottom: 0 },
      });

      const volumeData = ohlcData.map(d => ({
        time: d.time,
        value: d.volume || 0,
        color: d.close >= d.open ? `${colors.up}33` : `${colors.down}33`,
      }));

      volumeSeries.setData(volumeData);
      volumeSeriesRef.current = volumeSeries;
    }

    indicators.forEach(indicator => {
      if (!indicator.enabled || !indicator.period) return;

      if (indicator.name.startsWith('SMA')) {
        const smaData = calculateSMA(ohlcData, indicator.period);
        const smaSeries = chart.addSeries(LineSeries, {
          color: indicator.color,
          lineWidth: 2,
          title: indicator.name,
        });
        smaSeries.setData(smaData);
      }

      if (indicator.name.startsWith('EMA')) {
        const emaData = calculateEMA(ohlcData, indicator.period);
        const emaSeries = chart.addSeries(LineSeries, {
          color: indicator.color,
          lineWidth: 2,
          title: indicator.name,
        });
        emaSeries.setData(emaData);
      }
    });

    if (indicators.find(i => i.name === 'Bollinger Bands')?.enabled) {
      const bb = calculateBollingerBands(ohlcData);

      const upperSeries = chart.addSeries(LineSeries, {
        color: `${colors.accent1}40`,
        lineWidth: 1,
        title: 'BB Upper',
      });
      upperSeries.setData(bb.upper);

      const lowerSeries = chart.addSeries(LineSeries, {
        color: `${colors.accent1}40`,
        lineWidth: 1,
        title: 'BB Lower',
      });
      lowerSeries.setData(bb.lower);
    }

    chart.timeScale().fitContent();
  }, [ohlcData, indicators]);

  const initRSIChart = useCallback(() => {
    if (!rsiContainerRef.current || ohlcData.length === 0 || !showRSI) return;

    if (rsiChartRef.current) {
      rsiChartRef.current.remove();
      rsiChartRef.current = null;
    }

    const chart = createChart(rsiContainerRef.current, {
      layout: {
        background: { color: 'transparent' },
        textColor: colors.text,
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      },
      grid: {
        vertLines: { color: colors.grid },
        horzLines: { color: colors.grid },
      },
      rightPriceScale: {
        borderColor: colors.grid,
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        borderColor: colors.grid,
        visible: false,
      },
      handleScroll: { vertTouchDrag: false },
    });

    rsiChartRef.current = chart;

    const rsiData = calculateRSI(ohlcData);
    const rsiSeries = chart.addSeries(LineSeries, {
      color: colors.accent2,
      lineWidth: 2,
      title: 'RSI',
    });
    rsiSeries.setData(rsiData);

    const overbought = chart.addSeries(LineSeries, {
      color: `${colors.down}80`,
      lineWidth: 1,
      lineStyle: 2,
    });
    overbought.setData(rsiData.map(d => ({ time: d.time, value: 70 })));

    const oversold = chart.addSeries(LineSeries, {
      color: `${colors.up}80`,
      lineWidth: 1,
      lineStyle: 2,
    });
    oversold.setData(rsiData.map(d => ({ time: d.time, value: 30 })));

    chart.timeScale().fitContent();
  }, [ohlcData, showRSI]);

  const initMACDChart = useCallback(() => {
    if (!macdContainerRef.current || ohlcData.length === 0 || !showMACD) return;

    if (macdChartRef.current) {
      macdChartRef.current.remove();
      macdChartRef.current = null;
    }

    const chart = createChart(macdContainerRef.current, {
      layout: {
        background: { color: 'transparent' },
        textColor: colors.text,
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      },
      grid: {
        vertLines: { color: colors.grid },
        horzLines: { color: colors.grid },
      },
      rightPriceScale: {
        borderColor: colors.grid,
      },
      timeScale: {
        borderColor: colors.grid,
        timeVisible: true,
      },
      handleScroll: { vertTouchDrag: false },
    });

    macdChartRef.current = chart;

    const { macd, signal, histogram } = calculateMACD(ohlcData);

    const histogramSeries = chart.addSeries(HistogramSeries, {
      color: colors.accent1,
      priceFormat: { type: 'price', precision: 4 },
    });
    histogramSeries.setData(histogram);

    const macdSeries = chart.addSeries(LineSeries, {
      color: colors.text,
      lineWidth: 2,
      title: 'MACD',
    });
    macdSeries.setData(macd);

    const signalSeries = chart.addSeries(LineSeries, {
      color: colors.accent2,
      lineWidth: 2,
      title: 'Signal',
    });
    signalSeries.setData(signal);

    chart.timeScale().fitContent();
  }, [ohlcData, showMACD]);

  useEffect(() => {
    if (!mainChartRef.current) return;

    const mainChart = mainChartRef.current;
    const rsiChart = rsiChartRef.current;
    const macdChart = macdChartRef.current;

    const handleTimeRangeChange = () => {
      const timeRange = mainChart.timeScale().getVisibleLogicalRange();
      if (timeRange) {
        rsiChart?.timeScale().setVisibleLogicalRange(timeRange);
        macdChart?.timeScale().setVisibleLogicalRange(timeRange);
      }
    };

    mainChart.timeScale().subscribeVisibleLogicalRangeChange(handleTimeRangeChange);

    return () => {
      mainChart.timeScale().unsubscribeVisibleLogicalRangeChange(handleTimeRangeChange);
    };
  }, []);

  useEffect(() => {
    initMainChart();
    initRSIChart();
    initMACDChart();
  }, [initMainChart, initRSIChart, initMACDChart]);

  useEffect(() => {
    const handleResize = () => {
      if (chartContainerRef.current && mainChartRef.current) {
        mainChartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth
        });
      }
      if (rsiContainerRef.current && rsiChartRef.current) {
        rsiChartRef.current.applyOptions({
          width: rsiContainerRef.current.clientWidth
        });
      }
      if (macdContainerRef.current && macdChartRef.current) {
        macdChartRef.current.applyOptions({
          width: macdContainerRef.current.clientWidth
        });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleIndicator = (name: string) => {
    setIndicators(prev => prev.map(i =>
      i.name === name ? { ...i, enabled: !i.enabled } : i
    ));
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#e0e0e0] font-sans selection:bg-[#ccff00] selection:text-black overflow-x-hidden">
      {/* Brutalist Grid Background */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.03] z-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, #ffffff 1px, transparent 1px),
            linear-gradient(to bottom, #ffffff 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />
      
      {/* Noise overlay */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-20 z-0 mix-blend-overlay"
        style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")'
        }}
      />

      <Navigation variant="dark" showWallet={true} showLaunchApp={false} />

      <main className="relative z-10 pt-24 px-4 md:px-8 pb-12 max-w-[1800px] mx-auto">
        {/* Terminal Header */}
        <header className="mb-8 border-b-2 border-[#1a1a1a] pb-6 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-[#00f0ff] font-mono">
              <Crosshair className="w-4 h-4" />
              <span>System.Terminal // Market.Data</span>
            </div>
            
            <div className="relative group inline-block">
              <button
                onClick={() => setShowTokenDropdown(!showTokenDropdown)}
                className="flex items-end gap-4 hover:opacity-80 transition-opacity"
              >
                <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-none" style={{ color: selectedToken.color }}>
                  {selectedToken.symbol}
                </h1>
                <span className="text-2xl md:text-4xl text-[#4a4a4a] font-bold mb-1">/USD</span>
                <ChevronDown className={`w-8 h-8 mb-2 text-[#4a4a4a] transition-transform ${showTokenDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showTokenDropdown && (
                <div className="absolute top-full left-0 mt-4 w-64 bg-[#0a0a0a] border-2 border-[#1a1a1a] p-2 z-50">
                  {TOKENS.map(token => (
                    <button
                      key={token.symbol}
                      onClick={() => {
                        setSelectedToken(token);
                        setShowTokenDropdown(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-[#1a1a1a] transition-colors flex justify-between items-center group"
                    >
                      <span className="font-bold text-xl" style={{ color: token.color }}>{token.symbol}</span>
                      <span className="text-xs text-[#4a4a4a] font-mono group-hover:text-white transition-colors">{token.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-start lg:items-end gap-2">
            <div className="text-xs text-[#4a4a4a] font-mono uppercase tracking-widest">Current_Price</div>
            <div className="flex items-baseline gap-4">
              <div className="text-5xl md:text-6xl font-mono font-bold tracking-tight">
                ${currentPrice.toFixed(4)}
              </div>
              <div className={`flex items-center gap-1 text-xl font-mono ${priceChange >= 0 ? 'text-[#ccff00]' : 'text-[#ff003c]'}`}>
                {priceChange >= 0 ? '▲' : '▼'}
                {Math.abs(priceChangePercent).toFixed(2)}%
              </div>
            </div>
          </div>
        </header>

        {/* Action Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          {/* Brutalist Tabs for Timeframe */}
          <div className="flex border-2 border-[#1a1a1a] bg-[#0a0a0a]">
            {TIMEFRAMES.map(tf => (
              <button
                key={tf.value}
                onClick={() => setSelectedTimeframe(tf)}
                className={`px-6 py-3 text-sm font-mono font-bold transition-colors ${
                  selectedTimeframe.value === tf.value
                    ? 'bg-[#e0e0e0] text-black'
                    : 'text-[#888] hover:text-white hover:bg-[#1a1a1a]'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>

          {/* Indicators & Toggles */}
          <div className="flex flex-wrap gap-2">
            {indicators.map(indicator => (
              <button
                key={indicator.name}
                onClick={() => toggleIndicator(indicator.name)}
                className={`px-3 py-1 text-xs font-mono border ${
                  indicator.enabled
                    ? 'bg-[#1a1a1a] text-white'
                    : 'border-[#1a1a1a] text-[#4a4a4a] hover:border-[#4a4a4a]'
                }`}
                style={indicator.enabled ? { borderColor: indicator.color } : {}}
              >
                <span style={{ color: indicator.enabled ? indicator.color : 'inherit' }}>■</span> {indicator.name}
              </button>
            ))}
            <div className="w-px bg-[#1a1a1a] mx-2" />
            <button
              onClick={() => setShowRSI(!showRSI)}
              className={`px-3 py-1 text-xs font-mono border ${showRSI ? 'border-[#ff00ff] text-[#ff00ff] bg-[#ff00ff]/10' : 'border-[#1a1a1a] text-[#4a4a4a]'}`}
            >
              RSI
            </button>
            <button
              onClick={() => setShowMACD(!showMACD)}
              className={`px-3 py-1 text-xs font-mono border ${showMACD ? 'border-[#00f0ff] text-[#00f0ff] bg-[#00f0ff]/10' : 'border-[#1a1a1a] text-[#4a4a4a]'}`}
            >
              MACD
            </button>
          </div>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          
          {/* Chart Area */}
          <div className="xl:col-span-3 space-y-6">
            <div className="border-2 border-[#1a1a1a] bg-[#050505] relative group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00f0ff] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="p-4 flex justify-between items-center border-b border-[#1a1a1a]">
                <div className="text-xs font-mono text-[#888] uppercase flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#ccff00]" />
                  Main_Chart_View
                </div>
                <button className="text-[#4a4a4a] hover:text-white transition-colors">
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
              
              <div className="p-2">
                <div ref={chartContainerRef} className="w-full h-[500px]" />
              </div>
            </div>

            {showRSI && (
              <div className="border-2 border-[#1a1a1a] bg-[#050505] p-2">
                <div className="text-[10px] font-mono text-[#ff00ff] mb-2 px-2 flex justify-between">
                  <span>RELATIVE_STRENGTH_INDEX // 14</span>
                  <span className="text-[#4a4a4a]">OS: 30 / OB: 70</span>
                </div>
                <div ref={rsiContainerRef} className="w-full h-[120px]" />
              </div>
            )}

            {showMACD && (
              <div className="border-2 border-[#1a1a1a] bg-[#050505] p-2">
                <div className="text-[10px] font-mono text-[#00f0ff] mb-2 px-2 flex gap-4">
                  <span>MACD // 12,26,9</span>
                  <span className="text-[#e0e0e0]">MACD</span>
                  <span className="text-[#ff00ff]">SIGNAL</span>
                  <span className="text-[#00f0ff]">HISTOGRAM</span>
                </div>
                <div ref={macdContainerRef} className="w-full h-[150px]" />
              </div>
            )}
          </div>

          {/* Sidebar Stats */}
          <div className="space-y-6">
            {/* Market Data Panel */}
            <div className="border-2 border-[#1a1a1a] bg-[#0a0a0a]">
              <div className="bg-[#1a1a1a] p-3 text-xs font-mono font-bold uppercase tracking-widest border-b border-[#1a1a1a]">
                Market_Data.sys
              </div>
              <div className="p-4 space-y-4 font-mono">
                <div>
                  <div className="text-[10px] text-[#888] mb-1">24H_HIGH</div>
                  <div className="text-xl text-[#ccff00]">${high24h.toFixed(4)}</div>
                </div>
                <div className="w-full h-px bg-[#1a1a1a]" />
                <div>
                  <div className="text-[10px] text-[#888] mb-1">24H_LOW</div>
                  <div className="text-xl text-[#ff003c]">${low24h.toFixed(4)}</div>
                </div>
                <div className="w-full h-px bg-[#1a1a1a]" />
                <div>
                  <div className="text-[10px] text-[#888] mb-1">24H_VOLUME</div>
                  <div className="text-xl text-[#00f0ff]">${(volume24h / 1000000).toFixed(2)}M</div>
                </div>
              </div>
            </div>

            {/* Analysis Panel */}
            <div className="border-2 border-[#1a1a1a] bg-[#0a0a0a]">
               <div className="bg-[#1a1a1a] p-3 text-xs font-mono font-bold uppercase tracking-widest border-b border-[#1a1a1a] flex justify-between items-center">
                <span>Analysis.log</span>
                <span className="animate-pulse w-2 h-2 bg-[#ccff00]" />
              </div>
              <div className="p-4 space-y-6 font-mono text-sm">
                
                {/* Trend */}
                <div>
                  <div className="text-[#888] mb-2 uppercase text-xs flex items-center gap-2">
                    <TrendingUp className="w-3 h-3" /> Trend
                  </div>
                  <div className="flex justify-between border-b border-[#1a1a1a] py-1">
                    <span>Status</span>
                    <span className={priceChange >= 0 ? 'text-[#ccff00]' : 'text-[#ff003c]'}>
                      {priceChange >= 0 ? 'BULLISH' : 'BEARISH'}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-[#1a1a1a] py-1">
                    <span>SMA20</span>
                    <span className={currentPrice > (calculateSMA(ohlcData, 20).slice(-1)[0]?.value || 0) ? 'text-[#ccff00]' : 'text-[#ff003c]'}>
                      {currentPrice > (calculateSMA(ohlcData, 20).slice(-1)[0]?.value || 0) ? 'ABOVE' : 'BELOW'}
                    </span>
                  </div>
                </div>

                {/* Momentum */}
                <div>
                  <div className="text-[#888] mb-2 uppercase text-xs flex items-center gap-2">
                    <Zap className="w-3 h-3" /> Momentum
                  </div>
                  <div className="flex justify-between border-b border-[#1a1a1a] py-1">
                    <span>RSI</span>
                    <span className="text-[#ff00ff]">
                      {calculateRSI(ohlcData).slice(-1)[0]?.value.toFixed(1) || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-[#1a1a1a] py-1">
                    <span>MACD</span>
                    <span className={calculateMACD(ohlcData).macd.slice(-1)[0]?.value >= 0 ? 'text-[#ccff00]' : 'text-[#ff003c]'}>
                      {calculateMACD(ohlcData).macd.slice(-1)[0]?.value >= 0 ? 'POS' : 'NEG'}
                    </span>
                  </div>
                </div>

              </div>
            </div>

            {/* Refresh Button */}
            <button
              onClick={async () => {
                setIsLoading(true);
                try {
                  const currentPrice = await fetchCurrentPrice(selectedToken.coingeckoId);
                  setOhlcData(generateOHLCData(selectedTimeframe.days, currentPrice));
                } catch {
                  const fallbackPrice = getFallbackPrice(selectedToken.coingeckoId);
                  setOhlcData(generateOHLCData(selectedTimeframe.days, fallbackPrice));
                } finally {
                  setIsLoading(false);
                }
              }}
              className="w-full py-4 border-2 border-[#1a1a1a] bg-[#050505] hover:bg-[#1a1a1a] hover:border-[#e0e0e0] transition-colors font-mono uppercase text-sm flex items-center justify-center gap-3 group"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#00f0ff]' : 'text-[#4a4a4a] group-hover:text-white'}`} />
              <span>{isLoading ? 'SYNCING...' : 'FORCE_SYNC'}</span>
            </button>
          </div>

        </div>
      </main>
    </div>
  );
};

export default ChartsPage;
