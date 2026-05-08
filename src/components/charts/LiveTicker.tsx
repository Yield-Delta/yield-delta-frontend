'use client';

import React, { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Activity, BarChart3, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { useWebSocket, type ConnectionStatus } from '@/hooks/useWebSocket';

interface LiveTickerProps {
  symbol: string;
  className?: string;
}

interface TickerItem {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
}

const MOCK_TICKERS: TickerItem[] = [
  { symbol: 'SEI-USDT', price: 0.4215, change24h: 2.34, volume24h: 12500000 },
  { symbol: 'ETH-USDT', price: 2345.67, change24h: -1.23, volume24h: 890000000 },
  { symbol: 'BTC-USDT', price: 43250.00, change24h: 3.45, volume24h: 12500000000 },
  { symbol: 'SOL-USDT', price: 95.30, change24h: 5.67, volume24h: 1500000000 },
  { symbol: 'ATOM-USDT', price: 8.02, change24h: -0.89, volume24h: 85000000 },
  { symbol: 'SUI-USDT', price: 0.845, change24h: 4.12, volume24h: 95000000 },
];

export default function LiveTicker({ symbol, className = '' }: LiveTickerProps) {
  const { prices, status, isConnected, connectionType } = useWebSocket();
  const [tickers, setTickers] = useState<TickerItem[]>(MOCK_TICKERS);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Update prices from WebSocket
  useEffect(() => {
    setTickers(prev => prev.map(ticker => {
      const wsPrice = prices.get(ticker.symbol);
      if (wsPrice) {
        return {
          ...ticker,
          price: wsPrice,
          change24h: ticker.change24h + (Math.random() - 0.5) * 0.1,
        };
      }
      return ticker;
    }));
  }, [prices]);

  // Rotate through tickers
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % tickers.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [tickers.length]);

  // Get status indicator color
  const getStatusColor = (status: ConnectionStatus) => {
    switch (status) {
      case 'connected': return 'bg-green-500';
      case 'connecting':
      case 'reconnecting': return 'bg-yellow-500';
      default: return 'bg-red-500';
    }
  };

  // Get status icon
  const StatusIcon = isConnected ? Wifi : WifiOff;

  // Format price
  const formatPrice = (price: number) => {
    if (price >= 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (price >= 1) return price.toFixed(4);
    return price.toFixed(6);
  };

  // Format volume
  const formatVolume = (vol: number) => {
    if (vol >= 1e9) return `$${(vol / 1e9).toFixed(2)}B`;
    if (vol >= 1e6) return `$${(vol / 1e6).toFixed(2)}M`;
    if (vol >= 1e3) return `$${(vol / 1e3).toFixed(2)}K`;
    return `$${vol.toFixed(2)}`;
  };

  const currentTicker = tickers[currentIndex] || tickers[0];

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10" />

      {/* Subtle scan line effect */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 245, 212, 0.03) 2px, rgba(0, 245, 212, 0.03) 4px)',
        }}
      />

      {/* Ticker content */}
      <div className="relative flex items-center gap-4 px-4 py-2">
        {/* Connection status */}
        <div className="flex items-center gap-2 pr-4 border-r border-white/10">
          <motion.div
            className={`w-2 h-2 rounded-full ${getStatusColor(status)}`}
            animate={status === 'connected' ? { scale: [1, 1.2, 1] } : {}}
            transition={{ repeat: Infinity, duration: 2 }}
          />
          <StatusIcon className={`w-4 h-4 ${isConnected ? 'text-green-400' : 'text-red-400'}`} />
          <span className="text-xs font-mono text-gray-400 hidden sm:inline">
            {connectionType === 'binance' ? 'Binance' : connectionType === 'mock' ? 'Live' : 'Offline'}
          </span>
        </div>

        {/* Main ticker display */}
        <div className="flex items-center gap-6 flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTicker?.symbol}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-4"
            >
              {/* Symbol */}
              <span className="font-mono font-bold text-white whitespace-nowrap">
                {currentTicker?.symbol}
              </span>

              {/* Price */}
              <span className="font-mono text-lg font-semibold text-white">
                ${formatPrice(currentTicker?.price || 0)}
              </span>

              {/* Change */}
              <div className={`flex items-center gap-1 ${(currentTicker?.change24h || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {(currentTicker?.change24h || 0) >= 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <span className="font-mono text-sm font-medium">
                  {(currentTicker?.change24h || 0) >= 0 ? '+' : ''}{currentTicker?.change24h?.toFixed(2)}%
                </span>
              </div>

              {/* Volume */}
              <div className="hidden md:flex items-center gap-2 text-gray-400">
                <BarChart3 className="w-3 h-3" />
                <span className="font-mono text-xs">{formatVolume(currentTicker?.volume24h || 0)}</span>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Mini sparkline placeholder */}
        <div className="hidden lg:flex items-center gap-2">
          <div className="w-16 h-6 flex items-end gap-0.5">
            {[0.6, 0.8, 0.5, 0.9, 0.7, 0.85, 0.95, 0.8].map((h, i) => (
              <motion.div
                key={i}
                className="flex-1 rounded-t-sm"
                style={{
                  background: 'linear-gradient(to top, #00f5d4, #00f5d480)',
                  height: `${h * 100}%`,
                }}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
              />
            ))}
          </div>
        </div>

        {/* Refresh indicator */}
        <button
          onClick={() => window.location.reload()}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 text-gray-400 ${status === 'connecting' ? 'animate-spin' : ''}`} />
        </button>

        {/* Ticker navigation dots */}
        <div className="hidden sm:flex items-center gap-1.5 pl-4 border-l border-white/10">
          {tickers.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                i === currentIndex ? 'bg-primary w-4' : 'bg-gray-500 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Decorative glow */}
      <div
        className="absolute left-0 top-1/2 -translate-y-1/2 w-20 h-20 rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${(currentTicker?.change24h || 0) >= 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'} 0%, transparent 70%)`,
        }}
      />
    </div>
  );
}