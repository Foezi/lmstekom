import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import { authenticate, requireCompleteProfile } from './middlewares/authenticate.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';
import authRoutes from './routes/auth.routes.js';
import profileRoutes from './routes/profile.routes.js';
import logRoutes from './routes/log.routes.js';
import { MASTER_CONFIGS } from './services/masterConfigs.js';
import { buildMasterRouter } from './routes/master.routes.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '2mb' }));

  // logger ringan (method, path, status, durasi)
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      if (req.path !== '/api/health') {
        console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - start}ms)`);
      }
    });
    next();
  });

  app.get('/api/health', (_req, res) => res.json({ data: { status: 'ok', time: new Date().toISOString() } }));

  // Auth tidak melewati gate lengkapi-profil (justru tempat menyelesaikannya)
  app.use('/api/auth', authRoutes);

  app.use(authenticate, requireCompleteProfile);

  app.use('/api', profileRoutes); // /api/dosen/me, /api/mahasiswa/me
  for (const [key, config] of Object.entries(MASTER_CONFIGS)) {
    app.use(`/api/${key}`, buildMasterRouter(config));
  }
  app.use('/api/logs', logRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
