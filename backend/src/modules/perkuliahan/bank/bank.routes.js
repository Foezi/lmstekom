import { Router } from 'express';
import { authenticate } from '../../../shared/middlewares/authenticate.js';
import { requireRole } from '../../../shared/middlewares/requireRole.js';
import { 
  getBankTugas, createBankTugas, updateBankTugas, deleteBankTugas,
  getBankKuis, getBankKuisById, createBankKuis, updateBankKuis, deleteBankKuis,
  getBankKuisSoal, createBankKuisSoal, updateBankKuisSoal, deleteBankKuisSoal
} from './bank.controller.js';
import multer from 'multer';
import os from 'os';

const upload = multer({ dest: os.tmpdir() });

const router = Router();

// Semua rute di modul ini membutuhkan login
router.use(authenticate);

// Rute Bank Tugas
router.get('/matakuliah/:mkId/tugas', requireRole('DOSEN', 'ADMIN'), getBankTugas);
router.post('/tugas', requireRole('DOSEN', 'ADMIN'), upload.single('file'), createBankTugas);
router.put('/tugas/:id', requireRole('DOSEN', 'ADMIN'), upload.single('file'), updateBankTugas);
router.delete('/tugas/:id', requireRole('DOSEN', 'ADMIN'), deleteBankTugas);

// Rute Bank Kuis
router.get('/matakuliah/:mkId/kuis', requireRole('DOSEN', 'ADMIN'), getBankKuis);
router.get('/kuis/:id', requireRole('DOSEN', 'ADMIN'), getBankKuisById);
router.post('/kuis', requireRole('DOSEN', 'ADMIN'), createBankKuis);
router.put('/kuis/:id', requireRole('DOSEN', 'ADMIN'), updateBankKuis);
router.delete('/kuis/:id', requireRole('DOSEN', 'ADMIN'), deleteBankKuis);

// Rute Bank Kuis Soal
router.get('/kuis/:kuisId/soal', requireRole('DOSEN', 'ADMIN'), getBankKuisSoal);
router.post('/kuis/:kuisId/soal', requireRole('DOSEN', 'ADMIN'), upload.single('file'), createBankKuisSoal);
router.put('/kuis/:kuisId/soal/:soalId', requireRole('DOSEN', 'ADMIN'), upload.single('file'), updateBankKuisSoal);
router.delete('/kuis/:kuisId/soal/:soalId', requireRole('DOSEN', 'ADMIN'), deleteBankKuisSoal);

export default router;
