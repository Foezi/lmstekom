import { buildCrudRouter } from '../../../shared/crud/crud.routes.js';
import { dosenConfig } from './dosen.config.js';

import { requireRole } from '../../../shared/middlewares/requireRole.js';
import { ApiError } from '../../../shared/utils/apiError.js';
import { hashDefault, ADMIN_TRIO } from '../../../shared/crud/crud.utils.js';
import { db as prisma } from '../../../core/database.js';

const router = buildCrudRouter(dosenConfig);

router.post('/:id/reset-password', requireRole(...ADMIN_TRIO), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const dosen = await prisma.dosen.findUnique({ where: { id } });
    if (!dosen) throw ApiError.notFound('Dosen tidak ditemukan');
    
    const user = await prisma.user.findUnique({ where: { username: dosen.nidn } });
    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: await hashDefault(dosen.nidn),
          wajibLengkapiProfil: true
        }
      });
    } else {
      await prisma.user.create({
        data: {
          username: dosen.nidn,
          password: await hashDefault(dosen.nidn),
          role: 'DOSEN',
          dosenId: dosen.id,
          wajibLengkapiProfil: true
        }
      });
    }
    
    res.json({ success: true, message: 'Password dosen berhasil di-reset ke default (NIDN)' });
  } catch (err) {
    next(err);
  }
});

export default router;
