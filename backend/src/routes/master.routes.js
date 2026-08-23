import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { createCrudService } from '../services/crudFactory.js';
import { createCrudController } from '../controllers/crudController.js';
import { requireRole } from '../middlewares/requireRole.js';
import { validateBody } from '../middlewares/validate.js';

const zBatchId = z.object({ batchId: z.string().uuid('batchId tidak valid') });

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = /\.(xlsx|xls|csv)$/i.test(file.originalname);
    cb(ok ? null : new Error('FORMAT_FILE'), ok);
  },
});

export function handleUploadError(err, _req, res, next) {
  if (err?.message === 'FORMAT_FILE') {
    return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Format file harus .xlsx, .xls, atau .csv' } });
  }
  if (err?.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Ukuran file maksimal 5MB' } });
  }
  next(err);
}

/** Bangun router CRUD lengkap (termasuk import/export) untuk satu entitas master data. */
export function buildMasterRouter(config) {
  const service = createCrudService(config);
  const controller = createCrudController(service, config);
  const router = Router();
  const rolesFor = (action) => requireRole(...config.rbac[action]);

  router.get('/', rolesFor('list'), controller.list);
  router.get('/export', rolesFor('export'), controller.export);
  router.get('/import/template', rolesFor('import'), controller.template);
  router.post(
    '/import/preview',
    rolesFor('import'),
    upload.single('file'),
    handleUploadError,
    controller.importPreview
  );
  router.post('/import/commit', rolesFor('import'), validateBody(zBatchId), controller.importCommit);

  router.get('/:id', rolesFor('get'), controller.get);
  router.post('/', rolesFor('create'), validateBody(config.schema), controller.create);
  router.put('/:id', rolesFor('update'), validateBody(config.schema.partial()), controller.update);
  router.delete('/:id', rolesFor('delete'), controller.remove);

  return router;
}
