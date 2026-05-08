'use client';

import { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, X, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  trend: 'up' | 'down' | 'neutral';
  details?: {
    label: string;
    value: string | number;
  }[];
  drillDownData?: {
    title: string;
    items: {
      label: string;
      value: string | number;
      change?: number;
    }[];
  };
  className?: string;
}

export function MetricCard({
  title,
  value,
  subtitle,
  change,
  changeLabel,
  icon,
  trend,
  details,
  drillDownData,
  className,
}: MetricCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const trendConfig = {
    up: {
      icon: <TrendingUp className="w-4 h-4" />,
      color: 'text-neon-green',
      bgColor: 'bg-neon-green/10',
      borderColor: 'border-neon-green/30',
    },
    down: {
      icon: <TrendingDown className="w-4 h-4" />,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30',
    },
    neutral: {
      icon: <Minus className="w-4 h-4" />,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/30',
    },
  };

  const config = trendConfig[trend];

  return (
    <>
      <div
        onClick={() => drillDownData && setIsExpanded(true)}
        className={cn(
          'bg-terminal-bg/80 backdrop-blur-sm border rounded-lg p-4 transition-all duration-200',
          drillDownData ? 'cursor-pointer hover:border-neon-green/50 hover:bg-terminal-bg' : '',
          className
        )}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {icon && (
              <div className="p-2 rounded-lg bg-terminal-accent/20">
                {icon}
              </div>
            )}
            <span className="text-sm text-gray-400">{title}</span>
          </div>
          {drillDownData && (
            <ChevronRight className="w-4 h-4 text-gray-500" />
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{value}</span>
            {subtitle && (
              <span className="text-sm text-gray-500">{subtitle}</span>
            )}
          </div>

          {change !== undefined && (
            <div className={cn('flex items-center gap-1.5', config.color)}>
              <span className={cn('flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium', config.bgColor)}>
                {config.icon}
                {change > 0 ? '+' : ''}{change.toFixed(2)}%
              </span>
              {changeLabel && (
                <span className="text-xs text-gray-500">{changeLabel}</span>
              )}
            </div>
          )}
        </div>

        {details && details.length > 0 && (
          <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-2 gap-2">
            {details.map((detail, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-xs text-gray-500">{detail.label}</span>
                <span className="text-sm font-medium text-gray-300">{detail.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {isExpanded && drillDownData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsExpanded(false)} />
          <div className="relative bg-terminal-bg border border-neon-green/30 rounded-xl w-full max-w-lg p-6 shadow-2xl shadow-neon-green/10">
            <button
              onClick={() => setIsExpanded(false)}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>

            <h3 className="text-xl font-bold text-white mb-6">{drillDownData.title}</h3>

            <div className="space-y-3">
              {drillDownData.items.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <span className="text-sm text-gray-400">{item.label}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-semibold text-white">{item.value}</span>
                    {item.change !== undefined && (
                      <span className={cn(
                        'text-sm font-medium',
                        item.change >= 0 ? 'text-neon-green' : 'text-red-500'
                      )}>
                        {item.change >= 0 ? '+' : ''}{item.change.toFixed(2)}%
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}