'use client'

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Menu, Wifi } from 'lucide-react';
import Navigation from '@/components/Navigation';
import LiveTicker from '@/components/charts/LiveTicker';
import ControlSidebar, { useChartControls } from '@/components/charts/ControlSidebar';
import EnhancedCandlestickChart, { type OHLCData as ChartOHLCData } from '@/components/charts/EnhancedCandlestickChart';
import RSIChart, { calculateRSI } from '@/components/charts/RSIChart';
import MACDChart, { calculateMACD } from '@/components/charts/MACDChart';
import DrawingTools, { useDrawings } from '@/components/charts/DrawingTools';
import TechnicalAnalysisPanel from '@/components/charts/TechnicalAnalysisPanel';
import PriceStatsGrid from '@/components/charts/PriceStatsGrid';
import TokenPairSelector, { useTokenFavorites } from '@/components/charts/TokenPairSelector';

interface Token {
  symbol: string;
  name: string;
  color: string;
  coingeckoId?: string;
}

const TOKENS: Token[] = [
  { symbol: 'SEI-USDT', name: 'SEI Network', color: '#dc2626', coingeckoId: 'sei-network' },
  { symbol: 'ETH-USDT', name: 'Ethereum', color: '#627eea', coingeckoId: 'ethereum' },
  { symbol: 'BTC-USDT', name: 'Bitcoin', color: '#f7931a', coingeckoId: 'bitcoin' },
  { symbol: 'USDC-USDT', name: 'USD Coin', color: '#2775ca', coingeckoId: 'usd-coin' },
  { symbol: 'SOL-USDT', name: 'Solana', color: '#00ffa3', coingeckoId: 'solana' },
  { symbol: 'ATOM-USDT', name: 'Cosmos', color: '#2e3148', coingeckoId: 'cosmos' },
  { symbol: 'OSMO-USDT', name: 'Osmosis', color: '#f5a623', coingeckoId: 'osmosis' },
  { symbol: 'SUI-USDT', name: 'Sui', color: '#6fcf97', coingeckoId: 'sui' },
  { symbol: 'W-USDT', name: 'Wormhole', color: '#00f5d4', coingeckoId: 'wormhole' },
];

const BASE_PRICES: Record<string, number> = {
  'SEI-USDT': 0.42,
  'ETH-USDT': 2340.50,
  'BTC-USDT': 43250.00,
  'USDC-USDT': 1.00,
  'SOL-USDT': 95.30,
  'ATOM-USDT': 8.00,
  'OSMO-USDT': 1.20,
  'SUI-USDT': 0.85,
  'W-USDT': 0.15,
};

const TIMEFRAMES = [
  { label: '1m', value: '1m', days: 1 },
  { label: '5m', value: '5m', days: 5 },
  { label: '15m', value: '15m', days: 15 },
  { label: '1H', value: '1h', days: 30 },
  { label: '4H', value: '4h', days: 90 },
  { label: '1D', value: '1d', days: 180 },
  { label: '1W', value: '1w', days: 365 },
];

function generateOHLCData(days: number, basePrice: number): ChartOHLCData[] {
  const data: ChartOHLCData[] = [];
  const now = Date.now();
  const interval = 60 * 60 * 1000;
  let price = basePrice;

  for (let i = days * 24; i >= 0; i--) {
    const time = Math.floor((now - i * interval) / 1000);
    const volatility = 0.02;
    const change = (Math.random() - 0.5) * volatility * price;

    const open = price;
    price = price * (1 + change);
    const close = price;
    const high = Math.max(open, close) * (1 + Math.random() * 0.01);
    const low = Math.min(open, close) * (1 - Math.random() * 0.01);
    const volume = 1000000 + Math.random() * 5000000;

    data.push({
      time: time as number,
      open,
      high,
      low,
      close,
      volume,
    });
  }

  return data;
}

