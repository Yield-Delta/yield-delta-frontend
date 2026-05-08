import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, ReactNode } from 'react';
import { useBinanceWebSocket, type WebSocketStatus, type BinanceTradeData, type BinanceKlineData, parseBinanceKline } from './useBinanceWebSocket';
import { useMockWebSocket, type MockWebSocketStatus, type MockTradeData, type MockKlineData, parseMockKline } from './useMockWebSocket';

export type ConnectionStatus = WebSocketStatus | MockWebSocketStatus;

export interface PriceData {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  timestamp: number;
}

export interface OHLCDataPoint {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface WebSocketContextType {
  status: ConnectionStatus;
  prices: Map<string, number>;
  ohlcData: Map<string, OHLCDataPoint[]>;
  lastTrade: PriceData | null;
  subscribe: (symbols: string[]) => void;
  unsubscribe: (symbols: string[]) => void;
  reconnect: () => void;
  isConnected: boolean;
  connectionType: 'binance' | 'mock' | null;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

interface WebSocketProviderProps {
  children: ReactNode;
  initialSymbols?: string[];
  onPriceUpdate?: (symbol: string, price: number) => void;
  onKlineUpdate?: (symbol: string, kline: OHLCDataPoint) => void;
}

export function WebSocketProvider({
  children,
  initialSymbols = [],
  onPriceUpdate,
  onKlineUpdate,
}: WebSocketProviderProps) {
  const [connectionType, setConnectionType] = useState<'binance' | 'mock' | null>(null);
  const [binanceStatus, setBinanceStatus] = useState<WebSocketStatus>('disconnected');
  const [mockStatus, setMockStatus] = useState<MockWebSocketStatus>('disconnected');
  const [prices, setPrices] = useState<Map<string, number>>(new Map());
  const [ohlcData, setOhlcData] = useState<Map<string, OHLCDataPoint[]>>(new Map());
  const [lastTrade, setLastTrade] = useState<PriceData | null>(null);

  // Binance WebSocket
  const binanceWs = useBinanceWebSocket({
    symbols: initialSymbols,
    onTrade: (data: BinanceTradeData) => {
      const symbol = data.s.replace('USDT', '-USDT').replace('BTC', '-BTC');
      const price = parseFloat(data.p);
      setPrices(prev => {
        const updated = new Map(prev);
        updated.set(symbol, price);
        return updated;
      });
      onPriceUpdate?.(symbol, price);
    },
    onKline: (data: BinanceKlineData) => {
      const symbol = data.s.replace('USDT', '-USDT').replace('BTC', '-BTC');
      const ohlc = parseBinanceKline(data);
      setOhlcData(prev => {
        const updated = new Map(prev);
        const existing = updated.get(symbol) || [];
        const newData = [...existing, ohlc];
        // Keep last 500 candles
        if (newData.length > 500) {
          newData.shift();
        }
        updated.set(symbol, newData);
        return updated;
      });
      onKlineUpdate?.(symbol, ohlc);
    },
  });

  // Mock WebSocket (fallback)
  const mockWs = useMockWebSocket({
    symbols: initialSymbols,
    onTrade: (data: MockTradeData) => {
      setPrices(prev => {
        const updated = new Map(prev);
        updated.set(data.symbol, data.price);
        return updated;
      });
      onPriceUpdate?.(data.symbol, data.price);
    },
    onKline: (data: MockKlineData) => {
      const ohlc = parseMockKline(data);
      setOhlcData(prev => {
        const updated = new Map(prev);
        const existing = updated.get(data.symbol) || [];
        const newData = [...existing, ohlc];
        if (newData.length > 500) {
          newData.shift();
        }
        updated.set(data.symbol, newData);
        return updated;
      });
      onKlineUpdate?.(data.symbol, ohlc);
    },
  });

  // Determine overall status and connection type
  useEffect(() => {
    setBinanceStatus(binanceWs.status);
    setMockStatus(mockWs.status);

    if (binanceWs.status === 'connected') {
      setConnectionType('binance');
    } else if (mockWs.status === 'connected') {
      setConnectionType('mock');
    } else if (binanceWs.status === 'reconnecting' || binanceWs.status === 'connecting') {
      setConnectionType('binance');
    } else if (mockWs.status === 'reconnecting' || mockWs.status === 'connecting') {
      setConnectionType('mock');
    } else {
      setConnectionType(null);
    }
  }, [binanceWs.status, mockWs.status]);

  // Try Binance first, fallback to mock
  useEffect(() => {
    const tryBinance = async () => {
      try {
        binanceWs.reconnect();
        // If Binance doesn't connect in 5 seconds, switch to mock
        setTimeout(() => {
          if (binanceWs.status !== 'connected') {
            console.log('[WebSocket] Binance not available, switching to mock');
            mockWs.connect();
          }
        }, 5000);
      } catch {
        console.log('[WebSocket] Binance failed, using mock');
        mockWs.connect();
      }
    };

    if (initialSymbols.length > 0) {
      tryBinance();
    }
  }, [initialSymbols]);

  const subscribe = useCallback((symbols: string[]) => {
    if (connectionType === 'binance') {
      binanceWs.subscribe(symbols);
    } else if (connectionType === 'mock') {
      // Mock doesn't need explicit subscription, just update symbols
    }
  }, [connectionType, binanceWs]);

  const unsubscribe = useCallback((symbols: string[]) => {
    if (connectionType === 'binance') {
      binanceWs.unsubscribe(symbols);
    }
  }, [connectionType, binanceWs]);

  const reconnect = useCallback(() => {
    binanceWs.reconnect();
    setTimeout(() => {
      if (binanceWs.status !== 'connected') {
        mockWs.connect();
      }
    }, 5000);
  }, [binanceWs, mockWs]);

  const status = connectionType === 'binance' ? binanceStatus : connectionType === 'mock' ? mockStatus : 'disconnected';
  const isConnected = status === 'connected';

  const value = useMemo(() => ({
    status,
    prices,
    ohlcData,
    lastTrade,
    subscribe,
    unsubscribe,
    reconnect,
    isConnected,
    connectionType,
  }), [status, prices, ohlcData, lastTrade, subscribe, unsubscribe, reconnect, isConnected, connectionType]);

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}

// Hook to get specific symbol price
export function useSymbolPrice(symbol: string): number | null {
  const { prices } = useWebSocket();
  return prices.get(symbol) || null;
}

// Hook to get OHLC data for a symbol
export function useSymbolOHLC(symbol: string): OHLCDataPoint[] {
  const { ohlcData } = useWebSocket();
  return ohlcData.get(symbol) || [];
}