import { z } from 'zod';
import { ApiError } from '../../../shared/utils/apiError.js';
import { ADMIN_TRIO, ADMIN_DUO, hashDefault, exp, mergeCaches } from '../../../shared/crud/crud.utils.js';

const kelasSchema = z.object({
  prodiId: z.coerce.number().int().positive({ message: 'Program studi wajib dipilih' }),
  namaKelas: z.string().min(1).max(50),
  angkatan: z.coerce.number().int().min(2000).max(2100),
  tahunKurikulumId: z.coerce.number().int().positive({ message: 'Tahun Kurikulum wajib dipilih' }),
  semesterBerjalan: z.coerce.number().int().min(1).max(14).default(1),
});

export const kelasConfig = {
  model: 'kelas',
  label: 'Kelas',
  schema: kelasSchema,
  searchFields: ['namaKelas'],
  filters: [
    { name: 'prodiId', field: 'prodiId', parse: (v) => (v ? parseInt(v, 10) : undefined) },
    { name: 'angkatan', field: 'angkatan', parse: (v) => (v ? parseInt(v, 10) : undefined) },
  ],
  orderBy: [{ angkatan: 'desc' }, { namaKelas: 'asc' }],
  include: {
    prodi: { select: { id: true, kodeProdi: true, namaProdi: true } },
    tahunKurikulum: { select: { id: true, tahun: true } }
  },
  toDto: (k) => ({
    id: k.id,
    prodiId: k.prodiId,
    prodiKode: k.prodi?.kodeProdi,
    prodiNama: k.prodi?.namaProdi,
    namaKelas: k.namaKelas,
    angkatan: k.angkatan,
    tahunKurikulumId: k.tahunKurikulumId,
    tahunKurikulum: k.tahunKurikulum?.tahun,
    semesterBerjalan: k.semesterBerjalan,
  }),
  rowLabel: (k) => k.namaKelas,
  exportColumns: [exp('kode_prodi', 'prodiKode'), exp('nama_kelas', 'namaKelas'), exp('angkatan', 'angkatan'), exp('kurikulum', 'tahunKurikulum')],
  rbac: {
    list: [...ADMIN_TRIO, 'DOSEN', 'MAHASISWA'],
    get: [...ADMIN_TRIO, 'DOSEN', 'MAHASISWA'],
    create: [...ADMIN_TRIO],
    update: [...ADMIN_TRIO],
    delete: [...ADMIN_TRIO],
    import: [...ADMIN_DUO],
    export: [...ADMIN_TRIO],
  },
  scopeWhere: (user) => {
    if (user.role === 'ADMIN_PRODI') return { prodiId: user.prodiId };
    if (user.role === 'MAHASISWA') return { id: user.mahasiswa?.kelasId ?? -1 };
    return undefined;
  },
  assertWriteScope: (user, data, existing) => {
    if (user.role === 'ADMIN_PRODI') {
      const target = data.prodiId ?? existing?.prodiId;
      if (target !== user.prodiId) throw ApiError.forbidden('Anda hanya dapat mengelola kelas pada program studi Anda');
    }
  },
  importColumns: [
    { header: 'kode_prodi', field: 'prodiId', required: true, ref: { resolve: (v, c) => c.prodiByKode.get(v) } },
    { header: 'nama_kelas', field: 'namaKelas', required: true },
    { header: 'angkatan', field: 'angkatan', required: true, type: 'int' },
    { header: 'kurikulum', field: 'tahunKurikulumId', required: true, ref: { resolve: (v, c, data) => c.kurikulumByProdiDanTahun.get(`${data.prodiId}|${v}`) } },
  ],
  importExample: ['D4-TI', 'TI-4A', 2022, 2024],
  uniqueKeys: (d) => [`kelas:${d.prodiId}:${d.namaKelas.toLowerCase()}`],
  loadExistingKeys: async (client) => {
    const rows = await client.kelas.findMany();
    return new Set(rows.map((r) => `kelas:${r.prodiId}:${r.namaKelas.toLowerCase()}`));
  },
  loadRefCaches: (client) => mergeCaches(client, 'prodi', 'kurikulum'),
};
