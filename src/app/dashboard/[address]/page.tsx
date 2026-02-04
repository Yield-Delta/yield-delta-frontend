"use client"

import CustomerVaultDashboard from '@/components/CustomerVaultDashboard';
import Navigation from '@/components/Navigation';
import { useParams } from 'next/navigation';

export const runtime = 'edge';

const VaultPage = () => {
  const { address } = useParams();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <Navigation variant="dark" showWallet={true} showLaunchApp={false} />
      
      <section className="py-16 relative">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <CustomerVaultDashboard
              vaultAddress={address as `0x${string}`}
              vaultABI={[]} // Pass the actual ABI here
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default VaultPage;