import { db } from '../../../core/database.js';
import { asyncHandler, ApiError } from '../../../shared/utils/apiError.js';

export const getUjianList = asyncHandler(async (req, res) => {
  const { matakuliahId } = req.query;
  const dosenId = req.user.dosenId;

  if (!dosenId) throw ApiError.unauthorized('Akses ditolak: Hanya dosen');
  if (!matakuliahId) throw ApiError.badRequest('matakuliahId diperlukan');

  const ujians = await db.bankKuis.findMany({
    where: {
      matakuliahId: Number(matakuliahId),
      dosenId,
      tipeUjian: { in: ['UTS', 'UAS'] }
    },
    include: {
      _count: { select: { soal: true } }
    },
    orderBy: { tipeUjian: 'asc' }
  });

  res.json({ data: ujians });
});

export const createUjian = asyncHandler(async (req, res) => {
  const { matakuliahId, tipeUjian, judul, deskripsi } = req.body;
  const dosenId = req.user.dosenId;

  if (!dosenId) throw ApiError.unauthorized('Akses ditolak: Hanya dosen');
  if (!matakuliahId) throw ApiError.badRequest('matakuliahId diperlukan');

  // Cek jika sudah ada ujian dengan tipe yang sama
  const existing = await db.bankKuis.findFirst({
    where: { matakuliahId: Number(matakuliahId), dosenId, tipeUjian }
  });

  if (existing) {
    throw ApiError.badRequest(`${tipeUjian} sudah ada untuk mata kuliah ini`);
  }

  const ujian = await db.bankKuis.create({
    data: {
      dosenId,
      matakuliahId: Number(matakuliahId),
      tipeUjian,
      jenis: 'PILIHAN_GANDA',
      judul: judul || (tipeUjian === 'UTS' ? 'Ujian Tengah Semester' : 'Ujian Akhir Semester'),
      deskripsi,
      bobotNilai: 100,
      modeLockdown: true
    }
  });

  res.status(201).json({ data: ujian, message: 'Ujian berhasil dibuat' });
});

export const updateUjian = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { judul, deskripsi } = req.body;
  const dosenId = req.user.dosenId;

  const ujian = await db.bankKuis.findUnique({
    where: { id: Number(id) }
  });

  if (!ujian || ujian.dosenId !== dosenId) {
    throw ApiError.notFound('Ujian tidak ditemukan atau akses ditolak');
  }

  const updated = await db.bankKuis.update({
    where: { id: Number(id) },
    data: {
      judul,
      deskripsi
    }
  });

  res.json({ data: updated, message: 'Pengaturan ujian diperbarui' });
});

export const deleteUjian = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const dosenId = req.user.dosenId;

  const ujian = await db.bankKuis.findUnique({
    where: { id: Number(id) }
  });

  if (!ujian || ujian.dosenId !== dosenId) {
    throw ApiError.notFound('Ujian tidak ditemukan atau akses ditolak');
  }

  await db.bankKuis.delete({
    where: { id: Number(id) }
  });

  res.json({ message: 'Ujian berhasil dihapus' });
});
