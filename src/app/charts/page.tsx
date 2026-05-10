"use client"

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Navigation from '@/components/Navigation';
import GlassCard from '@/components/GlassCard';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './terminal.module.css';
import {
  TrendingUp,
  Activity,
  Zap,
  ChevronDown,
  RefreshCw,
  Maximize2,
  BarChart3,
  Clock,
  Layers,
  Settings2,
  ShieldCheck,
  Cpu,
  Globe,
  Terminal,
  Database,
  Wifi,
  Radio
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
        color: histValue >= 0 ? colors.up : colors.down,
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
  { symbol: 'SEI', name: 'SEI Network', color: '#00f5d4', coingeckoId: 'sei-network' },
  { symbol: 'ETH', name: 'Ethereum', color: '#9b5de5', coingeckoId: 'ethereum' },
  { symbol: 'BTC', name: 'Bitcoin', color: '#f59e0b', coingeckoId: 'bitcoin' },
  { symbol: 'USDC', name: 'USD Coin', color: '#3b82f6', coingeckoId: 'usd-coin' },
];

const TIMEFRAMES = [
  { label: '1H', value: '1h', days: 7 },
  { label: '4H', value: '4h', days: 30 },
  { label: '1D', value: '1d', days: 90 },
  { label: '1W', value: '1w', days: 365 },
];

