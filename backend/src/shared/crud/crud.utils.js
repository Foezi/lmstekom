import bcrypt from 'bcrypt';
export const ADMIN_TRIO = ['ADMIN', 'ADMIN_AKADEMIK', 'ADMIN_PRODI'];
export const ADMIN_DUO = ['ADMIN', 'ADMIN_AKADEMIK'];
export const hashDefault = async (username) => bcrypt.hash(username + '@poltek', 10);
export const exp = (header, key) => ({ header, key });
const refCaches = {
  async prodi(client) {
    const rows = await client.prodi.findMany({ select: { id: true, kodeProdi: true } });
    return { prodiByKode: new Map(rows.map((r) => [r.kodeProdi, r.id])) };
  },
  async kelas(client) {
    const rows = await client.kelas.findMany({ select: { id: true, prodiId: true, namaKelas: true } });
    return { kelasByProdiDanNama: new Map(rows.map((r) => [r.prodiId + '|' + r.namaKelas, r.id])) };
  },
  async dosen(client) {
    const rows = await client.dosen.findMany({ select: { id: true, nidn: true } });
    return { dosenByNidn: new Map(rows.map((r) => [r.nidn, r.id])) };
  },
  async kurikulum(client) {
    const rows = await client.tahunKurikulum.findMany({ select: { id: true, tahun: true, prodiId: true } });
    return { kurikulumByProdiDanTahun: new Map(rows.map((r) => [r.prodiId + '|' + r.tahun, r.id])) };
  },
};
export const mergeCaches = async (client, ...refs) => {
  const out = {};
  for (const ref of refs) Object.assign(out, await refCaches[ref](client));
  return out;
};
