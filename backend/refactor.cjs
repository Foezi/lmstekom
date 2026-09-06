const fs = require('fs');
const path = require('path');

const MASTER_DIR = '/home/foezi/Documents/Documents/Politeknik Sukabumi/LMS Politeknik Sukabumi/lmstekom/backend/src/modules/master';
const PERKULIAHAN_DIR = '/home/foezi/Documents/Documents/Politeknik Sukabumi/LMS Politeknik Sukabumi/lmstekom/backend/src/modules/perkuliahan';
const SHARED_CRUD_DIR = '/home/foezi/Documents/Documents/Politeknik Sukabumi/LMS Politeknik Sukabumi/lmstekom/backend/src/shared/crud';

fs.mkdirSync(SHARED_CRUD_DIR, { recursive: true });

const controllerStr = fs.readFileSync(path.join(MASTER_DIR, 'master.controller.js'), 'utf-8');
const routesStr = fs.readFileSync(path.join(MASTER_DIR, 'master.routes.js'), 'utf-8');
const serviceStr = fs.readFileSync(path.join(MASTER_DIR, 'master.service.js'), 'utf-8');
const configsStr = fs.readFileSync(path.join(MASTER_DIR, 'master.configs.js'), 'utf-8');

fs.writeFileSync(path.join(SHARED_CRUD_DIR, 'crud.controller.js'), controllerStr.replace(/..\/..\/shared\//g, '../'));
fs.writeFileSync(path.join(SHARED_CRUD_DIR, 'crud.service.js'), serviceStr.replace(/..\/..\/core\//g, '../../core/').replace(/..\/..\/shared\//g, '../'));
fs.writeFileSync(path.join(SHARED_CRUD_DIR, 'crud.routes.js'), routesStr.replace(/..\/..\/shared\//g, '../').replace(/.\/master.controller.js/, './crud.controller.js'));

const utilsContent = "import bcrypt from 'bcrypt';\n" +
"export const ADMIN_TRIO = ['ADMIN', 'ADMIN_AKADEMIK', 'ADMIN_PRODI'];\n" +
"export const ADMIN_DUO = ['ADMIN', 'ADMIN_AKADEMIK'];\n" +
"export const hashDefault = async (username) => bcrypt.hash(username + '@poltek', 10);\n" +
"export const exp = (header, key) => ({ header, key });\n" +
"const refCaches = {\n" +
"  async prodi(client) {\n" +
"    const rows = await client.prodi.findMany({ select: { id: true, kodeProdi: true } });\n" +
"    return { prodiByKode: new Map(rows.map((r) => [r.kodeProdi, r.id])) };\n" +
"  },\n" +
"  async kelas(client) {\n" +
"    const rows = await client.kelas.findMany({ select: { id: true, prodiId: true, namaKelas: true } });\n" +
"    return { kelasByProdiDanNama: new Map(rows.map((r) => [r.prodiId + '|' + r.namaKelas, r.id])) };\n" +
"  },\n" +
"  async dosen(client) {\n" +
"    const rows = await client.dosen.findMany({ select: { id: true, nidn: true } });\n" +
"    return { dosenByNidn: new Map(rows.map((r) => [r.nidn, r.id])) };\n" +
"  },\n" +
"  async kurikulum(client) {\n" +
"    const rows = await client.tahunKurikulum.findMany({ select: { id: true, tahun: true, prodiId: true } });\n" +
"    return { kurikulumByProdiDanTahun: new Map(rows.map((r) => [r.prodiId + '|' + r.tahun, r.id])) };\n" +
"  },\n" +
"};\n" +
"export const mergeCaches = async (client, ...refs) => {\n" +
"  const out = {};\n" +
"  for (const ref of refs) Object.assign(out, await refCaches[ref](client));\n" +
"  return out;\n" +
"};\n";
fs.writeFileSync(path.join(SHARED_CRUD_DIR, 'crud.utils.js'), utilsContent);

const entities = [
  { folder: path.join(MASTER_DIR, 'prodi'), schema: 'prodiSchema', config: 'prodiConfig' },
  { folder: path.join(MASTER_DIR, 'dosen'), schema: 'dosenSchema', config: 'dosenConfig' },
  { folder: path.join(MASTER_DIR, 'mahasiswa'), schema: 'mahasiswaSchema', config: 'mahasiswaConfig' },
  { folder: path.join(MASTER_DIR, 'kelas'), schema: 'kelasSchema', config: 'kelasConfig' },
  { folder: path.join(MASTER_DIR, 'ruangan'), schema: 'ruanganSchema', config: 'ruanganConfig' },
  { folder: path.join(MASTER_DIR, 'kurikulum'), schema: 'kurikulumSchema', config: 'kurikulumConfig' },
  { folder: path.join(MASTER_DIR, 'matakuliah'), schema: 'mataKuliahSchema', config: 'mataKuliahConfig' },
  { folder: path.join(MASTER_DIR, 'tahun-akademik'), schema: 'tahunAkademikSchema', config: 'tahunAkademikConfig' },
  { folder: path.join(PERKULIAHAN_DIR, 'jadwal'), schema: 'jadwalSchema', config: 'jadwalConfig' },
];

for (const ent of entities) {
  fs.mkdirSync(ent.folder, { recursive: true });
  
  const startIdx = configsStr.indexOf("const " + ent.schema);
  let endIdx = configsStr.indexOf("// ======", configsStr.indexOf("export const " + ent.config));
  if (endIdx === -1) endIdx = configsStr.indexOf("export const MASTER_CONFIGS");
  if (endIdx === -1) endIdx = configsStr.length;
  
  const block = configsStr.substring(startIdx, endIdx).trim();
  
  let depth = '../../';
  if (ent.folder.includes('perkuliahan')) depth = '../../'; 
  
  const configContent = "import { z } from 'zod';\n" +
    "import { ApiError } from '" + depth + "shared/utils/apiError.js';\n" +
    "import { ADMIN_TRIO, ADMIN_DUO, hashDefault, exp, mergeCaches } from '" + depth + "shared/crud/crud.utils.js';\n\n" +
    block + "\n";

  const routeContent = "import { buildMasterRouter } from '" + depth + "shared/crud/crud.routes.js';\n" +
    "import { " + ent.config + " } from './" + path.basename(ent.folder) + ".config.js';\n\n" +
    "export default buildMasterRouter(" + ent.config + ");\n";

  fs.writeFileSync(path.join(ent.folder, path.basename(ent.folder) + ".config.js"), configContent);
  fs.writeFileSync(path.join(ent.folder, path.basename(ent.folder) + ".routes.js"), routeContent);
}

fs.unlinkSync(path.join(MASTER_DIR, 'master.controller.js'));
fs.unlinkSync(path.join(MASTER_DIR, 'master.routes.js'));
fs.unlinkSync(path.join(MASTER_DIR, 'master.service.js'));
fs.unlinkSync(path.join(MASTER_DIR, 'master.configs.js'));
console.log('DONE');
