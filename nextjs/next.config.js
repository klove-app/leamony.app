/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: true,
  swcMinify: false,
  images: {
    unoptimized: true
  },
  output: 'export',
  trailingSlash: true,
  productionBrowserSourceMaps: false,
  webpack: (config, { dev, isServer }) => {
    // Отключаем минификацию в продакшене
    if (!dev) {
      config.optimization.minimize = false;
    }
    return config;
  }
};

module.exports = nextConfig; 