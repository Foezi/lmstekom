import { db } from '../../core/database.js';
import * as driveService from '../drive/drive.service.js';
import { ApiError } from '../../shared/utils/apiError.js';
import { signToken } from '../../shared/utils/jwt.js';
import { comparePassword, hashPassword } from '../../shared/utils/password.js';
import { generateOtp } from '../../shared/utils/otp.js';
import { env } from '../../core/env.js';
import { notificationStub } from '../../shared/utils/notificationStub.js';

/** Bentuk aman data user untuk respons API. */
export function userPayload(user) {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    nama:
      user.dosen?.nama ||
      user.mahasiswa?.nama ||
      (user.role === 'ADMIN_PRODI' ? user.prodiKelola?.namaProdi : null) ||
      user.username,
    dosenId: user.dosenId,
    mahasiswaId: user.mahasiswaId,
    prodiId: user.prodiId ?? user.mahasiswa?.prodiId ?? null,
    kelasId: user.mahasiswa?.kelasId ?? null,
    nickname: user.nickname,
    avatarUrl: user.avatarUrl,
    email: user.email,
    noHp: user.noHp,
    statusVerifikasiEmail: user.statusVerifikasiEmail,
    statusVerifikasiWa: user.statusVerifikasiWa,
    googleDriveConnected: user.googleDriveConnected,
    wajibLengkapiProfil: user.wajibLengkapiProfil,
  };
}

const findUserFull = (id) =>
  db.user.findUnique({
    where: { id },
    include: {
      dosen: { select: { id: true, nidn: true, nama: true } },
      mahasiswa: {
        select: { id: true, nim: true, nama: true, kelasId: true, prodiId: true },
      },
      prodiKelola: { select: { id: true, namaProdi: true } },
    },
  });

async function login({ username, password }) {
  const found = await db.user.findUnique({ where: { username: username.trim() } });
  const user = found ? await findUserFull(found.id) : null;
  const passwordOk = user && (await comparePassword(password, user.password));
  if (!passwordOk) {
    throw ApiError.unauthorized('Username atau password salah');
  }

  if (!user.firstLoginAt) {
    await db.user.update({ where: { id: user.id }, data: { firstLoginAt: new Date() } });
  }

  const token = signToken({ id: user.id, role: user.role });
  return { token, user: userPayload(user) };
}

/**
 * Langkah login pertama kali (blueprint §6.0b):
 * simpan email Gmail + WA + password baru, lalu generate & "kirim" OTP ke dua kanal.
 */
async function lengkapiProfil(userId, { email, noHp, passwordBaru }) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw ApiError.badRequest('Format email tidak valid');
  }
  if (!/^\+?[0-9]{9,15}$/.test(noHp.replace(/[\s-]/g, ''))) {
    throw ApiError.badRequest('Format nomor WhatsApp tidak valid');
  }

  const cleanWa = noHp.replace(/[\s-]/g, '');
  const existing = await db.user.findFirst({
    where: { 
      OR: [
        { email: email.toLowerCase() },
        { noHp: cleanWa }
      ],
      id: { not: userId } 
    },
  });
  if (existing) {
    if (existing.email === email.toLowerCase()) throw ApiError.conflict('Email sudah dipakai akun lain');
    if (existing.noHp === cleanWa) throw ApiError.conflict('Nomor WhatsApp sudah digunakan oleh akun lain');
  }

  const currentUser = await db.user.findUnique({ where: { id: userId } });
  const isEmailUnchanged = currentUser.email === email.toLowerCase();
  const isWaUnchanged = currentUser.noHp === cleanWa;
  const isVerified = currentUser.statusVerifikasiEmail === 'TERVERIFIKASI' && currentUser.statusVerifikasiWa === 'TERVERIFIKASI';

  let user = await db.user.update({
    where: { id: userId },
    data: {
      email: email.toLowerCase(),
      noHp: cleanWa,
      ...(passwordBaru ? { password: await hashPassword(passwordBaru) } : {}),
    },
    include: {
      dosen: { select: { id: true, nidn: true, nama: true } },
      mahasiswa: { select: { id: true, nim: true, nama: true, kelasId: true, prodiId: true } },
      prodiKelola: { select: { id: true, namaProdi: true } },
    }
  });

  if (isEmailUnchanged && isWaUnchanged && isVerified) {
    user = await maybeFinalize(user);
    return { pesan: 'Password dan profil berhasil diperbarui', user: user.wajibLengkapiProfil === false ? userPayload(user) : undefined };
  }

  const devCodes = await issueOtpsFor(user);
  return { pesan: 'Kode OTP telah dikirim ke email dan WhatsApp Anda', ...(env.otpDevMode ? { devCodes } : {}) };
}

/** Buat pasangan OTP (email + whatsapp), tandai yang lama GAGAL. */
async function issueOtpsFor(user) {
  const now = new Date();
  const kadaluarsa = new Date(now.getTime() + env.otpTtlMinutes * 60_000);

  await db.verifikasiOtp.updateMany({
    where: { userId: user.id, status: 'PENDING' },
    data: { status: 'GAGAL' },
  });

  const kodeEmail = generateOtp();
  const kodeWa = generateOtp();
  await db.verifikasiOtp.createMany({
    data: [
      { userId: user.id, jenis: 'EMAIL', kodeOtp: kodeEmail, kadaluarsaPada: kadaluarsa },
      { userId: user.id, jenis: 'WHATSAPP', kodeOtp: kodeWa, kadaluarsaPada: kadaluarsa },
    ],
  });

  await notificationStub.sendEmailOtp(user.email, kodeEmail);
  await notificationStub.sendWhatsappOtp(user.noHp, kodeWa);

  return env.otpDevMode ? { email: kodeEmail, whatsapp: kodeWa } : undefined;
}