// Cyberpunk inspired colors - aligned with Yield Delta V2
const colors = {
  bg: '#020617', // slate-950
  text: '#f8fafc', // slate-50
  grid: 'rgba(255, 255, 255, 0.05)',
  up: '#10b981', // emerald-500
  down: '#ef4444', // red-500
  accent1: '#00f5d4', // brand cyan
  accent2: '#9b5de5', // brand purple
  accent3: '#ff206e', // brand pink
  muted: '#64748b'  // slate-400
};

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
        fontFamily: "'DM Mono', monospace",
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
        fontFamily: "'DM Mono', monospace",
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
        fontFamily: "'DM Mono', monospace",
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1] as const
      }
    }
  };

  const CornerBrackets = () => (
    <>
      <div className={`${styles.cornerBracket} ${styles.topLeft}`} />
      <div className={`${styles.cornerBracket} ${styles.topRight}`} />
      <div className={`${styles.cornerBracket} ${styles.bottomLeft}`} />
      <div className={`${styles.cornerBracket} ${styles.bottomRight}`} />
    </>
  );

  const ActivityLog = () => {
    const logs = [
      { time: '14:22:04', event: 'FETCHING_CANDLE_BATCH_v3', status: 'OK' },
      { time: '14:22:05', event: 'UPLINK_ESTABLISHED_NODE_07', status: 'OK' },
      { time: '14:22:08', event: 'COMPUTING_SMA_CROSSOVER', status: 'CALC' },
      { time: '14:22:12', event: 'WS_HEARTBEAT_ACK', status: 'OK' },
      { time: '14:22:15', event: 'INJECTING_ALPHA_VECTORS', status: 'OK' },
    ];

    return (
      <div className={styles.logContainer}>
        <div className="absolute top-0 right-4 text-[7px] text-[#00f5d4]/30 uppercase font-mono">SYS_LOG_PIPE</div>
        {logs.map((log, i) => (
          <div key={i} className={styles.logEntry}>
            <span className={styles.logTimestamp}>[{log.time}]</span>
            <span className="text-[#00f5d4]/40">$</span>
            <span className="flex-1">{log.event}</span>
            <span className="text-[#00f5d4]">{log.status}</span>
          </div>
        ))}
        <motion.div 
          animate={{ opacity: [0.2, 0.8, 0.2] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="mt-2 text-[#00f5d4] flex items-center gap-1"
        >
          <span className="w-1.5 h-3 bg-[#00f5d4]" />
          <span>LISTENING_FOR_EVENTS...</span>
        </motion.div>
      </div>
    );
  };

  return (
    <div className="min-h-[100dvh] bg-[#020617] text-slate-50 font-sans selection:bg-[#00f5d4] selection:text-black overflow-x-hidden relative">
      {/* Premium Atmospheric Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Dynamic Mesh Gradients */}
        <div 
          className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-[#00f5d4]/10 blur-[120px] rounded-full animate-pulse" 
          style={{ animationDuration: '8s' }}
        />
        <div 
          className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#9b5de5]/10 blur-[150px] rounded-full animate-pulse" 
          style={{ animationDuration: '12s', animationDelay: '2s' }}
        />
        <div 
          className="absolute top-[30%] right-[10%] w-[40%] h-[40%] bg-[#ff206e]/5 blur-[100px] rounded-full animate-pulse" 
          style={{ animationDuration: '15s', animationDelay: '5s' }}
        />
        
        {/* Animated Grid */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(to right, #ffffff 1px, transparent 1px),
              linear-gradient(to bottom, #ffffff 1px, transparent 1px)
            `,
            backgroundSize: '80px 80px',
            maskImage: 'radial-gradient(circle at center, black, transparent 80%)'
          }}
        />
      </div>
      
      {/* High-Fidelity Grain Overlay */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.05] z-[1] mix-blend-overlay"
        style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")'
        }}
      />
      <div className={styles.terminalOverlay} />
      <div className={styles.scanline} />

      <Navigation variant="dark" showWallet={true} showLaunchApp={false} />

      {/* HUD Edge Indicators */}
      <div className="fixed top-24 left-8 z-20 pointer-events-none hidden xl:flex flex-col gap-6">
        <div className={styles.hudLabel}><Database className="w-3 h-3" /> BUFFER_STATUS: OPTIMAL</div>
        <div className={styles.hudLabel}><Wifi className="w-3 h-3" /> NODE_LATENCY: 22MS</div>
      </div>
      <div className="fixed top-24 right-8 z-20 pointer-events-none hidden xl:flex flex-col gap-6 items-end">
        <div className={styles.hudLabel}>ENCRYPTION: AES-256 <ShieldCheck className="w-3 h-3" /></div>
        <div className={styles.hudLabel}>SIGNAL_STRENGTH: 100% <Radio className="w-3 h-3" /></div>
      </div>

      <motion.main 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="relative z-10 pt-28 px-4 md:px-8 pb-12 max-w-[1600px] mx-auto"
      >
        {/* Premium Header */}
        <motion.header variants={itemVariants} className="mb-12 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.4em] text-[#00f5d4] font-mono bg-[#00f5d4]/10 w-fit px-4 py-1.5 rounded-sm border-l-2 border-[#00f5d4]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00f5d4] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00f5d4]"></span>
              </span>
              <span>SECURE_DATA_STREAM {"//"} ACTIVE</span>
            </div>
            
            <div className="relative group">
              <button
                onClick={() => setShowTokenDropdown(!showTokenDropdown)}
                className="flex items-center gap-6 hover:opacity-80 transition-all"
              >
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-3">
                    <h1 className={`text-6xl md:text-8xl font-black tracking-tighter leading-none font-display ${styles.glitchText}`} style={{ color: selectedToken.color }}>
                      {selectedToken.symbol}
                    </h1>
                    <span className="text-3xl md:text-4xl text-slate-500 font-bold font-display">/USD</span>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="h-px w-8 bg-slate-700" />
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-[0.3em]">{selectedToken.name}</span>
                  </div>
                </div>
                <div className="bg-slate-900/80 p-3 rounded-sm border border-slate-700/50 group-hover:border-[#00f5d4]/50 transition-colors shadow-xl">
                  <ChevronDown className={`w-6 h-6 text-slate-400 transition-transform duration-300 ${showTokenDropdown ? 'rotate-180 text-[#00f5d4]' : ''}`} />
                </div>
              </button>

              <AnimatePresence>
                {showTokenDropdown && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.98 }}
                    className="absolute top-full left-0 mt-4 w-80 bg-[#0a0f1e]/95 backdrop-blur-2xl border-2 border-slate-800 rounded-sm p-3 z-50 shadow-2xl overflow-hidden"
                  >
                    <CornerBrackets />
                    <div className="px-3 py-2 text-[10px] uppercase tracking-widest text-slate-500 font-mono border-b border-slate-800/50 mb-2 flex justify-between">
                      <span>Select_Quantum_Node</span>
                      <span>v2.0.4</span>
                    </div>
                    <div className="grid gap-1">
                      {TOKENS.map(token => (
                        <button
                          key={token.symbol}
                          onClick={() => {
                            setSelectedToken(token);
                            setShowTokenDropdown(false);
                          }}
                          className={`w-full text-left px-4 py-3 rounded-sm transition-all flex justify-between items-center group/item ${
                            selectedToken.symbol === token.symbol ? 'bg-slate-800/80' : 'hover:bg-slate-800/40'
                          }`}
                        >
                          <div className="flex flex-col">
                            <span className="font-bold text-xl font-display tracking-tight" style={{ color: token.color }}>{token.symbol}</span>
                            <span className="text-[9px] text-slate-500 font-mono uppercase">{token.name}</span>
                          </div>
                          {selectedToken.symbol === token.symbol && (
                            <div className="flex items-center gap-2">
                              <span className="text-[8px] font-mono text-[#00f5d4]">ACTIVE</span>
                              <div className="w-1.5 h-1.5 rounded-full bg-[#00f5d4] shadow-[0_0_8px_#00f5d4]" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-[#00f5d4]/10 to-[#9b5de5]/10 blur-xl opacity-50" />
            <GlassCard className="!p-0 border-2 border-slate-800/50 bg-[#0a0f1e]/60 backdrop-blur-xl relative overflow-hidden group">
              <CornerBrackets />
              <div className="flex items-center p-8 gap-10">
                <div className="flex flex-col items-start gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-3 bg-[#00f5d4]" />
                    <div className="text-[10px] text-slate-400 font-mono uppercase tracking-[0.2em]">Price_Ticker</div>
                  </div>
                  <div className="text-5xl md:text-6xl font-mono font-bold tracking-tighter text-white group-hover:text-[#00f5d4] transition-colors">
                    <span className="text-slate-500">$</span>{currentPrice.toFixed(4)}
                  </div>
                </div>
                <div className="h-16 w-px bg-slate-800" />
                <div className="flex flex-col items-start gap-2">
                  <div className="text-[10px] text-slate-400 font-mono uppercase tracking-[0.2em]">Volatility_Index</div>
                  <div className={`flex items-center gap-3 text-3xl font-mono font-bold ${priceChange >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                    <div className={`p-1.5 rounded-sm border ${priceChange >= 0 ? 'bg-[#10b981]/10 border-[#10b981]/30' : 'bg-[#ef4444]/10 border-[#ef4444]/30'}`}>
                      {priceChange >= 0 ? <TrendingUp className="w-6 h-6" /> : <TrendingUp className="w-6 h-6 rotate-180" />}
                    </div>
                    {Math.abs(priceChangePercent).toFixed(2)}%
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
        </motion.header>

        {/* Action Bar */}
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          {/* Timeframe Selector */}
          <div className="flex p-1 bg-slate-900/80 backdrop-blur-md rounded-sm border-2 border-slate-800/50 shadow-2xl relative">
            <div className="absolute -top-2 left-4 px-2 bg-[#020617] text-[8px] font-mono text-slate-500 uppercase">T_Interval</div>
            {TIMEFRAMES.map(tf => (
              <button
                key={tf.value}
                onClick={() => setSelectedTimeframe(tf)}
                className={`px-6 py-2 rounded-sm text-xs font-mono font-bold transition-all relative overflow-hidden group ${
                  selectedTimeframe.value === tf.value
                    ? 'text-black'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {selectedTimeframe.value === tf.value && (
                  <motion.div 
                    layoutId="tf-bg"
                    className="absolute inset-0 bg-[#00f5d4]"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10">{tf.label}</span>
              </button>
            ))}
          </div>

          {/* Indicators & Toggles */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-slate-900/50 border border-slate-800 rounded-sm">
              <Settings2 className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-[0.2em]">Terminal_Config</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {indicators.map(indicator => (
                <button
                  key={indicator.name}
                  onClick={() => toggleIndicator(indicator.name)}
                  className={`px-4 py-2 text-[10px] font-mono rounded-sm border transition-all flex items-center gap-2 relative group overflow-hidden ${
                    indicator.enabled
                      ? 'bg-slate-800/80 text-white border-slate-600'
                      : 'border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-400'
                  }`}
                >
                  <div className="absolute bottom-0 left-0 h-0.5 w-0 group-hover:w-full bg-[#00f5d4] transition-all duration-300" style={{ backgroundColor: indicator.color }} />
                  <div className="w-2 h-2 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.2)]" style={{ backgroundColor: indicator.enabled ? indicator.color : '#334155' }} />
                  {indicator.name}
                </button>
              ))}
              <div className="w-px h-8 bg-slate-800 mx-1" />
              <button
                onClick={() => setShowRSI(!showRSI)}
                className={`px-4 py-2 text-[10px] font-mono rounded-sm border transition-all relative overflow-hidden ${
                  showRSI ? 'border-[#9b5de5]/50 text-[#9b5de5] bg-[#9b5de5]/10' : 'border-slate-800 text-slate-500'
                }`}
              >
                {showRSI && <div className="absolute top-0 right-0 w-1 h-1 bg-[#9b5de5] animate-pulse" />}
                RSI_INDEX
              </button>
              <button
                onClick={() => setShowMACD(!showMACD)}
                className={`px-4 py-2 text-[10px] font-mono rounded-sm border transition-all relative overflow-hidden ${
                  showMACD ? 'border-[#00f5d4]/50 text-[#00f5d4] bg-[#00f5d4]/10' : 'border-slate-800 text-slate-500'
                }`}
              >
                {showMACD && <div className="absolute top-0 right-0 w-1 h-1 bg-[#00f5d4] animate-pulse" />}
                MACD_FLOW
              </button>
            </div>
          </div>
        </motion.div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-10">
          
          {/* Chart Area */}
          <div className="xl:col-span-3 space-y-10">
            <motion.div variants={itemVariants}>
              <GlassCard className="!p-0 overflow-hidden relative group border-2 border-slate-800/50 rounded-sm">
                <CornerBrackets />
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00f5d4] to-transparent opacity-40" />
                
                <div className="px-8 py-5 flex justify-between items-center border-b border-slate-800/50 bg-[#0a0f1e]/40">
                  <div className="text-[10px] font-mono text-slate-400 uppercase tracking-[0.3em] flex items-center gap-4">
                    <div className="p-2 rounded-sm bg-[#00f5d4]/10 border border-[#00f5d4]/20">
                      <Terminal className="w-4 h-4 text-[#00f5d4]" />
                    </div>
                    Market_Execution_Core
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3 px-4 py-1.5 rounded-sm bg-slate-900 border border-slate-800 shadow-inner">
                      <div className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse shadow-[0_0_10px_#10b981]" />
                      <span className="text-[10px] font-mono text-slate-300 tracking-[0.1em]">UPLINK_STABLE</span>
                    </div>
                    <button className="text-slate-500 hover:text-[#00f5d4] transition-colors">
                      <Maximize2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                <div className="p-6 bg-slate-950/40">
                  <div ref={chartContainerRef} className="w-full h-[600px]" />
                </div>
              </GlassCard>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <AnimatePresence>
                {showRSI && (
                  <motion.div 
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="relative"
                  >
                    <div className="absolute -top-3 -right-3 w-6 h-6 border-t-2 border-r-2 border-[#9b5de5]/30 z-20 pointer-events-none" />
                    <GlassCard className="!p-0 overflow-hidden border-2 border-slate-800/50 rounded-sm">
                      <div className="px-6 py-4 border-b border-slate-800/50 bg-[#0a0f1e]/40 flex justify-between items-center">
                        <div className="text-[10px] font-mono text-[#9b5de5] uppercase tracking-[0.2em] flex items-center gap-3 font-bold">
                          <Zap className="w-3.5 h-3.5" />
                          Momentum_Vectors
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 tracking-tighter">OS: 30 // OB: 70</span>
                      </div>
                      <div className="p-5">
                        <div ref={rsiContainerRef} className="w-full h-[180px]" />
                      </div>
                    </GlassCard>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {showMACD && (
                  <motion.div 
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="relative"
                  >
                    <div className="absolute -top-3 -right-3 w-6 h-6 border-t-2 border-r-2 border-[#00f5d4]/30 z-20 pointer-events-none" />
                    <GlassCard className="!p-0 overflow-hidden border-2 border-slate-800/50 rounded-sm">
                       <div className="px-6 py-4 border-b border-slate-800/50 bg-[#0a0f1e]/40 flex justify-between items-center relative overflow-hidden group/header">
                        {/* Header Scanline */}
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-[#00f5d4]/30 group-hover/header:translate-y-10 transition-transform duration-1000" />
                        
                        <div className="text-[10px] font-mono text-[#00f5d4] uppercase tracking-[0.2em] flex items-center gap-3 font-bold">
                          <div className="relative">
                            <Layers className="w-3.5 h-3.5" />
                            <div className="absolute inset-0 bg-[#00f5d4]/20 blur-sm animate-pulse" />
                          </div>
                          <span className={styles.glitchText}>Convergence_Node</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 tracking-tighter opacity-50 group-hover/header:opacity-100 transition-opacity">SIG: 12, 26, 9</span>
                      </div>
                      <div className="p-5">
                        <div ref={macdContainerRef} className="w-full h-[180px]" />
                      </div>
                    </GlassCard>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <motion.div variants={itemVariants}>
              <ActivityLog />
            </motion.div>
          </div>

          {/* Sidebar Stats */}
          <div className="space-y-10 relative">
            <div className={styles.asymmetricRule} />
            {/* Market Data Panel */}
            <motion.div variants={itemVariants}>
              <GlassCard className="!p-0 overflow-hidden border-2 border-slate-800/50 rounded-sm relative group/card">
                <div className="bg-[#0a0f1e]/60 px-6 py-5 border-b border-slate-800/50 flex justify-between items-center relative overflow-hidden group/header">
                  {/* Header Scanline */}
                  <div className="absolute top-0 left-0 w-full h-[1px] bg-slate-400/20 group-hover/header:translate-y-12 transition-transform duration-1000" />
                  
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-sm bg-slate-800 border border-slate-700 shadow-xl relative overflow-hidden">
                      <Activity className="w-4 h-4 text-slate-200" />
                      <div className="absolute inset-0 bg-white/5 animate-pulse" />
                    </div>
                    <span className="text-sm font-bold uppercase tracking-[0.2em] text-slate-200 font-display">Terminal_Intel</span>
                  </div>
                  <div className="flex gap-1">
                    <div className="w-1 h-3 bg-slate-800" />
                    <div className="w-1 h-3 bg-slate-700" />
                    <div className="w-1 h-3 bg-slate-600" />
                  </div>
                </div>
                <div className="p-8 space-y-8 font-mono">
                  <div className="flex justify-between items-center group/stat">
                    <div>
                      <div className="text-[10px] text-slate-500 mb-2 flex items-center gap-2 tracking-widest">
                        <div className="w-1 h-3 bg-[#10b981]" />
                        24H_CEILING
                      </div>
                      <div className="text-3xl text-white group-hover:text-[#10b981] transition-colors tracking-tighter">${high24h.toFixed(4)}</div>
                    </div>
                    <Clock className="w-5 h-5 text-slate-800 group-hover:text-slate-500 transition-colors" />
                  </div>
                  <div className="h-px bg-slate-800/50" />
                  <div className="flex justify-between items-center group/stat">
                    <div>
                      <div className="text-[10px] text-slate-500 mb-2 flex items-center gap-2 tracking-widest">
                        <div className="w-1 h-3 bg-[#ef4444]" />
                        24H_FLOOR
                      </div>
                      <div className="text-3xl text-white group-hover:text-[#ef4444] transition-colors tracking-tighter">${low24h.toFixed(4)}</div>
                    </div>
                    <Clock className="w-5 h-5 text-slate-800 group-hover:text-slate-500 transition-colors" />
                  </div>
                  <div className="h-px bg-slate-800/50" />
                  <div className="flex justify-between items-center group/stat">
                    <div>
                      <div className="text-[10px] text-slate-500 mb-2 flex items-center gap-2 tracking-widest">
                        <div className="w-1 h-3 bg-[#00f5d4]" />
                        24H_THROUGHPUT
                      </div>
                      <div className="text-3xl text-white group-hover:text-[#00f5d4] transition-colors tracking-tighter">${(volume24h / 1000000).toFixed(2)}M</div>
                    </div>
                    <BarChart3 className="w-5 h-5 text-slate-800 group-hover:text-slate-500 transition-colors" />
                  </div>
                </div>
              </GlassCard>
            </motion.div>

            {/* Analysis Panel */}
            <motion.div variants={itemVariants}>
              <GlassCard className="!p-0 overflow-hidden border-2 border-slate-800/50 rounded-sm relative group/card">
                 <div className="bg-[#0a0f1e]/60 px-6 py-5 border-b border-slate-800/50 flex justify-between items-center relative overflow-hidden group/header">
                  {/* Header Scanline */}
                  <div className="absolute top-0 left-0 w-full h-[1px] bg-[#00f5d4]/20 group-hover/header:translate-y-12 transition-transform duration-1000" />
                  
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-sm bg-slate-800 border border-slate-700 relative overflow-hidden">
                      <Zap className="w-4 h-4 text-[#00f5d4]" />
                      <div className="absolute inset-0 bg-[#00f5d4]/10 animate-pulse" />
                    </div>
                    <span className="text-sm font-bold uppercase tracking-[0.2em] text-slate-200 font-display">Neural_Log</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[8px] font-mono text-[#10b981] opacity-50">SYNC_OK</span>
                    <div className="animate-pulse w-2 h-2 rounded-full bg-[#10b981] shadow-[0_0_12px_#10b981]" />
                  </div>
                </div>
                <div className="p-8 space-y-8 font-mono text-sm">
                  
                  {/* Trend */}
                  <div className="bg-slate-950/60 p-5 rounded-sm border-l-2 border-[#00f5d4]/40 hover:bg-slate-950/80 transition-all">
                    <div className="text-slate-500 mb-4 uppercase text-[10px] tracking-[0.3em] flex items-center justify-between font-bold">
                      <span>VECTOR_ANALYSIS</span>
                      <TrendingUp className="w-3 h-3" />
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-xs">Primary Sentiment</span>
                        <span className={`px-3 py-1 rounded-sm text-[10px] font-bold tracking-widest ${priceChange >= 0 ? 'bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/30' : 'bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/30'}`}>
                          {priceChange >= 0 ? 'OPTIMISTIC' : 'CAUTIOUS'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-xs">SMA_20_OFFSET</span>
                        <span className={`text-xs font-bold ${currentPrice > (calculateSMA(ohlcData, 20).slice(-1)[0]?.value || 0) ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                          {currentPrice > (calculateSMA(ohlcData, 20).slice(-1)[0]?.value || 0) ? '+SUPPORTED' : '-RESISTANT'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Momentum */}
                  <div className="bg-slate-950/60 p-5 rounded-sm border-l-2 border-[#9b5de5]/40 hover:bg-slate-950/80 transition-all">
                    <div className="text-slate-500 mb-4 uppercase text-[10px] tracking-[0.3em] flex items-center justify-between font-bold">
                      <span>MOMENTUM_ENGINE</span>
                      <Zap className="w-3 h-3" />
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-xs">Relative Strength</span>
                        <span className="text-xs font-bold text-[#9b5de5] flex items-center gap-2">
                          {calculateRSI(ohlcData).slice(-1)[0]?.value.toFixed(1) || '0.0'}
                          <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-[#9b5de5]" style={{ width: `${calculateRSI(ohlcData).slice(-1)[0]?.value || 0}%` }} />
                          </div>
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-xs">MACD_DELTA</span>
                        <span className={`text-xs font-bold ${calculateMACD(ohlcData).macd.slice(-1)[0]?.value >= 0 ? 'text-[#00f5d4]' : 'text-[#ef4444]'}`}>
                          {calculateMACD(ohlcData).macd.slice(-1)[0]?.value >= 0 ? 'Ω_POSITIVE' : 'Ω_NEGATIVE'}
                        </span>
                      </div>
                    </div>
                  </div>

                </div>
              </GlassCard>
            </motion.div>

            {/* Upgraded Action Button with Scanning Effect */}
            <motion.div variants={itemVariants}>
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
                className="w-full py-6 rounded-sm group overflow-hidden relative shadow-[0_0_30px_rgba(0,245,212,0.15)] border-2 border-[#00f5d4]/20 hover:border-[#00f5d4]/50 transition-all active:scale-[0.98]"
              >
                {/* Background Gradient */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#00f5d4]/20 via-[#9b5de5]/20 to-[#00f5d4]/20 bg-[length:200%_100%] group-hover:animate-gradientShift" />
                
                {/* Scanning Beam Effect */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  <div className="absolute top-0 left-[-100%] w-[50%] h-full bg-gradient-to-r from-transparent via-[#00f5d4]/40 to-transparent skew-x-[-25deg] group-hover:animate-scanBeam" />
                </div>
                
                {/* Button Content */}
                <div className="relative flex items-center justify-center gap-4">
                  <RefreshCw className={`w-5 h-5 text-[#00f5d4] ${isLoading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                  <span className="text-sm font-black uppercase tracking-[0.4em] text-white group-hover:text-[#00f5d4] transition-colors">
                    {isLoading ? 'RECALIBRATING...' : 'SYNC_NODE_DATA'}
                  </span>
                  <div className="flex items-center gap-1">
                    <div className="w-1 h-1 rounded-full bg-[#00f5d4] animate-ping" />
                    <div className="w-1 h-1 rounded-full bg-[#00f5d4]" />
                  </div>
                </div>

                {/* Corner Accents */}
                <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-[#00f5d4] opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-[#00f5d4] opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </motion.div>

            {/* Global Keyframes for the button */}
            <style jsx global>{`
              @keyframes scanBeam {
                0% { left: -100%; }
                100% { left: 200%; }
              }
              @keyframes gradientShift {
                0% { background-position: 0% 50%; }
                100% { background-position: 200% 50%; }
              }
            `}</style>

            {/* Quick Links */}
            <motion.div variants={itemVariants} className="grid grid-cols-3 gap-6">
               <button className="flex flex-col items-center gap-3 p-4 rounded-sm bg-slate-900/60 border-2 border-slate-800/50 hover:bg-slate-800/60 hover:border-[#10b981]/40 transition-all group relative">
                <div className="absolute top-0 left-0 w-1 h-1 bg-[#10b981] opacity-0 group-hover:opacity-100" />
                <ShieldCheck className="w-6 h-6 text-slate-500 group-hover:text-[#10b981] transition-colors" />
                <span className="text-[9px] font-mono text-slate-500 group-hover:text-slate-300 uppercase tracking-widest">SECURE</span>
              </button>
              <button className="flex flex-col items-center gap-3 p-4 rounded-sm bg-slate-900/60 border-2 border-slate-800/50 hover:bg-slate-800/60 hover:border-[#00f5d4]/40 transition-all group relative">
                <div className="absolute top-0 left-0 w-1 h-1 bg-[#00f5d4] opacity-0 group-hover:opacity-100" />
                <Cpu className="w-6 h-6 text-slate-500 group-hover:text-[#00f5d4] transition-colors" />
                <span className="text-[9px] font-mono text-slate-500 group-hover:text-slate-300 uppercase tracking-widest">AI_CORE</span>
              </button>
              <button className="flex flex-col items-center gap-3 p-4 rounded-sm bg-slate-900/60 border-2 border-slate-800/50 hover:bg-slate-800/60 hover:border-[#9b5de5]/40 transition-all group relative">
                <div className="absolute top-0 left-0 w-1 h-1 bg-[#9b5de5] opacity-0 group-hover:opacity-100" />
                <Globe className="w-6 h-6 text-slate-500 group-hover:text-[#9b5de5] transition-colors" />
                <span className="text-[9px] font-mono text-slate-500 group-hover:text-slate-300 uppercase tracking-widest">GLOBAL</span>
              </button>
            </motion.div>
          </div>

        </div>
      </motion.main>
    </div>
  );
};

export default ChartsPage;
