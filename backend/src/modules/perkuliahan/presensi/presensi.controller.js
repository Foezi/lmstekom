import { db } from '../../../core/database.js';
import { asyncHandler, ApiError } from '../../../shared/utils/apiError.js';

export const getRekapPresensi = asyncHandler(async (req, res) => {
  const { matakuliahId, tahunAkademikId } = req.query;
  if (!matakuliahId || !tahunAkademikId) {
    throw ApiError.badRequest('matakuliahId dan tahunAkademikId harus disertakan');
  }

  const jadwals = await db.jadwal.findMany({
    where: { 
      matakuliahId: parseInt(matakuliahId, 10),
      tahunAkademikId: parseInt(tahunAkademikId, 10)
    },
    include: {
      kelas: { include: { mahasiswa: { orderBy: { nama: 'asc' } } } },
      mengajar: {
        include: {
          pertemuan: {
            where: { status: { in: ['SELESAI', 'TERLAKSANA'] } },
            include: { presensis: true }
          }
        }
      }
    }
  });

  if (jadwals.length === 0) {
    return res.json({ data: [] });
  }

  let rekap = [];

  jadwals.forEach((jadwal) => {
    const mahasiswas = jadwal.kelas?.mahasiswa || [];
    const pertemuans = jadwal.mengajar?.pertemuan || [];
    const totalPertemuan = pertemuans.length;

    mahasiswas.forEach((m) => {
      let hadirCount = 0;
      
      // Hitung kehadiran
      if (totalPertemuan > 0) {
        pertemuans.forEach((p) => {
          const presensiMahasiswa = p.presensis.find((pr) => pr.mahasiswaId === m.id);
          if (presensiMahasiswa && presensiMahasiswa.status === 'HADIR') {
            hadirCount++;
          }
        });
      }

      const persentase = totalPertemuan === 0 ? 0 : Math.round((hadirCount / totalPertemuan) * 100);

      rekap.push({
        mahasiswaId: m.id,
        nim: m.nim,
        nama: m.nama,
        kelas: jadwal.kelas?.namaKelas,
        hadirCount,
        totalPertemuan,
        persentase
      });
    });
  });

  res.json({ data: rekap });
});

export const getMataKuliahPresensi = asyncHandler(async (req, res) => {
  const { prodiId, tahunKurikulumId, tahunAkademikId } = req.query;

  if (!prodiId || !tahunKurikulumId || !tahunAkademikId) {
    throw ApiError.badRequest('prodiId, tahunKurikulumId, dan tahunAkademikId harus disertakan');
  }

  const jadwals = await db.jadwal.findMany({
    where: {
      tahunAkademikId: parseInt(tahunAkademikId, 10),
      matakuliah: {
        prodiId: parseInt(prodiId, 10),
        tahunKurikulumId: parseInt(tahunKurikulumId, 10)
      }
    },
    include: {
      matakuliah: true
    }
  });

  const uniqueMks = [];
  const map = new Map();

  jadwals.forEach(j => {
    if (j.matakuliah && !map.has(j.matakuliah.id)) {
      map.set(j.matakuliah.id, true);
      uniqueMks.push(j.matakuliah);
    }
  });

  res.json({ data: uniqueMks });
});

export const getPresensiPertemuan = asyncHandler(async (req, res) => {
  const pertemuanId = parseInt(req.params.pertemuanId, 10);
  const pertemuan = await db.pertemuan.findUnique({
    where: { id: pertemuanId },
    include: {
      mengajar: {
        include: {
          kelas: { include: { mahasiswa: { orderBy: { nama: 'asc' } } } }
        }
      },
      presensis: true
    }
  });

  if (!pertemuan) throw ApiError.notFound('Pertemuan tidak ditemukan');

  const mahasiswas = pertemuan.mengajar.kelas?.mahasiswa || [];
  const result = mahasiswas.map(m => {
    const pr = pertemuan.presensis.find(p => p.mahasiswaId === m.id);
    return {
      mahasiswaId: m.id,
      nim: m.nim,
      nama: m.nama,
      status: pr ? pr.status : 'ALPA',
      waktu: pr ? pr.waktu : null
    };
  });

  res.json({ data: result, skemaPresensi: pertemuan.skemaPresensi });
});

