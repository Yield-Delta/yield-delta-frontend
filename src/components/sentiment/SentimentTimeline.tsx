'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimelineEvent {
  timestamp: Date;
  label: string;
  sentiment: number;
  change: number;
  description?: string;
}

interface SentimentTimelineProps {
  events: TimelineEvent[];
  className?: string;
}

export function SentimentTimeline({ events, className }: SentimentTimelineProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const getSentimentColor = (value: number) => {
    if (value >= 70) return 'bg-neon-green';
    if (value >= 50) return 'bg-yellow-500';
    if (value >= 30) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getSentimentLabel = (value: number) => {
    if (value >= 80) return 'Extreme Greed';
    if (value >= 60) return 'Greed';
    if (value >= 40) return 'Neutral';
    if (value >= 20) return 'Fear';
    return 'Extreme Fear';
  };

  return (
    <div className={cn('bg-terminal-bg/80 backdrop-blur-sm border border-white/10 rounded-xl p-6', className)}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Sentiment History</h3>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-lg hover:bg-white/10 transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-400" />
          </button>
          <span className="text-sm text-gray-400">Last 30 Days</span>
          <button className="p-2 rounded-lg hover:bg-white/10 transition-colors">
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>

      <div className="relative">
        <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-gradient-to-r from-red-500 via-yellow-500 to-neon-green opacity-30" />

        <div className="relative flex justify-between">
          {events.map((event, index) => {
            const isSelected = selectedIndex === index;
            const position = (event.sentiment / 100) * 100;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative group cursor-pointer"
                onClick={() => setSelectedIndex(isSelected ? null : index)}
              >
                <div
                  className={cn(
                    'w-4 h-4 rounded-full border-2 transition-all duration-200',
                    isSelected ? 'scale-125 border-white' : 'border-gray-600',
                    getSentimentColor(event.sentiment)
                  )}
                  style={{ marginTop: `${50 - position}%` }}
                />

                <div
                  className={cn(
                    'absolute top-6 left-1/2 -translate-x-1/2 z-10 bg-terminal-bg border border-white/20 rounded-lg p-4 w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200',
                    isSelected && 'opacity-100 visible'
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400">
                      {event.timestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <span className={cn('text-xs font-medium', getSentimentColor(event.sentiment).replace('bg-', 'text-'))}>
                      {getSentimentLabel(event.sentiment)}
                    </span>
                  </div>
                  <p className="text-sm text-white font-medium mb-1">{event.label}</p>
                  {event.description && (
                    <p className="text-xs text-gray-400 mb-2">{event.description}</p>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-white">{event.sentiment}</span>
                    <span className={cn(
                      'text-xs font-medium',
                      event.change >= 0 ? 'text-neon-green' : 'text-red-500'
                    )}>
                      {event.change >= 0 ? '+' : ''}{event.change.toFixed(1)}
                    </span>
                  </div>
                </div>

                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <span className="text-xs text-gray-500">
                    {event.timestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-between mt-8 text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span>Extreme Fear</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <span>Neutral</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-neon-green" />
          <span>Extreme Greed</span>
        </div>
      </div>
    </div>
  );
}