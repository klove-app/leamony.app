/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'runconnect.app',
      },
    ],
  },
  output: 'standalone',
  env: {
    API_URL: process.env.API_URL || 'http://localhost:3000',
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': './src',
    };
    return config;
  }
}

module.exports = nextConfig 