export const syncPresensiAsinkronus = asyncHandler(async (req, res) => {
  const pertemuanId = parseInt(req.params.pertemuanId, 10);
  const pertemuan = await db.pertemuan.findUnique({
    where: { id: pertemuanId },
    include: {
      mengajar: {
        include: {
          kelas: { include: { mahasiswa: true } }
        }
      },
      materi: true,
      tugas: true,
      kuis: true
    }
  });

  if (!pertemuan) throw ApiError.notFound('Pertemuan tidak ditemukan');
  if (pertemuan.skemaPresensi !== 'ASINKRONUS') {
    throw ApiError.badRequest('Fitur ini hanya untuk skema presensi ASINKRONUS');
  }

  // Batas waktu: 7 hari setelah tanggal pertemuan
  const deadline = new Date(pertemuan.tanggal);
  deadline.setDate(deadline.getDate() + 7);
  deadline.setHours(23, 59, 59, 999); // Akhir hari ke-7

  const materiIds = pertemuan.materi.map(m => m.id);
  const tugasIds = pertemuan.tugas.map(t => t.id);
  const kuisIds = pertemuan.kuis.map(k => k.id);

  const mahasiswas = pertemuan.mengajar.kelas?.mahasiswa || [];
  
  for (const m of mahasiswas) {
    let hadir = false;
    
    // Cek Materi (MateriAkses)
    if (materiIds.length > 0 && !hadir) {
      const pm = await db.materiAkses.findFirst({
        where: {
          mahasiswaId: m.id,
          materiId: { in: materiIds },
          waktuAkses: { lte: deadline }
        }
      });
      if (pm) hadir = true;
    }

    // Cek Tugas (TugasSubmission)
    if (tugasIds.length > 0 && !hadir) {
      const st = await db.tugasSubmission.findFirst({
        where: {
          mahasiswaId: m.id,
          tugasId: { in: tugasIds },
          waktuSubmit: { lte: deadline }
        }
      });
      if (st) hadir = true;
    }

    // Cek Kuis (KuisAttempt)
    if (kuisIds.length > 0 && !hadir) {
      const sk = await db.kuisAttempt.findFirst({
        where: {
          mahasiswaId: m.id,
          kuisId: { in: kuisIds },
          waktuMulai: { lte: deadline }
        }
      });
      if (sk) hadir = true;
    }

    // Upsert Presensi
    await db.presensi.upsert({
      where: {
        pertemuanId_mahasiswaId: {
          pertemuanId: pertemuan.id,
          mahasiswaId: m.id
        }
      },
      update: {
        status: hadir ? 'HADIR' : 'ALPA',
        waktu: new Date()
      },
      create: {
        pertemuanId: pertemuan.id,
        mahasiswaId: m.id,
        status: hadir ? 'HADIR' : 'ALPA',
        waktu: new Date()
      }
    });
  }

  res.json({ message: 'Sinkronisasi presensi asinkronus berhasil' });
});

export const savePresensiManual = asyncHandler(async (req, res) => {
  const pertemuanId = parseInt(req.params.pertemuanId, 10);
  const { data } = req.body; // Array of { mahasiswaId, status }

  const pertemuan = await db.pertemuan.findUnique({
    where: { id: pertemuanId }
  });

  if (!pertemuan) throw ApiError.notFound('Pertemuan tidak ditemukan');
  if (pertemuan.skemaPresensi !== 'SINKRONUS') {
    throw ApiError.badRequest('Fitur ini hanya untuk skema presensi SINKRONUS');
  }

  // Validasi waktu: harus hari yang sama dengan jadwal pertemuan
  // Kita beri kelonggaran hingga jam 23:59 di hari yang sama
  if (pertemuan.tanggal) {
    const hariH = new Date(pertemuan.tanggal);
    hariH.setHours(0, 0, 0, 0);
    const besok = new Date(hariH);
    besok.setDate(besok.getDate() + 1);

    const sekarang = new Date();
    if (sekarang < hariH || sekarang >= besok) {
      throw ApiError.badRequest('Presensi manual hanya dapat diisi pada hari jadwal perkuliahan.');
    }
  }

  for (const item of data) {
    await db.presensi.upsert({
      where: {
        pertemuanId_mahasiswaId: {
          pertemuanId: pertemuan.id,
          mahasiswaId: item.mahasiswaId
        }
      },
      update: {
        status: item.status,
        waktu: new Date()
      },
      create: {
        pertemuanId: pertemuan.id,
        mahasiswaId: item.mahasiswaId,
        status: item.status,
        waktu: new Date()
      }
    });
  }

  res.json({ message: 'Presensi manual berhasil disimpan' });
});
