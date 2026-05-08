'use client';

import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface RadarChartProps {
  data: {
    axis: string;
    value: number;
    color: string;
  }[];
  size?: number;
  levels?: number;
}

export default function RadarChart({
  data = [],
  size = 400,
  levels = 5,
}: RadarChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const center = size / 2;
  const maxRadius = (size / 2) - 60;
  const angleSlice = (Math.PI * 2) / data.length;

  const gridLevels = Array.from({ length: levels }, (_, i) => (i + 1) / levels);

  const getPointOnRadius = (radius: number, index: number) => {
    const angle = angleSlice * index - Math.PI / 2;
    return {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
    };
  };

  const getLabelPosition = (index: number) => {
    const angle = angleSlice * index - Math.PI / 2;
    const labelRadius = maxRadius + 35;
    return {
      x: center + labelRadius * Math.cos(angle),
      y: center + labelRadius * Math.sin(angle),
    };
  };

  const getDataPoints = () => {
    return data.map((d, i) => {
      const radius = (d.value / 100) * maxRadius;
      return getPointOnRadius(radius, i);
    });
  };

  const dataPoints = getDataPoints();

  return (
    <div className="relative flex flex-col items-center">
      <svg
        ref={svgRef}
        width={size}
        height={size}
        className="overflow-visible"
      >
        <defs>
          <filter id="radarGlow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="radarFillGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00f5d4" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#ff206e" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {gridLevels.map((level, i) => (
          <motion.polygon
            key={i}
            points={data.map((_, j) => {
              const point = getPointOnRadius(maxRadius * level, j);
              return `${point.x},${point.y}`;
            }).join(' ')}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={1}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.05 }}
          />
        ))}

        {data.map((_, i) => {
          const point = getPointOnRadius(maxRadius, i);
          return (
            <motion.line
              key={i}
              x1={center}
              y1={center}
              x2={point.x}
              y2={point.y}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth={1}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: i * 0.05, duration: 0.5 }}
            />
          );
        })}

        <motion.polygon
          points={dataPoints.map(p => `${p.x},${p.y}`).join(' ')}
          fill="url(#radarFillGradient)"
          stroke="#00f5d4"
          strokeWidth={2}
          filter="url(#radarGlow)"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />

        {dataPoints.map((point, i) => (
          <motion.circle
            key={i}
            cx={point.x}
            cy={point.y}
            r={hoveredIndex === i ? 8 : 5}
            fill={data[i].color}
            filter="url(#radarGlow)"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5 + i * 0.1, type: 'spring' }}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
            style={{ cursor: 'pointer' }}
          />
        ))}

        {data.map((d, i) => {
          const pos = getLabelPosition(i);
          const textAnchor = pos.x < center - 10 ? 'end' : pos.x > center + 10 ? 'start' : 'middle';
          return (
            <motion.g
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 + i * 0.05 }}
            >
              <text
                x={pos.x}
                y={pos.y}
                textAnchor={textAnchor}
                fill="rgba(255,255,255,0.7)"
                fontSize={11}
                fontFamily="JetBrains Mono, monospace"
              >
                {d.axis}
              </text>
              <text
                x={pos.x}
                y={pos.y + 14}
                textAnchor={textAnchor}
                fill={d.color}
                fontSize={12}
                fontWeight="bold"
                fontFamily="JetBrains Mono, monospace"
              >
                {d.value}%
              </text>
            </motion.g>
          );
        })}

        <text
          x={center}
          y={center + 5}
          textAnchor="middle"
          fill="rgba(255,255,255,0.3)"
          fontSize={10}
          fontFamily="JetBrains Mono, monospace"
        >
          SENTIMENT MAP
        </text>
      </svg>

      {hoveredIndex !== null && (
        <motion.div
          className="absolute top-4 left-4 px-4 py-2 rounded-xl"
          style={{
            background: 'rgba(10, 10, 15, 0.95)',
            border: `1px solid ${data[hoveredIndex].color}40`,
          }}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="text-sm font-bold" style={{ color: data[hoveredIndex].color }}>
            {data[hoveredIndex].axis}
          </div>
          <div className="text-lg font-mono font-bold text-white">
            {data[hoveredIndex].value}%
          </div>
        </motion.div>
      )}
    </div>
  );
}

export function useRadarChartData(metrics: {
  technical: number;
  fundamental: number;
  social: number;
  fearGreed: number;
  momentum: number;
  volatility: number;
}) {
  return [
    { axis: 'Technical', value: metrics.technical, color: '#06b6d4' },
    { axis: 'Fundamental', value: metrics.fundamental, color: '#10b981' },
    { axis: 'Social', value: metrics.social, color: '#8b5cf6' },
    { axis: 'Fear/Greed', value: metrics.fearGreed, color: '#f59e0b' },
    { axis: 'Momentum', value: metrics.momentum, color: '#ff206e' },
    { axis: 'Volatility', value: metrics.volatility, color: '#dc2626' },
  ];
}