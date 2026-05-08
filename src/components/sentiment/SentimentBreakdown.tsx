'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Activity, Brain, BarChart3, Users, ChevronDown, ChevronUp, Info } from 'lucide-react';

interface SentimentBreakdownProps {
  technical: number;
  fundamental: number;
  social: number;
}

export default function SentimentBreakdown({
  technical = 50,
  fundamental = 50,
  social = 50,
}: SentimentBreakdownProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const categories = [
    {
      id: 'technical',
      label: 'Technical',
      icon: BarChart3,
      value: technical,
      color: '#06b6d4',
      gradient: 'from-cyan-500 to-blue-500',
      description: 'Price action indicators, RSI, MACD, Moving Averages',
      details: [
        { label: 'RSI (14)', value: '54', trend: 'bullish' },
        { label: 'MACD Signal', value: 'Bullish', trend: 'bullish' },
        { label: 'SMA Cross', value: 'Golden', trend: 'bullish' },
      ],
    },
    {
      id: 'fundamental',
      label: 'Fundamental',
      icon: Brain,
      value: fundamental,
      color: '#10b981',
      gradient: 'from-green-500 to-emerald-500',
      description: 'Network health, TVL, trading volume, DeFi adoption',
      details: [
        { label: 'SEI Ecosystem', value: 'Healthy', trend: 'bullish' },
        { label: 'TVL', value: '$125M', trend: 'neutral' },
        { label: 'Daily Volume', value: '$12.5M', trend: 'bullish' },
      ],
    },
    {
      id: 'social',
      label: 'Social',
      icon: Users,
      value: social,
      color: '#8b5cf6',
      gradient: 'from-purple-500 to-pink-500',
      description: 'Community engagement, Fear & Greed Index, social sentiment',
      details: [
        { label: 'Fear & Greed', value: '65', trend: 'neutral' },
        { label: 'Engagement', value: 'High', trend: 'bullish' },
        { label: 'Trending', value: 'Positive', trend: 'bullish' },
      ],
    },
  ];

  const total = technical + fundamental + social;
  const percentages = {
    technical: (technical / total) * 100,
    fundamental: (fundamental / total) * 100,
    social: (social / total) * 100,
  };

  return (
    <motion.div
      className="rounded-2xl p-6"
      style={{
        background: 'rgba(10, 10, 15, 0.8)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          Sentiment Breakdown
        </h3>
        <span className="text-xs text-gray-400">Click to expand</span>
      </div>

      <div className="space-y-4">
        {categories.map((category, index) => (
          <motion.div
            key={category.id}
            className="rounded-xl overflow-hidden"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <button
              onClick={() => setExpanded(expanded === category.id ? null : category.id)}
              className="w-full p-4 flex items-center gap-4"
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${category.gradient}`}
              >
                <category.icon className="w-5 h-5 text-white" />
              </div>

              <div className="flex-1 text-left">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-white">{category.label}</span>
                  <span
                    className="text-lg font-bold font-mono"
                    style={{ color: category.color }}
                  >
                    {category.value}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r"
                    style={{
                      backgroundImage: `linear-gradient(to right, ${category.color}, ${category.color}80)`,
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${percentages[category.id as keyof typeof percentages]}%` }}
                    transition={{ delay: 0.3 + index * 0.1, duration: 1 }}
                  />
                </div>
              </div>

              <div className="text-gray-400">
                {expanded === category.id ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </div>
            </button>

            <AnimatePresence>
              {expanded === category.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 border-t border-white/5">
                    <p className="text-sm text-gray-400 mt-3 mb-4">{category.description}</p>
                    <div className="grid grid-cols-3 gap-3">
                      {category.details.map((detail, i) => (
                        <div
                          key={i}
                          className="p-3 rounded-lg"
                          style={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                          }}
                        >
                          <div className="text-xs text-gray-500 mb-1">{detail.label}</div>
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-semibold text-white">{detail.value}</span>
                            {detail.trend === 'bullish' && (
                              <TrendingUp className="w-3 h-3 text-green-400" />
                            )}
                            {detail.trend === 'bearish' && (
                              <TrendingDown className="w-3 h-3 text-red-400" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}