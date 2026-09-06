import { z } from 'zod';
import { ApiError } from '../../../shared/utils/apiError.js';
import { ADMIN_TRIO, ADMIN_DUO, hashDefault, exp, mergeCaches } from '../../../shared/crud/crud.utils.js';

const ruanganSchema = z.object({
  kodeRuangan: z.string().min(1).max(30),
  namaRuangan: z.string().min(3).max(100),
  kapasitas: z.coerce.number().int().min(1).max(1000),
  gedung: z.string().max(60).nullish(),
});

export const ruanganConfig = {
  model: 'ruangan',
  label: 'Ruangan',
  schema: ruanganSchema,
  searchFields: ['kodeRuangan', 'namaRuangan', 'gedung'],
  filters: [{ name: 'gedung', field: 'gedung' }],
  orderBy: { kodeRuangan: 'asc' },
  include: undefined,
  toDto: (r) => ({ ...r }),
  rowLabel: (r) => `${r.kodeRuangan} - ${r.namaRuangan}`,
  exportColumns: [exp('kode_ruangan', 'kodeRuangan'), exp('nama_ruangan', 'namaRuangan'), exp('kapasitas', 'kapasitas'), exp('gedung', 'gedung')],
  rbac: {
    list: [...ADMIN_TRIO, 'DOSEN'],
    get: [...ADMIN_TRIO, 'DOSEN'],
    create: [...ADMIN_DUO],
    update: [...ADMIN_DUO],
    delete: [...ADMIN_DUO],
    import: [...ADMIN_DUO],
    export: [...ADMIN_DUO],
  },
  scopeWhere: () => undefined,
  importColumns: [
    { header: 'kode_ruangan', field: 'kodeRuangan', required: true },
    { header: 'nama_ruangan', field: 'namaRuangan', required: true },
    { header: 'kapasitas', field: 'kapasitas', required: true, type: 'int' },
    { header: 'gedung', field: 'gedung' },
  ],
  importExample: ['R-201', 'Lab Jaringan', 36, 'Gedung B'],
  uniqueKeys: (d) => [`ruangan:${d.kodeRuangan.toUpperCase()}`],
  loadExistingKeys: async (client) => {
    const rows = await client.ruangan.findMany({ select: { kodeRuangan: true } });
    return new Set(rows.map((r) => `ruangan:${r.kodeRuangan.toUpperCase()}`));
  },
  loadRefCaches: async () => ({}),
};
