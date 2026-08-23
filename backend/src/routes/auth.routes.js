import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middlewares/authenticate.js';
import { validateBody } from '../middlewares/validate.js';
import * as auth from '../controllers/authController.js';

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
router.put('/password', validateBody(changePasswordSchema), auth.changePassword);

export default router;
