import { Router } from 'express';
import { z } from 'zod';
import { db } from '../../core/database.js';
import { requireRole } from '../../shared/middlewares/requireRole.js';
import { validateBody } from '../../shared/middlewares/validate.js';
import { asyncHandler, ApiError } from '../../shared/utils/apiError.js';
import { logActivity } from '../../shared/utils/activityLog.js';

const router = Router();

const dosenUpdateSchema = z.object({
  email: z.string().email().nullish(),
  noHp: z.string().max(20).nullish(),
});

const mahasiswaUpdateSchema = z.object({
  email: z.string().email().nullish(),
});

// ---------------- DOSEN ----------------
router.get(
  '/dosen/me',
  requireRole('DOSEN'),
  asyncHandler(async (req, res) => {
    const record = await db.dosen.findUnique({
      where: { id: req.user.dosenId },
      include: { prodi: { select: { kodeProdi: true, namaProdi: true } } },
    });
    if (!record) throw ApiError.notFound('Data profil dosen tidak ditemukan');
    res.json({ data: record });
  })
);

router.put(
  '/dosen/me',
  requireRole('DOSEN'),
  validateBody(dosenUpdateSchema),
  asyncHandler(async (req, res) => {
    const record = await db.dosen.update({ where: { id: req.user.dosenId }, data: req.body });
    await logActivity({ userId: req.user.id, aktivitas: 'UPDATE_PROFIL_DOSEN', modul: 'DOSEN', ipAddress: req.ip });
    res.json({ data: record });
  })
);

// ---------------- MAHASISWA ----------------
router.get(
  '/mahasiswa/me',
  requireRole('MAHASISWA'),
  asyncHandler(async (req, res) => {
    const record = await db.mahasiswa.findUnique({
      where: { id: req.user.mahasiswaId },
      include: {
        prodi: { select: { kodeProdi: true, namaProdi: true } },
        kelas: { select: { namaKelas: true, angkatan: true } },
      },
    });
    if (!record) throw ApiError.notFound('Data profil mahasiswa tidak ditemukan');
    res.json({ data: record });
  })
);

router.put(
  '/mahasiswa/me',
  requireRole('MAHASISWA'),
  validateBody(mahasiswaUpdateSchema),
  asyncHandler(async (req, res) => {
    const record = await db.mahasiswa.update({ where: { id: req.user.mahasiswaId }, data: req.body });
    await logActivity({ userId: req.user.id, aktivitas: 'UPDATE_PROFIL_MAHASISWA', modul: 'MAHASISWA', ipAddress: req.ip });
    res.json({ data: record });
  })
);

export default router;
