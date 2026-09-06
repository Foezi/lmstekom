import { db } from '../../core/database.js';
import { verifyToken } from '../utils/jwt.js';
import { ApiError } from '../utils/apiError.js';

/** Verifikasi Bearer JWT lalu muat user terkini dari DB (role/status bisa berubah). */
export const authenticate = async (req, _res, next) => {
  try {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Token tidak disertakan');
    }
    let payload;
    try {
      payload = verifyToken(header.slice(7));
    } catch {
      throw ApiError.unauthorized('Token tidak valid atau kedaluwarsa');
    }

    const user = await db.user.findUnique({
      where: { id: payload.id },
      include: {
        dosen: { select: { id: true, nidn: true, nama: true } },
        mahasiswa: {
          select: {
            id: true,
            nim: true,
            nama: true,
            kelasId: true,
            prodiId: true,
          },
        },
      },
    });
    if (!user) throw ApiError.unauthorized('Akun tidak ditemukan');

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Blokir akses modul lain selama wajib lengkapi profil (blueprint §6.0b-2).
 * Dipasang setelah authenticate untuk semua router non-/auth.
 */
export const requireCompleteProfile = (req, _res, next) => {
  if (req.user?.wajibLengkapiProfil) {
    return next(
      ApiError.forbidden('Lengkapi profil dan verifikasi akun terlebih dahulu', 'PROFILE_INCOMPLETE')
    );
  }
  next();
};
