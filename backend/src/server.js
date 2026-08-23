import { createApp } from './app.js';
import { env } from './config/env.js';
import { db } from './config/db.js';

const app = createApp();

const server = app.listen(env.port, () => {
  console.log(`LMS SimTugas API berjalan di http://localhost:${env.port}`);
});

async function shutdown(signal) {
  console.log(`\n${signal} diterima, mematikan server...`);
  server.close(async () => {
    await db.$disconnect();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
