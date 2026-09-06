import { createApp } from './app.js';
import { env } from './core/env.js';
import { db } from './core/database.js';

const app = createApp();

const server = app.listen(env.port, () => {
  console.log(`LMS Polteksmi API berjalan di http://localhost:${env.port}`);
});

import { initSocket } from './core/socket.js';
initSocket(server);

async function shutdown(signal) {
  console.log(`\n${signal} diterima, mematikan server...`);
  server.close(async () => {
    await db.$disconnect();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
