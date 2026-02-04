'use client'

import React from 'react';
import { cn } from '@/lib/utils';
import { AlertTriangle, Network } from 'lucide-react';
import { useAccount } from 'wagmi';
import { isTestnetChain } from '@/lib/chainUtils';

interface TestnetBannerProps {
  className?: string;
  variant?: 'banner' | 'badge';
}

export function TestnetBanner({ className, variant = 'banner' }: TestnetBannerProps) {
  const { chain } = useAccount();
  const isTestnet = chain ? isTestnetChain(chain.id) : true; // Default to testnet warning if not connected

  if (!isTestnet && chain) return null;

  // Badge variant - compact floating indicator
  if (variant === 'badge') {
    return (
      <div
        className={cn(
          "fixed bottom-4 right-4 z-50",
          "px-3 py-2 rounded-lg",
          "bg-gradient-to-r from-amber-500/90 to-orange-500/90",
          "border border-amber-400/50",
          "backdrop-blur-sm shadow-lg",
          "flex items-center gap-2",
          "text-white text-xs font-semibold",
          "transition-all duration-300 hover:scale-105",
          "animate-pulse-subtle",
          className
        )}
        role="status"
        aria-live="polite"
      >
        <Network className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="hidden sm:inline">SEI Testnet</span>
        <span className="sm:hidden">Testnet</span>
        <div
          className="w-2 h-2 rounded-full bg-amber-200 animate-pulse"
          aria-hidden="true"
        />
      </div>
    );
  }

  // Banner variant - clean, minimal top banner without text overlap
  return (
    <div
      className={cn(
        "testnet-banner-container fixed left-0 right-0 z-30",
        "bg-gradient-to-r from-amber-500 to-orange-500",
        "border-b border-amber-400/30",
        "shadow-sm",
        className
      )}
      style={{
        isolation: 'isolate',
        top: '3.5rem'
      }}
      role="alert"
      aria-live="polite"
    >
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex items-center justify-center gap-2">
          {/* Warning Icon */}
          <AlertTriangle
            className="h-4 w-4 text-white"
            aria-hidden="true"
          />

          {/* Simple, clean text - no overlapping */}
          <div className="flex items-center gap-2 text-white text-sm">
            <span className="font-semibold">SEI Testnet</span>
            <span className="text-white/90">•</span>
            <span className="text-white/90">Test tokens only</span>
          </div>

          {/* Status Indicator */}
          <div className="relative hidden sm:block">
            <div className="w-2 h-2 rounded-full bg-white/80" />
            <div className="absolute inset-0 w-2 h-2 rounded-full bg-white animate-ping opacity-50" />
          </div>
        </div>
      </div>

      {/* Subtle animated line at bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"
        aria-hidden="true"
      />
    </div>
  );
}

export default TestnetBanner;
