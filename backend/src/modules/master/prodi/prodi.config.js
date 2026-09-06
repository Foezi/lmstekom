import { z } from 'zod';
import { ApiError } from '../../../shared/utils/apiError.js';
import { ADMIN_TRIO, ADMIN_DUO, hashDefault, exp, mergeCaches } from '../../../shared/crud/crud.utils.js';

const prodiSchema = z.object({
  kodeProdi: z.string().min(2).max(20),
  namaProdi: z.string().min(3).max(100),
  jenjang: z.enum(['D2', 'D3', 'D4', 'S1', 'S2', 'S3', 'Profesi']),
  ketuaProdiId: z.coerce.number().int().positive().nullish(),
});

export const prodiConfig = {
  model: 'prodi',
  label: 'Program Studi',
  schema: prodiSchema,
  searchFields: ['kodeProdi', 'namaProdi'],
  filters: [{ name: 'jenjang', field: 'jenjang' }],
  orderBy: { kodeProdi: 'asc' },
  include: { ketuaProdi: { select: { id: true, nidn: true, nama: true } } },
  toDto: (p) => ({
    id: p.id,
    kodeProdi: p.kodeProdi,
    namaProdi: p.namaProdi,
    jenjang: p.jenjang,
    ketuaProdiId: p.ketuaProdiId,
    ketuaProdiNama: p.ketuaProdi?.nama ?? null,
  }),
  rowLabel: (p) => `${p.kodeProdi} - ${p.namaProdi}`,
  exportColumns: [exp('kode_prodi', 'kodeProdi'), exp('nama_prodi', 'namaProdi'), exp('jenjang', 'jenjang'), exp('ketua_prodi', 'ketuaProdiNama')],
  rbac: {
    list: [...ADMIN_TRIO, 'DOSEN', 'MAHASISWA'],
    get: [...ADMIN_TRIO],
    create: ['ADMIN'],
    update: ['ADMIN'],
    delete: ['ADMIN'],
    import: ['ADMIN'],
    export: [...ADMIN_TRIO],
  },
  scopeWhere: (user) => (user.role === 'ADMIN_PRODI' ? { id: user.prodiId } : undefined),
  importColumns: [
    { header: 'kode_prodi', field: 'kodeProdi', required: true },
    { header: 'nama_prodi', field: 'namaProdi', required: true },
    { header: 'jenjang', field: 'jenjang', required: true, enum: ['D2', 'D3', 'D4', 'S1', 'S2', 'S3', 'PROFESI'], default: null },
    {
      header: 'nidn_ketua',
      field: 'ketuaProdiId',
      ref: { resolve: (v, c) => c.dosenByNidn.get(v) },
    },
  ],
  importExample: ['D4-TI', 'Teknik Informatika', 'D4', '0012345601'],
  uniqueKeys: (d) => [`kodeProdi:${d.kodeProdi}`],
  loadExistingKeys: async (client) => {
    const rows = await client.prodi.findMany({ select: { kodeProdi: true } });
    return new Set(rows.map((r) => `kodeProdi:${r.kodeProdi}`));
  },
  loadRefCaches: (client) => mergeCaches(client, 'dosen'),
};
