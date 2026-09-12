import { Router } from 'express';
import {
  getUjianList,
  createUjian,
  updateUjian,
  deleteUjian
} from './ujian.controller.js';
import { authenticate } from '../../../shared/middlewares/authenticate.js';
import { requireRole } from '../../../shared/middlewares/requireRole.js';

const router = Router();

router.use(authenticate);
router.use(requireRole('DOSEN'));

router.get('/', getUjianList);
router.post('/', createUjian);
router.put('/:id', updateUjian);
router.delete('/:id', deleteUjian);

export default router;
