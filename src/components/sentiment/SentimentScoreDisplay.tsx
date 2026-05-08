'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Zap, Activity } from 'lucide-react';

interface SentimentScoreDisplayProps {
  score: number;
  technicalScore: number;
  fundamentalScore: number;
  socialScore: number;
  confidence: number;
  timeframe: string;
  previousScore?: number;
}

export default function SentimentScoreDisplay({
  score,
  technicalScore,
  fundamentalScore,
  socialScore,
  confidence,
  timeframe,
  previousScore,
}: SentimentScoreDisplayProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const [animatedSubscores, setAnimatedSubscores] = useState({
    technical: 0,
    fundamental: 0,
    social: 0,
  });

  useEffect(() => {
    const duration = 1500;
    const startTime = Date.now();
    const startScore = animatedScore;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      setAnimatedScore(startScore + (score - startScore) * eased);
      setAnimatedSubscores({
        technical: technicalScore * eased,
        fundamental: fundamentalScore * eased,
        social: socialScore * eased,
      });

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [score, technicalScore, fundamentalScore, socialScore]);

  const getScoreColor = (val: number) => {
    if (val >= 70) return '#10b981';
    if (val >= 55) return '#22c55e';
    if (val >= 45) return '#8b5cf6';
    if (val >= 30) return '#f59e0b';
    return '#ef4444';
  };

  const getScoreLabel = (val: number) => {
    if (val >= 80) return 'Very Bullish';
    if (val >= 65) return 'Bullish';
    if (val >= 55) return 'Slightly Bullish';
    if (val >= 45) return 'Neutral';
    if (val >= 35) return 'Slightly Bearish';
    if (val >= 20) return 'Bearish';
    return 'Very Bearish';
  };

  const scoreColor = getScoreColor(animatedScore);
  const scoreLabel = getScoreLabel(animatedScore);
  const trend = previousScore !== undefined
    ? animatedScore > previousScore ? 'up' : animatedScore < previousScore ? 'down' : 'neutral'
    : 'neutral';

  return (
    <motion.div
      className="relative rounded-3xl p-8 overflow-hidden"
      style={{
        background: 'rgba(10, 10, 15, 0.8)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: `0 0 60px ${scoreColor}15`,
      }}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-1/2 -right-1/2 w-full h-full rounded-full"
          style={{
            background: `radial-gradient(circle, ${scoreColor}10 0%, transparent 70%)`,
          }}
        />
        <div
          className="absolute -bottom-1/2 -left-1/2 w-full h-full rounded-full"
          style={{
            background: `radial-gradient(circle, ${scoreColor}05 0%, transparent 70%)`,
          }}
        />
      </div>

      <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8">
        <div className="flex-1 text-center lg:text-left">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-gray-400 uppercase tracking-wider">
              Overall Sentiment Score
            </span>
          </div>

          <div className="flex items-center justify-center lg:justify-start gap-4 mb-4">
            <motion.div
              className="relative"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
            >
              <span
                className="text-7xl font-black font-mono"
                style={{
                  color: scoreColor,
                  textShadow: `0 0 40px ${scoreColor}50`,
                }}
              >
                {Math.round(animatedScore)}
              </span>
              <span className="text-2xl text-gray-500">/100</span>

              <motion.div
                className="absolute -top-2 -right-8"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
              >
                {trend === 'up' && (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20 border border-green-500/30">
                    <TrendingUp className="w-3 h-3 text-green-400" />
                    <span className="text-xs font-bold text-green-400">+{Math.abs(score - (previousScore || score)).toFixed(1)}</span>
                  </div>
                )}
                {trend === 'down' && (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/20 border border-red-500/30">
                    <TrendingDown className="w-3 h-3 text-red-400" />
                    <span className="text-xs font-bold text-red-400">-{Math.abs(score - (previousScore || score)).toFixed(1)}</span>
                  </div>
                )}
              </motion.div>
            </motion.div>
          </div>

          <div className="flex items-center gap-4">
            <span
              className="px-3 py-1.5 rounded-full text-sm font-bold"
              style={{
                background: `${scoreColor}20`,
                color: scoreColor,
                border: `1px solid ${scoreColor}40`,
              }}
            >
              {scoreLabel}
            </span>
            <span className="text-sm text-gray-400">
              {timeframe} timeframe
            </span>
          </div>
        </div>

        <div className="flex-1 w-full lg:w-auto">
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Technical', value: animatedSubscores.technical, icon: '📊' },
              { label: 'Fundamental', value: animatedSubscores.fundamental, icon: '🏗️' },
              { label: 'Social', value: animatedSubscores.social, icon: '💬' },
            ].map((item, index) => (
              <motion.div
                key={item.label}
                className="text-center p-4 rounded-xl"
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                <div className="text-2xl mb-2">{item.icon}</div>
                <div className="flex items-center justify-center gap-1 mb-1">
                  <span
                    className="text-2xl font-bold font-mono"
                    style={{ color: getScoreColor(item.value) }}
                  >
                    {Math.round(item.value)}
                  </span>
                </div>
                <div className="text-xs text-gray-400 mb-2">{item.label}</div>
                <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: getScoreColor(item.value) }}
                    initial={{ width: 0 }}
                    animate={{ width: `${item.value}%` }}
                    transition={{ delay: 0.5 + index * 0.1, duration: 1 }}
                  />
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Confidence:</span>
              <div className="flex items-center gap-1">
                <div className="w-24 h-2 rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-purple-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${confidence}%` }}
                    transition={{ delay: 0.6, duration: 1 }}
                  />
                </div>
                <span className="text-sm font-mono font-bold text-white">{confidence}%</span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Zap className="w-3 h-3" />
              <span>AI Powered</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}