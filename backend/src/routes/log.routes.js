import { Router } from 'express';
import { db } from '../config/db.js';
import { requireRole } from '../middlewares/requireRole.js';
import { asyncHandler } from '../utils/apiError.js';
import { parsePagination, buildMeta } from '../utils/pagination.js';

const router = Router();

/** Audit trail — khusus Administrator (blueprint §8). */
router.get(
  '/activity',
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const { skip, take, page, limit } = parsePagination(req.query);
    const where = {};
    if (req.query.modul) where.modul = String(req.query.modul);
    if (req.query.userId) where.userId = parseInt(req.query.userId, 10);
    const [rows, total] = await Promise.all([
      db.activityLog.findMany({
        where,
        skip,
        take,
        orderBy: { waktu: 'desc' },
        include: { user: { select: { username: true, role: true } } },
      }),
      db.activityLog.count({ where }),
    ]);
    res.json({ data: rows, meta: buildMeta({ page, limit }, total) });
  })
);

router.get(
  '/import',
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const { skip, take, page, limit } = parsePagination(req.query);
    const where = {};
    if (req.query.jenisData) where.jenisData = String(req.query.jenisData);
    const [rows, total] = await Promise.all([
      db.importLog.findMany({
        where,
        skip,
        take,
        orderBy: { waktu: 'desc' },
        include: { user: { select: { username: true, role: true } } },
      }),
      db.importLog.count({ where }),
    ]);
    res.json({ data: rows, meta: buildMeta({ page, limit }, total) });
  })
);

export default router;
