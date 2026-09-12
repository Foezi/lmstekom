import { db } from '../../../core/database.js';
import { asyncHandler, ApiError } from '../../../shared/utils/apiError.js';
import { logActivity } from '../../../shared/utils/activityLog.js';
import { parsePagination, buildMeta } from '../../../shared/utils/pagination.js';

const ip = (req) => req.ip || req.socket?.remoteAddress || null;

/**
 * Controller untuk mengelola Materi Pembelajaran.
 * Modul ini menampilkan Jadwal Kuliah sebagai root, lalu me-lazy-load Mengajar & Pertemuan.
 */

// 1. GET /api/materi -> Menampilkan daftar Jadwal Kuliah aktif
export const listJadwalMateri = asyncHandler(async (req, res) => {
  const { skip, take, page, limit, q } = parsePagination(req.query);
  const { tahunAkademikId, tahunKurikulumId, prodiId } = req.query;

  const where = {};
  if (q) {
    where.matakuliah = { namaMk: { contains: q } };
  }
  if (tahunAkademikId) where.tahunAkademikId = parseInt(tahunAkademikId, 10);
  if (tahunKurikulumId) where.tahunKurikulumId = parseInt(tahunKurikulumId, 10);
  
  // Jika Dosen, hanya tampilkan jadwal yang diajar oleh Dosen tsb
  if (req.user.role === 'DOSEN' && req.user.dosenId) {
    where.dosenId = req.user.dosenId;
  }
  // Jika Admin Prodi, hanya prodinya
  if (req.user.role === 'ADMIN_PRODI') {
    where.kelas = { prodiId: req.user.prodiId };
  }
  if (prodiId) {
    where.kelas = { ...where.kelas, prodiId: parseInt(prodiId, 10) };
  }

  const [rows, total] = await Promise.all([
    db.jadwal.findMany({
      where,
      skip,
      take,
      include: {
        matakuliah: true,
        kelas: { include: { prodi: true } },
        dosen: true,
        tahunAkademik: true,
        tahunKurikulum: true,
        mengajar: { select: { id: true } }
      },
      orderBy: { id: 'desc' }
    }),
    db.jadwal.count({ where })
  ]);

  const data = rows.map((r) => ({
    id: r.id,
    matakuliahId: r.matakuliahId,
    matakuliah: r.matakuliah,
    kodeMk: r.matakuliah?.kodeMk,
    namaMk: r.matakuliah?.namaMk,
    sks: r.matakuliah?.sks,
    kelasNama: r.kelas?.namaKelas,
    prodiNama: r.kelas?.prodi?.namaProdi,
    dosenNama: r.dosen?.nama,
    tahunAkademik: r.tahunAkademik?.nama,
    kurikulum: r.tahunKurikulum?.tahun,
    isInitialized: !!r.mengajar, // Apakah sudah pernah dikelola materinya
    hari: r.hari,
    waktu: `${r.jamMulai} - ${r.jamSelesai}`
  }));

  res.json({ data, meta: buildMeta({ page, limit }, total) });
});

