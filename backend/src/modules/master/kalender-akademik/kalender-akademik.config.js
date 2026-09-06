import { z } from 'zod';
import { ADMIN_TRIO, ADMIN_DUO, exp } from '../../../shared/crud/crud.utils.js';

const kalenderAkademikSchema = z.object({
  tahunAkademikId: z.coerce.number().int().positive(),
  namaKegiatan: z.string().min(3, 'Nama kegiatan minimal 3 karakter'),
  jenisKegiatan: z.enum(['AWAL_KULIAH', 'UTS', 'UAS', 'LIBUR', 'LAINNYA']).default('LAINNYA'),
  tanggalMulai: z.string().or(z.date()),
  tanggalSelesai: z.string().or(z.date()),
  keterangan: z.string().optional()
});

export const kalenderAkademikConfig = {
  model: 'kalenderAkademik',
  label: 'Kalender Akademik',
  schema: kalenderAkademikSchema,
  searchFields: ['namaKegiatan', 'keterangan'],
  filters: [{ name: 'tahunAkademikId', field: 'tahunAkademikId', parse: (v) => v ? parseInt(v, 10) : undefined }],
  orderBy: { tanggalMulai: 'asc' },
  include: { tahunAkademik: true },
  beforeWrite: (data) => {
    if (data.tanggalMulai) data.tanggalMulai = new Date(data.tanggalMulai);
    if (data.tanggalSelesai) data.tanggalSelesai = new Date(data.tanggalSelesai);
  },
  toDto: (d) => ({
    id: d.id,
    tahunAkademikId: d.tahunAkademikId,
    tahunAkademikNama: d.tahunAkademik?.nama,
    namaKegiatan: d.namaKegiatan,
    jenisKegiatan: d.jenisKegiatan,
    tanggalMulai: d.tanggalMulai,
    tanggalSelesai: d.tanggalSelesai,
    keterangan: d.keterangan
  }),
  rowLabel: (d) => `${d.namaKegiatan}`,
  exportColumns: [
    exp('tahun_akademik', 'tahunAkademikNama'),
    exp('nama_kegiatan', 'namaKegiatan'),
    exp('jenis_kegiatan', 'jenisKegiatan'),
    exp('tanggal_mulai', 'tanggalMulai'),
    exp('tanggal_selesai', 'tanggalSelesai')
  ],
  rbac: {
    list: [...ADMIN_TRIO, 'DOSEN', 'MAHASISWA'],
    get: [...ADMIN_TRIO, 'DOSEN', 'MAHASISWA'],
    create: [...ADMIN_DUO],
    update: [...ADMIN_DUO],
    delete: [...ADMIN_DUO],
    import: [...ADMIN_DUO],
    export: [...ADMIN_TRIO],
  },
  scopeWhere: () => undefined,
  importColumns: [
    { header: 'tahunAkademikId', field: 'tahunAkademikId', required: true },
    { header: 'namaKegiatan', field: 'namaKegiatan', required: true },
    { header: 'jenisKegiatan', field: 'jenisKegiatan', enum: ['AWAL_KULIAH', 'UTS', 'UAS', 'LIBUR', 'LAINNYA'], default: 'LAINNYA' },
    { header: 'tanggalMulai', field: 'tanggalMulai', required: true },
    { header: 'tanggalSelesai', field: 'tanggalSelesai', required: true },
    { header: 'keterangan', field: 'keterangan' }
  ],
};
