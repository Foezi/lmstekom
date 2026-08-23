import { authService, userPayload } from '../services/authService.js';
import { asyncHandler } from '../utils/apiError.js';
import { logActivity } from '../utils/activityLog.js';

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
  res.json({ data: result });
});

export const changePassword = asyncHandler(async (req, res) => {
  const result = await authService.changePassword(req.user.id, req.body);
  await logActivity({ userId: req.user.id, aktivitas: 'GANTI_PASSWORD', modul: 'AUTH', ipAddress: ip(req) });
  res.json({ data: result });
});

export const me = asyncHandler(async (req, res) => {
  const result = await authService.me(req.user.id);
  res.json({ data: userPayload(result.user) });
});