// 2. GET /api/materi/:jadwalId/pertemuan -> Mengambil/membuat Mengajar dan 16 Pertemuan
export const getPertemuanList = asyncHandler(async (req, res) => {
  const jadwalId = parseInt(req.params.jadwalId, 10);
  const jadwal = await db.jadwal.findUnique({
    where: { id: jadwalId },
    include: {
      matakuliah: true,
      kelas: { include: { prodi: true } },
      dosen: true,
      tahunAkademik: true,
      tahunKurikulum: true
    }
  });

  if (!jadwal) throw ApiError.notFound('Jadwal tidak ditemukan');

  // Cek otorisasi
  if (req.user.role === 'DOSEN' && jadwal.dosenId !== req.user.dosenId) {
    throw ApiError.forbidden('Anda tidak berhak mengakses materi untuk jadwal ini');
  }

  let mengajar = await db.mengajar.findUnique({
    where: { jadwalId },
    include: {
      pertemuan: { orderBy: { keBerapa: 'asc' }, include: { materi: true, tugas: true, kuis: true } },
      kuis: { where: { tipeUjian: { in: ['UTS', 'UAS'] } } }
    }
  });

  // Lazy Initialization: Buat Mengajar jika belum ada, TAPI JANGAN buat pertemuan otomatis
  if (!mengajar) {
    mengajar = await db.mengajar.create({
      data: {
        jadwalId: jadwal.id,
        dosenId: jadwal.dosenId,
        matakuliahId: jadwal.matakuliahId,
        kelasId: jadwal.kelasId,
        semester: jadwal.semester,
        tahunAkademikId: jadwal.tahunAkademikId,
        totalPertemuan: 0 // di set 0 dulu sampai digenerate
      },
      include: {
        pertemuan: { orderBy: { keBerapa: 'asc' }, include: { materi: true, tugas: true, kuis: true } },
        kuis: { where: { tipeUjian: { in: ['UTS', 'UAS'] } } }
      }
    });
  }

  res.json({
    data: {
      jadwal: {
        id: jadwal.id,
        prodiNama: jadwal.kelas?.prodi?.namaProdi,
        kodeMk: jadwal.matakuliah?.kodeMk,
        namaMk: jadwal.matakuliah?.namaMk,
        sks: jadwal.matakuliah?.sks,
        kurikulum: jadwal.tahunKurikulum?.tahun,
        tahunAkademik: jadwal.tahunAkademik?.nama,
        kelasNama: jadwal.kelas?.namaKelas,
        dosenNama: jadwal.dosen?.nama
      },
      isPengampu: req.user.role === 'DOSEN' && jadwal.dosenId === req.user.dosenId,
      mengajarId: mengajar.id,
      matakuliahId: jadwal.matakuliahId,
      deskripsiMk: mengajar.deskripsiMk,
      pertemuan: mengajar.pertemuan || [],
      ujianList: mengajar.kuis || []
    }
  });
});

export const updateDeskripsi = asyncHandler(async (req, res) => {
  const jadwalId = parseInt(req.params.jadwalId, 10);
  const { deskripsiMk } = req.body;

  const mengajar = await db.mengajar.update({
    where: { jadwalId },
    data: { deskripsiMk }
  });

  await logActivity({ userId: req.user.id, aktivitas: `UPDATE_DESKRIPSI_MK Jadwal ${jadwalId}`, modul: 'MATERI', ipAddress: ip(req) });

  res.json({ data: mengajar });
});

