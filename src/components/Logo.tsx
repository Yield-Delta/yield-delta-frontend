import React from 'react';
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
  
  if (variant === 'horizontal') {
    return <LogoHorizontal3D height={size} className={className} />;
  }
  
  if (variant === 'horizontal-svg') {
    const height = size;
    const width = (height / 60) * 200; // Maintain aspect ratio from original SVG
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
        viewBox="0 0 32 32" 
        className={className}
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="iconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))"/>
            <stop offset="50%" stopColor="hsl(var(--secondary))"/>
            <stop offset="100%" stopColor="hsl(var(--accent))"/>
          </linearGradient>
          
          <radialGradient id="iconCore" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(var(--secondary))"/>
            <stop offset="100%" stopColor="hsl(var(--primary))"/>
          </radialGradient>
        </defs>
        
        <circle cx="16" cy="16" r="15" fill="hsl(var(--background))" stroke="url(#iconGradient)" strokeWidth="1"/>
        <path d="M16 6 L8 22 L24 22 Z" fill="url(#iconGradient)" opacity="0.8"/>
        <path d="M6 24 L12 18 L16 14 L20 10 L26 6" stroke="hsl(var(--primary))" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <circle cx="8" cy="10" r="1" fill="hsl(var(--primary))" opacity="0.7"/>
        <circle cx="24" cy="8" r="1" fill="hsl(var(--secondary))" opacity="0.6"/>
        <circle cx="10" cy="26" r="1" fill="hsl(var(--accent))" opacity="0.7"/>
        <circle cx="22" cy="24" r="1" fill="hsl(var(--primary))" opacity="0.6"/>
        <circle cx="16" cy="16" r="3" fill="url(#iconCore)"/>
        <circle cx="16" cy="16" r="1.5" fill="hsl(var(--secondary))"/>
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
        <g opacity="0.3" stroke="currentColor" strokeWidth="0.5" fill="currentColor">
          <path d="M25 35 L45 25 L65 40 L85 30 L95 50" fill="none"/>
          <path d="M20 65 L40 55 L60 70 L80 60 L100 80" fill="none"/>
          <circle cx="25" cy="35" r="1.5"/>
          <circle cx="45" cy="25" r="1"/>
          <circle cx="65" cy="40" r="1.5"/>
          <circle cx="85" cy="30" r="1"/>
          <circle cx="95" cy="50" r="1.5"/>
          <circle cx="20" cy="65" r="1"/>
          <circle cx="40" cy="55" r="1.5"/>
          <circle cx="60" cy="70" r="1"/>
          <circle cx="80" cy="60" r="1.5"/>
          <circle cx="100" cy="80" r="1"/>
        </g>
        
        <path d="M60 20 L35 80 L85 80 Z" fill="currentColor" opacity="0.8"/>
        
        <path d="M30 75 L42 65 L54 55 L66 45 L78 35 L90 25" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              fill="none"
              strokeLinecap="round"/>
        
        <circle cx="30" cy="75" r="2" fill="currentColor"/>
        <circle cx="42" cy="65" r="2" fill="currentColor"/>
        <circle cx="54" cy="55" r="2" fill="currentColor"/>
        <circle cx="66" cy="45" r="2" fill="currentColor"/>
        <circle cx="78" cy="35" r="2" fill="currentColor"/>
        <circle cx="90" cy="25" r="2" fill="currentColor"/>
        
        <circle cx="60" cy="50" r="6" fill="currentColor"/>
        <circle cx="60" cy="50" r="3" fill="hsl(var(--background))"/>
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
        <linearGradient id="defaultGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(var(--primary))"/>
          <stop offset="100%" stopColor="hsl(var(--secondary))"/>
        </linearGradient>
        
        <radialGradient id="defaultCore" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="hsl(var(--secondary))"/>
          <stop offset="50%" stopColor="hsl(var(--accent))"/>
          <stop offset="100%" stopColor="hsl(var(--primary))"/>
        </radialGradient>
      </defs>
      
      <g opacity="0.6">
        <path d="M25 35 L45 25 L65 40 L85 30 L95 50" stroke="hsl(var(--primary))" strokeWidth="1" opacity="0.4" fill="none"/>
        <path d="M20 65 L40 55 L60 70 L80 60 L100 80" stroke="hsl(var(--secondary))" strokeWidth="1" opacity="0.4" fill="none"/>
        <circle cx="25" cy="35" r="2" fill="hsl(var(--primary))" opacity="0.7"/>
        <circle cx="45" cy="25" r="1.5" fill="hsl(var(--secondary))" opacity="0.6"/>
        <circle cx="65" cy="40" r="2" fill="hsl(var(--accent))" opacity="0.5"/>
        <circle cx="85" cy="30" r="1.5" fill="hsl(var(--primary))" opacity="0.6"/>
        <circle cx="95" cy="50" r="2" fill="hsl(var(--secondary))" opacity="0.5"/>
      </g>
      
      <path d="M60 20 L35 80 L85 80 Z" 
            fill="url(#defaultGradient)" 
            opacity="0.9"
            stroke="hsl(var(--primary))" 
            strokeWidth="1"/>
      
      <g strokeWidth="2.5" fill="none">
        <path d="M30 75 L42 65 L54 55 L66 45 L78 35 L90 25" 
              stroke="url(#defaultGradient)" 
              strokeLinecap="round"
              strokeLinejoin="round"/>
        
        <circle cx="30" cy="75" r="3" fill="hsl(var(--primary))"/>
        <circle cx="42" cy="65" r="3" fill="hsl(var(--secondary))"/>
        <circle cx="54" cy="55" r="3" fill="hsl(var(--accent))"/>
        <circle cx="66" cy="45" r="3" fill="hsl(var(--primary))"/>
        <circle cx="78" cy="35" r="3" fill="hsl(var(--secondary))"/>
        <circle cx="90" cy="25" r="3" fill="hsl(var(--accent))"/>
      </g>
      
      <circle cx="60" cy="50" r="8" fill="url(#defaultCore)"/>
      <circle cx="60" cy="50" r="4" fill="hsl(var(--secondary))"/>
    </svg>
  );
}

export default Logo;
