import React from 'react';
import Logo from '@/components/Logo';

export default function LogoShowcase() {
  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">SEI DLP Logo Showcase</h1>
        
        {/* Logo Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          
          {/* Default Logo */}
          <div className="bg-card p-6 rounded-lg border border-border">
            <h3 className="text-lg font-semibold mb-4">Default Static</h3>
            <div className="flex justify-center mb-4">
              <Logo variant="default" size={120} animated={false} />
            </div>
            <p className="text-sm text-muted-foreground">
              Standard logo with SEI DLP theme colors, no animations
            </p>
          </div>
          
          {/* 3D Animated Logo */}
          <div className="bg-card p-6 rounded-lg border border-border">
            <h3 className="text-lg font-semibold mb-4">3D Animated</h3>
            <div className="flex justify-center mb-4">
              <Logo variant="3d" size={120} />
            </div>
            <p className="text-sm text-muted-foreground">
              3D perspective with pulsing AI core and animated elements
            </p>
          </div>
          
          {/* Horizontal Logo */}
          <div className="bg-card p-6 rounded-lg border border-border">
            <h3 className="text-lg font-semibold mb-4">Horizontal</h3>
            <div className="flex justify-center mb-4">
              <Logo variant="horizontal" size={60} />
            </div>
            <p className="text-sm text-muted-foreground">
              Perfect for navigation bars and headers
            </p>
          </div>
          
          {/* Icon Version */}
          <div className="bg-card p-6 rounded-lg border border-border">
            <h3 className="text-lg font-semibold mb-4">Icon</h3>
            <div className="flex justify-center mb-4">
              <Logo variant="icon" size={80} />
            </div>
            <p className="text-sm text-muted-foreground">
              Simplified version for favicons and small sizes
            </p>
          </div>
          
          {/* Monochrome Version */}
          <div className="bg-card p-6 rounded-lg border border-border">
            <h3 className="text-lg font-semibold mb-4">Monochrome</h3>
            <div className="flex justify-center mb-4">
              <Logo variant="mono" size={120} />
            </div>
            <p className="text-sm text-muted-foreground">
              Single color version for print and simple backgrounds
            </p>
          </div>
          
          {/* Small Sizes */}
          <div className="bg-card p-6 rounded-lg border border-border">
            <h3 className="text-lg font-semibold mb-4">Size Variations</h3>
            <div className="flex justify-center items-center space-x-4 mb-4">
              <Logo variant="icon" size={24} />
              <Logo variant="icon" size={32} />
              <Logo variant="icon" size={48} />
              <Logo variant="icon" size={64} />
            </div>
            <p className="text-sm text-muted-foreground">
              24px, 32px, 48px, 64px - for different UI contexts
            </p>
          </div>
        </div>
        
        {/* Design Elements Breakdown */}
        <div className="bg-card p-8 rounded-lg border border-border mb-8">
          <h2 className="text-2xl font-bold mb-6">Design Elements</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <svg width="64" height="64" viewBox="0 0 120 120">
                  <path d="M60 20 L35 80 L85 80 Z" 
                        fill="url(#elementGradient)" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth="2"/>
                  <defs>
                    <linearGradient id="elementGradient">
                      <stop offset="0%" stopColor="hsl(var(--primary))"/>
                      <stop offset="100%" stopColor="hsl(var(--secondary))"/>
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <h3 className="font-semibold mb-2">Greek Delta (Δ)</h3>
              <p className="text-sm text-muted-foreground">
                Represents change, transformation, and mathematical precision
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <svg width="64" height="64" viewBox="0 0 120 120">
                  <path d="M20 60 L35 45 L50 35 L65 25 L80 15 L95 10" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth="3" 
                        fill="none" 
                        strokeLinecap="round"/>
                  <circle cx="20" cy="60" r="3" fill="hsl(var(--primary))"/>
                  <circle cx="35" cy="45" r="3" fill="hsl(var(--secondary))"/>
                  <circle cx="50" cy="35" r="3" fill="hsl(var(--accent))"/>
                  <circle cx="65" cy="25" r="3" fill="hsl(var(--primary))"/>
                  <circle cx="80" cy="15" r="3" fill="hsl(var(--secondary))"/>
                  <circle cx="95" cy="10" r="3" fill="hsl(var(--accent))"/>
                </svg>
              </div>
              <h3 className="font-semibold mb-2">Growth Chart</h3>
              <p className="text-sm text-muted-foreground">
                Shows upward trajectory and yield optimization
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <svg width="64" height="64" viewBox="0 0 120 120">
                  <g opacity="0.6">
                    <path d="M25 35 L45 25 L65 40 L85 30" stroke="hsl(var(--primary))" strokeWidth="1" fill="none"/>
                    <path d="M20 65 L40 55 L60 70 L80 60" stroke="hsl(var(--secondary))" strokeWidth="1" fill="none"/>
                    <circle cx="25" cy="35" r="2" fill="hsl(var(--primary))"/>
                    <circle cx="45" cy="25" r="2" fill="hsl(var(--secondary))"/>
                    <circle cx="65" cy="40" r="2" fill="hsl(var(--accent))"/>
                    <circle cx="85" cy="30" r="2" fill="hsl(var(--primary))"/>
                    <circle cx="20" cy="65" r="2" fill="hsl(var(--secondary))"/>
                    <circle cx="40" cy="55" r="2" fill="hsl(var(--accent))"/>
                    <circle cx="60" cy="70" r="2" fill="hsl(var(--primary))"/>
                    <circle cx="80" cy="60" r="2" fill="hsl(var(--secondary))"/>
                  </g>
                  <circle cx="60" cy="50" r="8" fill="hsl(var(--secondary))" opacity="0.8"/>
                </svg>
              </div>
              <h3 className="font-semibold mb-2">Neural Network</h3>
              <p className="text-sm text-muted-foreground">
                AI-driven optimization with interconnected nodes
              </p>
            </div>
          </div>
        </div>
        
        {/* Color Scheme */}
        <div className="bg-card p-8 rounded-lg border border-border">
          <h2 className="text-2xl font-bold mb-6">Color Scheme</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-primary"></div>
              <h3 className="font-semibold mb-2">Primary</h3>
              <p className="text-sm text-muted-foreground font-mono">#00f5d4</p>
              <p className="text-sm text-muted-foreground">Cyan/Teal - Growth & Innovation</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-secondary"></div>
              <h3 className="font-semibold mb-2">Secondary</h3>
              <p className="text-sm text-muted-foreground font-mono">#9b5de5</p>
              <p className="text-sm text-muted-foreground">SEI Purple - AI Core</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-accent"></div>
              <h3 className="font-semibold mb-2">Accent</h3>
              <p className="text-sm text-muted-foreground font-mono">#ff206e</p>
              <p className="text-sm text-muted-foreground">Pink/Magenta - Energy</p>
            </div>
          </div>
        </div>
        
        {/* Usage Guidelines */}
        <div className="bg-card p-8 rounded-lg border border-border mt-8">
          <h2 className="text-2xl font-bold mb-6">Usage Guidelines</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Recommended Usage</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• <strong>Default/3D:</strong> Hero sections, landing pages</li>
                <li>• <strong>Horizontal:</strong> Navigation bars, headers</li>
                <li>• <strong>Icon:</strong> Favicons, app icons, small UI elements</li>
                <li>• <strong>Monochrome:</strong> Print materials, single-color contexts</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Technical Specs</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• <strong>Format:</strong> SVG (scalable), PNG (raster)</li>
                <li>• <strong>Sizes:</strong> 16px to 256px+ supported</li>
                <li>• <strong>Animation:</strong> CSS/SVG animations (optional)</li>
                <li>• <strong>Theme:</strong> Adapts to CSS custom properties</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