export const generatePertemuan = asyncHandler(async (req, res) => {
  const jadwalId = parseInt(req.params.jadwalId, 10);
  const { jumlahPertemuan } = req.body;

  if (!jumlahPertemuan || jumlahPertemuan <= 0) {
    throw ApiError.badRequest('Jumlah pertemuan harus lebih dari 0');
  }

  const jadwal = await db.jadwal.findUnique({ 
    where: { id: jadwalId },
    include: { ruangan: true }
  });
  if (!jadwal) throw ApiError.notFound('Jadwal tidak ditemukan');

  const mengajar = await db.mengajar.findUnique({ where: { jadwalId } });
  if (!mengajar) throw ApiError.notFound('Data mengajar belum diinisialisasi');

  // Cek apakah pertemuan sudah ada
  const count = await db.pertemuan.count({ where: { mengajarId: mengajar.id } });
  if (count > 0) throw ApiError.badRequest('Pertemuan sudah pernah di-generate');

  // Cari patokan Awal Kuliah dari Kalender Akademik
  const kalender = await db.kalenderAkademik.findFirst({
    where: {
      tahunAkademikId: jadwal.tahunAkademikId,
      jenisKegiatan: 'AWAL_KULIAH'
    }
  });

  let baseDate = kalender ? new Date(kalender.tanggalMulai) : new Date();
  
  // Cari hari pertama perkuliahan berdasarkan hari jadwal (Misal: 'Senin')
  const hariIndo = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const targetDay = hariIndo.findIndex(h => h.toLowerCase() === jadwal.hari.toLowerCase());
  
  if (targetDay !== -1) {
    const currentDay = baseDate.getDay();
    let distance = targetDay - currentDay;
    if (distance < 0) distance += 7;
    baseDate.setDate(baseDate.getDate() + distance);
  }

  await db.$transaction(async (tx) => {
    // Update totalPertemuan di tabel mengajar
    await tx.mengajar.update({
      where: { id: mengajar.id },
      data: { totalPertemuan: jumlahPertemuan }
    });

    const pertemuanData = Array.from({ length: jumlahPertemuan }).map((_, i) => {
      let jenis = 'Kuliah';
      if (jumlahPertemuan >= 14) {
        if (i === Math.floor(jumlahPertemuan / 2) - 1) jenis = 'UTS';
        if (i === jumlahPertemuan - 1) jenis = 'UAS';
      }
      
      const tanggalSesi = new Date(baseDate.getTime());
      tanggalSesi.setDate(tanggalSesi.getDate() + (i * 7));
      
      return {
        mengajarId: mengajar.id,
        keBerapa: i + 1,
        tanggal: tanggalSesi,
        waktuMulai: jadwal.jamMulai,
        waktuSelesai: jadwal.jamSelesai,
        ruangKuliah: jadwal.ruangan?.namaRuangan || String(jadwal.ruanganId), // fallback
        jenisPertemuan: jenis
      };
    });

    await tx.pertemuan.createMany({ data: pertemuanData });
  });

  const updatedMengajar = await db.mengajar.findUnique({
    where: { id: mengajar.id },
    include: { pertemuan: { orderBy: { keBerapa: 'asc' }, include: { materi: true, tugas: true, kuis: true } } }
  });

  await logActivity({ userId: req.user.id, aktivitas: `GENERATE_PERTEMUAN Jadwal ${jadwalId} (${jumlahPertemuan} Sesi)`, modul: 'MATERI', ipAddress: ip(req) });

  res.json({ data: updatedMengajar.pertemuan });
});

