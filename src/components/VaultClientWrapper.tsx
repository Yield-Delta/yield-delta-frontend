"use client"

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

interface VaultSearchParams {
  vaultAddress: string | null;
  activeTab: string;
  action: string | null;
  searchParams: URLSearchParams;
}

interface VaultClientWrapperProps {
  children: (params: VaultSearchParams) => React.ReactNode;
}

function VaultParamsProvider({ children }: VaultClientWrapperProps) {
  const searchParams = useSearchParams();
  
  // Get vault address and tab from URL
  const vaultAddress = searchParams.get('address');
  const activeTab = searchParams.get('tab') || 'overview';
  const action = searchParams.get('action');
  
  return (
    <>
      {children({ vaultAddress, activeTab, action, searchParams })}
    </>
  );
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-lg">Loading vault details...</p>
      </div>
    </div>
  );
}

export default function VaultClientWrapper({ children }: VaultClientWrapperProps) {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <VaultParamsProvider>
        {children}
      </VaultParamsProvider>
    </Suspense>
  );
}