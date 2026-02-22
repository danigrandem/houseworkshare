const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  experimental: {
    optimizePackageImports: ['@supabase/supabase-js', '@supabase/ssr'],
  },
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      if (!isServer) {
        config.watchOptions = {
          poll: 1000,
          aggregateTimeout: 300,
        }
      }
      config.cache = {
        type: 'filesystem',
        buildDependencies: {
          config: [__filename],
        },
        cacheDirectory: path.resolve(__dirname, '.next/cache/webpack'),
        compression: 'gzip',
        maxMemoryGenerations: 1,
        maxAge: 1000 * 60 * 60 * 24 * 7,
      }
      config.optimization = {
        ...config.optimization,
        moduleIds: 'deterministic',
        chunkIds: 'deterministic',
      }
    }
    config.externals = config.externals || []
    if (isServer) {
      config.externals.push({
        '@supabase/supabase-js': 'commonjs @supabase/supabase-js',
        '@supabase/ssr': 'commonjs @supabase/ssr',
      })
    }
    return config
  },
}

module.exports = nextConfig