export const syncPertemuanAPI = asyncHandler(async (req, res) => {
  const jadwalId = parseInt(req.params.jadwalId, 10);
  
  const jadwal = await db.jadwal.findUnique({ 
    where: { id: jadwalId },
    include: { ruangan: true, matakuliah: true }
  });
  if (!jadwal) throw ApiError.notFound('Jadwal tidak ditemukan');

  const mengajar = await db.mengajar.findUnique({ where: { jadwalId } });
  if (!mengajar) throw ApiError.notFound('Data mengajar belum diinisialisasi');

  // Cek apakah pertemuan sudah ada
  const count = await db.pertemuan.count({ where: { mengajarId: mengajar.id } });
  if (count > 0) throw ApiError.badRequest('Pertemuan sudah pernah di-generate. Hapus sesi lama terlebih dahulu untuk sync ulang.');

  // Ambil URL dari .env
  const apiUrl = process.env.EXTERNAL_SYLLABUS_API || 'https://api.example.com/v1/silabus';
  const kodeMk = jadwal.matakuliah?.kodeMk || 'UNKNOWN';

  let silabusData = null;
  try {
    // Simulasi pemanggilan API Eksternal
    // const response = await fetch(`${apiUrl}/${kodeMk}`);
    // silabusData = await response.json();
    throw new Error('Simulasi API'); // Memaksa catch untuk MOCK DATA DEMO
  } catch (err) {
    // MOCK DATA DEMO karena API aslinya belum ada
    silabusData = {
      deskripsi: `(HASIL SYNC EXTERNAL API: ${apiUrl})\nMata kuliah ini membahas secara komprehensif tentang ${jadwal.matakuliah?.namaMk} berbasis standar industri terkini.`,
      jumlahPertemuan: 16,
      rencana: Array.from({ length: 16 }).map((_, i) => ({
        pertemuanKe: i + 1,
        materi: `Materi Sesi ${i + 1}: Konsep dan Praktikum Terpadu ${jadwal.matakuliah?.namaMk} bagian ${i + 1}`
      }))
    };
    if (silabusData.rencana.length >= 8) silabusData.rencana[7].materi = 'Ujian Tengah Semester (UTS)';
    if (silabusData.rencana.length >= 16) silabusData.rencana[15].materi = 'Ujian Akhir Semester (UAS)';
  }

  // Cari patokan Awal Kuliah dari Kalender Akademik
  const kalender = await db.kalenderAkademik.findFirst({
    where: { tahunAkademikId: jadwal.tahunAkademikId, jenisKegiatan: 'AWAL_KULIAH' }
  });
  let baseDate = kalender ? new Date(kalender.tanggalMulai) : new Date();
  
  const hariIndo = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const targetDay = hariIndo.findIndex(h => h.toLowerCase() === jadwal.hari.toLowerCase());
  
  if (targetDay !== -1) {
    const currentDay = baseDate.getDay();
    let distance = targetDay - currentDay;
    if (distance < 0) distance += 7;
    baseDate.setDate(baseDate.getDate() + distance);
  }

  await db.$transaction(async (tx) => {
    // 1. Update deskripsiMk & totalPertemuan
    await tx.mengajar.update({
      where: { id: mengajar.id },
      data: { 
        deskripsiMk: silabusData.deskripsi,
        totalPertemuan: silabusData.jumlahPertemuan 
      }
    });

    // 2. Buat pertemuan dengan rencanaMateri dari API
    const pertemuanData = silabusData.rencana.map((plan, i) => {
      let jenis = 'Kuliah';
      if (plan.materi.includes('UTS')) jenis = 'UTS';
      if (plan.materi.includes('UAS')) jenis = 'UAS';
      
      const tanggalSesi = new Date(baseDate.getTime());
      tanggalSesi.setDate(tanggalSesi.getDate() + (i * 7));
      
      return {
        mengajarId: mengajar.id,
        keBerapa: plan.pertemuanKe,
        tanggal: tanggalSesi,
        waktuMulai: jadwal.jamMulai,
        waktuSelesai: jadwal.jamSelesai,
        ruangKuliah: jadwal.ruangan?.namaRuangan || String(jadwal.ruanganId),
        jenisPertemuan: jenis,
        rencanaMateri: plan.materi
      };
    });

    await tx.pertemuan.createMany({ data: pertemuanData });
  });

  const updatedMengajar = await db.mengajar.findUnique({
    where: { id: mengajar.id },
    include: { pertemuan: { orderBy: { keBerapa: 'asc' }, include: { materi: true, tugas: true, kuis: true } } }
  });

  await logActivity({ userId: req.user.id, aktivitas: `SYNC_PERTEMUAN Jadwal ${jadwalId}`, modul: 'MATERI', ipAddress: ip(req) });

  res.json({ data: updatedMengajar.pertemuan });
});