async function verifyOtp(userId, jenis, kode) {
  const otp = await db.verifikasiOtp.findFirst({
    where: { userId, jenis, status: 'PENDING' },
    orderBy: { dikirimPada: 'desc' },
  });
  if (!otp) throw ApiError.badRequest(`Tidak ada OTP ${jenis.toLowerCase()} yang aktif, silakan kirim ulang`);
  if (otp.kadaluarsaPada < new Date()) {
    await db.verifikasiOtp.update({ where: { id: otp.id }, data: { status: 'GAGAL' } });
    throw ApiError.badRequest('OTP sudah kedaluwarsa, silakan kirim ulang');
  }
  if (otp.kodeOtp !== kode.trim()) throw ApiError.badRequest('Kode OTP salah');

  await db.verifikasiOtp.update({ where: { id: otp.id }, data: { status: 'BERHASIL' } });
  const data =
    jenis === 'EMAIL' ? { statusVerifikasiEmail: 'TERVERIFIKASI' } : { statusVerifikasiWa: 'TERVERIFIKASI' };

  let user = await db.user.update({
    where: { id: userId },
    data,
    include: {
      dosen: { select: { id: true, nidn: true, nama: true } },
      mahasiswa: { select: { id: true, nim: true, nama: true, kelasId: true, prodiId: true } },
      prodiKelola: { select: { id: true, namaProdi: true } },
    },
  });

  user = await maybeFinalize(user);
  return { user: userPayload(user) };
}

async function resendOtp(userId, jenis) {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user?.email || !user?.noHp) {
    throw ApiError.badRequest('Lengkapi profil terlebih dahulu sebelum meminta ulang OTP');
  }
  const devCodes = await issueOtpsFor(user);
  return { pesan: `OTP ${jenis.toLowerCase()} baru telah dikirim`, ...(env.otpDevMode ? { devCodes } : {}) };
}

/** OAuth2 Google Drive. */
async function connectDrive(userId) {
  const oauth2Client = driveService.getOAuth2Client();
  if (!oauth2Client) {
    await db.user.update({
      where: { id: userId },
      data: { googleDriveConnected: true, wajibLengkapiProfil: false }
    });
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    return { url: `${frontendUrl}/lengkapi-profil?drive_simulated_success=true` };
  }
  const url = driveService.generateAuthUrl(userId);
  return { url };
}

export async function handleGoogleCallback(code, state) {
  const userId = await driveService.handleGoogleCallback(code, state);
  let user = await db.user.findUnique({
    where: { id: userId },
    include: {
      dosen: { select: { id: true, nidn: true, nama: true } },
      mahasiswa: { select: { id: true, nim: true, nama: true, kelasId: true, prodiId: true } },
      prodiKelola: { select: { id: true, namaProdi: true } },
    },
  });
  await notificationStub.connectGoogleDrive(user);
  user = await maybeFinalize(user);
  return userId;
}

/** Selesaikan onboarding bila kedua verifikasi + drive terpenuhi (§6.0b-8). */
async function maybeFinalize(user) {
  if (
    user.wajibLengkapiProfil &&
    user.statusVerifikasiEmail === 'TERVERIFIKASI' &&
    user.statusVerifikasiWa === 'TERVERIFIKASI' &&
    user.googleDriveConnected
  ) {
    user = await db.user.update({
      where: { id: user.id },
      data: { wajibLengkapiProfil: false },
      include: {
        dosen: { select: { id: true, nidn: true, nama: true } },
        mahasiswa: { select: { id: true, nim: true, nama: true, kelasId: true, prodiId: true } },
        prodiKelola: { select: { id: true, namaProdi: true } },
      },
    });
  }
  return user;
}

async function changePassword(userId, { passwordLama, passwordBaru }) {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user || !(await comparePassword(passwordLama, user.password))) {
    throw ApiError.badRequest('Password lama tidak sesuai');
  }
  let updated = await db.user.update({ 
    where: { id: userId }, 
    data: { password: await hashPassword(passwordBaru) },
    include: {
      dosen: { select: { id: true, nidn: true, nama: true } },
      mahasiswa: { select: { id: true, nim: true, nama: true, kelasId: true, prodiId: true } },
      prodiKelola: { select: { id: true, namaProdi: true } },
    }
  });
  updated = await maybeFinalize(updated);
  return { pesan: 'Password berhasil diubah', user: userPayload(updated) };
}

export const authService = {
  login,
  lengkapiProfil,
  verifyOtp,
  resendOtp,
  connectDrive,
  handleGoogleCallback,
  changePassword,
  me: async (userId) => {
    const user = await findUserFull(userId);
    if (!user) throw ApiError.notFound('User tidak ditemukan');
    return { user: userPayload(user) };
  },

  async updateProfile(userId, { nickname, avatarUrl }) {
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) throw ApiError.notFound('User tidak ditemukan');

    const updateData = {};
    if (nickname !== undefined) updateData.nickname = nickname;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;

    const updated = await db.user.update({
      where: { id: userId },
      data: updateData,
    });
    return findUserFull(userId);
  }
};
