import { db } from '../../core/database.js';

export async function getDashboardData(user) {
  // 1. Ambil Tahun Akademik Aktif
  const activeTahun = await db.tahunAkademik.findFirst({
    where: { status: 'AKTIF' },
  });

  if (!activeTahun) {
    return {
      tahunAkademik: null,
      jadwals: [],
      agendas: []
    };
  }

  // 2. Ambil Kalender Akademik (Agenda)
  const agendas = await db.kalenderAkademik.findMany({
    where: { tahunAkademikId: activeTahun.id },
    orderBy: { tanggalMulai: 'asc' }
  });

  // 3. Ambil Jadwal berdasarkan role
  let jadwals = [];
  
  if (['ADMIN', 'ADMIN_AKADEMIK', 'ADMIN_PRODI'].includes(user.role)) {
    // Admin melihat semua jadwal di tahun aktif
    jadwals = await db.jadwal.findMany({
      where: { tahunAkademikId: activeTahun.id },
      include: {
        matakuliah: true,
        kelas: true,
        dosen: true,
        ruangan: true,
      }
    });
  } else if (user.role === 'DOSEN' && user.dosenId) {
    // Dosen melihat jadwal ngajarnya
    jadwals = await db.jadwal.findMany({
      where: { tahunAkademikId: activeTahun.id, dosenId: user.dosenId },
      include: {
        matakuliah: true,
        kelas: true,
        dosen: true,
        ruangan: true,
      }
    });
  } else if (user.role === 'MAHASISWA' && user.mahasiswaId) {
    // Mahasiswa melihat jadwal kelasnya
    const mhs = await db.mahasiswa.findUnique({ where: { id: user.mahasiswaId } });
    if (mhs && mhs.kelasId) {
      jadwals = await db.jadwal.findMany({
        where: { tahunAkademikId: activeTahun.id, kelasId: mhs.kelasId },
        include: {
          matakuliah: true,
          kelas: true,
          dosen: true,
          ruangan: true,
        }
      });
    }
  }

  return {
    tahunAkademik: activeTahun,
    jadwals,
    agendas
  };
}
