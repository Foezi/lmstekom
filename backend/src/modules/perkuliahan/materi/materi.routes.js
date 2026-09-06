import { Router } from 'express';
import { requireRole } from '../../../shared/middlewares/requireRole.js';
import * as controller from './materi.controller.js';

const router = Router();

// Akses untuk dosen & admin terkait
const ACCESS_ROLES = ['ADMIN', 'ADMIN_AKADEMIK', 'ADMIN_PRODI', 'DOSEN'];

router.get('/', requireRole(...ACCESS_ROLES), controller.listJadwalMateri);
router.get('/:jadwalId/pertemuan', requireRole(...ACCESS_ROLES), controller.getPertemuanList);
router.post('/:jadwalId/pertemuan/generate', requireRole(...ACCESS_ROLES), controller.generatePertemuan);
router.post('/:jadwalId/pertemuan/sync', requireRole(...ACCESS_ROLES), controller.syncPertemuanAPI);
router.put('/:jadwalId/deskripsi', requireRole(...ACCESS_ROLES), controller.updateDeskripsi);
router.put('/pertemuan/:pertemuanId', requireRole(...ACCESS_ROLES), controller.updatePertemuan);

export default router;
