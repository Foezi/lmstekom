import { z } from 'zod';
import { ApiError } from '../../../shared/utils/apiError.js';
import { ADMIN_TRIO, ADMIN_DUO, hashDefault, exp, mergeCaches } from '../../../shared/crud/crud.utils.js';

const kurikulumSchema = z.object({
  prodiId: z.coerce.number().int().positive({ message: 'Program studi wajib dipilih' }),
  tahun: z.coerce.number().int().min(1990).max(2100),
  statusAktif: z.enum(['AKTIF', 'NONAKTIF']).default('AKTIF'),
});

export const kurikulumConfig = {
  model: 'tahunKurikulum',
  label: 'Tahun Kurikulum',
  schema: kurikulumSchema,
  searchFields: [],
  numericSearchFields: ['tahun'],
  filters: [
    { name: 'prodiId', field: 'prodiId', parse: (v) => (v ? parseInt(v, 10) : undefined) },
    { name: 'statusAktif', field: 'statusAktif' }
  ],
  orderBy: { tahun: 'desc' },
  include: { prodi: { select: { id: true, kodeProdi: true, namaProdi: true } } },
  toDto: (k) => ({
    id: k.id,
    prodiId: k.prodiId,
    prodiKode: k.prodi?.kodeProdi,
    prodiNama: k.prodi?.namaProdi,
    tahun: k.tahun,
    statusAktif: k.statusAktif,
  }),
  rowLabel: (k) => `Kurikulum ${k.tahun}`,
  exportColumns: [exp('kode_prodi', 'prodiKode'), exp('tahun', 'tahun'), exp('status_aktif', 'statusAktif')],
  rbac: {
    list: [...ADMIN_TRIO, 'DOSEN', 'MAHASISWA'],
    get: [...ADMIN_TRIO, 'DOSEN', 'MAHASISWA'],
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
      if (target !== user.prodiId) throw ApiError.forbidden('Anda hanya dapat mengelola kurikulum pada program studi Anda');
    }
  },
  importColumns: [
    { header: 'kode_prodi', field: 'prodiId', required: true, ref: { resolve: (v, c) => c.prodiByKode.get(v) } },
    { header: 'tahun', field: 'tahun', required: true, type: 'int' },
    { header: 'status_aktif', field: 'statusAktif', enum: ['AKTIF', 'NONAKTIF'], default: 'AKTIF' },
  ],
  importExample: ['D4-TI', 2025, 'AKTIF'],
  uniqueKeys: (d) => [`kurikulum:${d.prodiId}:${d.tahun}`],
  loadExistingKeys: async (client) => {
    const rows = await client.tahunKurikulum.findMany({ select: { prodiId: true, tahun: true } });
    return new Set(rows.map((r) => `kurikulum:${r.prodiId}:${r.tahun}`));
  },
  loadRefCaches: (client) => mergeCaches(client, 'prodi'),
};
