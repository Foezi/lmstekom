import { db } from '../../../core/database.js';
import { asyncHandler, ApiError } from '../../../shared/utils/apiError.js';
import { logActivity } from '../../../shared/utils/activityLog.js';
import { uploadFileToDrive } from '../../drive/drive.service.js';

const ip = (req) => req.ip || req.socket?.remoteAddress || null;

// ======================= BANK TUGAS =======================

export const getBankTugas = asyncHandler(async (req, res) => {
  const { mkId } = req.params;
  
  const whereFilter = { matakuliahId: parseInt(mkId, 10) };
  if (req.user.role === 'DOSEN') {
    whereFilter.dosenId = req.user.dosenId;
  }
  
  const tugas = await db.bankTugas.findMany({
    where: whereFilter,
    orderBy: { createdAt: 'desc' }
  });

  res.json({ data: tugas });
});

export const createBankTugas = asyncHandler(async (req, res) => {
  const { matakuliahId, judul, kategori, deskripsi } = req.body;
  if (!req.user.dosenId) throw ApiError.forbidden('Hanya Dosen yang dapat membuat tugas');

  let fileUrl = null;
  if (req.file) {
    try {
      const uploadRes = await uploadFileToDrive(req.user.id, req.file);
      fileUrl = uploadRes.webViewLink;
    } catch (error) {
      throw ApiError.internal('Gagal mengunggah file lampiran tugas ke Google Drive: ' + error.message);
    }
  }

  const tugas = await db.bankTugas.create({
    data: {
      dosenId: req.user.dosenId,
      matakuliahId: parseInt(matakuliahId, 10),
      judul,
      kategori,
      deskripsi,
      fileUrl
    }
  });

  await logActivity({
    userId: req.user.id,
    aktivitas: `BUAT TEMPLATE TUGAS: ${judul}`,
    modul: 'BANK_TUGAS',
    ipAddress: ip(req)
  });

  res.status(201).json({ message: 'Template Tugas berhasil dibuat', data: tugas });
});

export const updateBankTugas = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { judul, kategori, deskripsi } = req.body;

  const tugas = await db.bankTugas.findUnique({ where: { id: parseInt(id, 10) } });
  if (!tugas) throw ApiError.notFound('Data tidak ditemukan');
  if (tugas.dosenId !== req.user.dosenId) throw ApiError.forbidden('Tidak memiliki akses ke tugas ini');

  let fileUrl = tugas.fileUrl;
  if (req.file) {
    try {
      const uploadRes = await uploadFileToDrive(req.user.id, req.file);
      fileUrl = uploadRes.webViewLink;
    } catch (error) {
      throw ApiError.internal('Gagal mengunggah file lampiran tugas ke Google Drive: ' + error.message);
    }
  }

  const updated = await db.bankTugas.update({
    where: { id: parseInt(id, 10) },
    data: { judul, kategori, deskripsi, fileUrl }
  });

  res.json({ message: 'Template Tugas diperbarui', data: updated });
});

export const deleteBankTugas = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const tugas = await db.bankTugas.findUnique({ where: { id: parseInt(id, 10) } });
  if (!tugas) throw ApiError.notFound('Data tidak ditemukan');
  if (tugas.dosenId !== req.user.dosenId) throw ApiError.forbidden('Tidak memiliki akses ke tugas ini');

  await db.bankTugas.delete({ where: { id: parseInt(id, 10) } });

  res.json({ message: 'Template Tugas berhasil dihapus' });
});

// ======================= BANK KUIS =======================

export const getBankKuis = asyncHandler(async (req, res) => {
  const { mkId } = req.params;
  const { tipeUjian } = req.query;
  
  const whereFilter = { matakuliahId: parseInt(mkId, 10) };
  if (tipeUjian) {
    whereFilter.tipeUjian = tipeUjian;
  }
  
  if (req.user.role === 'DOSEN') {
    whereFilter.dosenId = req.user.dosenId;
  }
  
  const kuis = await db.bankKuis.findMany({
    where: whereFilter,
    orderBy: { createdAt: 'desc' }
  });

  res.json({ data: kuis });
});

export const getBankKuisById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const kuis = await db.bankKuis.findUnique({
    where: { id: parseInt(id, 10) }
  });

  if (!kuis) throw ApiError.notFound('Bank Kuis tidak ditemukan');
  if (req.user.role === 'DOSEN' && kuis.dosenId !== req.user.dosenId) {
    throw ApiError.forbidden('Tidak memiliki akses');
  }

  res.json({ data: kuis });
});

export const createBankKuis = asyncHandler(async (req, res) => {
  const { matakuliahId, judul, jenis, deskripsi, bobotNilai, modeLockdown } = req.body;
  if (!req.user.dosenId) throw ApiError.forbidden('Hanya Dosen yang dapat membuat kuis');

  const kuis = await db.bankKuis.create({
    data: {
      dosenId: req.user.dosenId,
      matakuliahId: parseInt(matakuliahId, 10),
      judul,
      jenis: jenis || 'PILIHAN_GANDA',
      deskripsi,
      bobotNilai: parseFloat(bobotNilai) || 100,
      modeLockdown: modeLockdown === true || modeLockdown === 'true'
    }
  });

  await logActivity({
    userId: req.user.id,
    aktivitas: `BUAT TEMPLATE KUIS: ${judul}`,
    modul: 'BANK_KUIS',
    ipAddress: ip(req)
  });

  res.status(201).json({ message: 'Template Kuis berhasil dibuat', data: kuis });
});

