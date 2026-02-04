import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Basic config for Cloudflare Pages with Functions
  reactStrictMode: false,

  // Basic environment variables
  env: {
    SEI_CHAIN_ID: '1328',
    SEI_RPC_URL: 'https://evm-rpc-arctic-1.sei-apis.com',
    API_VERSION: '1.0.0',
  },

  // Turbopack configuration (stable in Next.js 15)
  turbopack: {
    rules: {
      // Configure loaders for specific file types
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
    resolveAlias: {
      // Optimize module resolution
      '@': './src',
    },
    resolveExtensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
  },

  // Experimental features
  experimental: {
    // Enable optimized compilation
    optimizePackageImports: [
      '@radix-ui/react-icons',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-popover',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      'lucide-react',
      'recharts',
      'three',
      '@react-three/fiber',
      '@react-three/drei',
    ],
  },

  // Compiler options for faster builds
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Simple webpack config (fallback when not using Turbopack)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        http: false,
        https: false,
        os: false,
        path: false,
        // Ignore React Native dependencies from MetaMask SDK
        '@react-native-async-storage/async-storage': false,
        'react-native': false,
      };
    }

    // Ignore warnings from MetaMask SDK about optional React Native dependencies
    config.ignoreWarnings = [
      { module: /node_modules\/@metamask\/sdk/ },
      { message: /Can't resolve '@react-native-async-storage\/async-storage'/ },
      { message: /Can't resolve 'react-native'/ },
    ];

    // Optimize for faster rebuilds
    config.cache = {
      type: 'filesystem',
      buildDependencies: {
        config: [__filename],
      },
    };

    return config;
  },

  // Cloudflare compatibility
  images: {
    unoptimized: true,
  },

  // Output configuration for better caching
  output: 'standalone',

  // Optimize production builds
  productionBrowserSourceMaps: false,

  // PoweredBy header
  poweredByHeader: false,

  // Compress responses
  compress: true,
}

export default nextConfig