import { useEffect, useRef, useCallback, useState } from 'react';

export type WebSocketStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected' | 'error';

export interface BinanceTradeData {
  e: string;           // Event type
  E: number;          // Event time
  s: string;          // Symbol
  t: number;          // Trade ID
  p: string;          // Price
  q: string;          // Quantity
  b: number;          // Buyer order ID
  a: number;          // Seller order ID
  T: number;          // Trade time
  m: boolean;         // Is buyer maker
}

export interface BinanceKlineData {
  t: number;          // Kline start time
  T: number;          // Kline close time
  s: string;          // Symbol
  i: string;          // Interval
  f: number;          // First trade ID
  L: number;          // Last trade ID
  o: string;          // Open price
  c: string;          // Close price
  h: string;          // High price
  l: string;          // Low price
  v: string;          // Base asset volume
  n: number;          // Number of trades
  x: boolean;         // Is this kline closed
  q: string;          // Quote asset volume
}

export interface OHLCData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface UseBinanceWebSocketOptions {
  symbols: string[];
  onTrade?: (data: BinanceTradeData) => void;
  onKline?: (data: BinanceKlineData) => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

interface UseBinanceWebSocketReturn {
  status: WebSocketStatus;
  lastTrade: BinanceTradeData | null;
  lastKline: BinanceKlineData | null;
  subscribe: (symbols: string[]) => void;
  unsubscribe: (symbols: string[]) => void;
  reconnect: () => void;
}

export function useBinanceWebSocket({
  symbols: initialSymbols = [],
  onTrade,
  onKline,
  reconnectInterval = 1000,
  maxReconnectAttempts = 5,
}: UseBinanceWebSocketOptions): UseBinanceWebSocketReturn {
  const [status, setStatus] = useState<WebSocketStatus>('disconnected');
  const [lastTrade, setLastTrade] = useState<BinanceTradeData | null>(null);
  const [lastKline, setLastKline] = useState<BinanceKlineData | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const subscribedSymbolsRef = useRef<Set<string>>(new Set(initialSymbols.map(s => s.toLowerCase())));

  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setStatus('connecting');

    // Build stream URL for multiple symbols
    const streams = Array.from(subscribedSymbolsRef.current).flatMap(symbol => [
      `${symbol}@trade`,
      `${symbol}@kline_1m`,
    ]);

    const wsUrl = `wss://stream.binance.com:9443/stream?streams=${streams.join('/')}`;

    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setStatus('connected');
        reconnectAttemptsRef.current = 0;
        console.log('[BinanceWS] Connected to Binance WebSocket');
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          const { stream, data } = message;

          if (stream?.includes('@trade')) {
            const tradeData = data as BinanceTradeData;
            setLastTrade(tradeData);
            onTrade?.(tradeData);
          }

          if (stream?.includes('@kline')) {
            const klineData = data.k as BinanceKlineData;
            setLastKline(klineData);
            onKline?.(klineData);
          }
        } catch (error) {
          console.error('[BinanceWS] Failed to parse message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('[BinanceWS] WebSocket error:', error);
        setStatus('error');
      };

      ws.onclose = () => {
        setStatus('disconnected');

        // Attempt reconnection with exponential backoff
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.min(
            reconnectInterval * Math.pow(2, reconnectAttemptsRef.current),
            30000
          );

          setStatus('reconnecting');
          reconnectAttemptsRef.current++;

          console.log(`[BinanceWS] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current})`);

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else {
          console.error('[BinanceWS] Max reconnection attempts reached');
          setStatus('error');
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('[BinanceWS] Failed to create WebSocket:', error);
      setStatus('error');
    }
  }, [reconnectInterval, maxReconnectAttempts, onTrade, onKline]);

  const subscribe = useCallback((symbols: string[]) => {
    const newSymbols = symbols.map(s => s.toLowerCase());
    newSymbols.forEach(symbol => subscribedSymbolsRef.current.add(symbol));

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const streams = newSymbols.flatMap(symbol => [
        `${symbol}@trade`,
        `${symbol}@kline_1m`,
      ]);
      wsRef.current.send(JSON.stringify({
        method: 'SUBSCRIBE',
        params: streams,
        id: Date.now(),
      }));
    } else {
      // Reconnect with new symbols
      connect();
    }
  }, [connect]);

  const unsubscribe = useCallback((symbols: string[]) => {
    const symbolsToRemove = symbols.map(s => s.toLowerCase());
    symbolsToRemove.forEach(symbol => subscribedSymbolsRef.current.delete(symbol));

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const streams = symbolsToRemove.flatMap(symbol => [
        `${symbol}@trade`,
        `${symbol}@kline_1m`,
      ]);
      wsRef.current.send(JSON.stringify({
        method: 'UNSUBSCRIBE',
        params: streams,
        id: Date.now(),
      }));
    }
  }, []);

  const reconnect = useCallback(() => {
    clearReconnectTimeout();
    reconnectAttemptsRef.current = 0;
    if (wsRef.current) {
      wsRef.current.close();
    }
    connect();
  }, [connect, clearReconnectTimeout]);

  useEffect(() => {
    if (initialSymbols.length > 0) {
      connect();
    }

    return () => {
      clearReconnectTimeout();
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return {
    status,
    lastTrade,
    lastKline,
    subscribe,
    unsubscribe,
    reconnect,
  };
}

// Helper to convert Binance kline to OHLC data
export function parseBinanceKline(kline: BinanceKlineData): OHLCData {
  return {
    time: kline.t / 1000,
    open: parseFloat(kline.o),
    high: parseFloat(kline.h),
    low: parseFloat(kline.l),
    close: parseFloat(kline.c),
    volume: parseFloat(kline.v),
  };
}

// Helper to parse trade price
export function parseTradePrice(trade: BinanceTradeData): number {
  return parseFloat(trade.p);
}