export const updateBankKuis = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { judul, jenis, deskripsi, bobotNilai, modeLockdown } = req.body;

  const kuis = await db.bankKuis.findUnique({ where: { id: parseInt(id, 10) } });
  if (!kuis) throw ApiError.notFound('Data tidak ditemukan');
  if (kuis.dosenId !== req.user.dosenId) throw ApiError.forbidden('Tidak memiliki akses ke kuis ini');

  const updated = await db.bankKuis.update({
    where: { id: parseInt(id, 10) },
    data: { 
      judul, 
      jenis, 
      deskripsi, 
      bobotNilai: parseFloat(bobotNilai) || 100, 
      modeLockdown: modeLockdown === true || modeLockdown === 'true' 
    }
  });

  res.json({ message: 'Template Kuis diperbarui', data: updated });
});

export const deleteBankKuis = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const kuis = await db.bankKuis.findUnique({ where: { id: parseInt(id, 10) } });
  if (!kuis) throw ApiError.notFound('Data tidak ditemukan');
  if (kuis.dosenId !== req.user.dosenId) throw ApiError.forbidden('Tidak memiliki akses ke kuis ini');

  await db.bankKuis.delete({ where: { id: parseInt(id, 10) } });

  res.json({ message: 'Template Kuis berhasil dihapus' });
});

// ======================= BANK KUIS SOAL =======================

export const getBankKuisSoal = asyncHandler(async (req, res) => {
  const { kuisId } = req.params;

  const kuis = await db.bankKuis.findUnique({ where: { id: parseInt(kuisId, 10) } });
  if (!kuis) throw ApiError.notFound('Bank Kuis tidak ditemukan');
  if (kuis.dosenId !== req.user.dosenId) throw ApiError.forbidden('Tidak memiliki akses');

  const soal = await db.bankKuisSoal.findMany({
    where: { bankKuisId: parseInt(kuisId, 10) },
    orderBy: { createdAt: 'asc' }
  });

  res.json({ data: soal });
});

export const createBankKuisSoal = asyncHandler(async (req, res) => {
  const { kuisId } = req.params;
  const { tipeSoal, pertanyaan, pilihanJawaban, kunciJawaban, bobotSoal } = req.body;

  const kuis = await db.bankKuis.findUnique({ where: { id: parseInt(kuisId, 10) } });
  if (!kuis) throw ApiError.notFound('Bank Kuis tidak ditemukan');
  if (kuis.dosenId !== req.user.dosenId) throw ApiError.forbidden('Tidak memiliki akses');

  let fileUrl = null;
  if (req.file) {
    try {
      const uploadRes = await uploadFileToDrive(req.user.id, req.file);
      fileUrl = uploadRes.webViewLink;
    } catch (error) {
      throw ApiError.internal('Gagal mengunggah file media soal: ' + error.message);
    }
  }

  let parsedPilihan = pilihanJawaban;
  if (typeof pilihanJawaban === 'string') {
    try { parsedPilihan = JSON.parse(pilihanJawaban); } catch(e) { parsedPilihan = [pilihanJawaban]; }
  }

  const soal = await db.bankKuisSoal.create({
    data: {
      bankKuisId: parseInt(kuisId, 10),
      tipeSoal,
      pertanyaan,
      pilihanJawaban: parsedPilihan || null,
      kunciJawaban: kunciJawaban || null,
      fileUrl,
      bobotSoal: parseFloat(bobotSoal) || 10
    }
  });

  res.status(201).json({ message: 'Soal berhasil ditambahkan', data: soal });
});

export const updateBankKuisSoal = asyncHandler(async (req, res) => {
  const { kuisId, soalId } = req.params;
  const { tipeSoal, pertanyaan, pilihanJawaban, kunciJawaban, bobotSoal, hapusFile } = req.body;

  const kuis = await db.bankKuis.findUnique({ where: { id: parseInt(kuisId, 10) } });
  if (!kuis) throw ApiError.notFound('Bank Kuis tidak ditemukan');
  if (kuis.dosenId !== req.user.dosenId) throw ApiError.forbidden('Tidak memiliki akses');

  const existingSoal = await db.bankKuisSoal.findUnique({ where: { id: parseInt(soalId, 10) } });
  if (!existingSoal) throw ApiError.notFound('Soal tidak ditemukan');

  let fileUrl = existingSoal.fileUrl;
  if (req.file) {
    try {
      const uploadRes = await uploadFileToDrive(req.user.id, req.file);
      fileUrl = uploadRes.webViewLink;
    } catch (error) {
      throw ApiError.internal('Gagal mengunggah file media soal: ' + error.message);
    }
  } else if (hapusFile === 'true') {
    fileUrl = null;
  }

  let parsedPilihan = pilihanJawaban;
  if (typeof pilihanJawaban === 'string') {
    try { parsedPilihan = JSON.parse(pilihanJawaban); } catch(e) { parsedPilihan = [pilihanJawaban]; }
  }

  const updated = await db.bankKuisSoal.update({
    where: { id: parseInt(soalId, 10) },
    data: {
      tipeSoal,
      pertanyaan,
      pilihanJawaban: parsedPilihan || null,
      kunciJawaban: kunciJawaban || null,
      fileUrl,
      bobotSoal: parseFloat(bobotSoal) || 10
    }
  });

  res.json({ message: 'Soal berhasil diperbarui', data: updated });
});

export const deleteBankKuisSoal = asyncHandler(async (req, res) => {
  const { kuisId, soalId } = req.params;

  const kuis = await db.bankKuis.findUnique({ where: { id: parseInt(kuisId, 10) } });
  if (!kuis) throw ApiError.notFound('Bank Kuis tidak ditemukan');
  if (kuis.dosenId !== req.user.dosenId) throw ApiError.forbidden('Tidak memiliki akses');

  await db.bankKuisSoal.delete({ where: { id: parseInt(soalId, 10) } });

  res.json({ message: 'Soal berhasil dihapus' });
});
