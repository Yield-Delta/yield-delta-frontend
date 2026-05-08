'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Filter, X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface SentimentFiltersProps {
  sources: FilterOption[];
  timeRange: FilterOption[];
  tokenFilters: FilterOption[];
  onSourceChange: (values: string[]) => void;
  onTimeRangeChange: (value: string) => void;
  onTokenChange: (values: string[]) => void;
  className?: string;
}

export function SentimentFilters({
  sources,
  timeRange,
  tokenFilters,
  onSourceChange,
  onTimeRangeChange,
  onTokenChange,
  className,
}: SentimentFiltersProps) {
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [selectedTokens, setSelectedTokens] = useState<string[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const [showSourceDropdown, setShowSourceDropdown] = useState(false);
  const [showTokenDropdown, setShowTokenDropdown] = useState(false);

  const handleSourceToggle = (value: string) => {
    const newSources = selectedSources.includes(value)
      ? selectedSources.filter((s) => s !== value)
      : [...selectedSources, value];
    setSelectedSources(newSources);
    onSourceChange(newSources);
  };

  const handleTokenToggle = (value: string) => {
    const newTokens = selectedTokens.includes(value)
      ? selectedTokens.filter((t) => t !== value)
      : [...selectedTokens, value];
    setSelectedTokens(newTokens);
    onTokenChange(newTokens);
  };

  const clearAllFilters = () => {
    setSelectedSources([]);
    setSelectedTokens([]);
    setSelectedTimeRange('24h');
    onSourceChange([]);
    onTokenChange([]);
    onTimeRangeChange('24h');
  };

  const hasActiveFilters = selectedSources.length > 0 || selectedTokens.length > 0 || selectedTimeRange !== '24h';

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex flex-wrap items-center gap-3', className)}
    >
      <div className="flex items-center gap-2 text-gray-400">
        <Filter className="w-4 h-4" />
        <span className="text-sm font-medium">Filters</span>
      </div>

      <div className="relative">
        <button
          onClick={() => setShowSourceDropdown(!showSourceDropdown)}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-200',
            selectedSources.length > 0
              ? 'bg-neon-green/20 border-neon-green/50 text-neon-green'
              : 'bg-white/5 border-white/20 text-gray-300 hover:border-white/40'
          )}
        >
          <span className="text-sm">Sources</span>
          {selectedSources.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-neon-green/30 text-xs">
              {selectedSources.length}
            </span>
          )}
          <ChevronDown className="w-4 h-4" />
        </button>

        {showSourceDropdown && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowSourceDropdown(false)} />
            <div className="absolute top-full left-0 mt-2 z-20 bg-terminal-bg border border-white/20 rounded-lg p-2 w-56 shadow-xl">
              {sources.map((source) => (
                <button
                  key={source.value}
                  onClick={() => handleSourceToggle(source.value)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <span className="text-sm text-white">{source.label}</span>
                  <div className="flex items-center gap-2">
                    {source.count && (
                      <span className="text-xs text-gray-500">{source.count}</span>
                    )}
                    <div
                      className={cn(
                        'w-4 h-4 rounded border transition-colors flex items-center justify-center',
                        selectedSources.includes(source.value)
                          ? 'bg-neon-green border-neon-green'
                          : 'border-gray-500'
                      )}
                    >
                      {selectedSources.includes(source.value) && (
                        <span className="text-xs text-black">✓</span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="flex items-center rounded-lg bg-white/5 border border-white/20 p-1">
        {timeRange.map((range) => (
          <button
            key={range.value}
            onClick={() => {
              setSelectedTimeRange(range.value);
              onTimeRangeChange(range.value);
            }}
            className={cn(
              'px-3 py-1.5 rounded text-sm font-medium transition-all duration-200',
              selectedTimeRange === range.value
                ? 'bg-neon-green text-black'
                : 'text-gray-400 hover:text-white'
            )}
          >
            {range.label}
          </button>
        ))}
      </div>

      <div className="relative">
        <button
          onClick={() => setShowTokenDropdown(!showTokenDropdown)}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-200',
            selectedTokens.length > 0
              ? 'bg-neon-green/20 border-neon-green/50 text-neon-green'
              : 'bg-white/5 border-white/20 text-gray-300 hover:border-white/40'
          )}
        >
          <span className="text-sm">Tokens</span>
          {selectedTokens.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-neon-green/30 text-xs">
              {selectedTokens.length}
            </span>
          )}
          <ChevronDown className="w-4 h-4" />
        </button>

        {showTokenDropdown && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowTokenDropdown(false)} />
            <div className="absolute top-full left-0 mt-2 z-20 bg-terminal-bg border border-white/20 rounded-lg p-2 w-48 shadow-xl">
              {tokenFilters.map((token) => (
                <button
                  key={token.value}
                  onClick={() => handleTokenToggle(token.value)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <span className="text-sm text-white">{token.label}</span>
                  <div
                    className={cn(
                      'w-4 h-4 rounded border transition-colors flex items-center justify-center',
                      selectedTokens.includes(token.value)
                        ? 'bg-neon-green border-neon-green'
                        : 'border-gray-500'
                    )}
                  >
                    {selectedTokens.includes(token.value) && (
                      <span className="text-xs text-black">✓</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {hasActiveFilters && (
        <button
          onClick={clearAllFilters}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-colors"
        >
          <X className="w-4 h-4" />
          <span className="text-sm">Clear All</span>
        </button>
      )}
    </motion.div>
  );
}