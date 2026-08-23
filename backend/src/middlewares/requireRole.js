import { ApiError } from '../utils/apiError.js';

const ROLE_LABEL = {
  ADMIN: 'Administrator',
  ADMIN_AKADEMIK: 'Admin Akademik',
  ADMIN_PRODI: 'Admin Prodi',
  DOSEN: 'Dosen',
  MAHASISWA: 'Mahasiswa',
};

/** Batasi endpoint hanya untuk role tertentu (RBAC — blueprint §3). */
export const requireRole = (...roles) => (req, _res, next) => {
  if (!req.user) return next(ApiError.unauthorized());
  if (!roles.includes(req.user.role)) {
    return next(
      ApiError.forbidden(`Modul ini tidak tersedia untuk peran ${ROLE_LABEL[req.user.role] || req.user.role}`)
    );
  }
  next();
};

export { ROLE_LABEL };
