import React, { useId } from 'react';

interface Logo3DProps {
  size?: number;
  className?: string;
}

interface LogoHorizontal3DProps {
  height?: number;
  className?: string;
}

export function Logo3D({ size = 120, className = '' }: Logo3DProps) {
  const id = useId().replace(/:/g, '');

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        className="absolute inset-0"
        style={{
          filter: 'drop-shadow(0 10px 20px rgba(3, 5, 18, 0.52))',
          transform: 'perspective(900px) rotateX(9deg) rotateY(-11deg)',
        }}
      >
        <defs>
          <linearGradient id={`${id}-aperture`} x1="39" y1="38" x2="82" y2="80">
            <stop stopColor="#00f5d4" />
            <stop offset="0.48" stopColor="#9b5de5" />
            <stop offset="1" stopColor="#ff206e" />
          </linearGradient>
          <filter id={`${id}-glow`} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="4.5" />
          </filter>
          <filter id={`${id}-depth`} x="-25%" y="-25%" width="150%" height="150%">
            <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#02030b" floodOpacity="0.55" />
          </filter>
        </defs>

        <g opacity="0.55" filter={`url(#${id}-glow)`}>
          <path d="M60 13 C46 35 34 59 20 96" stroke="#00f5d4" strokeWidth="20" strokeLinecap="round" />
          <path d="M60 13 C74 36 86 61 100 96" stroke="#ff206e" strokeWidth="20" strokeLinecap="round" />
          <path d="M20 96 C45 82 75 82 100 96" stroke="#9b5de5" strokeWidth="20" strokeLinecap="round" />
        </g>

        <g filter={`url(#${id}-depth)`}>
          <path d="M60 13 C46 35 34 59 20 96" stroke="#00f5d4" strokeWidth="18" strokeLinecap="round" />
          <path d="M60 13 C74 36 86 61 100 96" stroke="#ff206e" strokeWidth="18" strokeLinecap="round" />
          <path d="M20 96 C45 82 75 82 100 96" stroke="#9b5de5" strokeWidth="18" strokeLinecap="round" />
          <path d="M60 13 C46 35 34 59 20 96" stroke="rgba(255,255,255,0.38)" strokeWidth="3.5" strokeLinecap="round">
            <animate attributeName="stroke-dasharray" values="0 170;56 114;0 170" dur="4.4s" repeatCount="indefinite" />
          </path>
          <path d="M60 13 C74 36 86 61 100 96" stroke="rgba(255,255,255,0.28)" strokeWidth="3.5" strokeLinecap="round">
            <animate attributeName="stroke-dasharray" values="0 170;56 114;0 170" dur="4.4s" begin="0.35s" repeatCount="indefinite" />
          </path>
          <path d="M20 96 C45 82 75 82 100 96" stroke="rgba(255,255,255,0.24)" strokeWidth="3.5" strokeLinecap="round">
            <animate attributeName="stroke-dasharray" values="0 170;56 114;0 170" dur="4.4s" begin="0.7s" repeatCount="indefinite" />
          </path>
        </g>

        <path d="M60 39 L80 59 L60 79 L40 59 Z" fill="#070914" stroke={`url(#${id}-aperture)`} strokeWidth="5" />
        <path d="M60 51 L68 59 L60 67 L52 59 Z" fill={`url(#${id}-aperture)`}>
          <animate attributeName="opacity" values="0.72;1;0.72" dur="2.2s" repeatCount="indefinite" />
        </path>
      </svg>
    </div>
  );
}

export function LogoHorizontal3D({ height = 60, className = '' }: LogoHorizontal3DProps) {
  const id = useId().replace(/:/g, '');
  const width = (height / 60) * 224;

  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      <svg
        width={width}
        height={height}
        viewBox="0 0 224 60"
        className="absolute inset-0"
        style={{
          filter: 'drop-shadow(0 8px 14px rgba(3, 5, 18, 0.42))',
          transform: 'perspective(800px) rotateX(4deg)',
        }}
      >
        <defs>
          <linearGradient id={`${id}-word`} x1="62" y1="0" x2="208" y2="0">
            <stop stopColor="#f6fbff" />
            <stop offset="0.58" stopColor="#d5ddfb" />
            <stop offset="1" stopColor="#00f5d4" />
          </linearGradient>
          <linearGradient id={`${id}-core`} x1="18" y1="11" x2="50" y2="49">
            <stop stopColor="#00f5d4" />
            <stop offset="0.48" stopColor="#9b5de5" />
            <stop offset="1" stopColor="#ff206e" />
          </linearGradient>
        </defs>

        <g transform="translate(4 3)">
          <path d="M28 7 C22 17 16 29 9 47" stroke="#00f5d4" strokeWidth="8" strokeLinecap="round" />
          <path d="M28 7 C34 17 40 30 47 47" stroke="#ff206e" strokeWidth="8" strokeLinecap="round" />
          <path d="M9 47 C20 41 36 41 47 47" stroke="#9b5de5" strokeWidth="8" strokeLinecap="round" />
          <path d="M28 20 L39 31 L28 42 L17 31 Z" fill="#070914" stroke={`url(#${id}-core)`} strokeWidth="2.5" />
          <path d="M28 27 L32 31 L28 35 L24 31 Z" fill={`url(#${id}-core)`}>
            <animate attributeName="opacity" values="0.7;1;0.7" dur="2.2s" repeatCount="indefinite" />
          </path>
        </g>

        <text x="66" y="29" fontFamily="inherit" fontSize="21" fontWeight="800" letterSpacing="0" fill={`url(#${id}-word)`}>
          Yield Delta
        </text>
        <text x="67" y="45" fontFamily="inherit" fontSize="9" fontWeight="700" letterSpacing="0" fill="#9ba8c9">
          MULTICHAIN VAULTS
        </text>
      </svg>
    </div>
  );
}

export default Logo3D;
