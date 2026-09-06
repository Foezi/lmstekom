import { asyncHandler } from '../../../shared/utils/apiError.js';
import { nilaiService } from './nilai.service.js';

export const getRekapNilaiAdmin = asyncHandler(async (req, res) => {
  const { prodiId, tahunAkademikId, kelasId, matakuliahId, q, page, limit } = req.query;
  const data = await nilaiService.getRekapNilaiAdmin({
    prodiId,
    tahunAkademikId,
    kelasId,
    matakuliahId,
    q,
    page: page || 1,
    limit: limit || 20
  });
  res.json({ data: data.rows, meta: data.meta });
});
