'use client'

import dynamic from 'next/dynamic';
import { Suspense, useEffect, useState } from 'react';
import Hero3DSimple from './Hero3DSimple';

// Always import the 3D component dynamically to avoid build-time issues
const Hero3D = dynamic(() => import('./Hero3DLoader'), {
  ssr: false,
  loading: () => <Hero3DSimple />,
});

export default function Hero3DWrapper() {
  const [useHeavy3D, setUseHeavy3D] = useState(false);

  useEffect(() => {
    // Simplified 3D enabling logic for reliable deployment
    const enable3D = typeof window !== 'undefined' && (
      process.env.NEXT_PUBLIC_ENABLE_3D_VISUALIZATION === 'true' ||
      // Force-enable for production to match localhost experience
      window.location.hostname === 'yielddelta.xyz' ||
      window.location.hostname === 'www.yielddelta.xyz' ||
      // Enable for localhost development
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'
    );
    
    setUseHeavy3D(enable3D);
  }, []);

  // Always render simple component if 3D is not enabled
  if (!useHeavy3D) {
    return <Hero3DSimple />;
  }

  return (
    <Suspense fallback={<Hero3DSimple />}>
      <Hero3D />
    </Suspense>
  );
}