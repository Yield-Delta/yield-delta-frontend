'use client';

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Search, Star, TrendingUp, X } from 'lucide-react';

interface Token {
  symbol: string;
  name: string;
  color: string;
  price?: number;
  change24h?: number;
  coingeckoId?: string;
}

interface TokenPairSelectorProps {
  tokens: Token[];
  selectedToken: Token;
  onSelectToken: (token: Token) => void;
  favorites?: string[];
  onToggleFavorite?: (symbol: string) => void;
  className?: string;
}

// Default tokens with their colors
const DEFAULT_TOKENS: Token[] = [
  { symbol: 'SEI-USDT', name: 'SEI Network', color: '#dc2626', coingeckoId: 'sei-network' },
  { symbol: 'ETH-USDT', name: 'Ethereum', color: '#627eea', coingeckoId: 'ethereum' },
  { symbol: 'BTC-USDT', name: 'Bitcoin', color: '#f7931a', coingeckoId: 'bitcoin' },
  { symbol: 'USDC-USDT', name: 'USD Coin', color: '#2775ca', coingeckoId: 'usd-coin' },
  { symbol: 'SOL-USDT', name: 'Solana', color: '#00ffa3', coingeckoId: 'solana' },
  { symbol: 'ATOM-USDT', name: 'Cosmos', color: '#2e3148', coingeckoId: 'cosmos' },
  { symbol: 'OSMO-USDT', name: 'Osmosis', color: '#f5a623', coingeckoId: 'osmosis' },
  { symbol: 'SUI-USDT', name: 'Sui', color: '#6fcf97', coingeckoId: 'sui' },
  { symbol: 'W-USDT', name: 'Wormhole', color: '#00f5d4', coingeckoId: 'wormhole' },
  { symbol: 'SEI-BTC', name: 'SEI/Bitcoin', color: '#dc2626' },
  { symbol: 'ETH-BTC', name: 'Ethereum/Bitcoin', color: '#627eea' },
  { symbol: 'SOL-BTC', name: 'Solana/Bitcoin', color: '#00ffa3' },
];

export default function TokenPairSelector({
  tokens = DEFAULT_TOKENS,
  selectedToken,
  onSelectToken,
  favorites = [],
  onToggleFavorite,
  className = '',
}: TokenPairSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter tokens based on search
  const filteredTokens = useMemo(() => {
    if (!searchQuery) return tokens;
    const query = searchQuery.toLowerCase();
    return tokens.filter(
      token =>
        token.symbol.toLowerCase().includes(query) ||
        token.name.toLowerCase().includes(query)
    );
  }, [tokens, searchQuery]);

  // Group tokens by base asset
  const groupedTokens = useMemo(() => {
    const groups: Record<string, Token[]> = {};
    filteredTokens.forEach(token => {
      const base = token.symbol.split('-')[0];
      if (!groups[base]) groups[base] = [];
      groups[base].push(token);
    });
    return groups;
  }, [filteredTokens]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 hover:bg-white/10"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* Token Icon */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm"
          style={{ background: selectedToken.color }}
        >
          {selectedToken.symbol.slice(0, 2)}
        </div>

        {/* Token Info */}
        <div className="text-left">
          <div className="font-bold text-white text-lg">{selectedToken.symbol}</div>
          <div className="text-xs text-gray-400">{selectedToken.name}</div>
        </div>

        {/* Chevron */}
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-5 h-5 text-gray-400" />
        </motion.div>
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute top-full left-0 mt-2 w-80 rounded-xl overflow-hidden z-50"
            style={{
              background: 'rgba(10, 10, 15, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
            }}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {/* Search */}
            <div className="p-3 border-b border-white/10">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tokens..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-primary/50"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Favorites */}
            {favorites.length > 0 && (
              <div className="p-2 border-b border-white/5">
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                  <Star className="w-3 h-3" />
                  <span>Favorites</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {favorites.map(symbol => {
                    const token = tokens.find(t => t.symbol === symbol);
                    if (!token) return null;
                    return (
                      <button
                        key={symbol}
                        onClick={() => {
                          onSelectToken(token);
                          setIsOpen(false);
                        }}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary/10 text-primary text-xs hover:bg-primary/20"
                      >
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ background: token.color }}
                        />
                        {symbol.split('-')[0]}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Token List */}
            <div className="max-h-80 overflow-y-auto p-2">
              {Object.entries(groupedTokens).map(([base, tokens]) => (
                <div key={base} className="mb-3">
                  <div className="px-2 py-1 text-[10px] text-gray-500 uppercase tracking-wide font-medium">
                    {base} Pairs
                  </div>
                  {tokens.map(token => (
                    <button
                      key={token.symbol}
                      onClick={() => {
                        onSelectToken(token);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                        selectedToken.symbol === token.symbol
                          ? 'bg-primary/10 border border-primary/30'
                          : 'hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      {/* Token Icon */}
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs"
                        style={{ background: token.color }}
                      >
                        {token.symbol.slice(0, 2)}
                      </div>

                      {/* Token Info */}
                      <div className="flex-1 text-left">
                        <div className="font-semibold text-white text-sm">{token.symbol}</div>
                        <div className="text-xs text-gray-400">{token.name}</div>
                      </div>

                      {/* Favorite button */}
                      {onToggleFavorite && (
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            onToggleFavorite(token.symbol);
                          }}
                          className={`p-1 rounded hover:bg-white/10 ${
                            favorites.includes(token.symbol) ? 'text-yellow-400' : 'text-gray-500'
                          }`}
                        >
                          <Star className="w-4 h-4" fill={favorites.includes(token.symbol) ? 'currentColor' : 'none'} />
                        </button>
                      )}

                      {/* Price indicator */}
                      {token.change24h !== undefined && (
                        <div
                          className={`text-xs font-mono ${
                            token.change24h >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}
                        >
                          {token.change24h >= 0 ? '+' : ''}{token.change24h.toFixed(2)}%
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-2 border-t border-white/10">
              <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                <TrendingUp className="w-3 h-3" />
                <span>{tokens.length} trading pairs</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Hook for managing favorites in localStorage
export function useTokenFavorites(symbol: string = 'chart-favorites') {
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(symbol);
    if (stored) {
      try {
        setFavorites(JSON.parse(stored));
      } catch {
        console.warn('Failed to load favorites');
      }
    }
  }, [symbol]);

  const toggleFavorite = useCallback((tokenSymbol: string) => {
    setFavorites(prev => {
      const newFavorites = prev.includes(tokenSymbol)
        ? prev.filter(s => s !== tokenSymbol)
        : [...prev, tokenSymbol];
      localStorage.setItem(symbol, JSON.stringify(newFavorites));
      return newFavorites;
    });
  }, [symbol]);

  return { favorites, toggleFavorite };
}