/** @type {import('next').NextConfig} */
const path = require('path')

module.exports = {
  output: 'export',
  images: {
    unoptimized: true,
    loader: 'akamai',
    path: '',
  },
  assetPrefix: '',
  basePath: '',
  trailingSlash: true,
  reactStrictMode: true,
  swcMinify: false,
  webpack: (config, { dev, isServer }) => {
    config.module.rules.push({
      test: /\.(png|jpe?g|gif|svg|woff|woff2|eot|ttf|otf)$/i,
      type: 'asset/resource'
    });

    // Отключаем минификацию для production
    if (!dev && !isServer) {
      config.optimization.minimize = false;
    }

    return config;
  }
} 