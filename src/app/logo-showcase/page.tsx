import React from 'react';
import Logo from '@/components/Logo';

export default function LogoShowcase() {
  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">Yield Delta Logo Showcase</h1>
        
        {/* Logo Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          
          {/* Default Logo */}
          <div className="bg-card p-6 rounded-lg border border-border">
            <h3 className="text-lg font-semibold mb-4">Default Static</h3>
            <div className="flex justify-center mb-4">
              <Logo variant="default" size={120} animated={false} />
            </div>
            <p className="text-sm text-muted-foreground">
              Three routed chain lanes around a neutral vault aperture
            </p>
          </div>
          
          {/* 3D Animated Logo */}
          <div className="bg-card p-6 rounded-lg border border-border">
            <h3 className="text-lg font-semibold mb-4">3D Animated</h3>
            <div className="flex justify-center mb-4">
              <Logo variant="3d" size={120} />
            </div>
            <p className="text-sm text-muted-foreground">
              Dimensional mark with liquidity flow moving through each lane
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
                  <path d="M60 13 C46 35 34 59 20 96" stroke="hsl(var(--primary))" strokeWidth="18" strokeLinecap="round"/>
                  <path d="M60 13 C74 36 86 61 100 96" stroke="hsl(var(--accent))" strokeWidth="18" strokeLinecap="round"/>
                  <path d="M20 96 C45 82 75 82 100 96" stroke="hsl(var(--secondary))" strokeWidth="18" strokeLinecap="round"/>
                </svg>
              </div>
              <h3 className="font-semibold mb-2">Tri-chain Delta</h3>
              <p className="text-sm text-muted-foreground">
                Three distinct routes resolve into one delta-neutral system
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <svg width="64" height="64" viewBox="0 0 120 120">
                  <defs>
                    <linearGradient id="showcaseAperture" x1="40" y1="39" x2="80" y2="79">
                      <stop stopColor="hsl(var(--primary))"/>
                      <stop offset="0.5" stopColor="hsl(var(--secondary))"/>
                      <stop offset="1" stopColor="hsl(var(--accent))"/>
                    </linearGradient>
                  </defs>
                  <path d="M60 30 L89 59 L60 88 L31 59 Z" fill="hsl(var(--background))" stroke="url(#showcaseAperture)" strokeWidth="7"/>
                  <path d="M60 48 L71 59 L60 70 L49 59 Z" fill="url(#showcaseAperture)"/>
                </svg>
              </div>
              <h3 className="font-semibold mb-2">Vault Aperture</h3>
              <p className="text-sm text-muted-foreground">
                A protected center gives the mark a recognizable vault signature
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <svg width="64" height="64" viewBox="0 0 120 120">
                  <path d="M18 93 C33 66 41 43 58 17" stroke="hsl(var(--primary))" strokeWidth="12" strokeLinecap="round"/>
                  <path d="M62 17 C78 43 88 67 102 93" stroke="hsl(var(--accent))" strokeWidth="12" strokeLinecap="round"/>
                  <path d="M18 93 C42 80 78 80 102 93" stroke="hsl(var(--secondary))" strokeWidth="12" strokeLinecap="round"/>
                </svg>
              </div>
              <h3 className="font-semibold mb-2">Liquidity Lanes</h3>
              <p className="text-sm text-muted-foreground">
                Broad flowing rails stay legible from favicon to hero scale
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
              <p className="text-sm text-muted-foreground">Violet - Base route</p>
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
