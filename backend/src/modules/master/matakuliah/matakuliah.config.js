import { z } from 'zod';
import { ApiError } from '../../../shared/utils/apiError.js';
import { ADMIN_TRIO, ADMIN_DUO, hashDefault, exp, mergeCaches } from '../../../shared/crud/crud.utils.js';

const mataKuliahSchema = z.object({
  prodiId: z.coerce.number().int().positive({ message: 'Program studi wajib dipilih' }),
  tahunKurikulumId: z.coerce.number().int().positive({ message: 'Tahun Kurikulum wajib dipilih' }),
  kodeMk: z.string().min(1).max(30),
  namaMk: z.string().min(3).max(120),
  sks: z.coerce.number().int().min(1).max(6),
  semester: z.coerce.number().int().min(1).max(8).default(1),
  sifat: z.enum(['WAJIB', 'PILIHAN']).default('WAJIB'),
  prasyaratId: z.coerce.number().int().positive().nullish(),
});

export const mataKuliahConfig = {
  model: 'mataKuliah',
  label: 'Mata Kuliah',
  schema: mataKuliahSchema,
  searchFields: ['kodeMk', 'namaMk'],
  filters: [
    { name: 'prodiId', field: 'prodiId', parse: (v) => (v ? parseInt(v, 10) : undefined) },
    { name: 'tahunKurikulumId', field: 'tahunKurikulumId', parse: (v) => (v ? parseInt(v, 10) : undefined) },
    { name: 'semester', field: 'semester', parse: (v) => (v ? parseInt(v, 10) : undefined) },
  ],
  orderBy: [{ tahunKurikulumId: 'desc' }, { semester: 'asc' }, { namaMk: 'asc' }],
  include: {
    prodi: { select: { id: true, kodeProdi: true, namaProdi: true } },
    tahunKurikulum: { select: { id: true, tahun: true } },
    prasyarat: { select: { id: true, kodeMk: true, namaMk: true } }
  },
  toDto: (mk) => ({
    id: mk.id,
    prodiId: mk.prodiId,
    prodiKode: mk.prodi?.kodeProdi,
    prodiNama: mk.prodi?.namaProdi,
    tahunKurikulumId: mk.tahunKurikulumId,
    tahunKurikulum: mk.tahunKurikulum?.tahun,
    kodeMk: mk.kodeMk,
    namaMk: mk.namaMk,
    sks: mk.sks,
    semester: mk.semester,
    sifat: mk.sifat,
    prasyaratId: mk.prasyaratId,
    prasyaratNama: mk.prasyarat ? `${mk.prasyarat.kodeMk} - ${mk.prasyarat.namaMk}` : null,
  }),
  rowLabel: (mk) => `${mk.kodeMk} - ${mk.namaMk}`,
  exportColumns: [exp('kode_prodi', 'prodiKode'), exp('kurikulum', 'tahunKurikulum'), exp('semester', 'semester'), exp('kode_mk', 'kodeMk'), exp('nama_mk', 'namaMk'), exp('sks', 'sks'), exp('sifat', 'sifat')],
  rbac: {
    list: [...ADMIN_TRIO],
    get: [...ADMIN_TRIO],
    create: [...ADMIN_TRIO],
    update: [...ADMIN_TRIO],
    delete: [...ADMIN_TRIO],
    import: [...ADMIN_DUO],
    export: [...ADMIN_TRIO],
  },
  scopeWhere: (user) => (user.role === 'ADMIN_PRODI' ? { prodiId: user.prodiId } : undefined),
  assertWriteScope: (user, data, existing) => {
    if (user.role === 'ADMIN_PRODI') {
      const target = data.prodiId ?? existing?.prodiId;
      if (target !== user.prodiId) throw ApiError.forbidden('Anda hanya dapat mengelola mata kuliah pada program studi Anda');
    }
  },
  importColumns: [
    { header: 'kode_prodi', field: 'prodiId', required: true, ref: { resolve: (v, c) => c.prodiByKode.get(v) } },
    { header: 'kurikulum', field: 'tahunKurikulumId', required: true, ref: { resolve: (v, c, data) => c.kurikulumByProdiDanTahun.get(`${data.prodiId}|${v}`) } },
    { header: 'kode_mk', field: 'kodeMk', required: true },
    { header: 'nama_mk', field: 'namaMk', required: true },
    { header: 'sks', field: 'sks', required: true, type: 'int' },
    { header: 'sifat', field: 'sifat', enum: ['WAJIB', 'PILIHAN'], default: 'WAJIB' }
  ],
  importExample: ['D4-TI', 'TI-303', 'Jaringan Komputer', 3],
  uniqueKeys: (d) => [`mk:${d.prodiId}:${d.kodeMk.toUpperCase()}`],
  loadExistingKeys: async (client) => {
    const rows = await client.mataKuliah.findMany();
    return new Set(rows.map((r) => `mk:${r.prodiId}:${r.kodeMk.toUpperCase()}`));
  },
  loadRefCaches: (client) => mergeCaches(client, 'prodi'),
};
