import { Router } from 'express';
import { requireRole } from '../../../shared/middlewares/requireRole.js';
import * as controller from './presensi.controller.js';

const router = Router();
const ACCESS_ROLES = ['ADMIN', 'ADMIN_AKADEMIK', 'ADMIN_PRODI', 'DOSEN', 'MAHASISWA'];

router.get('/rekap', requireRole(...ACCESS_ROLES), controller.getRekapPresensi);
router.get('/mata-kuliah', requireRole(...ACCESS_ROLES), controller.getMataKuliahPresensi);

export default router;
