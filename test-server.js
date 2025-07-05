const express = require('express');
const app = express();
const port = process.env.PORT || 8080;

app.get('/', (req, res) => {
  res.send(`
    <html>
      <head><title>Azure App Service Test</title></head>
      <body>
        <h1>🎉 Azure App Service is working!</h1>
        <p>Node.js version: ${process.version}</p>
        <p>PORT: ${port}</p>
        <p>Environment: ${process.env.NODE_ENV}</p>
        <p>Current time: ${new Date().toISOString()}</p>
      </body>
    </html>
  `);
});

app.listen(port, () => {
  console.log(`Test server listening on port ${port}`);
});