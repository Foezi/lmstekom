import { authService, userPayload } from './auth.service.js';
import { asyncHandler } from '../../shared/utils/apiError.js';
import { logActivity } from '../../shared/utils/activityLog.js';
import { env } from '../../core/env.js';

const ip = (req) => req.ip || req.socket?.remoteAddress || null;

export const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  await logActivity({
    userId: result.user.id,
    aktivitas: 'LOGIN',
    modul: 'AUTH',
    ipAddress: ip(req),
  });
  res.json({ data: result });
});

export const lengkapiProfil = asyncHandler(async (req, res) => {
  const result = await authService.lengkapiProfil(req.user.id, req.body);
  await logActivity({ userId: req.user.id, aktivitas: 'LENGKAPI_PROFIL', modul: 'AUTH', ipAddress: ip(req) });
  res.json({ data: result });
});

export const verifyOtp = asyncHandler(async (req, res) => {
  const { jenis, kode } = req.body;
  const result = await authService.verifyOtp(req.user.id, jenis, kode);
  await logActivity({ userId: req.user.id, aktivitas: `VERIFIKASI_OTP_${jenis}`, modul: 'AUTH', ipAddress: ip(req) });
  res.json({ data: result });
});

export const resendOtp = asyncHandler(async (req, res) => {
  const { jenis } = req.body;
  const result = await authService.resendOtp(req.user.id, jenis);
  res.json({ data: result });
});

export const connectDrive = asyncHandler(async (req, res) => {
  const result = await authService.connectDrive(req.user.id);
  await logActivity({ userId: req.user.id, aktivitas: 'HUBUNGKAN_GDRIVE', modul: 'AUTH', ipAddress: ip(req) });
  res.json({ data: result }); // result = { url: ... }
});

export const driveCallback = asyncHandler(async (req, res) => {
  console.log('[DEBUG] Masuk ke driveCallback. Query:', req.query);
  const { code, state, error } = req.query;
  
  if (error) {
    return res.redirect(`${env.frontendUrl}/lengkapi-profil?drive_error=true`);
  }
  
  if (!code || !state) {
    return res.redirect(`${env.frontendUrl}/lengkapi-profil?drive_error=true`);
  }
  
  try {
    const userId = await authService.handleGoogleCallback(code, state);
    res.redirect(`${env.frontendUrl}/lengkapi-profil?drive_success=true&userId=${userId}`);
  } catch (err) {
    console.error('Drive Callback Error:', err);
    res.redirect(`${env.frontendUrl}/lengkapi-profil?drive_error=true`);
  }
});

export const changePassword = asyncHandler(async (req, res) => {
  const result = await authService.changePassword(req.user.id, req.body);
  await logActivity({ userId: req.user.id, aktivitas: 'GANTI_PASSWORD', modul: 'AUTH', ipAddress: ip(req) });
  res.json({ data: result });
});

export const me = asyncHandler(async (req, res) => {
  const result = await authService.me(req.user.id);
  res.json({ data: result.user });
});

export const updateProfile = asyncHandler(async (req, res) => {
  let avatarUrl = req.body.avatarUrl;
  
  if (req.file) {
    // If multer is used with memoryStorage, convert to base64
    const base64 = req.file.buffer.toString('base64');
    const mime = req.file.mimetype;
    avatarUrl = `data:${mime};base64,${base64}`;
  }

  const result = await authService.updateProfile(req.user.id, {
    nickname: req.body.nickname,
    avatarUrl,
  });
  await logActivity({ userId: req.user.id, aktivitas: 'UPDATE_PROFILE', modul: 'AUTH', ipAddress: ip(req) });
  res.json({ data: userPayload(result) });
});
