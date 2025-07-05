/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
  },
  output: 'standalone',
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost', '*.azurewebsites.net'],
    },
  },
}

module.exports = nextConfig