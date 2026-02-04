import React from 'react';

export default function StatsCardGraphic({ type = 'tvl', className = '', style = {} }) {
  // Pick a different SVG for each stat type
  if (type === 'tvl') {
    return (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className={className} style={style}>
        <circle cx="24" cy="24" r="22" fill="url(#tvlGradient)" opacity="0.18" />
        <circle cx="24" cy="24" r="16" fill="#00f5d4" opacity="0.18" />
        <rect x="14" y="20" width="20" height="12" rx="4" fill="#00f5d4" fillOpacity="0.7" />
        <rect x="18" y="16" width="12" height="8" rx="3" fill="#9b5de5" fillOpacity="0.7" />
        <defs>
          <radialGradient id="tvlGradient" cx="0.5" cy="0.5" r="0.5" fx="0.5" fy="0.5">
            <stop stopColor="#00f5d4" />
            <stop offset="1" stopColor="#9b5de5" />
          </radialGradient>
        </defs>
      </svg>
    );
  }
  if (type === 'vaults') {
    return (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className={className} style={style}>
        <rect x="8" y="16" width="32" height="16" rx="8" fill="#9b5de5" fillOpacity="0.18" />
        <rect x="14" y="20" width="8" height="8" rx="4" fill="#00f5d4" />
        <rect x="26" y="20" width="8" height="8" rx="4" fill="#ff206e" />
      </svg>
    );
  }
  if (type === 'apy') {
    return (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className={className} style={style}>
        <path d="M12 36L20 28L28 36L36 20" stroke="#00f5d4" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="36" cy="20" r="4" fill="#ff206e" />
        <circle cx="20" cy="28" r="4" fill="#9b5de5" />
        <circle cx="28" cy="36" r="4" fill="#00f5d4" />
      </svg>
    );
  }
  // AI Uptime
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className={className} style={style}>
      <circle cx="24" cy="24" r="22" fill="#00f5d4" opacity="0.10" />
      <circle cx="24" cy="24" r="16" fill="#9b5de5" opacity="0.10" />
      <path d="M24 12v12l8 8" stroke="#00f5d4" strokeWidth="3" strokeLinecap="round" />
      <circle cx="24" cy="24" r="3" fill="#00f5d4" />
    </svg>
  );
}
