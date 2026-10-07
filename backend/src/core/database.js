import { PrismaClient } from '../../prisma/client/index.js';

export const db = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});
