/** @type {import('next').NextConfig} */
const path = require('path')

module.exports = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  assetPrefix: '',
  basePath: '',
  trailingSlash: true,
  reactStrictMode: true,
  swcMinify: false,
  productionBrowserSourceMaps: false,
  experimental: {
    optimizeFonts: false,
  },
  webpack: (config, { dev, isServer }) => {
    config.module.rules.push({
      test: /\.(png|jpe?g|gif|svg|woff|woff2|eot|ttf|otf)$/i,
      type: 'asset/resource'
    });

    // Отключаем минификацию для production
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        minimize: false,
        minimizer: [],
      }
    }

    return config;
  }
} 