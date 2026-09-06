import { db } from '../../core/database.js';
import { ApiError } from '../../shared/utils/apiError.js';

export const findAll = async () => {
  return db.tahunKurikulum.findMany({
    orderBy: { tahun: 'desc' },
  });
};

export const findById = async (id) => {
  const kurikulum = await db.tahunKurikulum.findUnique({ where: { id } });
  if (!kurikulum) throw ApiError.notFound('Tahun Kurikulum tidak ditemukan');
  return kurikulum;
};

export const create = async (data) => {
  const existing = await db.tahunKurikulum.findUnique({ where: { tahun: data.tahun } });
  if (existing) throw ApiError.conflict('Tahun Kurikulum sudah ada');
  return db.tahunKurikulum.create({ data });
};

export const update = async (id, data) => {
  await findById(id);
  if (data.tahun) {
    const existing = await db.tahunKurikulum.findFirst({ where: { tahun: data.tahun, id: { not: id } } });
    if (existing) throw ApiError.conflict('Tahun Kurikulum sudah digunakan');
  }
  return db.tahunKurikulum.update({
    where: { id },
    data,
  });
};

export const remove = async (id) => {
  await findById(id);
  return db.tahunKurikulum.delete({ where: { id } });
};
