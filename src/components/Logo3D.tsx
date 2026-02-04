import React from 'react';

export function Logo3D({ size = 120, className = "" }) {
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 120 120" 
        className="absolute inset-0 drop-shadow-lg"
        style={{
          filter: 'drop-shadow(0 0 20px rgba(155, 93, 229, 0.5))',
          transform: 'perspective(1000px) rotateX(10deg) rotateY(-10deg)'
        }}
      >
        <defs>
          <linearGradient id="logo3d-primary" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00f5d4"/>
            <stop offset="50%" stopColor="#9b5de5"/>
            <stop offset="100%" stopColor="#ff206e"/>
          </linearGradient>
          
          <radialGradient id="logo3d-core" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#9b5de5"/>
            <stop offset="50%" stopColor="#ff206e"/>
            <stop offset="100%" stopColor="#00f5d4"/>
          </radialGradient>
          
          <filter id="logo3d-glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          <filter id="logo3d-depth">
            <feDropShadow dx="2" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.3"/>
          </filter>
        </defs>
        
        {/* Neural Network Layer */}
        <g opacity="0.6" filter="url(#logo3d-depth)">
          <path d="M25 35 L45 25 L65 40 L85 30 L95 50" 
                stroke="#00f5d4" 
                strokeWidth="1.5" 
                opacity="0.4" 
                fill="none"/>
          <path d="M20 65 L40 55 L60 70 L80 60 L100 80" 
                stroke="#9b5de5" 
                strokeWidth="1.5" 
                opacity="0.4" 
                fill="none"/>
          
          {/* Animated neural nodes */}
          <circle cx="25" cy="35" r="2.5" fill="#00f5d4" opacity="0.8">
            <animate attributeName="r" values="2;3.5;2" dur="3s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.5;1;0.5" dur="3s" repeatCount="indefinite"/>
          </circle>
          <circle cx="45" cy="25" r="2" fill="#9b5de5" opacity="0.7">
            <animate attributeName="r" values="1.5;3;1.5" dur="2.5s" repeatCount="indefinite"/>
          </circle>
          <circle cx="65" cy="40" r="2.5" fill="#ff206e" opacity="0.6">
            <animate attributeName="r" values="2;3.5;2" dur="3.5s" repeatCount="indefinite"/>
          </circle>
          <circle cx="85" cy="30" r="2" fill="#00f5d4" opacity="0.7"/>
          <circle cx="95" cy="50" r="2.5" fill="#9b5de5" opacity="0.6"/>
        </g>
        
        {/* Greek Delta with 3D effect */}
        <g filter="url(#logo3d-depth)">
          <path d="M60 20 L35 80 L85 80 Z" 
                fill="url(#logo3d-primary)" 
                opacity="0.9"
                stroke="#00f5d4" 
                strokeWidth="1.5"/>
          
          {/* 3D depth lines */}
          <path d="M60 20 L62 18 L87 78 L85 80 Z" 
                fill="#9b5de5" 
                opacity="0.6"/>
          <path d="M85 80 L87 78 L37 78 L35 80 Z" 
                fill="#00f5d4" 
                opacity="0.4"/>
        </g>
        
        {/* Stock Growth Chart with animation */}
        <g strokeWidth="3" fill="none" filter="url(#logo3d-depth)">
          <path d="M30 75 L42 65 L54 55 L66 45 L78 35 L90 25" 
                stroke="url(#logo3d-primary)" 
                strokeLinecap="round"
                strokeLinejoin="round">
            <animate 
              attributeName="strokeDasharray" 
              values="0,200;200,200" 
              dur="4s" 
              repeatCount="indefinite"/>
            <animate 
              attributeName="strokeDashoffset" 
              values="200;0" 
              dur="4s" 
              repeatCount="indefinite"/>
          </path>
          
          {/* 3D chart points */}
          <circle cx="30" cy="75" r="4" fill="#00f5d4" stroke="#00f5d4" strokeWidth="2">
            <animate attributeName="r" values="3;5;3" dur="2s" repeatCount="indefinite"/>
          </circle>
          <circle cx="42" cy="65" r="4" fill="#9b5de5" stroke="#9b5de5" strokeWidth="2">
            <animate attributeName="r" values="3;5;3" dur="2.5s" repeatCount="indefinite"/>
          </circle>
          <circle cx="54" cy="55" r="4" fill="#ff206e" stroke="#ff206e" strokeWidth="2">
            <animate attributeName="r" values="3;5;3" dur="3s" repeatCount="indefinite"/>
          </circle>
          <circle cx="66" cy="45" r="4" fill="#00f5d4" stroke="#00f5d4" strokeWidth="2">
            <animate attributeName="r" values="3;5;3" dur="2.2s" repeatCount="indefinite"/>
          </circle>
          <circle cx="78" cy="35" r="4" fill="#9b5de5" stroke="#9b5de5" strokeWidth="2">
            <animate attributeName="r" values="3;5;3" dur="2.8s" repeatCount="indefinite"/>
          </circle>
          <circle cx="90" cy="25" r="4" fill="#ff206e" stroke="#ff206e" strokeWidth="2">
            <animate attributeName="r" values="3;5;3" dur="3.2s" repeatCount="indefinite"/>
          </circle>
        </g>
        
        {/* AI Core with intense glow */}
        <g filter="url(#logo3d-glow)">
          <circle cx="60" cy="50" r="10" fill="url(#logo3d-core)">
            <animate attributeName="r" values="8;14;8" dur="2s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite"/>
          </circle>
          
          <circle cx="60" cy="50" r="6" fill="#9b5de5">
            <animate attributeName="r" values="4;8;4" dur="2s" repeatCount="indefinite"/>
          </circle>
          
          <circle cx="60" cy="50" r="3" fill="#ffffff" opacity="0.9">
            <animate attributeName="opacity" values="0.7;1;0.7" dur="1s" repeatCount="indefinite"/>
          </circle>
        </g>
        
        {/* Energy beams connecting elements */}
        <g opacity="0.5">
          <path d="M60 50 L60 20" 
                stroke="#9b5de5" 
                strokeWidth="2" 
                strokeDasharray="3,3">
            <animate attributeName="strokeDashoffset" values="0;-15" dur="1s" repeatCount="indefinite"/>
          </path>
          <path d="M60 50 L30 75" 
                stroke="#00f5d4" 
                strokeWidth="2" 
                strokeDasharray="3,3">
            <animate attributeName="strokeDashoffset" values="0;-15" dur="1.2s" repeatCount="indefinite"/>
          </path>
          <path d="M60 50 L90 25" 
                stroke="#ff206e" 
                strokeWidth="2" 
                strokeDasharray="3,3">
            <animate attributeName="strokeDashoffset" values="0;-15" dur="0.8s" repeatCount="indefinite"/>
          </path>
        </g>
      </svg>
    </div>
  );
}

