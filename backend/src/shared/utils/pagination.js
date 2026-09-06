import { ApiError } from './apiError.js';

/**
 * Parse query pagination standar: ?page=&limit=&q=
 * Return { skip, take, page, limit, q }
 */
export function parsePagination(query, { defaultLimit = 10, maxLimit = 100 } = {}) {
  let page = parseInt(query.page || '1', 10);
  let limit = parseInt(query.limit || String(defaultLimit), 10);
  if (!Number.isFinite(page) || page < 1) page = 1;
  if (!Number.isFinite(limit) || limit < 1) limit = defaultLimit;
  if (limit > maxLimit) limit = maxLimit;
  const q = typeof query.q === 'string' ? query.q.trim() : '';
  return { skip: (page - 1) * limit, take: limit, page, limit, q };
}

export const buildMeta = ({ page, limit }, total) => ({
  page,
  limit,
  total,
  totalPages: Math.max(1, Math.ceil(total / limit)),
});

/** Ambil & validasi parameter filter angka (mis. prodiId) dari query. */
export function numericFilter(query, name) {
  if (query[name] === undefined || query[name] === '') return undefined;
  const val = parseInt(query[name], 10);
  if (!Number.isFinite(val)) {
    throw ApiError.badRequest(`Parameter ${name} harus berupa angka`);
  }
  return val;
}
