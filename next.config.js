/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
    // Docker build時の画像最適化を無効化
    unoptimized: true,
  },

  // CSS最適化設定 - TailwindCSS保持のため調整
  optimizeFonts: false,
  swcMinify: false, // TailwindCSSとの競合を避けるため無効化

  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'prisma'],
  },
  // Docker standalone output for Azure App Service
  output: 'standalone',
  // Azure App ServiceでのCSS/JS読み込み問題を解決
  trailingSlash: false,
  poweredByHeader: false,

  // コンパイラー設定 - CSS関連の最適化を制限
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // 🎨 CSS設定 - TailwindCSSを本番環境で確実に動作させる
  webpack: (config, { dev, isServer }) => {
    // TailwindCSS本番環境での強制読み込み
    if (!dev && !isServer) {
      // splitChunksが存在することを確認してから設定
      if (!config.optimization) {
        config.optimization = {};
      }
      if (!config.optimization.splitChunks) {
        config.optimization.splitChunks = {
          chunks: 'all',
          cacheGroups: {}
        };
      }
      if (!config.optimization.splitChunks.cacheGroups) {
        config.optimization.splitChunks.cacheGroups = {};
      }

      // CSSファイル用のキャッシュグループを安全に追加
      config.optimization.splitChunks.cacheGroups.styles = {
        name: 'styles',
        test: /\.(css|scss|sass)$/,
        chunks: 'all',
        enforce: true,
        priority: 20,
      };
    }

    return config;
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
  assetPrefix: '',

  // サーバー設定
  serverRuntimeConfig: {
    port: process.env.PORT || 8080,
    hostname: process.env.HOST || '0.0.0.0',
  },

  // セキュリティヘッダー + CSS配信最適化
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
            value: 'text/css; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // TailwindCSS用の追加ヘッダー
      {
        source: '/_next/static/chunks/:path*',
        headers: [
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
