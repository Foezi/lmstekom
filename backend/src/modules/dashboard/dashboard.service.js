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

  let jadwals = [];
  let recentLogs = [];
  let tasks = [];
  
  const isAdmin = ['ADMIN', 'ADMIN_AKADEMIK', 'ADMIN_PRODI'].includes(user.role);

  if (isAdmin) {
    // Admin melihat semua jadwal di tahun aktif
    jadwals = await db.jadwal.findMany({
      where: { tahunAkademikId: activeTahun.id },
      include: {
        matakuliah: true,
        kelas: true,
        dosen: true,
        ruangan: true,
        mengajar: {
          include: {
            pertemuan: {
              where: { status: { in: ['BELUM', 'MULAI'] } },
              orderBy: { keBerapa: 'asc' },
              take: 1
            }
          }
        }
      }
    });

    // Admin juga melihat log aktivitas terkini
    recentLogs = await db.activityLog.findMany({
      take: 5,
      orderBy: { waktu: 'desc' },
      include: {
        user: {
          select: { nickname: true, username: true }
        }
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
        mengajar: {
          include: {
            pertemuan: {
              where: { status: { in: ['BELUM', 'MULAI'] } },
              orderBy: { keBerapa: 'asc' },
              take: 1
            }
          }
        }
      }
    });

    // Hitung tugas yang belum dinilai (TugasSubmission nilai == null)
    const ungradedSubmissions = await db.tugasSubmission.count({
      where: {
        nilai: null,
        tugas: {
          pertemuan: {
            mengajar: {
              jadwal: {
                dosenId: user.dosenId,
                tahunAkademikId: activeTahun.id
              }
            }
          }
        }
      }
    });

    if (ungradedSubmissions > 0) {
      tasks.push({
        id: 'ungraded-tugas',
        type: 'GRADING_TUGAS',
        title: 'Penilaian Tugas Mahasiswa',
        description: `Ada ${ungradedSubmissions} pengumpulan tugas yang menunggu untuk Anda nilai.`,
        count: ungradedSubmissions,
        link: '/',
        icon: 'clipboard-list'
      });
    }

    // Hitung sesi hari ini yang belum dimulai
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    
    const todaysClasses = await db.pertemuan.count({
      where: {
        status: 'BELUM',
        tanggal: { gte: startOfDay, lte: endOfDay },
        mengajar: {
          jadwal: {
            dosenId: user.dosenId,
            tahunAkademikId: activeTahun.id
          }
        }
      }
    });

    if (todaysClasses > 0) {
      tasks.push({
        id: 'start-class',
        type: 'MULAI_KELAS',
        title: 'Mulai Kelas Hari Ini',
        description: `Ada ${todaysClasses} sesi perkuliahan hari ini yang belum Anda mulai.`,
        count: todaysClasses,
        link: '/',
        icon: 'play-circle'
      });
    }
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
          mengajar: {
            include: {
              pertemuan: {
                where: { status: { in: ['BELUM', 'MULAI'] } },
                orderBy: { keBerapa: 'asc' },
                take: 1
              }
            }
          }
        }
      });
    }
  }

  return {
    tahunAkademik: activeTahun,
    jadwals,
    agendas,
    recentLogs,
    tasks
  };
}
