import { useEffect, useRef, useCallback, useState } from 'react';

export type MockWebSocketStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected' | 'error';

export interface MockTradeData {
  symbol: string;
  price: number;
  quantity: number;
  timestamp: number;
  isBuyerMaker: boolean;
}

export interface MockKlineData {
  symbol: string;
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  isClosed: boolean;
}

interface UseMockWebSocketOptions {
  symbols: string[];
  basePrice?: number;
  volatility?: number;
  updateInterval?: number;
  onTrade?: (data: MockTradeData) => void;
  onKline?: (data: MockKlineData) => void;
}

interface UseMockWebSocketReturn {
  status: MockWebSocketStatus;
  prices: Map<string, number>;
  klines: Map<string, MockKlineData[]>;
  connect: () => void;
  disconnect: () => void;
  updateSymbol: (symbol: string, price: number) => void;
}

// Realistic base prices for supported tokens
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
  'SEI-BTC': 0.0000097,
  'ETH-BTC': 0.0541,
  'SOL-BTC': 0.00220,
};

// Volatility factors for different tokens
const VOLATILITY: Record<string, number> = {
  'SEI-USDT': 0.015,
  'ETH-USDT': 0.008,
  'BTC-USDT': 0.005,
  'USDC-USDT': 0.0001,
  'SOL-USDT': 0.012,
  'ATOM-USDT': 0.010,
  'OSMO-USDT': 0.012,
  'SUI-USDT': 0.018,
  'W-USDT': 0.025,
  'SEI-BTC': 0.01,
  'ETH-BTC': 0.005,
  'SOL-BTC': 0.008,
};

export function useMockWebSocket({
  symbols = [],
  volatility = 0.01,
  updateInterval = 1000,
  onTrade,
  onKline,
}: UseMockWebSocketOptions): UseMockWebSocketReturn {
  const [status, setStatus] = useState<MockWebSocketStatus>('disconnected');
  const [prices, setPrices] = useState<Map<string, number>>(new Map());
  const [klines, setKlines] = useState<Map<string, MockKlineData[]>>(new Map());

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const klineIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentPricesRef = useRef<Map<string, number>>(new Map());
  const klineDataRef = useRef<Map<string, MockKlineData>>(new Map());

  const generateMockPrice = useCallback((symbol: string, previousPrice?: number): number => {
    const basePrice = BASE_PRICES[symbol] || previousPrice || 1.0;
    const vol = VOLATILITY[symbol] || volatility;

    // Random walk with mean reversion
    const change = (Math.random() - 0.5) * vol * basePrice;
    const meanReversion = (basePrice - (previousPrice || basePrice)) * 0.01;

    const newPrice = (previousPrice || basePrice) + change + meanReversion;
    return Math.max(newPrice, basePrice * 0.5); // Prevent extreme drops
  }, [volatility]);

  const generateMockKline = useCallback((symbol: string): MockKlineData => {
    const previousKline = klineDataRef.current.get(symbol);
    const basePrice = BASE_PRICES[symbol] || 1.0;
    const vol = VOLATILITY[symbol] || volatility;

    const open = previousKline?.close || basePrice;
    const movement = (Math.random() - 0.5) * vol * open;
    const close = open + movement;

    const range = Math.random() * vol * open;
    const high = Math.max(open, close) + range * Math.random();
    const low = Math.min(open, close) - range * Math.random();
    const volume = Math.random() * 1000000 + 100000;

    const kline: MockKlineData = {
      symbol,
      time: Date.now(),
      open: parseFloat(open.toFixed(6)),
      high: parseFloat(high.toFixed(6)),
      low: parseFloat(low.toFixed(6)),
      close: parseFloat(close.toFixed(6)),
      volume: parseFloat(volume.toFixed(2)),
      isClosed: Math.random() > 0.7, // ~30% chance of closed candle
    };

    klineDataRef.current.set(symbol, kline);
    return kline;
  }, [volatility]);

  const generateMockTrade = useCallback((symbol: string): MockTradeData => {
    const price = currentPricesRef.current.get(symbol) || BASE_PRICES[symbol] || 1.0;
    return {
      symbol,
      price: parseFloat(price.toFixed(6)),
      quantity: Math.random() * 100 + 1,
      timestamp: Date.now(),
      isBuyerMaker: Math.random() > 0.5,
    };
  }, []);

  const connect = useCallback(() => {
    if (status === 'connected') return;

    setStatus('connecting');

    // Initialize prices
    const initialPrices = new Map<string, number>();
    symbols.forEach(symbol => {
      const price = BASE_PRICES[symbol] || 1.0;
      initialPrices.set(symbol, price);
      currentPricesRef.current.set(symbol, price);
    });
    setPrices(initialPrices);

    // Start mock data generation
    setTimeout(() => {
      setStatus('connected');

      // Trade updates every second
      intervalRef.current = setInterval(() => {
        symbols.forEach(symbol => {
          const newPrice = generateMockPrice(symbol, currentPricesRef.current.get(symbol));
          currentPricesRef.current.set(symbol, newPrice);

          setPrices(prev => {
            const updated = new Map(prev);
            updated.set(symbol, newPrice);
            return updated;
          });

          const trade = generateMockTrade(symbol);
          onTrade?.(trade);
        });
      }, updateInterval);

      // Kline updates every minute (simulate)
      klineIntervalRef.current = setInterval(() => {
        symbols.forEach(symbol => {
          const kline = generateMockKline(symbol);
          onKline?.(kline);
        });
      }, 60000);
    }, 500);
  }, [symbols, updateInterval, generateMockPrice, generateMockTrade, generateMockKline, onTrade, onKline, status]);

  const disconnect = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (klineIntervalRef.current) {
      clearInterval(klineIntervalRef.current);
      klineIntervalRef.current = null;
    }
    setStatus('disconnected');
  }, []);

  const updateSymbol = useCallback((symbol: string, price: number) => {
    currentPricesRef.current.set(symbol, price);
    setPrices(prev => {
      const updated = new Map(prev);
      updated.set(symbol, price);
      return updated;
    });
  }, []);

  useEffect(() => {
    if (symbols.length > 0 && status === 'disconnected') {
      connect();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (klineIntervalRef.current) {
        clearInterval(klineIntervalRef.current);
      }
    };
  }, [symbols, status, connect]);

  return {
    status,
    prices,
    klines,
    connect,
    disconnect,
    updateSymbol,
  };
}

// Helper to convert mock kline to standard OHLC format
export function parseMockKline(kline: MockKlineData): { time: number; open: number; high: number; low: number; close: number; volume: number } {
  return {
    time: Math.floor(kline.time / 1000),
    open: kline.open,
    high: kline.high,
    low: kline.low,
    close: kline.close,
    volume: kline.volume,
  };
}