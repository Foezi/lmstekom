import { Router } from 'express';
import { requireRole } from '../../../shared/middlewares/requireRole.js';
import * as controller from './presensi.controller.js';

const router = Router();
const ACCESS_ROLES = ['ADMIN', 'ADMIN_AKADEMIK', 'ADMIN_PRODI', 'DOSEN', 'MAHASISWA'];

router.get('/rekap', requireRole(...ACCESS_ROLES), controller.getRekapPresensi);
router.get('/mata-kuliah', requireRole(...ACCESS_ROLES), controller.getMataKuliahPresensi);

router.get('/pertemuan/:pertemuanId', requireRole('ADMIN', 'ADMIN_AKADEMIK', 'DOSEN', 'MAHASISWA'), controller.getPresensiPertemuan);
router.post('/pertemuan/:pertemuanId/sync', requireRole('ADMIN', 'DOSEN'), controller.syncPresensiAsinkronus);
router.put('/pertemuan/:pertemuanId/manual', requireRole('ADMIN', 'DOSEN'), controller.savePresensiManual);

export default router;
