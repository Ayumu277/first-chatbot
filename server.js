const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = process.env.PORT || 8080;

console.log(`🚀 Starting server in ${dev ? 'development' : 'production'} mode`);
console.log(`📡 Server will listen on ${hostname}:${port}`);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// ヘルスチェックハンドラー
const healthCheck = (req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV
  }));
};

// グレースフルシャットダウン
const gracefulShutdown = (signal) => {
  console.log(`📴 Received ${signal}, shutting down gracefully...`);
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// アプリケーション準備
console.log('🔧 Preparing Next.js application...');

app.prepare()
  .then(() => {
    console.log('✅ Next.js application prepared successfully');

    const server = createServer(async (req, res) => {
      try {
        const parsedUrl = parse(req.url, true);

        // ヘルスチェックエンドポイント
        if (parsedUrl.pathname === '/health' || parsedUrl.pathname === '/api/health') {
          return healthCheck(req, res);
        }

        // 通常のNext.jsルーティング
        await handle(req, res, parsedUrl);
      } catch (err) {
        console.error('❌ Error occurred handling request:', req.url);
        console.error('📝 Error details:', err);
        console.error('📊 Stack trace:', err.stack);

        res.statusCode = 500;
        res.setHeader('Content-Type', 'text/plain');
        res.end('Internal Server Error - Please check server logs');
      }
    });

    server.listen(port, hostname, (err) => {
      if (err) {
        console.error('❌ Failed to start server:', err);
        process.exit(1);
      }

      console.log(`🎉 Server is ready and listening on http://${hostname}:${port}`);
      console.log(`🔍 Health check available at http://${hostname}:${port}/health`);
      console.log(`📊 Process ID: ${process.pid}`);
      console.log(`💾 Memory usage:`, process.memoryUsage());
    });

    // サーバーエラーハンドリング
    server.on('error', (err) => {
      console.error('🚨 Server error:', err);
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${port} is already in use`);
        process.exit(1);
      }
    });

    // 未処理のPromise拒否を捕捉
    process.on('unhandledRejection', (reason, promise) => {
      console.error('⚠️  Unhandled Rejection at:', promise, 'reason:', reason);
    });

    // 未捕捉例外を捕捉
    process.on('uncaughtException', (err) => {
      console.error('💥 Uncaught Exception:', err);
      console.error('📊 Stack trace:', err.stack);
      process.exit(1);
    });

  })
  .catch((err) => {
    console.error('❌ Failed to prepare Next.js application:', err);
    console.error('📊 Stack trace:', err.stack);
    process.exit(1);
  });