// 3. PUT /api/materi/pertemuan/:pertemuanId -> Update rincian pertemuan
export const updatePertemuan = asyncHandler(async (req, res) => {
  const pertemuanId = parseInt(req.params.pertemuanId, 10);
  const data = req.body;

  const pertemuan = await db.pertemuan.findUnique({
    where: { id: pertemuanId },
    include: { mengajar: true }
  });

  if (!pertemuan) throw ApiError.notFound('Pertemuan tidak ditemukan');
  if (req.user.role === 'DOSEN' && pertemuan.mengajar.dosenId !== req.user.dosenId) {
    throw ApiError.forbidden('Anda tidak berhak mengubah pertemuan ini');
  }

  if (data.status === 'MULAI') {
    if (!pertemuan.tanggal || !pertemuan.waktuMulai) {
       throw ApiError.badRequest('Tanggal dan waktu mulai sesi belum diatur');
    }
    
    // Buat objek tanggal berdasarkan pertemuan.tanggal (biasanya set ke 00:00 UTC)
    const scheduledStart = new Date(pertemuan.tanggal);
    const [jam, menit] = pertemuan.waktuMulai.split(':');
    // Asumsi timezone server lokal
    scheduledStart.setHours(parseInt(jam, 10), parseInt(menit, 10), 0, 0);
    
    // Berikan toleransi 15 menit lebih awal
    scheduledStart.setMinutes(scheduledStart.getMinutes() - 15);

    if (new Date() < scheduledStart) {
       throw ApiError.badRequest('Belum waktunya untuk memulai kelas ini. Kelas dapat dimulai paling cepat 15 menit sebelum jadwal.');
    }
  }

  const updateData = {};
  if (data.tanggal !== undefined) updateData.tanggal = data.tanggal ? new Date(data.tanggal) : null;
  if (data.waktuMulai !== undefined) updateData.waktuMulai = data.waktuMulai;
  if (data.waktuSelesai !== undefined) updateData.waktuSelesai = data.waktuSelesai;
  if (data.jenisPertemuan !== undefined) updateData.jenisPertemuan = data.jenisPertemuan;
  if (data.metodePembelajaran !== undefined) updateData.metodePembelajaran = data.metodePembelajaran;
  if (data.ruangKuliah !== undefined) updateData.ruangKuliah = data.ruangKuliah;
  if (data.keteranganRuang !== undefined) updateData.keteranganRuang = data.keteranganRuang;
  if (data.urlKuliahOnline !== undefined) updateData.urlKuliahOnline = data.urlKuliahOnline;
  if (data.rencanaMateri !== undefined) updateData.rencanaMateri = data.rencanaMateri;
  if (data.realisasiMateri !== undefined) updateData.realisasiMateri = data.realisasiMateri;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.skemaPresensi !== undefined) updateData.skemaPresensi = data.skemaPresensi;

  const updated = await db.pertemuan.update({
    where: { id: pertemuanId },
    data: updateData
  });

  await logActivity({
    userId: req.user.id,
    aktivitas: `UPDATE PERTEMUAN Sesi ${pertemuan.keBerapa} Mengajar ${pertemuan.mengajarId}`,
    modul: 'PERTEMUAN',
    ipAddress: ip(req)
  });

  res.json({ data: updated });
});

export const addMateri = asyncHandler(async (req, res) => {
  const { pertemuanId } = req.params;
  const { judul, deskripsi, jenis, urlAtauLink } = req.body;

  const pertemuan = await db.pertemuan.findUnique({
    where: { id: parseInt(pertemuanId, 10) },
    include: { kuis: true }
  });

  if (!pertemuan) throw ApiError.notFound('Pertemuan tidak ditemukan');
  if (pertemuan.kuis && pertemuan.kuis.some(k => k.tipeUjian === 'UTS' || k.tipeUjian === 'UAS')) {
    throw ApiError.badRequest('Sesi ini dikhususkan untuk Ujian. Tidak dapat menambahkan materi.');
  }

  let gdriveFileId = null;
  let finalUrl = urlAtauLink;

  if (jenis === 'DOKUMEN' && req.file) {
    const { uploadFileToDrive } = await import('../../drive/drive.service.js');
    const uploadResult = await uploadFileToDrive(req.user.id, req.file);
    gdriveFileId = uploadResult.fileId;
    finalUrl = uploadResult.webViewLink;
  }

  const materi = await db.materi.create({
    data: {
      pertemuanId: parseInt(pertemuanId, 10),
      judul,
      deskripsi,
      jenis,
      urlAtauLink: finalUrl,
      gdriveFileId,
      gdriveOwnerUserId: gdriveFileId ? req.user.id : null
    }
  });

  await logActivity({
    userId: req.user.id,
    aktivitas: `TAMBAH MATERI ${jenis} - ${judul}`,
    modul: 'MATERI',
    ipAddress: ip(req)
  });

  res.status(201).json({ data: materi });
});

export const deleteMateri = asyncHandler(async (req, res) => {
  const { materiId } = req.params;

  const materi = await db.materi.findUnique({
    where: { id: parseInt(materiId, 10) }
  });

  if (!materi) throw ApiError.notFound('Materi tidak ditemukan');

  if (materi.gdriveFileId) {
    try {
      const { deleteFileFromDrive } = await import('../../drive/drive.service.js');
      await deleteFileFromDrive(materi.gdriveOwnerUserId || req.user.id, materi.gdriveFileId);
    } catch (err) {
      console.error('Gagal hapus di GDrive:', err);
    }
  }

  await db.materi.delete({ where: { id: parseInt(materiId, 10) } });

  await logActivity({
    userId: req.user.id,
    aktivitas: `HAPUS MATERI ${materi.judul}`,
    modul: 'MATERI',
    ipAddress: ip(req)
  });

  res.json({ message: 'Materi berhasil dihapus' });
});

