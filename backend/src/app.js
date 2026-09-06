import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import { authenticate, requireCompleteProfile } from './shared/middlewares/authenticate.js';
import { errorHandler, notFoundHandler } from './shared/middlewares/errorHandler.js';

import authRoutes from './modules/auth/auth.routes.js';
import profileRoutes from './modules/auth/profile.routes.js';
import logRoutes from './modules/audit/audit.routes.js';
import dashboardRoutes from './modules/dashboard/dashboard.routes.js';

import prodiRoutes from './modules/master/prodi/prodi.routes.js';
import kelasRoutes from './modules/master/kelas/kelas.routes.js';
import dosenRoutes from './modules/master/dosen/dosen.routes.js';
import mahasiswaRoutes from './modules/master/mahasiswa/mahasiswa.routes.js';
import ruanganRoutes from './modules/master/ruangan/ruangan.routes.js';
import kurikulumRoutes from './modules/master/kurikulum/kurikulum.routes.js';
import matakuliahRoutes from './modules/master/matakuliah/matakuliah.routes.js';
import tahunAkademikRoutes from './modules/master/tahun-akademik/tahun-akademik.routes.js';
import kalenderAkademikRoutes from './modules/master/kalender-akademik/kalender-akademik.routes.js';

import jadwalRoutes from './modules/perkuliahan/jadwal/jadwal.routes.js';
import materiRoutes from './modules/perkuliahan/materi/materi.routes.js';
import diskusiRoutes from './modules/perkuliahan/diskusi/diskusi.routes.js';
import presensiRoutes from './modules/perkuliahan/presensi/presensi.routes.js';
import nilaiRoutes from './modules/perkuliahan/nilai/nilai.routes.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '2mb' }));

  // logger ringan
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

  app.use('/api/auth', authRoutes);

  app.use(authenticate, requireCompleteProfile);

  app.use('/api', profileRoutes);

  app.use('/api/prodi', prodiRoutes);
  app.use('/api/kelas', kelasRoutes);
  app.use('/api/dosen', dosenRoutes);
  app.use('/api/mahasiswa', mahasiswaRoutes);
  app.use('/api/ruangan', ruanganRoutes);
  app.use('/api/kurikulum', kurikulumRoutes);
  app.use('/api/mata-kuliah', matakuliahRoutes);
  app.use('/api/tahun-akademik', tahunAkademikRoutes);
  app.use('/api/kalender-akademik', kalenderAkademikRoutes);

  app.use('/api/jadwal', jadwalRoutes);
  app.use('/api/materi', materiRoutes);
  app.use('/api/diskusi', diskusiRoutes);
  app.use('/api/presensi', presensiRoutes);
  app.use('/api/nilai', nilaiRoutes);

  app.use('/api/dashboard', dashboardRoutes);

  app.use('/api/logs', logRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
