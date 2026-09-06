import { db } from '../../core/database.js';
import { ApiError } from '../../shared/utils/apiError.js';

// Helper to scope queries by prodi if the user is ADMIN_PRODI
const getScope = (user) => {
  if (user && user.role === 'ADMIN_PRODI') {
    return { prodiId: user.prodiId };
  }
  return {};
};

const assertAccess = (user, prodiId) => {
  if (user && user.role === 'ADMIN_PRODI' && user.prodiId !== prodiId) {
    throw ApiError.forbidden('Anda hanya dapat mengelola data pada prodi Anda');
  }
};

export const findAll = async (user) => {
  return db.mataKuliah.findMany({
    where: getScope(user),
    include: {
      prodi: { select: { namaProdi: true } },
      tahunKurikulum: { select: { tahun: true } }
    },
    orderBy: [{ semester: 'asc' }, { kodeMk: 'asc' }],
  });
};

export const findById = async (id, user) => {
  const mk = await db.mataKuliah.findFirst({
    where: { id, ...getScope(user) },
    include: { prodi: true, tahunKurikulum: true }
  });
  if (!mk) throw ApiError.notFound('Mata Kuliah tidak ditemukan');
  return mk;
};

export const create = async (data, user) => {
  assertAccess(user, data.prodiId);
  const existing = await db.mataKuliah.findUnique({
    where: { prodiId_kodeMk: { prodiId: data.prodiId, kodeMk: data.kodeMk } }
  });
  if (existing) throw ApiError.conflict('Kode Mata Kuliah sudah ada di prodi tersebut');
  return db.mataKuliah.create({ data });
};

export const update = async (id, data, user) => {
  const existingMk = await findById(id, user);
  if (data.prodiId) assertAccess(user, data.prodiId);
  
  if (data.kodeMk || data.prodiId) {
    const targetProdi = data.prodiId || existingMk.prodiId;
    const targetKode = data.kodeMk || existingMk.kodeMk;
    const duplicate = await db.mataKuliah.findFirst({
      where: { prodiId: targetProdi, kodeMk: targetKode, id: { not: id } }
    });
    if (duplicate) throw ApiError.conflict('Kode Mata Kuliah sudah ada di prodi tersebut');
  }

  return db.mataKuliah.update({
    where: { id },
    data,
  });
};

export const remove = async (id, user) => {
  await findById(id, user);
  return db.mataKuliah.delete({ where: { id } });
};
