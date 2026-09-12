import { asyncHandler, ApiError } from '../../../shared/utils/apiError.js';
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

export const getRekapPenilaianDosen = asyncHandler(async (req, res) => {
  const { matakuliahId, tahunAkademikId } = req.query;
  const dosenId = req.user.dosenId;

  if (!dosenId) {
    throw ApiError.unauthorized('Anda bukan dosen');
  }
  if (!matakuliahId || !tahunAkademikId) {
    throw ApiError.badRequest('matakuliahId dan tahunAkademikId diperlukan');
  }

  const data = await nilaiService.getRekapPenilaianDosen({
    dosenId,
    matakuliahId,
    tahunAkademikId
  });

  res.json({ data });
});
