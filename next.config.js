/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
  },
  serverExternalPackages: ['@prisma/client', 'prisma'],
}

module.exports = nextConfig