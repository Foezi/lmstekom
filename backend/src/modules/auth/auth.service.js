import { db } from '../../core/database.js';
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
    emailAktif: user.emailAktif,
    noWhatsapp: user.noWhatsapp,
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
async function lengkapiProfil(userId, { email, noWhatsapp, passwordBaru }) {
  if (!/^[^\s@]+@gmail\.com$/i.test(email)) {
    throw ApiError.badRequest('Email wajib menggunakan domain @gmail.com untuk integrasi Google Drive');
  }
  if (!/^\+?[0-9]{9,15}$/.test(noWhatsapp.replace(/[\s-]/g, ''))) {
    throw ApiError.badRequest('Format nomor WhatsApp tidak valid');
  }

  const cleanWa = noWhatsapp.replace(/[\s-]/g, '');
  const existing = await db.user.findFirst({
    where: { 
      OR: [
        { emailAktif: email.toLowerCase() },
        { noWhatsapp: cleanWa }
      ],
      id: { not: userId } 
    },
  });
  if (existing) {
    if (existing.emailAktif === email.toLowerCase()) throw ApiError.conflict('Email sudah dipakai akun lain');
    if (existing.noWhatsapp === cleanWa) throw ApiError.conflict('Nomor WhatsApp sudah digunakan oleh akun lain');
  }

  const user = await db.user.update({
    where: { id: userId },
    data: {
      emailAktif: email.toLowerCase(),
      noWhatsapp: noWhatsapp.replace(/[\s-]/g, ''),
      password: await hashPassword(passwordBaru),
    },
  });

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

  await notificationStub.sendEmailOtp(user.emailAktif, kodeEmail);
  await notificationStub.sendWhatsappOtp(user.noWhatsapp, kodeWa);

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
  if (!user?.emailAktif || !user?.noWhatsapp) {
    throw ApiError.badRequest('Lengkapi profil terlebih dahulu sebelum meminta ulang OTP');
  }
  const devCodes = await issueOtpsFor(user);
  return { pesan: `OTP ${jenis.toLowerCase()} baru telah dikirim`, ...(env.otpDevMode ? { devCodes } : {}) };
}

/** Stub OAuth2 Google Drive (blueprint §6.0c). */
async function connectDrive(userId) {
  let user = await db.user.update({
    where: { id: userId },
    data: { googleDriveConnected: true },
    include: {
      dosen: { select: { id: true, nidn: true, nama: true } },
      mahasiswa: { select: { id: true, nim: true, nama: true, kelasId: true, prodiId: true } },
      prodiKelola: { select: { id: true, namaProdi: true } },
    },
  });
  await notificationStub.connectGoogleDrive(user);
  user = await maybeFinalize(user);
  return { user: userPayload(user) };
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
  await db.user.update({ where: { id: userId }, data: { password: await hashPassword(passwordBaru) } });
  return { pesan: 'Password berhasil diubah' };
}

export const authService = {
  login,
  lengkapiProfil,
  verifyOtp,
  resendOtp,
  connectDrive,
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
