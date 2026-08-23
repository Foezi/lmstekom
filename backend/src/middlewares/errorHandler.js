import { ApiError } from '../utils/apiError.js';

/** Handler error terpusat: ApiError | ZodError | Prisma known errors | fallback 500. */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  // Prisma unique constraint violation
  if (err?.code === 'P2002') {
    const target = Array.isArray(err.meta?.target) ? err.meta.target.join(', ') : err.meta?.target;
    return res.status(409).json({
      error: { code: 'CONFLICT', message: `Data duplikat pada kolom unik (${target || '?'})` },
    });
  }
  if (err?.code === 'P2025') {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Data tidak ditemukan' } });
  }

  if (err instanceof ApiError) {
    const body = { code: err.code, message: err.message };
    if (err.details) body.details = err.details;
    return res.status(err.statusCode).json({ error: body });
  }

  if (err?.name === 'ZodError') {
    return res.status(400).json({
      error: { code: 'BAD_REQUEST', message: 'Data tidak valid', details: err.issues },
    });
  }

  console.error('[unhandled]', err);
  return res.status(500).json({
    error: { code: 'INTERNAL', message: 'Terjadi kesalahan internal server' },
  });
}

/** 404 untuk route yang tidak dikenal di bawah /api. */
export function notFoundHandler(req, res) {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: `Endpoint ${req.method} ${req.originalUrl} tidak ditemukan` } });
}
