import { Router } from 'express';
import { getRekapNilaiAdmin } from './nilai.controller.js';
import { authenticate } from '../../../shared/middlewares/authenticate.js';
import { requireRole } from '../../../shared/middlewares/requireRole.js';

const router = Router();

router.use(authenticate);

router.get('/admin/rekap', requireRole('ADMIN', 'ADMIN_AKADEMIK', 'ADMIN_PRODI'), getRekapNilaiAdmin);

export default router;
