import { z } from 'zod';
import bcrypt from 'bcrypt';
import { ApiError } from '../utils/apiError.js';

const ADMIN_TRIO = ['ADMIN', 'ADMIN_AKADEMIK', 'ADMIN_PRODI'];
const ADMIN_DUO = ['ADMIN', 'ADMIN_AKADEMIK'];

const hashDefault = async (username) => bcrypt.hash(`${username}@poltek`, 10);

// ---------- referensi bersama untuk import ----------

const refCaches = {
  async prodi(client) {
    const rows = await client.prodi.findMany({ select: { id: true, kodeProdi: true } });
    return { prodiByKode: new Map(rows.map((r) => [r.kodeProdi, r.id])) };
  },
  async kelas(client) {
    const rows = await client.kelas.findMany({ select: { id: true, prodiId: true, namaKelas: true } });
    return { kelasByProdiDanNama: new Map(rows.map((r) => [`${r.prodiId}|${r.namaKelas}`, r.id])) };
  },
  async dosen(client) {
    const rows = await client.dosen.findMany({ select: { id: true, nidn: true } });
    return { dosenByNidn: new Map(rows.map((r) => [r.nidn, r.id])) };
  },
};

const mergeCaches = async (client, ...refs) => {
  const out = {};
  for (const ref of refs) Object.assign(out, await refCaches[ref](client));
  return out;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const exp = (header, key) => ({ header, key });

// ============================================================
// PROGRAM STUDI
// ============================================================
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
  exportColumns: [exp('kode_prodi','kodeProdi'), exp('nama_prodi','namaProdi'), exp('jenjang','jenjang'), exp('ketua_prodi','ketuaProdiNama')],
  rbac: {
    list: [...ADMIN_TRIO],
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

// ============================================================
// KELAS
// ============================================================
const kelasSchema = z.object({
  prodiId: z.coerce.number().int().positive({ message: 'Program studi wajib dipilih' }),
  namaKelas: z.string().min(1).max(50),
  angkatan: z.coerce.number().int().min(2000).max(2100),
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
  include: { prodi: { select: { id: true, kodeProdi: true, namaProdi: true } } },
  toDto: (k) => ({
    id: k.id,
    prodiId: k.prodiId,
    prodiKode: k.prodi?.kodeProdi,
    prodiNama: k.prodi?.namaProdi,
    namaKelas: k.namaKelas,
    angkatan: k.angkatan,
    semesterBerjalan: k.semesterBerjalan,
  }),
  rowLabel: (k) => k.namaKelas,
  exportColumns: [exp('kode_prodi','prodiKode'), exp('nama_kelas','namaKelas'), exp('angkatan','angkatan'), exp('semester_berjalan','semesterBerjalan')],
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
    { header: 'semester_berjalan', field: 'semesterBerjalan', type: 'int', default: 1 },
  ],
  importExample: ['D4-TI', 'TI-4A', 2022, 4],
  uniqueKeys: (d) => [`kelas:${d.prodiId}:${d.namaKelas.toLowerCase()}`],
  loadExistingKeys: async (client) => {
    const rows = await client.kelas.findMany();
    return new Set(rows.map((r) => `kelas:${r.prodiId}:${r.namaKelas.toLowerCase()}`));
  },
  loadRefCaches: (client) => mergeCaches(client, 'prodi'),
};

// ============================================================
// DOSEN
// ============================================================
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
  exportColumns: [exp('nidn','nidn'), exp('nama','nama'), exp('email','email'), exp('no_hp','noHp'), exp('status','status'), exp('kode_prodi','prodiKode')],
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

// ============================================================
// MAHASISWA
// ============================================================
const mahasiswaSchema = z.object({
  nim: z.string().min(4).max(20),
  nama: z.string().min(3).max(120),
  prodiId: z.coerce.number().int().positive({ message: 'Program studi wajib dipilih' }),
  kelasId: z.coerce.number().int().positive({ message: 'Kelas wajib dipilih' }),
  email: z.string().email().nullish(),
  status: z.enum(['AKTIF', 'NONAKTIF']).default('AKTIF'),
});

export const mahasiswaConfig = {
  model: 'mahasiswa',
  label: 'Mahasiswa',
  schema: mahasiswaSchema,
  searchFields: ['nim', 'nama', 'email'],
  filters: [
    { name: 'prodiId', field: 'prodiId', parse: (v) => (v ? parseInt(v, 10) : undefined) },
    { name: 'kelasId', field: 'kelasId', parse: (v) => (v ? parseInt(v, 10) : undefined) },
    { name: 'status', field: 'status' },
  ],
  orderBy: { nim: 'asc' },
  include: {
    prodi: { select: { id: true, kodeProdi: true, namaProdi: true } },
    kelas: { select: { id: true, namaKelas: true, angkatan: true } },
  },
  toDto: (m) => ({
    id: m.id,
    nim: m.nim,
    nama: m.nama,
    email: m.email,
    status: m.status,
    prodiId: m.prodiId,
    prodiKode: m.prodi?.kodeProdi,
    prodiNama: m.prodi?.namaProdi,
    kelasId: m.kelasId,
    kelasNama: m.kelas?.namaKelas,
    angkatan: m.kelas?.angkatan,
  }),
  rowLabel: (m) => `${m.nim} - ${m.nama}`,
  exportColumns: [exp('nim','nim'), exp('nama','nama'), exp('kode_prodi','prodiKode'), exp('nama_kelas','kelasNama'), exp('email','email'), exp('status','status')],
  rbac: {
    list: [...ADMIN_TRIO, 'DOSEN'],
    get: [...ADMIN_TRIO, 'DOSEN'],
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
      if (target !== user.prodiId) throw ApiError.forbidden('Anda hanya dapat mengelola mahasiswa pada program studi Anda');
    }
  },
  afterWrite: async (record, previous, user, client) => {
    if (!previous) {
      await client.user.upsert({
        where: { username: record.nim },
        update: { mahasiswaId: record.id },
        create: {
          username: record.nim,
          password: await hashDefault(record.nim),
          role: 'MAHASISWA',
          mahasiswaId: record.id,
          wajibLengkapiProfil: true,
        },
      });
    } else if (previous.nim !== record.nim) {
      const oldUser = await client.user.findUnique({ where: { username: previous.nim } });
      if (oldUser) {
        try {
          await client.user.update({ where: { id: oldUser.id }, data: { username: record.nim } });
        } catch {
          throw ApiError.conflict(`Username ${record.nim} sudah digunakan akun lain`);
        }
      }
    }
  },
  importColumns: [
    { header: 'nim', field: 'nim', required: true },
    { header: 'nama', field: 'nama', required: true },
    { header: 'kode_prodi', field: 'prodiId', required: true, ref: { resolve: (v, c) => c.prodiByKode.get(v) } },
    {
      header: 'nama_kelas',
      field: 'kelasId',
      required: true,
      ref: { resolve: (v, c, data) => c.kelasByProdiDanNama.get(`${data.prodiId}|${v}`) },
    },
    { header: 'email', field: 'email' },
    { header: 'status', field: 'status', enum: ['AKTIF', 'NONAKTIF'], default: 'AKTIF' },
  ],
  importExample: ['2204099', 'Nama Mahasiswa', 'D4-TI', 'TI-4A', 'mahasiswa@gmail.com', 'AKTIF'],
  uniqueKeys: (d) => [`nim:${d.nim}`],
  loadExistingKeys: async (client) => {
    const rows = await client.mahasiswa.findMany({ select: { nim: true } });
    return new Set(rows.map((r) => `nim:${r.nim}`));
  },
  loadRefCaches: (client) => mergeCaches(client, 'prodi', 'kelas'),
  validateRow: (d, fail) => {
    if (d.email && !EMAIL_RE.test(d.email)) fail('email', 'Format email tidak valid');
  },
};

// ============================================================
// RUANGAN
// ============================================================
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
  exportColumns: [exp('kode_ruangan','kodeRuangan'), exp('nama_ruangan','namaRuangan'), exp('kapasitas','kapasitas'), exp('gedung','gedung')],
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

// ============================================================
// MATA KULIAH
// ============================================================
const mataKuliahSchema = z.object({
  prodiId: z.coerce.number().int().positive({ message: 'Program studi wajib dipilih' }),
  kodeMk: z.string().min(1).max(30),
  namaMk: z.string().min(3).max(120),
  sks: z.coerce.number().int().min(1).max(6),
});

export const mataKuliahConfig = {
  model: 'mataKuliah',
  label: 'Mata Kuliah',
  schema: mataKuliahSchema,
  searchFields: ['kodeMk', 'namaMk'],
  filters: [
    { name: 'prodiId', field: 'prodiId', parse: (v) => (v ? parseInt(v, 10) : undefined) },
    { name: 'sks', field: 'sks', parse: (v) => (v ? parseInt(v, 10) : undefined) },
  ],
  orderBy: [{ prodiId: 'asc' }, { kodeMk: 'asc' }],
  include: { prodi: { select: { id: true, kodeProdi: true, namaProdi: true } } },
  toDto: (mk) => ({
    id: mk.id,
    prodiId: mk.prodiId,
    prodiKode: mk.prodi?.kodeProdi,
    prodiNama: mk.prodi?.namaProdi,
    kodeMk: mk.kodeMk,
    namaMk: mk.namaMk,
    sks: mk.sks,
  }),
  rowLabel: (mk) => `${mk.kodeMk} - ${mk.namaMk}`,
  exportColumns: [exp('kode_prodi','prodiKode'), exp('kode_mk','kodeMk'), exp('nama_mk','namaMk'), exp('sks','sks')],
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
    { header: 'kode_mk', field: 'kodeMk', required: true },
    { header: 'nama_mk', field: 'namaMk', required: true },
    { header: 'sks', field: 'sks', required: true, type: 'int' },
  ],
  importExample: ['D4-TI', 'TI-303', 'Jaringan Komputer', 3],
  uniqueKeys: (d) => [`mk:${d.prodiId}:${d.kodeMk.toUpperCase()}`],
  loadExistingKeys: async (client) => {
    const rows = await client.mataKuliah.findMany();
    return new Set(rows.map((r) => `mk:${r.prodiId}:${r.kodeMk.toUpperCase()}`));
  },
  loadRefCaches: (client) => mergeCaches(client, 'prodi'),
};

export const MASTER_CONFIGS = {
  prodi: prodiConfig,
  kelas: kelasConfig,
  dosen: dosenConfig,
  mahasiswa: mahasiswaConfig,
  ruangan: ruanganConfig,
  'mata-kuliah': mataKuliahConfig,
};
