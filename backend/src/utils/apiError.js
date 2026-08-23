/**
 * Error terkontrol dengan status code. Lempar dari service/controller;
 * errorHandler akan menerjemahkannya menjadi response JSON.
 */
export class ApiError extends Error {
  constructor(statusCode, message, { code, details } = {}) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }

  static badRequest(message, opts) {
    return new ApiError(400, message, { code: 'BAD_REQUEST', ...opts });
  }

  static unauthorized(message = 'Tidak terautentikasi') {
    return new ApiError(401, message, { code: 'UNAUTHORIZED' });
  }

  static forbidden(message = 'Akses ditolak', code) {
    return new ApiError(403, message, { code: code || 'FORBIDDEN' });
  }

  static notFound(message = 'Data tidak ditemukan') {
    return new ApiError(404, message, { code: 'NOT_FOUND' });
  }

  static conflict(message, details) {
    return new ApiError(409, message, { code: 'CONFLICT', details });
  }
}

/** Bungkus handler async agar error tertangkap express. */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
