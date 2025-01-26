/** @type {import('next').NextConfig} */
const path = require('path')

module.exports = {
  output: 'export',
  images: {
    unoptimized: true,
    loader: 'custom',
    path: '/'
  },
  assetPrefix: '',
  basePath: '',
  trailingSlash: true,
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(png|jpe?g|gif|svg|woff|woff2|eot|ttf|otf)$/i,
      type: 'asset/resource'
    });
    return config;
  }
} 