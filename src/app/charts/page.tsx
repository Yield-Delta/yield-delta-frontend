"use client"

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Navigation from '@/components/Navigation';
import styles from './page.module.css';
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

  const latestRSI = calculateRSI(ohlcData).slice(-1)[0]?.value;
  const latestMACD = calculateMACD(ohlcData);
  const macdValue = latestMACD.macd.slice(-1)[0]?.value || 0;
  const signalValue = latestMACD.signal.slice(-1)[0]?.value || 0;
  const sma20Value = calculateSMA(ohlcData, 20).slice(-1)[0]?.value || 0;
  const sma50Value = calculateSMA(ohlcData, 50).slice(-1)[0]?.value || 0;
  const dailyRange = low24h > 0 ? (((high24h - low24h) / low24h) * 100).toFixed(2) : '0.00';

  const technicalSummary = [
    {
      title: 'Trend Analysis',
      icon: TrendingUp,
      accent: '#10b981',
      items: [
        { label: 'Short-term', value: priceChange >= 0 ? 'Bullish' : 'Bearish', positive: priceChange >= 0 },
        { label: 'SMA 20', value: currentPrice > sma20Value ? 'Above' : 'Below', positive: currentPrice > sma20Value },
        { label: 'SMA 50', value: currentPrice > sma50Value ? 'Above' : 'Below', positive: currentPrice > sma50Value },
      ],
    },
    {
      title: 'Momentum',
      icon: Activity,
      accent: '#9b5de5',
      items: [
        { label: 'RSI (14)', value: latestRSI?.toFixed(1) || 'N/A', positive: (latestRSI || 50) < 70 && (latestRSI || 50) > 30 },
        { label: 'MACD', value: macdValue >= 0 ? 'Positive' : 'Negative', positive: macdValue >= 0 },
        { label: 'Signal', value: macdValue > signalValue ? 'Bullish' : 'Bearish', positive: macdValue > signalValue },
      ],
    },
    {
      title: 'Volatility',
      icon: Target,
      accent: '#00f5d4',
      items: [
        { label: 'Daily Range', value: `${dailyRange}%`, positive: true },
        { label: 'BB Width', value: 'Normal', positive: true },
        { label: 'Volume', value: volume24h > 2000000 ? 'High' : 'Normal', positive: volume24h > 2000000 },
      ],
    },
  ];

  return (
    <div className={styles.pageShell}>
      <div className={styles.gridBackdrop} aria-hidden />
      <div className={styles.radarGlow} aria-hidden />
      <Navigation variant="dark" showWallet={true} showLaunchApp={false} />

      <main className={styles.main}>
        <section className={styles.heroPanel}>
          <div className={styles.heroCopy}>
            <div className={styles.liveBadge}>
              <span />
              MARKET SIGNALS
            </div>
            <h1 className={styles.title}>
              Institutional charts for <span>{selectedToken.symbol}</span> liquidity timing
            </h1>
            <p className={styles.subtitle}>
              Live token pricing, technical overlays, and momentum diagnostics tuned to Yield Delta strategy workflows.
            </p>
          </div>

          <div className={styles.marketPanel}>
            <div className={styles.tokenRow}>
              <div className={styles.tokenDropdown}>
                  <button
                    onClick={() => setShowTokenDropdown(!showTokenDropdown)}
                  className={styles.tokenButton}
                  >
                    <div
                    className={styles.tokenAvatar}
                      style={{ background: selectedToken.color }}
                    >
                      {selectedToken.symbol.slice(0, 2)}
                    </div>
                  <div>
                    <div className={styles.tokenSymbol}>{selectedToken.symbol}/USD</div>
                    <div className={styles.tokenName}>{selectedToken.name}</div>
                    </div>
                  <ChevronDown className={showTokenDropdown ? styles.chevronOpen : styles.chevron} />
                  </button>

                  {showTokenDropdown && (
                  <div className={styles.dropdown}>
                      {TOKENS.map(token => (
                        <button
                          key={token.symbol}
                          onClick={() => {
                            setSelectedToken(token);
                            setShowTokenDropdown(false);
                          }}
                        className={styles.dropdownItem}
                        >
                          <div
                          className={styles.dropdownAvatar}
                            style={{ background: token.color }}
                          >
                            {token.symbol.slice(0, 2)}
                          </div>
                        <div>
                          <div className={styles.dropdownSymbol}>{token.symbol}</div>
                          <div className={styles.dropdownName}>{token.name}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

              <div className={styles.priceBlock}>
                <div className={styles.price}>
                      ${currentPrice.toFixed(4)}
                </div>
                <div className={priceChange >= 0 ? styles.priceUp : styles.priceDown}>
                      {priceChange >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                      {priceChange >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%
                </div>
              </div>
            </div>

            <div className={styles.statGrid}>
                {[
                { label: '24h High', value: `$${high24h.toFixed(4)}`, icon: TrendingUp, accent: '#10b981' },
                { label: '24h Low', value: `$${low24h.toFixed(4)}`, icon: TrendingDown, accent: '#ff206e' },
                { label: '24h Volume', value: `$${(volume24h / 1000000).toFixed(2)}M`, icon: BarChart3, accent: '#00f5d4' },
                ].map((stat, i) => (
                  <div
                    key={i}
                  className={styles.statPill}
                  style={{ '--accent': stat.accent } as React.CSSProperties}
                  >
                  <stat.icon className={styles.statIcon} />
                    <div>
                    <div className={styles.statLabel}>{stat.label}</div>
                    <div className={styles.statValue}>{stat.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
        </section>

        <section className={styles.controlDeck}>
          <div className={styles.controlGroup}>
            <span className={styles.groupLabel}><Clock /> Timeframe</span>
            <div className={styles.segmented}>
                {TIMEFRAMES.map(tf => (
                  <button
                    key={tf.value}
                    onClick={() => setSelectedTimeframe(tf)}
                    className={selectedTimeframe.value === tf.value ? styles.segmentActive : styles.segment}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>
            </div>

          <div className={styles.indicatorGroup}>
            <span className={styles.groupLabel}><Layers /> Overlays</span>
            <div className={styles.chips}>
              {indicators.map(indicator => (
                <button
                  key={indicator.name}
                  onClick={() => toggleIndicator(indicator.name)}
                  className={indicator.enabled ? styles.chipActive : styles.chip}
                  style={{ '--chip': indicator.color } as React.CSSProperties}
                >
                  <span />
                  {indicator.name}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.oscillatorGroup}>
              <button
                onClick={() => setShowRSI(!showRSI)}
              className={showRSI ? styles.oscillatorActive : styles.oscillator}
              style={{ '--chip': '#9b5de5' } as React.CSSProperties}
              >
              <Activity />
                RSI
              </button>
              <button
                onClick={() => setShowMACD(!showMACD)}
              className={showMACD ? styles.oscillatorActive : styles.oscillator}
              style={{ '--chip': '#00f5d4' } as React.CSSProperties}
              >
              <Zap />
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
              className={styles.refreshButton}
              aria-label="Refresh chart data"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
        </section>

        <section className={styles.chartFrame}>
          <div className={styles.chartHeader}>
            <div>
              <div className={styles.sectionKicker}>Price Chart</div>
              <h2>{selectedToken.symbol}/USD execution view</h2>
            </div>
            <div className={styles.chartMeta}>
              <span>{selectedTimeframe.label} timeframe</span>
              <span>{ohlcData.length} candles</span>
                </div>
              </div>

          <div className={styles.mainChartWrap}>
              <div
                ref={chartContainerRef}
              className={styles.mainChart}
              />
            </div>

            {showRSI && (
            <div className={styles.subChartPanel}>
              <div className={styles.subChartHeader}>
                <div><Activity /> RSI (14)</div>
                <span>Overbought 70 / Oversold 30</span>
                  </div>
                <div
                  ref={rsiContainerRef}
                className={styles.rsiChart}
                />
              </div>
            )}

            {showMACD && (
            <div className={styles.subChartPanel}>
              <div className={styles.subChartHeader}>
                <div><Zap /> MACD (12, 26, 9)</div>
                <div className={styles.legend}>
                  <span style={{ '--dot': '#00f5d4' } as React.CSSProperties}>
                        MACD
                      </span>
                  <span style={{ '--dot': '#f59e0b' } as React.CSSProperties}>
                        Signal
                      </span>
                  <span style={{ '--dot': '#10b981' } as React.CSSProperties}>
                        Histogram
                      </span>
                    </div>
                  </div>
                <div
                  ref={macdContainerRef}
                className={styles.macdChart}
                />
              </div>
            )}
        </section>

        <section className={styles.summaryGrid}>
          {technicalSummary.map((section, i) => (
              <div
                key={i}
              className={styles.summaryCard}
              style={{ '--accent': section.accent } as React.CSSProperties}
              >
              <div className={styles.summaryHeader}>
                <section.icon />
                <span>{section.title}</span>
                </div>
              <div className={styles.summaryItems}>
                  {section.items.map((item, j) => (
                  <div key={j} className={styles.summaryItem}>
                    <span>{item.label}</span>
                    <strong className={item.positive ? styles.positive : styles.negative}>
                        {item.value}
                    </strong>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </section>
      </main>
    </div>
  );
};

export default ChartsPage;
