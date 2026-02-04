import React from 'react';

export function GradientTitle() {
  return (
    <svg viewBox="0 0 1200 200" className="w-full h-auto">
      <defs>
        <linearGradient id="title-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="hsl(var(--primary))">
            <animate attributeName="stop-color" values="hsl(var(--primary));hsl(var(--secondary));hsl(var(--accent));hsl(var(--primary))" dur="4s" repeatCount="indefinite" />
          </stop>
          <stop offset="100%" stopColor="hsl(var(--secondary))">
            <animate attributeName="stop-color" values="hsl(var(--secondary));hsl(var(--accent));hsl(var(--primary));hsl(var(--secondary))" dur="4s" repeatCount="indefinite" />
          </stop>
        </linearGradient>
      </defs>
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle"
        className="text-5xl lg:text-7xl font-bold"
        fill="url(#title-gradient)">
        Your Liquidity, Evolved
      </text>
    </svg>
  );
}
