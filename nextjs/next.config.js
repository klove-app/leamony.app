/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true,
  },
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
  },
  // Отключаем статический рендеринг для всех страниц
  staticPageGenerationTimeout: 0,
  // Отключаем кэширование данных
  generateEtags: false,
}

module.exports = nextConfig 