function ChartsPageContent() {
  const chartControls = useChartControls();
  const { favorites, toggleFavorite } = useTokenFavorites();

  const [selectedToken, setSelectedToken] = useState<Token>(TOKENS[0]);
  const [ohlcData, setOhlcData] = useState<ChartOHLCData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<{ toChartCoords: (x: number, y: number) => { time: number; price: number } } | null>(null);

  const { drawings, setDrawings } = useDrawings(selectedToken.symbol);

  const basePrice = BASE_PRICES[selectedToken.symbol] || 1.0;

  const loadData = useCallback(() => {
    setIsLoading(true);
    const data = generateOHLCData(
      TIMEFRAMES.find(tf => tf.value === chartControls.selectedTimeframe)?.days || 30,
      basePrice
    );
    setTimeout(() => {
      setOhlcData(data);
      setIsLoading(false);
    }, 500);
  }, [chartControls.selectedTimeframe, basePrice]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const rsiData = useMemo(() => {
    if (ohlcData.length < 15) return [];
    return calculateRSI(
      ohlcData.map(d => ({ time: d.time, close: d.close })),
      14
    );
  }, [ohlcData]);

  const macdResult = useMemo(() => {
    if (ohlcData.length < 27) return { macd: [], signal: [], histogram: [] };
    return calculateMACD(
      ohlcData.map(d => ({ time: d.time, close: d.close })),
      12,
      26,
      9
    );
  }, [ohlcData]);

  const currentPrice = ohlcData.length > 0 ? ohlcData[ohlcData.length - 1].close : 0;
  const prevPrice = ohlcData.length > 1 ? ohlcData[ohlcData.length - 2].close : currentPrice;
  const priceChange = currentPrice - prevPrice;
  const priceChangePercent = prevPrice > 0 ? (priceChange / prevPrice) * 100 : 0;

  const formatPrice = (price: number) => {
    if (price >= 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (price >= 1) return price.toFixed(4);
    return price.toFixed(6);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] relative overflow-x-hidden">
      {/* Animated background grid */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Gradient orbs */}
      <div className="fixed top-0 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-purple-500/5 blur-3xl pointer-events-none" />

      <Navigation variant="dark" showWallet={true} showLaunchApp={false} />

      <div className="relative z-10 pt-20">
        {/* Live Ticker Bar */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="border-b border-white/10"
        >
          <LiveTicker symbol={selectedToken.symbol} />
        </motion.div>

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row">
          {/* Control Sidebar - Desktop */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="hidden lg:block w-64 flex-shrink-0 p-4"
          >
            <ControlSidebar
              selectedTimeframe={chartControls.selectedTimeframe}
              setSelectedTimeframe={chartControls.setSelectedTimeframe}
              indicators={chartControls.indicators}
              setIndicators={chartControls.setIndicators}
              showRSI={chartControls.showRSI}
              setShowRSI={chartControls.setShowRSI}
              showMACD={chartControls.showMACD}
              setShowMACD={chartControls.setShowMACD}
              onRefresh={() => {
                setIsLoading(true);
                setTimeout(() => setIsLoading(false), 500);
              }}
              isLoading={isLoading}
            />
          </motion.div>

          {/* Main Chart Area */}
          <div className="flex-1 p-4 space-y-4">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <TokenPairSelector
                  tokens={TOKENS}
                  selectedToken={selectedToken}
                  onSelectToken={setSelectedToken}
                  favorites={favorites}
                  onToggleFavorite={toggleFavorite}
                />

                <div className="flex items-center gap-3">
                  <span className="text-3xl font-bold font-mono text-white">
                    ${formatPrice(currentPrice)}
                  </span>
                  <span
                    className={`flex items-center gap-1 text-lg font-semibold font-mono ${
                      priceChange >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {priceChange >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                    {priceChange >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%
                  </span>
                </div>
              </div>

              {/* Mobile Controls Toggle */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="lg:hidden flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              >
                <Menu className="w-4 h-4" />
                <span className="text-sm">Controls</span>
              </button>
            </motion.div>

            {/* Mobile Control Menu */}
            <AnimatePresence>
              {showMobileMenu && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="lg:hidden overflow-hidden"
                >
                  <ControlSidebar
                    selectedTimeframe={chartControls.selectedTimeframe}
                    setSelectedTimeframe={chartControls.setSelectedTimeframe}
                    indicators={chartControls.indicators}
                    setIndicators={chartControls.setIndicators}
                    showRSI={chartControls.showRSI}
                    setShowRSI={chartControls.setShowRSI}
                    showMACD={chartControls.showMACD}
                    setShowMACD={chartControls.setShowMACD}
                    onRefresh={() => setIsLoading(true)}
                    isLoading={isLoading}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Price Stats Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <PriceStatsGrid ohlcData={ohlcData} symbol={selectedToken.symbol} />
            </motion.div>

            {/* Main Chart Container */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="relative rounded-2xl overflow-hidden"
              style={{
                background: 'rgba(10, 10, 15, 0.6)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              {/* Connection Status */}
              <div className="absolute top-4 right-4 z-30 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm">
                <motion.div
                  className="w-2 h-2 rounded-full bg-green-500"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                />
                <Wifi className="w-3 h-3 text-green-400" />
                <span className="text-xs font-mono text-green-400">Live</span>
              </div>

              {/* Loading Overlay */}
              {isLoading && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#0a0a0f]/80">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-gray-400">Loading chart data...</span>
                  </div>
                </div>
              )}

              {/* Chart */}
              <div ref={chartContainerRef} className="relative">
                <EnhancedCandlestickChart
                  data={ohlcData}
                  symbol={selectedToken.symbol}
                  height={500}
                  showVolume={chartControls.indicators.find(i => i.id === 'volume')?.enabled ?? true}
                />

                {/* Drawing Tools Overlay */}
                <DrawingTools
                  containerRef={chartContainerRef}
                  chartRef={chartRef}
                  activeTool="select"
                  setActiveTool={() => {}}
                  color="#00f5d4"
                  setColor={() => {}}
                  lineWidth={2}
                  setLineWidth={() => {}}
                  drawings={drawings}
                  setDrawings={setDrawings}
                />
              </div>
            </motion.div>

            {/* RSI Chart */}
            {chartControls.showRSI && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="rounded-xl overflow-hidden"
                style={{
                  background: 'rgba(10, 10, 15, 0.6)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <RSIChart
                  data={rsiData}
                  height={150}
                  period={14}
                />
              </motion.div>
            )}

            {/* MACD Chart */}
            {chartControls.showMACD && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="rounded-xl overflow-hidden"
                style={{
                  background: 'rgba(10, 10, 15, 0.6)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <MACDChart
                  macdData={macdResult.macd}
                  signalData={macdResult.signal}
                  histogramData={macdResult.histogram}
                  height={180}
                />
              </motion.div>
            )}

            {/* Technical Analysis Panel */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
            >
              <TechnicalAnalysisPanel
                ohlcData={ohlcData}
                rsiData={rsiData}
                macdData={
                  macdResult.macd.length > 0
                    ? {
                        macd: macdResult.macd[macdResult.macd.length - 1]?.value ?? 0,
                        signal: macdResult.signal[macdResult.signal.length - 1]?.value ?? 0,
                        histogram: macdResult.histogram[macdResult.histogram.length - 1]?.value ?? 0,
                      }
                    : undefined
                }
              />
            </motion.div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap');

        :root {
          --font-mono: 'JetBrains Mono', monospace;
        }

        html {
          scroll-behavior: smooth;
        }

        body {
          font-family: var(--font-mono);
        }
      `}</style>
    </div>
  );
}

export default function ChartsPage() {
  return <ChartsPageContent />;
}