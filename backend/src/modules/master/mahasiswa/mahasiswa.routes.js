import { buildCrudRouter } from '../../../shared/crud/crud.routes.js';
import { mahasiswaConfig } from './mahasiswa.config.js';

import { requireRole } from '../../../shared/middlewares/requireRole.js';
import { ApiError } from '../../../shared/utils/apiError.js';
import { hashDefault, ADMIN_TRIO } from '../../../shared/crud/crud.utils.js';
import { db as prisma } from '../../../core/database.js';

const router = buildCrudRouter(mahasiswaConfig);

router.post('/:id/reset-password', requireRole(...ADMIN_TRIO), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const mahasiswa = await prisma.mahasiswa.findUnique({ where: { id } });
    if (!mahasiswa) throw ApiError.notFound('Mahasiswa tidak ditemukan');
    
    const user = await prisma.user.findUnique({ where: { username: mahasiswa.nim } });
    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: await hashDefault(mahasiswa.nim),
          wajibLengkapiProfil: true
        }
      });
    } else {
      await prisma.user.create({
        data: {
          username: mahasiswa.nim,
          password: await hashDefault(mahasiswa.nim),
          role: 'MAHASISWA',
          mahasiswaId: mahasiswa.id,
          wajibLengkapiProfil: true
        }
      });
    }
    
    res.json({ success: true, message: 'Password mahasiswa berhasil di-reset ke default (NIM)' });
  } catch (err) {
    next(err);
  }
});

export default router;
