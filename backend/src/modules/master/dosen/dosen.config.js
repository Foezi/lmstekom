import { z } from 'zod';
import { ApiError } from '../../../shared/utils/apiError.js';
import { ADMIN_TRIO, ADMIN_DUO, hashDefault, exp, mergeCaches } from '../../../shared/crud/crud.utils.js';

const dosenSchema = z.object({
  nidn: z.string().min(5).max(20),
  nama: z.string().min(3).max(120),
  email: z.string().email().nullish(),
  noHp: z.string().max(20).nullish(),
  status: z.enum(['AKTIF', 'NONAKTIF']).default('AKTIF'),
  prodiId: z.coerce.number().int().positive().nullish(),
});

export const dosenConfig = {
  model: 'dosen',
  label: 'Dosen',
  schema: dosenSchema,
  searchFields: ['nidn', 'nama', 'email'],
  filters: [
    { name: 'prodiId', field: 'prodiId', parse: (v) => (v ? parseInt(v, 10) : undefined) },
    { name: 'status', field: 'status' },
  ],
  orderBy: { nidn: 'asc' },
  include: { prodi: { select: { id: true, kodeProdi: true, namaProdi: true } } },
  toDto: (d) => ({
    id: d.id,
    nidn: d.nidn,
    nama: d.nama,
    email: d.email,
    noHp: d.noHp,
    status: d.status,
    prodiId: d.prodiId,
    prodiKode: d.prodi?.kodeProdi ?? null,
    prodiNama: d.prodi?.namaProdi ?? null,
  }),
  rowLabel: (d) => `${d.nidn} - ${d.nama}`,
  exportColumns: [exp('nidn', 'nidn'), exp('nama', 'nama'), exp('email', 'email'), exp('no_hp', 'noHp'), exp('status', 'status'), exp('kode_prodi', 'prodiKode')],
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
      if (target !== user.prodiId) throw ApiError.forbidden('Anda hanya dapat mengelola dosen pada program studi Anda');
    }
  },
  /** Sinkron akun login otomatis: username=NIDN, password default (blueprint §6.0a). */
  afterWrite: async (record, previous, user, client) => {
    if (!previous) {
      await client.user.upsert({
        where: { username: record.nidn },
        update: { dosenId: record.id },
        create: {
          username: record.nidn,
          password: await hashDefault(record.nidn),
          role: 'DOSEN',
          dosenId: record.id,
          wajibLengkapiProfil: true,
        },
      });
    } else if (previous.nidn !== record.nidn) {
      const oldUser = await client.user.findUnique({ where: { username: previous.nidn } });
      if (oldUser) {
        try {
          await client.user.update({ where: { id: oldUser.id }, data: { username: record.nidn } });
        } catch {
          throw ApiError.conflict(`Username ${record.nidn} sudah digunakan akun lain`);
        }
      }
    }
  },
  importColumns: [
    { header: 'nidn', field: 'nidn', required: true },
    { header: 'nama', field: 'nama', required: true },
    { header: 'email', field: 'email' },
    { header: 'no_hp', field: 'noHp' },
    { header: 'status', field: 'status', enum: ['AKTIF', 'NONAKTIF'], default: 'AKTIF' },
    { header: 'kode_prodi', field: 'prodiId', ref: { resolve: (v, c) => c.prodiByKode.get(v) } },
  ],
  importExample: ['0012345609', 'Nama Dosen, M.Kom', 'dosen@gmail.com', '081234567890', 'AKTIF', 'D4-TI'],
  uniqueKeys: (d) => [`nidn:${d.nidn}`],
  loadExistingKeys: async (client) => {
    const rows = await client.dosen.findMany({ select: { nidn: true } });
    return new Set(rows.map((r) => `nidn:${r.nidn}`));
  },
  loadRefCaches: (client) => mergeCaches(client, 'prodi'),
  validateRow: (d, fail) => {
    if (d.email && !EMAIL_RE.test(d.email)) fail('email', 'Format email tidak valid');
  },
};
