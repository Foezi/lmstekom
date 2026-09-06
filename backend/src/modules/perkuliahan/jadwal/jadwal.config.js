import { z } from 'zod';
import { ApiError } from '../../../shared/utils/apiError.js';
import { ADMIN_TRIO, ADMIN_DUO, hashDefault, exp, mergeCaches } from '../../../shared/crud/crud.utils.js';

const jadwalSchema = z.object({
  matakuliahId: z.coerce.number().int().positive(),
  kelasId: z.coerce.number().int().positive(),
  dosenId: z.coerce.number().int().positive(),
  ruanganId: z.coerce.number().int().positive().nullish(),
  metode: z.enum(['OFFLINE', 'ONLINE', 'HYBRID']).default('OFFLINE'),
  hari: z.enum(['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']),
  jamMulai: z.string().min(4).max(5),
  jamSelesai: z.string().min(4).max(5),
  tahunAkademikId: z.coerce.number().int().positive(),
  tahunKurikulumId: z.coerce.number().int().positive().nullish(),
  semester: z.coerce.number().int().positive().default(1),
});

export const jadwalConfig = {
  model: 'jadwal',
  schema: jadwalSchema,
  searchFields: ['hari', 'matakuliah.namaMk', 'dosen.nama', 'kelas.namaKelas', 'ruangan.namaRuangan'],
  filters: [
    { name: 'tahunAkademikId', field: 'tahunAkademikId', parse: (v) => (v ? parseInt(v, 10) : undefined) }
  ],
  include: {
    matakuliah: { select: { id: true, kodeMk: true, namaMk: true, prodiId: true, tahunKurikulumId: true } },
    kelas: { select: { id: true, namaKelas: true, prodiId: true, tahunKurikulumId: true } },
    dosen: { select: { id: true, nama: true } },
    ruangan: { select: { id: true, namaRuangan: true } },
    tahunAkademik: { select: { id: true, kode: true, nama: true } },
    tahunKurikulum: { select: { id: true, tahun: true } }
  },
  toDto: (k) => ({
    id: k.id,
    prodiId: k.matakuliah?.prodiId || k.kelas?.prodiId,
    matakuliahId: k.matakuliahId,
    matakuliahNama: `${k.matakuliah?.kodeMk} - ${k.matakuliah?.namaMk}`,
    kelasId: k.kelasId,
    kelasNama: k.kelas?.namaKelas,
    dosenId: k.dosenId,
    dosenNama: k.dosen?.nama,
    ruanganId: k.ruanganId,
    ruanganNama: k.ruangan?.namaRuangan,
    metode: k.metode,
    hari: k.hari,
    jamMulai: k.jamMulai,
    jamSelesai: k.jamSelesai,
    waktu: `${k.jamMulai} - ${k.jamSelesai}`,
    tahunAkademikId: k.tahunAkademikId,
    tahunAkademikNama: k.tahunAkademik?.nama,
    tahunKurikulumId: k.tahunKurikulumId || k.matakuliah?.tahunKurikulumId || k.kelas?.tahunKurikulumId,
    tahunKurikulumTahun: k.tahunKurikulum?.tahun,
    semester: k.semester
  }),
  rowLabel: (k) => `Jadwal ${k.hari} (${k.jamMulai} - ${k.jamSelesai})`,
  exportColumns: [exp('hari', 'hari')],
  rbac: {
    list: [...ADMIN_TRIO, 'DOSEN', 'MAHASISWA'],
    get: [...ADMIN_TRIO, 'DOSEN', 'MAHASISWA'],
    create: [...ADMIN_TRIO],
    update: [...ADMIN_TRIO],
    delete: [...ADMIN_TRIO],
    import: [...ADMIN_DUO],
    export: [...ADMIN_TRIO],
  },
  scopeWhere: (user) => undefined,
  assertWriteScope: (user, data, existing) => { },
  beforeWrite: async (data, existing, user) => {
    // Fallback to existing values for partial updates
    const metode = data.metode !== undefined ? data.metode : existing?.metode;
    const ruanganId = data.ruanganId !== undefined ? data.ruanganId : existing?.ruanganId;
    const tahunAkademikId = data.tahunAkademikId !== undefined ? data.tahunAkademikId : existing?.tahunAkademikId;
    const hari = data.hari !== undefined ? data.hari : existing?.hari;
    const jamMulai = data.jamMulai !== undefined ? data.jamMulai : existing?.jamMulai;
    const jamSelesai = data.jamSelesai !== undefined ? data.jamSelesai : existing?.jamSelesai;
    const kelasId = data.kelasId !== undefined ? data.kelasId : existing?.kelasId;
    const dosenId = data.dosenId !== undefined ? data.dosenId : existing?.dosenId;

    if (metode !== 'ONLINE' && !ruanganId) {
      throw ApiError.badRequest('Ruangan wajib diisi untuk metode pelaksanaan Offline atau Hybrid');
    }

    // Validasi bentrok jadwal
    const { db } = await import('../../../core/database.js');
    
    // Convert jam to minutes for easier comparison
    const parseTime = (timeStr) => {
      if (!timeStr) return 0;
      const [h, m] = timeStr.split(':').map(Number);
      return h * 60 + m;
    };
    
    const newStart = parseTime(jamMulai);
    const newEnd = parseTime(jamSelesai);
    
    // 1. Validasi 1 Matakuliah = 1 Jadwal per Kelas
    const matakuliahId = data.matakuliahId !== undefined ? data.matakuliahId : existing?.matakuliahId;
    const existingMk = await db.jadwal.findFirst({
      where: {
        tahunAkademikId: tahunAkademikId,
        kelasId: kelasId,
        matakuliahId: matakuliahId,
        ...(existing ? { id: { not: existing.id } } : {})
      }
    });

    if (existingMk) {
      throw ApiError.badRequest('Mata Kuliah ini sudah memiliki jadwal untuk kelas tersebut. Satu Mata Kuliah tidak dapat dijadwalkan lebih dari satu kali untuk kelas yang sama.');
    }

    // 2. Validasi bentrok waktu & tempat
    const overlapping = await db.jadwal.findMany({
      where: {
        tahunAkademikId: tahunAkademikId,
        hari: hari,
        ...(existing ? { id: { not: existing.id } } : {})
      }
    });
    
    let clashMessage = null;
    
    overlapping.some(o => {
      const oStart = parseTime(o.jamMulai);
      const oEnd = parseTime(o.jamSelesai);
      
      // Check time overlap
      if (newStart < oEnd && newEnd > oStart) {
        if (o.kelasId === kelasId) {
          clashMessage = 'Bentrok: Kelas sudah memiliki jadwal pada waktu tersebut';
          return true;
        }
        if (o.dosenId === dosenId) {
          clashMessage = 'Bentrok: Dosen sedang mengajar di kelas lain pada waktu tersebut';
          return true;
        }
        
        const isNewOnline = metode === 'ONLINE';
        const isOldOnline = o.metode === 'ONLINE';
        
        if (!isNewOnline && !isOldOnline && ruanganId && o.ruanganId && ruanganId === o.ruanganId) {
          clashMessage = 'Bentrok: Ruangan sedang digunakan pada waktu tersebut';
          return true;
        }
      }
      return false;
    });
    
    if (clashMessage) throw ApiError.badRequest(clashMessage);
  },
  importColumns: [],
  importExample: [],
  uniqueKeys: (d) => [],
  loadExistingKeys: async (client) => new Set(),
  loadRefCaches: (client) => ({}),
};
