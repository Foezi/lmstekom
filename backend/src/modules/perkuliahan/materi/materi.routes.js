import { Router } from 'express';
import { requireRole } from '../../../shared/middlewares/requireRole.js';
import { authenticate } from '../../../shared/middlewares/authenticate.js';
import * as controller from './materi.controller.js';
import * as videoCtrl from './video-interaktif.controller.js';
import multer from 'multer';
import os from 'os';

const upload = multer({ dest: os.tmpdir() });

const router = Router();

// Akses untuk dosen & admin terkait
const ACCESS_ROLES = ['ADMIN', 'ADMIN_AKADEMIK', 'ADMIN_PRODI', 'DOSEN'];

router.get('/', requireRole(...ACCESS_ROLES), controller.listJadwalMateri);
router.get('/:jadwalId/pertemuan', requireRole(...ACCESS_ROLES), controller.getPertemuanList);
router.post('/:jadwalId/pertemuan/generate', requireRole(...ACCESS_ROLES), controller.generatePertemuan);
router.post('/:jadwalId/pertemuan/sync', requireRole(...ACCESS_ROLES), controller.syncPertemuanAPI);
router.put('/:jadwalId/deskripsi', requireRole(...ACCESS_ROLES), controller.updateDeskripsi);
router.put('/pertemuan/:pertemuanId', requireRole(...ACCESS_ROLES), controller.updatePertemuan);
router.post('/pertemuan/:pertemuanId/materi', requireRole(...ACCESS_ROLES), upload.single('file'), controller.addMateri);
router.post('/pertemuan/:pertemuanId/tugas', requireRole(...ACCESS_ROLES), controller.addTugas);
router.post('/pertemuan/:pertemuanId/kuis', requireRole(...ACCESS_ROLES), controller.addKuis);

router.delete('/pertemuan/tugas/:id', requireRole(...ACCESS_ROLES), controller.removeTugas);
router.delete('/pertemuan/kuis/:id', requireRole(...ACCESS_ROLES), controller.removeKuis);

router.get('/pertemuan/tugas/:id/submissions', requireRole(...ACCESS_ROLES), controller.getTugasSubmissions);
router.put('/pertemuan/tugas/submissions/:id', requireRole(...ACCESS_ROLES), controller.updateNilaiTugas);
router.get('/pertemuan/kuis/:id/submissions', requireRole(...ACCESS_ROLES), controller.getKuisSubmissions);

router.get('/:materiId/akses', requireRole(...ACCESS_ROLES), controller.getMateriAkses);
router.post('/:materiId/akses', requireRole('MAHASISWA'), controller.recordMateriAkses);

router.delete('/:materiId', requireRole(...ACCESS_ROLES), controller.deleteMateri);

// --- Rute Video Interaktif ---
router.get('/:materiId/video-questions', authenticate, videoCtrl.getQuestions);
router.post('/:materiId/video-questions', authenticate, videoCtrl.addQuestion);
router.put('/:materiId/video-questions/:qId', authenticate, videoCtrl.updateQuestion);
router.delete('/:materiId/video-questions/:qId', authenticate, videoCtrl.deleteQuestion);

router.get('/:materiId/video-progress', authenticate, videoCtrl.getProgress);
router.post('/:materiId/video-progress', authenticate, videoCtrl.saveProgress);

export default router;
