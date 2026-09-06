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
