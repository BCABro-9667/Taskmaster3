import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Enable image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Enable compression
  compress: true,
  // Optimize fonts
  experimental: {
    optimizeCss: true,
    optimizePackageImports: [
      'lucide-react',
      'react-hook-form',
      '@hookform/resolvers',
      'zod',
      '@tanstack/react-query',
      '@tanstack/react-query-devtools'
    ]
  },
  // Enable webpack optimizations
  webpack: (config, { dev, isServer }) => {
    // Enable tree shaking
    config.optimization.usedExports = true;
    
    // Split chunks for better caching
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      };
    }
    
    return config;
  }
};

export default nextConfig;