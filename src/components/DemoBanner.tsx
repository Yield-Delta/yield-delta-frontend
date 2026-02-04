'use client'

import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { AlertTriangle } from 'lucide-react';
import { useAccount } from 'wagmi';
import { isTestnetChain } from '@/lib/chainUtils';

interface DemoBannerProps {
  className?: string;
}

export function DemoBanner({ className }: DemoBannerProps) {
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
  const { chain } = useAccount();
  const isTestnet = chain ? isTestnetChain(chain.id) : true;

  if (!isDemoMode) return null;

  return (
    <div
      className={cn(
        "demo-banner-container fixed left-0 right-0 z-30 border-b",
        "bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-yellow-500/10",
        "border-yellow-500/30 backdrop-blur-sm",
        className
      )}
      style={{
        isolation: 'isolate',
        top: isTestnet ? '5.5rem' : '3.5rem'
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Alert className="demo-banner-alert border-0 bg-transparent p-3">
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          <AlertTitle className="text-yellow-200 font-semibold text-sm">
            Demo Mode Active
          </AlertTitle>
          <AlertDescription className="text-yellow-100/90 text-xs">
            This is a demonstration environment. All transactions and data are simulated for testing purposes.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}

export default DemoBanner;