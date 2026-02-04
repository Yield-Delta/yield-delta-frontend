'use client'

import { useEffect, useState } from 'react';

// Debug component to verify environment variables in production
export default function DebugEnv() {
  const [envValues, setEnvValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setEnvValues({
        NODE_ENV: process.env.NODE_ENV || 'undefined',
        NEXT_PUBLIC_ENABLE_3D_VISUALIZATION: process.env.NEXT_PUBLIC_ENABLE_3D_VISUALIZATION || 'undefined',
        CF_PAGES: process.env.CF_PAGES || 'undefined',
      });
    }
  }, []);

  // Only show in development or when explicitly enabled
  if (process.env.NODE_ENV === 'production' && 
      process.env.NEXT_PUBLIC_DEBUG !== 'true') {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 bg-black/80 text-white p-2 rounded text-xs font-mono z-50">
      <div>Environment Debug:</div>
      {Object.entries(envValues).map(([key, value]) => (
        <div key={key}>
          {key}: {value}
        </div>
      ))}
    </div>
  );
}