import React, { useId } from 'react';
import Image from 'next/image';
import { Logo3D, LogoHorizontal3D } from './Logo3D';

interface LogoProps {
  variant?: 'default' | 'horizontal' | 'horizontal-svg' | 'icon' | 'mono' | '3d';
  size?: number;
  animated?: boolean;
  className?: string;
}

export function Logo({ 
  variant = 'default', 
  size = 120, 
  animated = true, 
  className = '' 
}: LogoProps) {
  const id = useId().replace(/:/g, '');
  
  if (variant === 'horizontal') {
    return <LogoHorizontal3D height={size} className={className} />;
  }
  
  if (variant === 'horizontal-svg') {
    const height = size;
    const width = (height / 60) * 224; // Maintain aspect ratio from horizontal SVG
    return (
      <Image
        src="/logo-horizontal.svg"
        alt="Yield Delta"
        width={width}
        height={height}
        className={className}
        style={{ maxHeight: height }}
      />
    );
  }
  
  if (variant === '3d' || (variant === 'default' && animated)) {
    return <Logo3D size={size} className={className} />;
  }
  
  if (variant === 'icon') {
    return (
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 120 120" 
        className={className}
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={`${id}-icon-ring`} x1="18" y1="19" x2="100" y2="101">
            <stop stopColor="hsl(var(--primary))"/>
            <stop offset="0.5" stopColor="hsl(var(--secondary))"/>
            <stop offset="1" stopColor="hsl(var(--accent))"/>
          </linearGradient>
          <filter id={`${id}-icon-shadow`} x="-25%" y="-25%" width="150%" height="150%">
            <feDropShadow dx="0" dy="6" stdDeviation="7" floodColor="#02030b" floodOpacity="0.6"/>
          </filter>
        </defs>
        <g filter={`url(#${id}-icon-shadow)`}>
          <path d="M60 8 L107 34 V86 L60 112 L13 86 V34 Z" fill="hsl(var(--background))" stroke={`url(#${id}-icon-ring)`} strokeWidth="3"/>
          <path d="M60 18 C48 37 37 58 25 91" stroke="hsl(var(--primary))" strokeWidth="17" strokeLinecap="round"/>
          <path d="M60 18 C71 37 83 60 95 91" stroke="hsl(var(--accent))" strokeWidth="17" strokeLinecap="round"/>
          <path d="M25 91 C47 80 73 80 95 91" stroke="hsl(var(--secondary))" strokeWidth="17" strokeLinecap="round"/>
          <path d="M60 18 C48 37 37 58 25 91" stroke="rgba(255,255,255,0.32)" strokeWidth="3" strokeLinecap="round"/>
          <path d="M60 18 C71 37 83 60 95 91" stroke="rgba(255,255,255,0.22)" strokeWidth="3" strokeLinecap="round"/>
          <path d="M25 91 C47 80 73 80 95 91" stroke="rgba(255,255,255,0.24)" strokeWidth="3" strokeLinecap="round"/>
        </g>
        <path d="M60 43 L76 59 L60 75 L44 59 Z" fill="hsl(var(--background))" stroke={`url(#${id}-icon-ring)`} strokeWidth="4"/>
        <path d="M60 51 L68 59 L60 67 L52 59 Z" fill={`url(#${id}-icon-ring)`}/>
      </svg>
    );
  }
  
  if (variant === 'mono') {
    return (
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 120 120" 
        className={className}
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M60 13 C46 35 34 59 20 96" stroke="currentColor" strokeWidth="18" strokeLinecap="round"/>
        <path d="M60 13 C74 36 86 61 100 96" stroke="currentColor" strokeWidth="18" strokeLinecap="round" opacity="0.84"/>
        <path d="M20 96 C45 82 75 82 100 96" stroke="currentColor" strokeWidth="18" strokeLinecap="round" opacity="0.68"/>
        <path d="M60 39 L80 59 L60 79 L40 59 Z" fill="hsl(var(--background))" stroke="currentColor" strokeWidth="5"/>
        <path d="M60 51 L68 59 L60 67 L52 59 Z" fill="currentColor"/>
      </svg>
    );
  }
  
  // Default static SVG
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 120 120" 
      className={className}
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={`${id}-default-aperture`} x1="39" y1="38" x2="82" y2="80">
          <stop stopColor="hsl(var(--primary))"/>
          <stop offset="0.48" stopColor="hsl(var(--secondary))"/>
          <stop offset="1" stopColor="hsl(var(--accent))"/>
        </linearGradient>
        <filter id={`${id}-default-depth`} x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow dx="0" dy="8" stdDeviation="9" floodColor="#02030b" floodOpacity="0.52"/>
        </filter>
      </defs>
      <g filter={`url(#${id}-default-depth)`}>
        <path d="M60 13 C46 35 34 59 20 96" stroke="hsl(var(--primary))" strokeWidth="18" strokeLinecap="round"/>
        <path d="M60 13 C74 36 86 61 100 96" stroke="hsl(var(--accent))" strokeWidth="18" strokeLinecap="round"/>
        <path d="M20 96 C45 82 75 82 100 96" stroke="hsl(var(--secondary))" strokeWidth="18" strokeLinecap="round"/>
        <path d="M60 13 C46 35 34 59 20 96" stroke="rgba(255,255,255,0.34)" strokeWidth="3" strokeLinecap="round"/>
        <path d="M60 13 C74 36 86 61 100 96" stroke="rgba(255,255,255,0.24)" strokeWidth="3" strokeLinecap="round"/>
        <path d="M20 96 C45 82 75 82 100 96" stroke="rgba(255,255,255,0.22)" strokeWidth="3" strokeLinecap="round"/>
      </g>
      <path d="M60 39 L80 59 L60 79 L40 59 Z" fill="hsl(var(--background))" stroke={`url(#${id}-default-aperture)`} strokeWidth="5"/>
      <path d="M60 51 L68 59 L60 67 L52 59 Z" fill={`url(#${id}-default-aperture)`}/>
    </svg>
  );
}

export default Logo;
