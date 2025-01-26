/** @type {import('next').NextConfig} */
const path = require('path')

module.exports = {
  experimental: {
    outputStandalone: true,
    outputFileTracingRoot: path.join(__dirname, '../../')
  },
  distDir: '.next',
  output: 'standalone'
} 