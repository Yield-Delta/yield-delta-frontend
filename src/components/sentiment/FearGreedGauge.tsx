'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Zap } from 'lucide-react';

interface FearGreedGaugeProps {
  value: number;
  classification: string;
  previousValue?: number;
  size?: 'sm' | 'md' | 'lg';
  showHistory?: boolean;
  history?: { time: string; value: number }[];
}

export default function FearGreedGauge({
  value = 50,
  classification = 'Neutral',
  previousValue,
  size = 'lg',
  showHistory = true,
  history = [],
}: FearGreedGaugeProps) {
  const [animatedValue, setAnimatedValue] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  const sizes = {
    sm: { width: 200, height: 120, strokeWidth: 8, fontSize: 24, labelSize: 10 },
    md: { width: 280, height: 160, strokeWidth: 12, fontSize: 32, labelSize: 12 },
    lg: { width: 400, height: 240, strokeWidth: 16, fontSize: 48, labelSize: 14 },
  };

  const { width, height, strokeWidth, fontSize, labelSize } = sizes[size];
  const radius = (width - strokeWidth) / 2;
  const centerX = width / 2;
  const centerY = height - strokeWidth / 2;
  const startAngle = Math.PI;
  const endAngle = 0;
  const totalAngle = startAngle - endAngle;

  useEffect(() => {
    const duration = 1500;
    const startTime = Date.now();
    const startValue = animatedValue;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedValue(startValue + (value - startValue) * eased);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value]);

  const getColor = (val: number) => {
    if (val <= 25) return '#dc2626';
    if (val <= 45) return '#f59e0b';
    if (val <= 55) return '#8b5cf6';
    if (val <= 75) return '#22c55e';
    return '#10b981';
  };

  const getClassificationLabel = (val: number) => {
    if (val <= 25) return 'Extreme Fear';
    if (val <= 45) return 'Fear';
    if (val <= 55) return 'Neutral';
    if (val <= 75) return 'Greed';
    return 'Extreme Greed';
  };

  const valueToAngle = (val: number) => {
    return startAngle - (val / 100) * totalAngle;
  };

  const needleAngle = valueToAngle(animatedValue);
  const needleX = centerX + (radius - 20) * Math.cos(needleAngle);
  const needleY = centerY + (radius - 20) * Math.sin(needleAngle);

  const color = getColor(animatedValue);

  const trend = previousValue !== undefined
    ? animatedValue > previousValue ? 'up' : animatedValue < previousValue ? 'down' : 'neutral'
    : 'neutral';

  return (
    <div className="relative flex flex-col items-center">
      <div className="relative" style={{ width, height }}>
        <svg width={width} height={height} className="overflow-visible">
          <defs>
            <linearGradient id="fearGreedGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#dc2626" />
              <stop offset="25%" stopColor="#f59e0b" />
              <stop offset="50%" stopColor="#8b5cf6" />
              <stop offset="75%" stopColor="#22c55e" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <circle
            cx={centerX}
            cy={centerY}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={strokeWidth}
            strokeDasharray={`${(totalAngle * radius)} ${2 * Math.PI * radius}`}
            strokeLinecap="round"
            transform={`rotate(${180} ${centerX} ${centerY})`}
          />

          <motion.circle
            cx={centerX}
            cy={centerY}
            r={radius}
            fill="none"
            stroke="url(#fearGreedGradient)"
            strokeWidth={strokeWidth}
            strokeDasharray={`${(totalAngle * radius)} ${2 * Math.PI * radius}`}
            strokeLinecap="round"
            transform={`rotate(${180} ${centerX} ${centerY})`}
            filter="url(#glow)"
            initial={{ strokeDashoffset: totalAngle * radius }}
            animate={{ strokeDashoffset: totalAngle * radius - (animatedValue / 100) * totalAngle * radius }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />

          <text
            x={centerX - radius + 10}
            y={centerY - 15}
            fill="#dc2626"
            fontSize={labelSize}
            fontFamily="JetBrains Mono, monospace"
            fontWeight="600"
          >
            Fear
          </text>
          <text
            x={centerX + radius - 30}
            y={centerY - 15}
            fill="#10b981"
            fontSize={labelSize}
            fontFamily="JetBrains Mono, monospace"
            fontWeight="600"
          >
            Greed
          </text>

          <motion.line
            x1={centerX}
            y1={centerY}
            x2={needleX}
            y2={needleY}
            stroke={color}
            strokeWidth={3}
            strokeLinecap="round"
            filter="url(#glow)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.3 }}
          />
          <motion.circle
            cx={centerX}
            cy={centerY}
            r={8}
            fill={color}
            filter="url(#glow)"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: 'spring' }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            className="font-mono font-bold text-white"
            style={{ fontSize, color, textShadow: `0 0 20px ${color}` }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
          >
            {Math.round(animatedValue)}
          </motion.div>

          <div className="flex items-center gap-2 mt-1">
            {trend === 'up' && <TrendingUp className="w-4 h-4 text-green-400" />}
            {trend === 'down' && <TrendingDown className="w-4 h-4 text-red-400" />}
            {trend === 'neutral' && <Minus className="w-4 h-4 text-purple-400" />}
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{
                background: `${color}20`,
                color,
                border: `1px solid ${color}40`,
              }}
            >
              {getClassificationLabel(animatedValue)}
            </span>
          </div>
        </div>
      </div>

      {showHistory && history.length > 0 && (
        <div className="mt-4 w-full max-w-md">
          <div className="h-16 flex items-end gap-1">
            {history.map((point, i) => (
              <motion.div
                key={i}
                className="flex-1 rounded-t-sm transition-colors"
                style={{
                  height: `${(point.value / 100) * 100}%`,
                  background: getColor(point.value),
                  opacity: 0.6,
                }}
                initial={{ height: 0 }}
                animate={{ height: `${(point.value / 100) * 100}%` }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
              />
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-gray-500 mt-1">
            <span>{history[0]?.time}</span>
            <span>{history[history.length - 1]?.time}</span>
          </div>
        </div>
      )}
    </div>
  );
}