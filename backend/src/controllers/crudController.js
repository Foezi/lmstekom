import { asyncHandler } from '../utils/apiError.js';
import { logActivity } from '../utils/activityLog.js';

const ip = (req) => req.ip || req.socket?.remoteAddress || null;

/** Factory controller generik untuk entitas master data. */
export function createCrudController(service, config) {
  const MODUL = config.model.toUpperCase();

  return {
    list: asyncHandler(async (req, res) => {
      const { rows, meta } = await service.list({ user: req.user, query: req.query });
      res.json({ data: rows, meta });
    }),

    get: asyncHandler(async (req, res) => {
      res.json({ data: await service.getById({ user: req.user, id: Number(req.params.id) }) });
    }),

    create: asyncHandler(async (req, res) => {
      const record = await service.create({ user: req.user, data: req.body });
      await logActivity({ userId: req.user.id, aktivitas: `TAMBAH ${MODUL}`, modul: MODUL, ipAddress: ip(req) });
      res.status(201).json({ data: record });
    }),

    update: asyncHandler(async (req, res) => {
      const record = await service.update({ user: req.user, id: Number(req.params.id), data: req.body });
      await logActivity({
        userId: req.user.id,
        aktivitas: `UBAH ${MODUL} #${req.params.id}`,
        modul: MODUL,
        ipAddress: ip(req),
      });
      res.json({ data: record });
    }),

    remove: asyncHandler(async (req, res) => {
      const result = await service.remove({ user: req.user, id: Number(req.params.id) });
      await logActivity({
        userId: req.user.id,
        aktivitas: `HAPUS ${MODUL} #${req.params.id}`,
        modul: MODUL,
        ipAddress: ip(req),
      });
      res.json({ data: result });
    }),

    template: asyncHandler(async (_req, res) => {
      const buffer = service.templateBuffer();
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="template-import-${config.model}.xlsx"`);
      res.send(buffer);
    }),

    importPreview: asyncHandler(async (req, res) => {
      const result = await service.importPreview({ user: req.user, file: req.file });
      await logActivity({ userId: req.user.id, aktivitas: `IMPORT_PREVIEW ${MODUL}`, modul: MODUL, ipAddress: ip(req) });
      res.json({ data: result });
    }),

    importCommit: asyncHandler(async (req, res) => {
      const result = await service.importCommit({ user: req.user, batchId: req.body?.batchId, ipAddress: ip(req) });
      res.json({ data: result });
    }),

    export: asyncHandler(async (req, res) => {
      const buffer = await service.exportBuffer({ user: req.user, query: req.query });
      await logActivity({ userId: req.user.id, aktivitas: `EXPORT ${MODUL}`, modul: MODUL, ipAddress: ip(req) });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="export-${config.model}-${Date.now()}.xlsx"`);
      res.send(buffer);
    }),
  };
}
