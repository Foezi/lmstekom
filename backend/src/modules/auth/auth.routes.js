import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../shared/middlewares/authenticate.js';
import { validateBody } from '../../shared/middlewares/validate.js';
import * as auth from './auth.controller.js';
import multer from 'multer';

const router = Router();

const loginSchema = z.object({
  username: z.string().min(1, 'Username wajib diisi'),
  password: z.string().min(1, 'Password wajib diisi'),
});

const lengkapiProfilSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  noWhatsapp: z.string().min(9).max(20),
  passwordBaru: z.string().min(8, 'Password baru minimal 8 karakter'),
});

const verifyOtpSchema = z.object({
  jenis: z.enum(['EMAIL', 'WHATSAPP']),
  kode: z.string().length(6, 'Kode OTP harus 6 digit'),
});

const resendOtpSchema = z.object({
  jenis: z.enum(['EMAIL', 'WHATSAPP']),
});

const changePasswordSchema = z.object({
  passwordLama: z.string().min(1),
  passwordBaru: z.string().min(8, 'Password baru minimal 8 karakter'),
});

router.post('/login', validateBody(loginSchema), auth.login);

// Semua route di bawah ini butuh token
router.use(authenticate);
router.get('/me', auth.me);
router.post('/lengkapi-profil', validateBody(lengkapiProfilSchema), auth.lengkapiProfil);
router.post('/verify-otp', validateBody(verifyOtpSchema), auth.verifyOtp);
router.post('/resend-otp', validateBody(resendOtpSchema), auth.resendOtp);
router.post('/drive/connect', auth.connectDrive);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('FORMAT_FILE'), false);
    }
  },
});

router.put('/password', validateBody(changePasswordSchema), auth.changePassword);
router.put(
  '/profile',
  upload.single('avatar'),
  (err, req, res, next) => {
    if (err) return res.status(400).json({ error: { message: 'Gagal upload avatar' } });
    next();
  },
  auth.updateProfile
);

export default router;
