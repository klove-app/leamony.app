/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  distDir: '.next',
  env: {
    API_URL: process.env.API_URL || 'http://localhost:3000',
  },
}

module.exports = nextConfig 