export const addTugas = asyncHandler(async (req, res) => {
  const pertemuanId = parseInt(req.params.pertemuanId, 10);
  const { bankTugasId, tanggalBuka, waktuMulai, tanggalTutup, waktuSelesai } = req.body;

  const pertemuan = await db.pertemuan.findUnique({
    where: { id: parseInt(pertemuanId, 10) },
    include: { kuis: true }
  });
  if (!pertemuan) throw ApiError.notFound('Pertemuan tidak ditemukan');
  if (pertemuan.kuis && pertemuan.kuis.some(k => k.tipeUjian === 'UTS' || k.tipeUjian === 'UAS')) {
    throw ApiError.badRequest('Sesi ini dikhususkan untuk Ujian. Tidak dapat menambahkan tugas.');
  }

  const bankTugas = await db.bankTugas.findUnique({ where: { id: parseInt(bankTugasId, 10) } });
  if (!bankTugas) throw ApiError.notFound('Bank Tugas tidak ditemukan');

  const tugas = await db.tugas.create({
    data: {
      pertemuanId,
      bankTugasId: bankTugas.id,
      judul: bankTugas.judul,
      kategori: bankTugas.kategori,
      deskripsi: req.body.deskripsi !== undefined ? req.body.deskripsi : bankTugas.deskripsi,
      tanggalBuka: new Date(`${tanggalBuka}T${waktuMulai}:00`),
      tanggalTutup: new Date(`${tanggalTutup}T${waktuSelesai}:00`)
    }
  });

  res.status(201).json({
    message: 'Tugas berhasil ditambahkan dari Bank',
    data: tugas
  });
});

export const addKuis = asyncHandler(async (req, res) => {
  const pertemuanId = parseInt(req.params.pertemuanId, 10);
  const { bankKuisId, waktuMulai, waktuSelesai, durasiMenit } = req.body;

  const pertemuan = await db.pertemuan.findUnique({
    where: { id: parseInt(pertemuanId, 10) },
    include: { 
      kuis: true, 
      materi: true, 
      tugas: true, 
      mengajar: { include: { pertemuan: { include: { kuis: true } } } } 
    }
  });
  if (!pertemuan) throw ApiError.notFound('Pertemuan tidak ditemukan');

  const bankKuis = await db.bankKuis.findUnique({ where: { id: parseInt(bankKuisId, 10) } });
  if (!bankKuis) throw ApiError.notFound('Bank Kuis tidak ditemukan');

  if (bankKuis.tipeUjian === 'UTS' || bankKuis.tipeUjian === 'UAS') {
    const hasPerkuliahan = (pertemuan.materi && pertemuan.materi.length > 0) || 
                           (pertemuan.tugas && pertemuan.tugas.length > 0) || 
                           (pertemuan.kuis && pertemuan.kuis.some(k => k.tipeUjian === 'KUIS'));
    if (hasPerkuliahan) throw ApiError.badRequest('Sesi ini sudah berisi materi perkuliahan. Ujian harus diletakkan pada sesi khusus.');
    
    const hasGlobalUjian = pertemuan.mengajar.pertemuan.some(p => p.kuis.some(k => k.tipeUjian === bankKuis.tipeUjian));
    if (hasGlobalUjian) throw ApiError.badRequest(`Sesi ${bankKuis.tipeUjian} sudah dijadwalkan pada sesi lain di mata kuliah ini.`);
  } else {
    if (pertemuan.kuis && pertemuan.kuis.some(k => k.tipeUjian === 'UTS' || k.tipeUjian === 'UAS')) {
      throw ApiError.badRequest('Sesi ini dikhususkan untuk Ujian. Tidak dapat menambahkan kuis reguler.');
    }
  }

  const kuis = await db.kuis.create({
    data: {
      pertemuanId,
      bankKuisId: bankKuis.id,
      judul: bankKuis.judul,
      jenis: bankKuis.jenis,
      tipeUjian: bankKuis.tipeUjian,
      deskripsi: req.body.deskripsi !== undefined ? req.body.deskripsi : bankKuis.deskripsi,
      bobotNilai: bankKuis.bobotNilai,
      modeLockdown: bankKuis.modeLockdown,
      waktuMulai: new Date(waktuMulai),
      waktuSelesai: new Date(waktuSelesai),
      durasiMenit: parseInt(durasiMenit, 10)
    }
  });

  res.status(201).json({
    message: 'Kuis berhasil ditambahkan dari Bank',
    data: kuis
  });
});

