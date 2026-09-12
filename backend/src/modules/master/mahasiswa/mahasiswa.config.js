import { z } from 'zod';
import { ApiError } from '../../../shared/utils/apiError.js';
import { ADMIN_TRIO, ADMIN_DUO, hashDefault, exp, mergeCaches } from '../../../shared/crud/crud.utils.js';

const mahasiswaSchema = z.object({
  nim: z.string().min(4).max(20),
  nama: z.string().min(3).max(120),
  prodiId: z.coerce.number().int().positive({ message: 'Program studi wajib dipilih' }),
  kelasId: z.coerce.number().int().positive({ message: 'Kelas wajib dipilih' }),
  email: z.string().email().nullish(),
  jenisKelamin: z.enum(['L', 'P']).nullish(),
  tempatLahir: z.string().max(100).nullish(),
  tanggalLahir: z.coerce.date().nullish(),
  periodeMasuk: z.string().max(50).nullish(),
  jalurPendaftaran: z.string().max(100).nullish(),
  dosenWaliId: z.coerce.number().int().positive().nullish(),
  status: z.enum(['AKTIF', 'NONAKTIF', 'LULUS', 'DO', 'MENGUNDURKAN_DIRI', 'CUTI']).default('AKTIF'),
});

export const mahasiswaConfig = {
  model: 'mahasiswa',
  label: 'Mahasiswa',
  schema: mahasiswaSchema,
  searchFields: ['nim', 'nama', 'user.email', 'user.noHp'],
  filters: [
    { name: 'prodiId', field: 'prodiId', parse: (v) => (v ? parseInt(v, 10) : undefined) },
    { name: 'kelasId', field: 'kelasId', parse: (v) => (v ? parseInt(v, 10) : undefined) },
    { name: 'status', field: 'status' },
  ],
  orderBy: { nim: 'asc' },
  include: {
    prodi: { select: { id: true, kodeProdi: true, namaProdi: true } },
    kelas: { select: { id: true, namaKelas: true, angkatan: true, tahunKurikulumId: true, tahunKurikulum: { select: { tahun: true } } } },
    dosenWali: { select: { id: true, nidn: true, nama: true } },
    user: { select: { email: true, noHp: true } }
  },
  toDto: (m) => ({
    id: m.id,
    nim: m.nim,
    nama: m.nama,
    email: m.user?.email,
    noHp: m.user?.noHp,
    status: m.status,
    prodiId: m.prodiId,
    prodiKode: m.prodi?.kodeProdi,
    prodiNama: m.prodi?.namaProdi,
    kelasId: m.kelasId,
    kelasNama: m.kelas?.namaKelas,
    angkatan: m.kelas?.angkatan,
    tahunKurikulum: m.kelas?.tahunKurikulum?.tahun,
    jenisKelamin: m.jenisKelamin,
    tempatLahir: m.tempatLahir,
    tanggalLahir: m.tanggalLahir ? m.tanggalLahir.toISOString().split('T')[0] : null,
    periodeMasuk: m.periodeMasuk,
    jalurPendaftaran: m.jalurPendaftaran,
    dosenWaliId: m.dosenWaliId,
    dosenWaliNama: m.dosenWali?.nama,
  }),
  mapToPrisma: (d) => {
    return {
      nim: d.nim,
      nama: d.nama,
      kelasId: d.kelasId,
      prodiId: d.prodiId,
      jenisKelamin: d.jenisKelamin,
      tempatLahir: d.tempatLahir,
      tanggalLahir: d.tanggalLahir,
      periodeMasuk: d.periodeMasuk,
      jalurPendaftaran: d.jalurPendaftaran,
      status: d.status,
      dosenWaliId: d.dosenWaliId
    };
  },
  rowLabel: (m) => `${m.nim} - ${m.nama}`,
  exportColumns: [
    exp('nim', 'nim'),
    exp('nama', 'nama'),
    exp('kode_prodi', 'prodiKode'),
    exp('nama_kelas', 'kelasNama'),
    exp('email', 'email'),
    exp('jenis_kelamin', 'jenisKelamin'),
    exp('tempat_lahir', 'tempatLahir'),
    exp('tanggal_lahir', 'tanggalLahir'),
    exp('periode_masuk', 'periodeMasuk'),
    exp('jalur_pendaftaran', 'jalurPendaftaran'),
    exp('dosen_wali', 'dosenWaliNama'),
    exp('status', 'status'),
  ],
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
  afterWrite: async (record, previous, user, client, originalData) => {
    if (!previous) {
      await client.user.upsert({
        where: { username: record.nim },
        update: { 
          mahasiswaId: record.id,
          email: originalData.email || undefined,
          noHp: originalData.noHp || undefined
        },
        create: {
          username: record.nim,
          password: await hashDefault(record.nim),
          role: 'MAHASISWA',
          mahasiswaId: record.id,
          wajibLengkapiProfil: true,
          email: originalData.email || null,
          noHp: originalData.noHp || null
        },
      });
    } else {
      let targetUser = await client.user.findUnique({ where: { mahasiswaId: record.id } });
      if (previous.nim !== record.nim) {
        if (targetUser) {
          try {
            await client.user.update({
              where: { id: targetUser.id },
              data: { username: record.nim },
            });
          } catch (err) {
            throw ApiError.conflict(`Username ${record.nim} sudah digunakan akun lain`);
          }
        }
      }
      if (targetUser && (originalData.email !== undefined || originalData.noHp !== undefined)) {
        await client.user.update({
          where: { id: targetUser.id },
          data: {
            email: originalData.email !== undefined ? originalData.email : undefined,
            noHp: originalData.noHp !== undefined ? originalData.noHp : undefined
          }
        });
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
    { header: 'status', field: 'status', enum: ['AKTIF', 'NONAKTIF', 'LULUS', 'DO', 'MENGUNDURKAN_DIRI', 'CUTI'], default: 'AKTIF' },
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
