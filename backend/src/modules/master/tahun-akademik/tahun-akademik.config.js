import { z } from 'zod';
import { ApiError } from '../../../shared/utils/apiError.js';
import { ADMIN_TRIO, ADMIN_DUO, hashDefault, exp, mergeCaches } from '../../../shared/crud/crud.utils.js';

const tahunAkademikSchema = z.object({
  kode: z.string().min(5).max(6).regex(/^\d{5,6}$/, 'Format harus berupa 5 atau 6 angka, contoh: 20241'),
  nama: z.string().optional(),
  status: z.enum(['AKTIF', 'NONAKTIF']).default('NONAKTIF')
});

export const tahunAkademikConfig = {
  model: 'tahunAkademik',
  label: 'Tahun Akademik',
  schema: tahunAkademikSchema,
  searchFields: ['kode', 'nama'],
  filters: [{ name: 'status', field: 'status' }],
  orderBy: { kode: 'desc' },
  include: undefined,
  beforeWrite: (data) => {
    if (data.kode && data.kode.length >= 5) {
      const year = parseInt(data.kode.substring(0, 4), 10);
      const suffix = data.kode.substring(4);
      let term = 'Pendek';
      if (suffix === '1') term = 'Ganjil';
      else if (suffix === '2') term = 'Genap';
      data.nama = `${term} ${year}/${year + 1}`;
    }
  },
  toDto: (d) => ({
    id: d.id,
    kode: d.kode,
    nama: d.nama,
    status: d.status,
  }),
  rowLabel: (d) => `${d.kode} - ${d.nama}`,
  exportColumns: [exp('kode', 'kode'), exp('nama', 'nama'), exp('status', 'status')],
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
    { header: 'kode', field: 'kode', required: true },
    { header: 'status', field: 'status', enum: ['AKTIF', 'NONAKTIF'], default: 'NONAKTIF' },
  ],
  importExample: ['20241', 'AKTIF'],
  uniqueKeys: (d) => [`tahunAkademik:${d.kode}`],
  loadExistingKeys: async (client) => {
    const rows = await client.tahunAkademik.findMany({ select: { kode: true } });
    return new Set(rows.map((r) => `tahunAkademik:${r.kode}`));
  },
  loadRefCaches: async () => ({}),
};
