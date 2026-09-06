import { db } from '../../../core/database.js';

export const nilaiService = {
  /**
   * Mengambil rekap nilai untuk admin.
   * Parameter:
   * - prodiId (opsional)
   * - tahunAkademikId (opsional)
   * - kelasId (opsional)
   * - matakuliahId (opsional)
   * - q (NIM atau Nama mahasiswa, opsional)
   */
  async getRekapNilaiAdmin({ prodiId, tahunAkademikId, kelasId, matakuliahId, q, page = 1, limit = 20 }) {
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    // Kriteria pencarian mahasiswa
    const mhsWhere = {};
    if (prodiId) {
      mhsWhere.prodiId = Number(prodiId);
    }
    if (q) {
      mhsWhere.OR = [
        { nim: { contains: q } },
        { nama: { contains: q } }
      ];
    }

    // Kriteria filter mengajar (kelas/matakuliah)
    const mengajarWhere = {};
    if (tahunAkademikId) {
      mengajarWhere.tahunAkademikId = Number(tahunAkademikId);
    }
    if (kelasId) {
      mengajarWhere.kelasId = Number(kelasId);
    }
    if (matakuliahId) {
      mengajarWhere.matakuliahId = Number(matakuliahId);
    }

    // Ambil data mahasiswa yang cocok
    const mahasiswaList = await db.mahasiswa.findMany({
      where: mhsWhere,
      skip,
      take,
      include: {
        prodi: true,
        kelas: {
          include: {
            mengajars: {
              where: Object.keys(mengajarWhere).length > 0 ? mengajarWhere : undefined,
              include: {
                matakuliah: true,
                dosen: true,
                nilaiAkhir: true,
                pertemuan: {
                  where: { status: { in: ['SELESAI', 'TERLAKSANA'] } },
                  include: { presensis: true }
                }
              }
            }
          }
        }
      },
      orderBy: [
        { nim: 'asc' }
      ]
    });

    const totalMahasiswa = await db.mahasiswa.count({ where: mhsWhere });

    // Transformasi data menjadi flat array per mata kuliah
    const rows = [];
    for (const mhs of mahasiswaList) {
      if (!mhs.kelas) continue;
      
      const mengajars = mhs.kelas.mengajars || [];
      for (const mengajar of mengajars) {
        // Cari nilaiAkhir spesifik untuk mahasiswa ini di kelas ini
        const nilaiMhs = mengajar.nilaiAkhir.find(n => n.mahasiswaId === mhs.id);

        const pertemuans = mengajar.pertemuan || [];
        const totalPertemuan = pertemuans.length;
        let hadirCount = 0;
        
        if (totalPertemuan > 0) {
          pertemuans.forEach(p => {
            const presensiMhs = p.presensis.find(pr => pr.mahasiswaId === mhs.id);
            if (presensiMhs && presensiMhs.status === 'HADIR') {
              hadirCount++;
            }
          });
        }
        const kehadiran = totalPertemuan === 0 ? 0 : Math.round((hadirCount / totalPertemuan) * 100);

        rows.push({
          id: `${mhs.id}-${mengajar.id}`, // unik untuk frontend key
          mahasiswaId: mhs.id,
          nim: mhs.nim,
          nama: mhs.nama,
          prodiNama: mhs.prodi?.namaProdi || '-',
          kelasNama: mhs.kelas.namaKelas,
          semester: mengajar.semester,
          kodeMk: mengajar.matakuliah?.kodeMk || '-',
          namaMk: mengajar.matakuliah?.namaMk || '-',
          sks: mengajar.matakuliah?.sks || 0,
          dosenNama: mengajar.dosen?.nama || '-',
          bobotKehadiran: mengajar.bobotKehadiran || 10,
          bobotTugas: mengajar.bobotTugas || 20,
          bobotUts: mengajar.bobotUts || 30,
          bobotUas: mengajar.bobotUas || 40,
          kehadiran,
          nilaiTugas: nilaiMhs?.nilaiTugas ?? null,
          nilaiUts: nilaiMhs?.nilaiUts ?? null,
          nilaiUas: nilaiMhs?.nilaiUas ?? null,
          nilaiAkhir: nilaiMhs?.nilaiAkhir ?? null
        });
      }
    }

    return {
      rows,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total: totalMahasiswa,
        totalPages: Math.ceil(totalMahasiswa / Number(limit))
      }
    };
  }
};
