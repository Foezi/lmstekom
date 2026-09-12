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
  },

  async getRekapPenilaianDosen({ dosenId, matakuliahId, tahunAkademikId }) {
    const mengajars = await db.mengajar.findMany({
      where: {
        dosenId: Number(dosenId),
        matakuliahId: Number(matakuliahId),
        tahunAkademikId: Number(tahunAkademikId)
      },
      include: {
        kelas: {
          include: {
            mahasiswa: { orderBy: { nama: 'asc' } }
          }
        },
        pertemuan: {
          where: { status: { in: ['SELESAI', 'TERLAKSANA'] } },
          include: {
            presensis: true,
            tugas: { include: { submissions: true } },
            kuis: { include: { attempts: true } } // KUIS, UTS, UAS are here
          },
          orderBy: { keBerapa: 'asc' }
        }
      }
    });

    if (!mengajars || mengajars.length === 0) return [];

    let rekap = [];

    for (const mengajar of mengajars) {
      const mahasiswas = mengajar.kelas?.mahasiswa || [];
      const pertemuans = mengajar.pertemuan || [];
      const totalPertemuan = pertemuans.length;

      const mhsRekap = mahasiswas.map(m => {
        let hadirCount = 0;
        let totalTugasKuisScore = 0;
        let countTugasKuis = 0;

        let uts = 0;
        let uas = 0;

        // Hitung kehadiran dan kumpulkan nilai tugas & kuis & ujian
        pertemuans.forEach(p => {
          const presensi = p.presensis.find(pr => pr.mahasiswaId === m.id);
          if (presensi && presensi.status === 'HADIR') hadirCount++;

          p.tugas.forEach(t => {
            const sub = t.submissions.find(s => s.mahasiswaId === m.id);
            totalTugasKuisScore += (sub?.nilai ?? 0);
            countTugasKuis++;
          });
          p.kuis.forEach(k => {
            const att = k.attempts.find(a => a.mahasiswaId === m.id);
            if (k.tipeUjian === 'UTS') {
              uts = att?.totalNilai ?? 0;
            } else if (k.tipeUjian === 'UAS') {
              uas = att?.totalNilai ?? 0;
            } else {
              totalTugasKuisScore += (att?.totalNilai ?? 0);
              countTugasKuis++;
            }
          });
        });

        const kehadiran = (hadirCount / Math.max(totalPertemuan, 1)) * 100;
        const tugas = countTugasKuis > 0 ? (totalTugasKuisScore / countTugasKuis) : 0;

        const nilaiAkhir = (kehadiran * 0.10) + (tugas * 0.20) + (uts * 0.30) + (uas * 0.40);

        return {
          id: m.id,
          nim: m.nim,
          nama: m.nama,
          kelas: mengajar.kelas.namaKelas,
          kehadiran: Number(kehadiran.toFixed(1)),
          tugas: Number(tugas.toFixed(1)),
          uts: Number(uts.toFixed(1)),
          uas: Number(uas.toFixed(1)),
          nilaiAkhir: Number(nilaiAkhir.toFixed(1))
        };
      });

      rekap.push({
        mengajarId: mengajar.id,
        kelas: mengajar.kelas.namaKelas,
        mahasiswaList: mhsRekap
      });
    }

    return rekap;
  }
};