export function LogoHorizontal3D({ height = 60, className = "" }) {
  const width = (height / 60) * 200;
  
  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      <svg 
        width={width} 
        height={height} 
        viewBox="0 0 200 60" 
        className="absolute inset-0"
        style={{
          filter: 'drop-shadow(0 0 15px rgba(155, 93, 229, 0.3))',
          transform: 'perspective(800px) rotateX(5deg)'
        }}
      >
        <defs>
          <linearGradient id="horizontal3d-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00f5d4"/>
            <stop offset="50%" stopColor="#9b5de5"/>
            <stop offset="100%" stopColor="#ff206e"/>
          </linearGradient>
        </defs>
        
        {/* Logo section */}
        <g transform="translate(5, 5)">
          {/* Mini Delta */}
          <path d="M25 5 L12 40 L38 40 Z" 
                fill="url(#horizontal3d-gradient)" 
                opacity="0.9"/>
          
          {/* Mini growth chart */}
          <path d="M8 38 L16 32 L24 26 L32 20 L40 14" 
                stroke="url(#horizontal3d-gradient)" 
                strokeWidth="2.5" 
                fill="none" 
                strokeLinecap="round"/>
          
          {/* AI Core */}
          <circle cx="25" cy="25" r="5" fill="#9b5de5">
            <animate attributeName="r" values="4;6;4" dur="2s" repeatCount="indefinite"/>
          </circle>
          <circle cx="25" cy="25" r="2.5" fill="#ffffff" opacity="0.9"/>
        </g>
        
        {/* 3D Text */}
        <g transform="translate(65, 15)">
          <text x="0" y="18" 
                fontFamily="Arial, sans-serif" 
                fontSize="18" 
                fontWeight="bold" 
                fill="url(#horizontal3d-gradient)"
                style={{ filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.3))' }}>
            SEI DLP
          </text>
          <text x="0" y="35" 
                fontFamily="Arial, sans-serif" 
                fontSize="11" 
                fill="#666" 
                opacity="0.8">
            Dynamic Liquidity Protocol
          </text>
        </g>
      </svg>
    </div>
  );
}

export default Logo3D;
