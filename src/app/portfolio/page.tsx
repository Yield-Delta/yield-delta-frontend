"use client"

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const PortfolioRedirect = () => {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Redirecting...</h1>
        <p className="text-gray-400">Please wait while we redirect you to the new dashboard.</p>
      </div>
    </div>
  );
};

export default PortfolioRedirect;