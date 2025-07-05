/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    domains: ['localhost'],
  },
  serverExternalPackages: ['@prisma/client', 'prisma'],
}

module.exports = nextConfig