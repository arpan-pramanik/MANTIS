'use strict';

const http = require('http');
const { WebSocketServer } = require('ws');
const { createApp } = require('./app');
const config = require('./config');
const { logger } = require('./utils/logger');
const { closeDb } = require('./utils/database');
const { generateToken } = require('./middleware/auth');
const { setWebSocket } = require('./services/threatIntel');

const app = createApp();
const server = http.createServer(app);

// WebSocket server for real-time threat streaming
let wss = null;
if (config.websocket?.enabled !== false) {
  wss = new WebSocketServer({ port: config.websocket?.port || 3001 });
  setWebSocket(wss);

  wss.on('connection', (ws, req) => {
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;
    logger.info('WebSocket client connected', { ip: clientIp });

    ws.send(JSON.stringify({ type: 'connected', message: 'MANTIS Threat Stream active' }));

    ws.on('close', () => {
      logger.debug('WebSocket client disconnected', { ip: clientIp });
    });

    ws.on('error', (err) => {
      logger.error('WebSocket error', { error: err.message });
    });
  });

  logger.info(`WebSocket server started on port ${config.websocket?.port || 3001}`);
}

// Start HTTP server
const PORT = config.port || 3000;
const HOST = config.host || '0.0.0.0';

server.listen(PORT, HOST, () => {
  const adminToken = generateToken({ startup: true });
  
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                                                              ║');
  console.log('║   ███╗   ███╗ █████╗ ███╗   ██╗████████╗██╗███████╗         ║');
  console.log('║   ████╗ ████║██╔══██╗████╗  ██║╚══██╔══╝██║██╔════╝         ║');
  console.log('║   ██╔████╔██║███████║██╔██╗ ██║   ██║   ██║███████╗         ║');
  console.log('║   ██║╚██╔╝██║██╔══██║██║╚██╗██║   ██║   ██║╚════██║         ║');
  console.log('║   ██║ ╚═╝ ██║██║  ██║██║ ╚████║   ██║   ██║███████║         ║');
  console.log('║   ╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝   ╚═╝   ╚═╝╚══════╝         ║');
  console.log('║                                                              ║');
  console.log('║   API Sentinel — Enterprise Threat Detection                  ║');
  console.log('║                                                              ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');
  logger.info(`MANTIS API Gateway started`, { port: PORT, host: HOST, env: config.environment });
  logger.info(`WebSocket: ws://${HOST}:${config.websocket?.port || 3001}`);
  logger.info(`Health: http://${HOST}:${PORT}/health`);
  logger.info(`Admin Token: ${adminToken}`);
  console.log('');
});

// Graceful shutdown
const shutdown = (signal) => {
  logger.info(`${signal} received. Shutting down gracefully...`);

  server.close(() => {
    logger.info('HTTP server closed');
    if (wss) {
      wss.clients.forEach(client => {
        client.send(JSON.stringify({ type: 'shutdown', message: 'Server shutting down' }));
        client.close();
      });
      wss.close(() => logger.info('WebSocket server closed'));
    }
    closeDb();
    logger.info('Shutdown complete');
    process.exit(0);
  });

  // Force shutdown after 10s
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', { error: err.message, stack: err.stack });
  shutdown('UNCAUGHT_EXCEPTION');
});
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', { reason: String(reason) });
});

module.exports = { server, app };
