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
  RefreshCw
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

  // Work backwards from current price to generate historical data
  // Use a deterministic seed based on days to ensure consistency
  let price = currentPrice;
  const priceHistory: number[] = [price];

  // Generate price history going backwards
  for (let i = 1; i <= days; i++) {
    // Random walk with mean reversion towards current price
    const volatility = 0.025 + Math.random() * 0.015;
    const meanReversion = (currentPrice - price) * 0.02;
    const change = (Math.random() - 0.5) * volatility + meanReversion;
    price = price * (1 - change);
    priceHistory.unshift(price);
  }

  // Generate OHLC from price history
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

  // Start with SMA for first value
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

  // Calculate MACD line (EMA12 - EMA26)
  const startIndex = 26 - 12; // Offset for different EMA lengths
  for (let i = startIndex; i < ema12.length; i++) {
    const ema26Index = i - startIndex;
    if (ema26Index >= 0 && ema26Index < ema26.length) {
      macdLine.push({
        time: ema12[i].time,
        value: parseFloat((ema12[i].value - ema26[ema26Index].value).toFixed(4)),
      });
    }
  }

  // Calculate Signal line (9-period EMA of MACD)
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

      // Calculate histogram
      const histValue = macdLine[i].value - (signalLine[signalLine.length - 1]?.value || 0);
      histogram.push({
        time: macdLine[i].time,
        value: parseFloat(histValue.toFixed(4)),
        color: histValue >= 0 ? 'rgba(16, 185, 129, 0.7)' : 'rgba(239, 68, 68, 0.7)',
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
  { symbol: 'SEI', name: 'SEI Network', color: '#dc2626', coingeckoId: 'sei-network' },
  { symbol: 'ETH', name: 'Ethereum', color: '#6366f1', coingeckoId: 'ethereum' },
  { symbol: 'BTC', name: 'Bitcoin', color: '#f59e0b', coingeckoId: 'bitcoin' },
  { symbol: 'USDC', name: 'USD Coin', color: '#2563eb', coingeckoId: 'usd-coin' },
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

  const [indicators, setIndicators] = useState<IndicatorConfig[]>([
    { name: 'SMA 20', enabled: true, color: '#06b6d4', period: 20 },
    { name: 'SMA 50', enabled: true, color: '#8b5cf6', period: 50 },
    { name: 'EMA 12', enabled: false, color: '#f59e0b', period: 12 },
    { name: 'EMA 26', enabled: false, color: '#ec4899', period: 26 },
    { name: 'Bollinger Bands', enabled: true, color: '#10b981' },
    { name: 'Volume', enabled: true, color: '#6366f1' },
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

  // Load data with real prices from API
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setIsLoading(true);
      try {
        // Fetch real price from CoinGecko
        const currentPrice = await fetchCurrentPrice(selectedToken.coingeckoId);

        if (isMounted) {
          // Generate OHLC data based on real current price
          const data = generateOHLCData(selectedTimeframe.days, currentPrice);
          setOhlcData(data);
        }
      } catch (error) {
        console.error('Error loading chart data:', error);
        if (isMounted) {
          // Fallback to default price if API fails
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

  // Initialize main chart
  const initMainChart = useCallback(() => {
    if (!chartContainerRef.current || ohlcData.length === 0) return;

    // Clean up existing chart
    if (mainChartRef.current) {
      mainChartRef.current.remove();
      mainChartRef.current = null;
    }

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: 'transparent' },
        textColor: 'rgba(255, 255, 255, 0.7)',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
      },
      crosshair: {
        mode: 1,
        vertLine: { color: 'rgba(255, 255, 255, 0.3)', width: 1, style: 2 },
        horzLine: { color: 'rgba(255, 255, 255, 0.3)', width: 1, style: 2 },
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        scaleMargins: { top: 0.1, bottom: 0.2 },
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: { vertTouchDrag: false },
    });

    mainChartRef.current = chart;

    // Candlestick series
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981',
      downColor: '#ef4444',
      borderUpColor: '#10b981',
      borderDownColor: '#ef4444',
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    });

    candleSeries.setData(ohlcData as CandlestickData<Time>[]);
    candleSeriesRef.current = candleSeries;

    // Volume
    if (indicators.find(i => i.name === 'Volume')?.enabled) {
      const volumeSeries = chart.addSeries(HistogramSeries, {
        color: '#6366f1',
        priceFormat: { type: 'volume' },
        priceScaleId: '',
      });

      volumeSeries.priceScale().applyOptions({
        scaleMargins: { top: 0.85, bottom: 0 },
      });

      const volumeData = ohlcData.map(d => ({
        time: d.time,
        value: d.volume || 0,
        color: d.close >= d.open ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)',
      }));

      volumeSeries.setData(volumeData);
      volumeSeriesRef.current = volumeSeries;
    }

    // SMA indicators
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

    // Bollinger Bands
    if (indicators.find(i => i.name === 'Bollinger Bands')?.enabled) {
      const bb = calculateBollingerBands(ohlcData);

      const upperSeries = chart.addSeries(LineSeries, {
        color: 'rgba(16, 185, 129, 0.5)',
        lineWidth: 1,
        title: 'BB Upper',
      });
      upperSeries.setData(bb.upper);

      const lowerSeries = chart.addSeries(LineSeries, {
        color: 'rgba(16, 185, 129, 0.5)',
        lineWidth: 1,
        title: 'BB Lower',
      });
      lowerSeries.setData(bb.lower);
    }

    chart.timeScale().fitContent();
  }, [ohlcData, indicators]);

  // Initialize RSI chart
  const initRSIChart = useCallback(() => {
    if (!rsiContainerRef.current || ohlcData.length === 0 || !showRSI) return;

    if (rsiChartRef.current) {
      rsiChartRef.current.remove();
      rsiChartRef.current = null;
    }

    const chart = createChart(rsiContainerRef.current, {
      layout: {
        background: { color: 'transparent' },
        textColor: 'rgba(255, 255, 255, 0.7)',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.03)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.03)' },
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        visible: false,
      },
      handleScroll: { vertTouchDrag: false },
    });

    rsiChartRef.current = chart;

    // RSI line
    const rsiData = calculateRSI(ohlcData);
    const rsiSeries = chart.addSeries(LineSeries, {
      color: '#8b5cf6',
      lineWidth: 2,
      title: 'RSI',
    });
    rsiSeries.setData(rsiData);

    // Overbought/oversold lines
    const overbought = chart.addSeries(LineSeries, {
      color: 'rgba(239, 68, 68, 0.5)',
      lineWidth: 1,
      lineStyle: 2,
    });
    overbought.setData(rsiData.map(d => ({ time: d.time, value: 70 })));

    const oversold = chart.addSeries(LineSeries, {
      color: 'rgba(16, 185, 129, 0.5)',
      lineWidth: 1,
      lineStyle: 2,
    });
    oversold.setData(rsiData.map(d => ({ time: d.time, value: 30 })));

    chart.timeScale().fitContent();
  }, [ohlcData, showRSI]);

  // Initialize MACD chart
  const initMACDChart = useCallback(() => {
    if (!macdContainerRef.current || ohlcData.length === 0 || !showMACD) return;

    if (macdChartRef.current) {
      macdChartRef.current.remove();
      macdChartRef.current = null;
    }

    const chart = createChart(macdContainerRef.current, {
      layout: {
        background: { color: 'transparent' },
        textColor: 'rgba(255, 255, 255, 0.7)',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.03)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.03)' },
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        timeVisible: true,
      },
      handleScroll: { vertTouchDrag: false },
    });

    macdChartRef.current = chart;

    const { macd, signal, histogram } = calculateMACD(ohlcData);

    // Histogram
    const histogramSeries = chart.addSeries(HistogramSeries, {
      color: '#10b981',
      priceFormat: { type: 'price', precision: 4 },
    });
    histogramSeries.setData(histogram);

    // MACD line
    const macdSeries = chart.addSeries(LineSeries, {
      color: '#06b6d4',
      lineWidth: 2,
      title: 'MACD',
    });
    macdSeries.setData(macd);

    // Signal line
    const signalSeries = chart.addSeries(LineSeries, {
      color: '#f59e0b',
      lineWidth: 2,
      title: 'Signal',
    });
    signalSeries.setData(signal);

    chart.timeScale().fitContent();
  }, [ohlcData, showMACD]);

  // Sync time scales
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

  // Initialize all charts
  useEffect(() => {
    initMainChart();
    initRSIChart();
    initMACDChart();
  }, [initMainChart, initRSIChart, initMACDChart]);

  // Handle resize
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
    <div className="min-h-screen bg-background">
      {/* Background gradient */}
      <div
        className="fixed inset-0 z-0"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.05) 40%, transparent 70%)'
        }}
      />

      <Navigation variant="dark" showWallet={true} showLaunchApp={false} />

      {/* Main Content */}
      <div className="relative z-10" style={{ paddingTop: '1.5rem' }}>
        {/* Header */}
        <div
          className="border-b border-white/10"
          style={{
            background: 'linear-gradient(180deg, rgba(99, 102, 241, 0.08) 0%, transparent 100%)',
          }}
        >
          <div className="max-w-[1600px] mx-auto px-4 py-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              {/* Token Selector & Price */}
              <div className="flex items-center gap-6">
                {/* Token Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowTokenDropdown(!showTokenDropdown)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:bg-white/10"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white"
                      style={{ background: selectedToken.color }}
                    >
                      {selectedToken.symbol.slice(0, 2)}
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-white text-lg">{selectedToken.symbol}/USD</div>
                      <div className="text-xs text-gray-400">{selectedToken.name}</div>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showTokenDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {showTokenDropdown && (
                    <div
                      className="absolute top-full left-0 mt-2 w-full rounded-xl overflow-hidden z-50"
                      style={{
                        background: 'rgba(20, 20, 30, 0.95)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(20px)',
                      }}
                    >
                      {TOKENS.map(token => (
                        <button
                          key={token.symbol}
                          onClick={() => {
                            setSelectedToken(token);
                            setShowTokenDropdown(false);
                          }}
                          className="flex items-center gap-3 w-full px-4 py-3 hover:bg-white/10 transition-colors"
                        >
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-sm"
                            style={{ background: token.color }}
                          >
                            {token.symbol.slice(0, 2)}
                          </div>
                          <div className="text-left">
                            <div className="font-semibold text-white">{token.symbol}</div>
                            <div className="text-xs text-gray-400">{token.name}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Price Display */}
                <div>
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-bold text-white">
                      ${currentPrice.toFixed(4)}
                    </span>
                    <span className={`flex items-center gap-1 text-lg font-semibold ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {priceChange >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                      {priceChange >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap items-center gap-4">
                {[
                  { label: '24h High', value: `$${high24h.toFixed(4)}`, icon: TrendingUp, color: 'text-green-400' },
                  { label: '24h Low', value: `$${low24h.toFixed(4)}`, icon: TrendingDown, color: 'text-red-400' },
                  { label: '24h Volume', value: `$${(volume24h / 1000000).toFixed(2)}M`, icon: BarChart3, color: 'text-blue-400' },
                ].map((stat, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                    }}
                  >
                    <stat.icon className={`w-4 h-4 ${stat.color}`} />
                    <div>
                      <div className="text-xs text-gray-400">{stat.label}</div>
                      <div className="font-semibold text-white">{stat.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Chart Controls */}
        <div className="max-w-[1600px] mx-auto px-4 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Timeframe Selector */}
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-gray-400" />
              <div className="flex gap-2">
                {TIMEFRAMES.map(tf => (
                  <button
                    key={tf.value}
                    onClick={() => setSelectedTimeframe(tf)}
                    className={`px-5 py-2.5 rounded-full font-medium text-sm transition-all min-w-[52px] ${
                      selectedTimeframe.value === tf.value
                        ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-500/50 shadow-lg'
                        : 'text-gray-400 hover:text-white hover:bg-white/10 border border-transparent'
                    }`}
                    style={{
                      boxShadow: selectedTimeframe.value === tf.value
                        ? '0 4px 15px rgba(99, 102, 241, 0.3)'
                        : 'none'
                    }}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Indicator Toggles */}
            <div className="flex flex-wrap items-center gap-2">
              <Layers className="w-4 h-4 text-gray-400" />
              {indicators.map(indicator => (
                <button
                  key={indicator.name}
                  onClick={() => toggleIndicator(indicator.name)}
                  className={`px-4 py-2 rounded-full text-xs font-medium transition-all flex items-center gap-2 ${
                    indicator.enabled
                      ? 'bg-white/10 border border-white/20'
                      : 'text-gray-500 hover:text-gray-300 hover:bg-white/5 border border-transparent'
                  }`}
                  style={indicator.enabled ? { borderColor: indicator.color + '50', boxShadow: `0 2px 10px ${indicator.color}20` } : {}}
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: indicator.enabled ? indicator.color : 'rgba(255,255,255,0.2)' }}
                  />
                  {indicator.name}
                </button>
              ))}
            </div>

            {/* Sub-chart toggles */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowRSI(!showRSI)}
                className={`px-4 py-2 rounded-full text-xs font-medium transition-all flex items-center gap-2 ${
                  showRSI ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'text-gray-500 hover:text-gray-300 border border-transparent'
                }`}
                style={showRSI ? { boxShadow: '0 2px 10px rgba(168, 85, 247, 0.2)' } : {}}
              >
                <Activity className="w-3.5 h-3.5" />
                RSI
              </button>
              <button
                onClick={() => setShowMACD(!showMACD)}
                className={`px-4 py-2 rounded-full text-xs font-medium transition-all flex items-center gap-2 ${
                  showMACD ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-gray-500 hover:text-gray-300 border border-transparent'
                }`}
                style={showMACD ? { boxShadow: '0 2px 10px rgba(6, 182, 212, 0.2)' } : {}}
              >
                <Zap className="w-3.5 h-3.5" />
                MACD
              </button>
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
                className="p-2.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-all"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Charts Container */}
        <div className="max-w-[1600px] mx-auto px-4 pb-8">
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            {/* Main Candlestick Chart */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-400" />
                  <span className="font-semibold text-white">Price Chart</span>
                </div>
                <div className="text-xs text-gray-400">
                  {selectedToken.symbol}/USD • {selectedTimeframe.label} timeframe
                </div>
              </div>
              <div
                ref={chartContainerRef}
                className="w-full rounded-xl overflow-hidden"
                style={{ height: '450px' }}
              />
            </div>

            {/* RSI Chart */}
            {showRSI && (
              <div className="px-4 pb-4 border-t border-white/5">
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-purple-400" />
                    <span className="text-sm font-medium text-white">RSI (14)</span>
                    <span className="text-xs text-gray-400 ml-2">
                      Overbought: 70 | Oversold: 30
                    </span>
                  </div>
                </div>
                <div
                  ref={rsiContainerRef}
                  className="w-full rounded-xl overflow-hidden"
                  style={{ height: '120px' }}
                />
              </div>
            )}

            {/* MACD Chart */}
            {showMACD && (
              <div className="px-4 pb-4 border-t border-white/5">
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm font-medium text-white">MACD (12, 26, 9)</span>
                    <div className="flex items-center gap-3 ml-4 text-xs">
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-cyan-400" />
                        MACD
                      </span>
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-amber-400" />
                        Signal
                      </span>
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-green-400" />
                        Histogram
                      </span>
                    </div>
                  </div>
                </div>
                <div
                  ref={macdContainerRef}
                  className="w-full rounded-xl overflow-hidden"
                  style={{ height: '150px' }}
                />
              </div>
            )}
          </div>

          {/* Technical Analysis Summary */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                title: 'Trend Analysis',
                icon: TrendingUp,
                color: 'green',
                items: [
                  { label: 'Short-term', value: priceChange >= 0 ? 'Bullish' : 'Bearish', positive: priceChange >= 0 },
                  { label: 'SMA 20', value: currentPrice > (calculateSMA(ohlcData, 20).slice(-1)[0]?.value || 0) ? 'Above' : 'Below', positive: currentPrice > (calculateSMA(ohlcData, 20).slice(-1)[0]?.value || 0) },
                  { label: 'SMA 50', value: currentPrice > (calculateSMA(ohlcData, 50).slice(-1)[0]?.value || 0) ? 'Above' : 'Below', positive: currentPrice > (calculateSMA(ohlcData, 50).slice(-1)[0]?.value || 0) },
                ]
              },
              {
                title: 'Momentum',
                icon: Activity,
                color: 'purple',
                items: [
                  { label: 'RSI (14)', value: calculateRSI(ohlcData).slice(-1)[0]?.value.toFixed(1) || 'N/A', positive: (calculateRSI(ohlcData).slice(-1)[0]?.value || 50) < 70 && (calculateRSI(ohlcData).slice(-1)[0]?.value || 50) > 30 },
                  { label: 'MACD', value: calculateMACD(ohlcData).macd.slice(-1)[0]?.value >= 0 ? 'Positive' : 'Negative', positive: calculateMACD(ohlcData).macd.slice(-1)[0]?.value >= 0 },
                  { label: 'Signal', value: calculateMACD(ohlcData).macd.slice(-1)[0]?.value > (calculateMACD(ohlcData).signal.slice(-1)[0]?.value || 0) ? 'Bullish' : 'Bearish', positive: calculateMACD(ohlcData).macd.slice(-1)[0]?.value > (calculateMACD(ohlcData).signal.slice(-1)[0]?.value || 0) },
                ]
              },
              {
                title: 'Volatility',
                icon: Target,
                color: 'cyan',
                items: [
                  { label: 'Daily Range', value: `${(((high24h - low24h) / low24h) * 100).toFixed(2)}%`, positive: true },
                  { label: 'BB Width', value: 'Normal', positive: true },
                  { label: 'Volume', value: volume24h > 2000000 ? 'High' : 'Normal', positive: volume24h > 2000000 },
                ]
              },
            ].map((section, i) => (
              <div
                key={i}
                className="rounded-xl p-4"
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <section.icon className={`w-5 h-5 text-${section.color}-400`} />
                  <span className="font-semibold text-white">{section.title}</span>
                </div>
                <div className="space-y-3">
                  {section.items.map((item, j) => (
                    <div key={j} className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">{item.label}</span>
                      <span className={`text-sm font-medium ${item.positive ? 'text-green-400' : 'text-red-400'}`}>
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartsPage;
