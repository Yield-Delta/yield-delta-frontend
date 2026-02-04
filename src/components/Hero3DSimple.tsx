'use client'

import { useRef, useEffect } from 'react';

/**
 * Hero3DSimple - Lightweight mobile fallback
 *
 * A performant SVG-based visualization that maintains the visual
 * language of the full 3D scene while being mobile-friendly.
 *
 * Design elements:
 * - Neural network pattern representing AI intelligence
 * - Orbital vault system showing liquidity management
 * - Data streams indicating automation
 * - Holographic aesthetic with brand colors
 */
export default function Hero3DSimple() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      // Smooth fade-in animation
      containerRef.current.style.opacity = '0';
      setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.style.transition = 'opacity 1.5s ease-in-out';
          containerRef.current.style.opacity = '1';
        }
      }, 100);
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative flex items-center justify-center min-h-full overflow-hidden"
      style={{ minHeight: 'inherit' }}
    >
      {/* Enhanced SVG-based neural network visualization */}
      <svg
        viewBox="0 0 800 800"
        className="w-full h-full max-w-none max-h-none"
        style={{
          filter: 'drop-shadow(0 0 40px rgba(0, 245, 212, 0.3))',
          minHeight: 'inherit'
        }}
      >
        {/* Defs for gradients and effects */}
        <defs>
          {/* Holographic grid pattern */}
          <pattern id="neuralGrid" width="80" height="80" patternUnits="userSpaceOnUse">
            <path
              d="M 80 0 L 0 0 0 80"
              fill="none"
              stroke="rgba(0, 245, 212, 0.06)"
              strokeWidth="0.5"
            />
          </pattern>

          {/* Radial gradients for depth */}
          <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" style={{stopColor:"rgba(0, 245, 212, 0.4)", stopOpacity:1}} />
            <stop offset="50%" style={{stopColor:"rgba(155, 93, 229, 0.2)", stopOpacity:0.5}} />
            <stop offset="100%" style={{stopColor:"rgba(255, 32, 110, 0.1)", stopOpacity:0}} />
          </radialGradient>

          {/* Energy flow gradient */}
          <linearGradient id="energyFlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{stopColor:"#00f5d4", stopOpacity:0.8}} />
            <stop offset="50%" style={{stopColor:"#9b5de5", stopOpacity:0.6}} />
            <stop offset="100%" style={{stopColor:"#ff206e", stopOpacity:0.4}} />
          </linearGradient>

          {/* Glow filter */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Background holographic grid */}
        <rect width="100%" height="100%" fill="url(#neuralGrid)" opacity="0.8"/>

        {/* Central glow */}
        <circle cx="400" cy="400" r="350" fill="url(#coreGlow)" />

        {/* Central AI Neural Core */}
        <g className="animate-spin" style={{
          transformOrigin: '400px 400px',
          animationDuration: '40s',
          animationTimingFunction: 'linear'
        }}>
          {/* Core icosahedron representation */}
          <g transform="translate(400,400)">
            {/* Multi-layered neural sphere */}
            {[0, 1, 2].map((layer) => {
              const size = 60 - layer * 8;
              const opacity = 0.7 - layer * 0.15;
              const color = layer === 0 ? '#00f5d4' : layer === 1 ? '#9b5de5' : '#ff206e';

              return (
                <g key={`layer-${layer}`}>
                  {/* Pentagon pattern for icosahedron feel */}
                  {[0, 72, 144, 216, 288].map((angle) => (
                    <path
                      key={`pent-${angle}`}
                      d={`M ${Math.cos((angle * Math.PI) / 180) * size} ${Math.sin((angle * Math.PI) / 180) * size}
                          L ${Math.cos(((angle + 72) * Math.PI) / 180) * size} ${Math.sin(((angle + 72) * Math.PI) / 180) * size}`}
                      stroke={color}
                      strokeWidth="2"
                      fill="none"
                      opacity={opacity}
                      filter="url(#glow)"
                    />
                  ))}
                </g>
              );
            })}
          </g>
        </g>

        {/* Neural network nodes */}
        <g>
          {Array.from({ length: 16 }).map((_, i) => {
            const angle = (i / 16) * Math.PI * 2;
            const radius = 180;
            const x = 400 + Math.cos(angle) * radius;
            const y = 400 + Math.sin(angle) * radius;
            const color = i % 3 === 0 ? '#00f5d4' : i % 3 === 1 ? '#9b5de5' : '#ff206e';

            return (
              <g key={`neuron-${i}`}>
                {/* Connection to core */}
                <line
                  x1="400"
                  y1="400"
                  x2={x}
                  y2={y}
                  stroke={color}
                  strokeWidth="0.5"
                  opacity="0.2"
                  strokeDasharray="4,4"
                  className="animate-pulse"
                  style={{animationDelay: `${i * 0.1}s`, animationDuration: '3s'}}
                />
                {/* Neuron node */}
                <circle
                  cx={x}
                  cy={y}
                  r="4"
                  fill={color}
                  opacity="0.8"
                  filter="url(#glow)"
                  className="animate-pulse"
                  style={{animationDelay: `${i * 0.1}s`, animationDuration: '2s'}}
                />
              </g>
            );
          })}
        </g>

        {/* Orbiting Vaults - Represents liquidity strategies */}
        {[0, 1, 2, 3].map((i) => {
          const orbitRadius = 240;
          const vaultSize = 30;

          return (
            <g
              key={`vault-${i}`}
              className="animate-spin"
              style={{
                transformOrigin: '400px 400px',
                animationDuration: `${25 + i * 5}s`,
                animationDirection: i % 2 === 0 ? 'normal' : 'reverse'
              }}
            >
              <g transform={`translate(${400 + Math.cos(i * Math.PI / 2) * orbitRadius}, ${400 + Math.sin(i * Math.PI / 2) * orbitRadius})`}>
                {/* Vault dodecahedron representation */}
                <g className="animate-pulse" style={{animationDuration: '2s'}}>
                  {/* Inner vault */}
                  <polygon
                    points={`0,-${vaultSize} ${vaultSize * 0.95},${vaultSize * 0.31} ${vaultSize * 0.59},${vaultSize * 0.81} ${-vaultSize * 0.59},${vaultSize * 0.81} ${-vaultSize * 0.95},${vaultSize * 0.31}`}
                    fill="none"
                    stroke={i === 0 ? '#00f5d4' : i === 1 ? '#9b5de5' : i === 2 ? '#ff206e' : '#fbae3c'}
                    strokeWidth="2"
                    opacity="0.8"
                    filter="url(#glow)"
                  />
                  {/* Outer glow */}
                  <polygon
                    points={`0,-${vaultSize * 1.2} ${vaultSize * 1.14},${vaultSize * 0.37} ${vaultSize * 0.71},${vaultSize * 0.97} ${-vaultSize * 0.71},${vaultSize * 0.97} ${-vaultSize * 1.14},${vaultSize * 0.37}`}
                    fill="none"
                    stroke={i === 0 ? '#00f5d4' : i === 1 ? '#9b5de5' : i === 2 ? '#ff206e' : '#fbae3c'}
                    strokeWidth="0.5"
                    opacity="0.3"
                  />
                </g>

                {/* Particle ring */}
                {Array.from({ length: 8 }).map((_, p) => {
                  const pAngle = (p / 8) * Math.PI * 2;
                  const pRadius = 45;
                  return (
                    <circle
                      key={`particle-${p}`}
                      cx={Math.cos(pAngle) * pRadius}
                      cy={Math.sin(pAngle) * pRadius}
                      r="2"
                      fill={i === 0 ? '#00f5d4' : i === 1 ? '#9b5de5' : i === 2 ? '#ff206e' : '#fbae3c'}
                      opacity="0.6"
                    />
                  );
                })}
              </g>
            </g>
          );
        })}

        {/* Data flow streams */}
        {[0, 1, 2, 3].map((i) => {
          const angle = (i / 4) * Math.PI * 2;
          const streamLength = 200;

          return (
            <line
              key={`stream-${i}`}
              x1="400"
              y1="400"
              x2={400 + Math.cos(angle) * streamLength}
              y2={400 + Math.sin(angle) * streamLength}
              stroke="url(#energyFlow)"
              strokeWidth="1.5"
              strokeDasharray="5,10"
              opacity="0.4"
              className="animate-pulse"
              style={{
                animationDelay: `${i * 0.3}s`,
                animationDuration: '2s'
              }}
            />
          );
        })}

        {/* Holographic rings */}
        {[120, 160, 200].map((radius, i) => (
          <circle
            key={`ring-${i}`}
            cx="400"
            cy="400"
            r={radius}
            fill="none"
            stroke={i === 0 ? '#00f5d4' : i === 1 ? '#9b5de5' : '#ff206e'}
            strokeWidth="1"
            opacity="0.15"
            strokeDasharray="10,10"
            className="animate-ping"
            style={{
              animationDuration: `${4 + i * 2}s`,
              animationDelay: `${i * 0.5}s`
            }}
          />
        ))}

        {/* Energy particles */}
        {Array.from({ length: 30 }).map((_, i) => {
          const x = 200 + Math.random() * 400;
          const y = 200 + Math.random() * 400;
          const color = i % 3 === 0 ? '#00f5d4' : i % 3 === 1 ? '#9b5de5' : '#ff206e';

          return (
            <circle
              key={`particle-${i}`}
              cx={x}
              cy={y}
              r={Math.random() * 2 + 1}
              fill={color}
              opacity="0.4"
              className="animate-pulse"
              style={{
                animationDelay: `${i * 0.2}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          );
        })}
      </svg>

      {/* Lightweight mode indicator */}
      <div className="absolute bottom-4 right-4 text-xs opacity-40 text-primary-glow backdrop-blur-sm px-2 py-1 rounded">
        Optimized Mode
      </div>
    </div>
  );
}
