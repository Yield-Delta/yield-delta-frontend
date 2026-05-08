'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp, ArrowUpRight, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SentimentRow {
  id: string;
  source: string;
  type: 'reddit' | 'twitter' | 'news' | 'on-chain';
  title: string;
  sentiment: number;
  engagement: number;
  timestamp: Date;
  url?: string;
  metrics: {
    bullish: number;
    bearish: number;
    neutral: number;
  };
}

interface SentimentTableProps {
  data: SentimentRow[];
  className?: string;
}

export function SentimentTable({ data, className }: SentimentTableProps) {
  const [sortField, setSortField] = useState<'timestamp' | 'sentiment' | 'engagement'>('timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const sortedData = [...data].sort((a, b) => {
    const multiplier = sortDirection === 'asc' ? 1 : -1;
    return (a[sortField] as number) * multiplier - (b[sortField] as number) * multiplier;
  });

  const handleSort = (field: 'timestamp' | 'sentiment' | 'engagement') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSentimentBadge = (value: number) => {
    if (value >= 60) {
      return <span className="px-2 py-1 rounded text-xs font-medium bg-neon-green/20 text-neon-green">Bullish</span>;
    }
    if (value >= 40) {
      return <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-500/20 text-yellow-500">Neutral</span>;
    }
    return <span className="px-2 py-1 rounded text-xs font-medium bg-red-500/20 text-red-500">Bearish</span>;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'reddit':
        return <span className="text-orange-500 font-bold text-xs">R</span>;
      case 'twitter':
        return <span className="text-blue-400 font-bold text-xs">X</span>;
      case 'news':
        return <span className="text-purple-500 font-bold text-xs">N</span>;
      case 'on-chain':
        return <span className="text-cyan-500 font-bold text-xs">C</span>;
      default:
        return null;
    }
  };

  const SortIcon = ({ field }: { field: 'timestamp' | 'sentiment' | 'engagement' }) => (
    <span className="ml-1 inline-flex">
      {sortField === field ? (
        sortDirection === 'asc' ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )
      ) : (
        <ChevronDown className="w-4 h-4 opacity-30" />
      )}
    </span>
  );

  return (
    <div className={cn('bg-terminal-bg/80 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden', className)}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-white/5">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Source</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Content</th>
              <th
                onClick={() => handleSort('sentiment')}
                className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center">
                  Sentiment
                  <SortIcon field="sentiment" />
                </div>
              </th>
              <th
                onClick={() => handleSort('engagement')}
                className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center">
                  Engagement
                  <SortIcon field="engagement" />
                </div>
              </th>
              <th
                onClick={() => handleSort('timestamp')}
                className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center">
                  Time
                  <SortIcon field="timestamp" />
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {sortedData.map((row, index) => (
              <motion.tr
                key={row.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  'hover:bg-white/5 transition-colors cursor-pointer',
                  expandedRow === row.id && 'bg-white/5'
                )}
                onClick={() => setExpandedRow(expandedRow === row.id ? null : row.id)}
              >
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                      {getTypeIcon(row.type)}
                    </div>
                    <div>
                      <span className="text-sm font-medium text-white">{row.source}</span>
                      <span className="ml-2 text-xs text-gray-500 capitalize">{row.type}</span>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="max-w-xs">
                    <p className="text-sm text-white truncate">{row.title}</p>
                    {row.url && (
                      <a
                        href={row.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-neon-green hover:underline flex items-center gap-1 mt-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View source <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-white">{row.sentiment}</span>
                    {getSentimentBadge(row.sentiment)}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className="text-sm text-gray-300">{row.engagement.toLocaleString()}</span>
                </td>
                <td className="px-4 py-4">
                  <span className="text-sm text-gray-400">
                    {row.timestamp.toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <button className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                    <ArrowUpRight className={cn(
                      'w-4 h-4 text-gray-400 transition-transform',
                      expandedRow === row.id && 'rotate-180'
                    )} />
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {expandedRow && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="border-t border-white/10 p-4 bg-white/5"
        >
          {(() => {
            const expanded = sortedData.find((r) => r.id === expandedRow);
            if (!expanded) return null;
            return (
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-neon-green/10 border border-neon-green/20">
                  <p className="text-xs text-gray-400 mb-1">Bullish</p>
                  <p className="text-2xl font-bold text-neon-green">{expanded.metrics.bullish}%</p>
                </div>
                <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <p className="text-xs text-gray-400 mb-1">Neutral</p>
                  <p className="text-2xl font-bold text-yellow-500">{expanded.metrics.neutral}%</p>
                </div>
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-xs text-gray-400 mb-1">Bearish</p>
                  <p className="text-2xl font-bold text-red-500">{expanded.metrics.bearish}%</p>
                </div>
              </div>
            );
          })()}
        </motion.div>
      )}
    </div>
  );
}