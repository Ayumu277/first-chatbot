/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
    // Docker build時の画像最適化を無効化
    unoptimized: true,
  },

  // CSS最適化設定
  optimizeFonts: false,
  swcMinify: true,

  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'prisma'],
  },

  // コンパイラー設定
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Azure App Service用のHTTP設定
  async rewrites() {
    return [
      {
        source: '/_next/static/:path*',
        destination: '/_next/static/:path*',
      },
    ];
  },

  // 静的ファイルの配信設定
  assetPrefix: './', // ← ここを空文字から変更（Azureで重要）
  trailingSlash: false,
  poweredByHeader: false,

  // サーバー設定
  serverRuntimeConfig: {
    port: process.env.PORT || 8080,
    hostname: process.env.HOST || '0.0.0.0',
  },

  // セキュリティヘッダー
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
      {
        source: '/_next/static/css/:path*',
        headers: [
          {
            key: 'Content-Type',
            value: 'text/css',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
