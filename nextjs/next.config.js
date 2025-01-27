/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['api.runconnect.app', 'runconnect.app'],
    unoptimized: true, // Для Netlify
  },
  // Отключаем статическую оптимизацию для страниц с авторизацией
  experimental: {
    serverActions: true,
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(png|jpe?g|gif|svg|woff|woff2|eot|ttf|otf)$/i,
      type: 'asset/resource'
    });
    return config;
  }
}

module.exports = nextConfig 