export const removeTugas = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const tugas = await db.tugas.findUnique({ where: { id: parseInt(id, 10) } });
  if (!tugas) throw ApiError.notFound('Tugas tidak ditemukan');
  await db.tugas.delete({ where: { id: tugas.id } });
  res.json({ message: 'Tugas berhasil dihapus dari pertemuan' });
});

export const removeKuis = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const kuis = await db.kuis.findUnique({ where: { id: parseInt(id, 10) } });
  if (!kuis) throw ApiError.notFound('Kuis tidak ditemukan');
  await db.kuis.delete({ where: { id: kuis.id } });
  res.json({ message: 'Kuis berhasil dihapus dari pertemuan' });
});

export const getTugasSubmissions = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const submissions = await db.tugasSubmission.findMany({
    where: { tugasId: parseInt(id, 10) },
    include: {
      mahasiswa: {
        select: { id: true, nim: true, nama: true }
      }
    }
  });
  res.json({ data: submissions });
});
export const updateNilaiTugas = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { nilai, catatanDosen } = req.body;

  const submission = await db.tugasSubmission.update({
    where: { id: parseInt(id, 10) },
    data: {
      nilai: nilai !== undefined && nilai !== '' ? parseFloat(nilai) : null,
      catatanDosen: catatanDosen || null
    },
    include: {
      mahasiswa: { select: { id: true, nim: true, nama: true } }
    }
  });

  res.json({ message: 'Nilai berhasil disimpan', data: submission });
});


export const getMateriAkses = asyncHandler(async (req, res, next) => {
  try {
    const { materiId } = req.params;
    const aksesList = await db.materiAkses.findMany({
      where: { materiId: parseInt(materiId) },
      include: { mahasiswa: { select: { nim: true, nama: true } } },
      orderBy: { waktuAkses: 'desc' }
    });
    res.json({ data: aksesList });
  } catch (error) {
    next(error);
  }
});

export const recordMateriAkses = asyncHandler(async (req, res, next) => {
  try {
    const { materiId } = req.params;
    const mahasiswaId = req.user.mahasiswaId;
    if (!mahasiswaId) return res.status(403).json({ error: 'Bukan mahasiswa' });

    const record = await db.materiAkses.upsert({
      where: {
        materiId_mahasiswaId: { materiId: parseInt(materiId), mahasiswaId: parseInt(mahasiswaId) }
      },
      update: { waktuAkses: new Date() },
      create: {
        materiId: parseInt(materiId),
        mahasiswaId: parseInt(mahasiswaId)
      }
    });
    res.json({ data: record });
  } catch (error) {
    next(error);
  }
});

export const getKuisSubmissions = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const submissions = await db.kuisJawaban.findMany({
    where: { kuisId: parseInt(id, 10) },
    include: {
      mahasiswa: {
        select: { id: true, nim: true, nama: true }
      }
    }
  });
  // Mengelompokkan berdasarkan mahasiswaId untuk melihat nilai kuis
  const grouped = [];
  submissions.forEach(sub => {
    if (!grouped.find(g => g.mahasiswaId === sub.mahasiswaId)) {
      grouped.push({
        mahasiswaId: sub.mahasiswaId,
        mahasiswa: sub.mahasiswa,
        totalNilai: sub.nilai // Jika satu jawaban memiliki nilai? Tapi KuisJawaban adalah per soal? Wait. Schema has KuisJawaban, and KuisResult?
      });
    }
  });
  res.json({ data: grouped.length > 0 ? grouped : submissions });
});
