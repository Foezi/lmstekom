import fs from 'fs';
import path from 'path';

const backendDir = '/home/foezi/Documents/Documents/Politeknik Sukabumi/LMS Politeknik Sukabumi/lmstekom/backend';
const srcDir = path.join(backendDir, 'src');
const masterDir = path.join(srcDir, 'modules', 'master');
const perkuliahanDir = path.join(srcDir, 'modules', 'perkuliahan');
const crudDir = path.join(srcDir, 'shared', 'crud');

// 1. Move generic engine to shared/crud
fs.mkdirSync(crudDir, { recursive: true });
fs.renameSync(path.join(masterDir, 'master.controller.js'), path.join(crudDir, 'crud.controller.js'));
fs.renameSync(path.join(masterDir, 'master.service.js'), path.join(crudDir, 'crud.service.js'));
fs.renameSync(path.join(masterDir, 'master.routes.js'), path.join(crudDir, 'crud.routes.js'));

// Read master.configs.js
const configsContent = fs.readFileSync(path.join(masterDir, 'master.configs.js'), 'utf-8');

// 2. Extract shared utils
const sharedUtils = `import { z } from 'zod';
import bcrypt from 'bcrypt';
import { ApiError } from '../utils/apiError.js';

export const ADMIN_TRIO = ['ADMIN', 'ADMIN_AKADEMIK', 'ADMIN_PRODI'];
export const ADMIN_DUO = ['ADMIN', 'ADMIN_AKADEMIK'];

export const hashDefault = async (username) => bcrypt.hash(\`\${username}@poltek\`, 10);

export const refCaches = {
  async prodi(client) {
    const rows = await client.prodi.findMany({ select: { id: true, kodeProdi: true } });
    return { prodiByKode: new Map(rows.map((r) => [r.kodeProdi, r.id])) };
  },
  async kelas(client) {
    const rows = await client.kelas.findMany({ select: { id: true, prodiId: true, namaKelas: true } });
    return { kelasByProdiDanNama: new Map(rows.map((r) => [\`\${r.prodiId}|\${r.namaKelas}\`, r.id])) };
  },
  async dosen(client) {
    const rows = await client.dosen.findMany({ select: { id: true, nidn: true } });
    return { dosenByNidn: new Map(rows.map((r) => [r.nidn, r.id])) };
  },
  async kurikulum(client) {
    const rows = await client.tahunKurikulum.findMany({ select: { id: true, tahun: true, prodiId: true } });
    return { kurikulumByProdiDanTahun: new Map(rows.map((r) => [\`\${r.prodiId}|\${r.tahun}\`, r.id])) };
  },
};

export const mergeCaches = async (client, ...refs) => {
  const out = {};
  for (const ref of refs) Object.assign(out, await refCaches[ref](client));
  return out;
};

export const EMAIL_RE = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
export const exp = (header, key) => ({ header, key });
`;
fs.writeFileSync(path.join(crudDir, 'crud.utils.js'), sharedUtils);

// 3. Create module folders and extract configs
const modules = [
  { name: 'prodi', folder: masterDir, configName: 'prodiConfig' },
  { name: 'kelas', folder: masterDir, configName: 'kelasConfig' },
  { name: 'dosen', folder: masterDir, configName: 'dosenConfig' },
  { name: 'mahasiswa', folder: masterDir, configName: 'mahasiswaConfig' },
  { name: 'ruangan', folder: masterDir, configName: 'ruanganConfig' },
  { name: 'kurikulum', folder: masterDir, configName: 'kurikulumConfig' },
  { name: 'matakuliah', folder: masterDir, configName: 'mataKuliahConfig' },
  { name: 'tahun-akademik', folder: masterDir, configName: 'tahunAkademikConfig' },
  { name: 'jadwal', folder: perkuliahanDir, configName: 'jadwalConfig' }
];

for (const mod of modules) {
  const modDir = path.join(mod.folder, mod.name);
  fs.mkdirSync(modDir, { recursive: true });
  
  // Try to find the block
  let regexPattern = `// ============================================================\\s*// [\\s\\S]*?export const ${mod.configName} = [\\s\\S]*?loadRefCaches:\\s*.*\\s*};`;
  let blockRegex = new RegExp(regexPattern);
  
  let match = configsContent.match(blockRegex);
  
  if (match) {
    let content = match[0];
    const imports = `import { z } from 'zod';
import { ApiError } from '../../../shared/utils/apiError.js';
import { ADMIN_TRIO, ADMIN_DUO, hashDefault, mergeCaches, EMAIL_RE, exp } from '../../../shared/crud/crud.utils.js';

`;
    fs.writeFileSync(path.join(modDir, `${mod.name}.config.js`), imports + content);
    
    // Create routes
    const routesContent = `import { buildCrudRouter } from '../../../shared/crud/crud.routes.js';
import { ${mod.configName} } from './${mod.name}.config.js';

export default buildCrudRouter(${mod.configName});
`;
    fs.writeFileSync(path.join(modDir, `${mod.name}.routes.js`), routesContent);
  } else {
    console.log("Could not match: " + mod.name);
  }
}

// 4. Clean up old master configs
fs.unlinkSync(path.join(masterDir, 'master.configs.js'));

// 5. Update crud.routes.js
let crudRoutes = fs.readFileSync(path.join(crudDir, 'crud.routes.js'), 'utf-8');
crudRoutes = crudRoutes.replace("import { createCrudController } from './master.controller.js';", "import { createCrudController } from './crud.controller.js';");
crudRoutes = crudRoutes.replace("import { MasterService } from './master.service.js';", "import { CrudService } from './crud.service.js';");
crudRoutes = crudRoutes.replace(/buildMasterRouter/g, "buildCrudRouter");
fs.writeFileSync(path.join(crudDir, 'crud.routes.js'), crudRoutes);

// 6. Update crud.controller.js
let crudController = fs.readFileSync(path.join(crudDir, 'crud.controller.js'), 'utf-8');
crudController = crudController.replace("../../shared/utils/", "../utils/");
fs.writeFileSync(path.join(crudDir, 'crud.controller.js'), crudController);

// 7. Update crud.service.js
let crudService = fs.readFileSync(path.join(crudDir, 'crud.service.js'), 'utf-8');
crudService = crudService.replace(/MasterService/g, "CrudService");
crudService = crudService.replace("../../shared/utils/", "../utils/");
crudService = crudService.replace("import { ApiError }", "import { db } from '../../core/database.js';\nimport { ApiError }");
crudService = crudService.replace(/import \{ db \}.*\n/, "import { db } from '../../core/database.js';\n"); // fix if double

fs.writeFileSync(path.join(crudDir, 'crud.service.js'), crudService);

// 8. Update app.js
let appJs = fs.readFileSync(path.join(srcDir, 'app.js'), 'utf-8');
appJs = appJs.replace(/import \{ MASTER_CONFIGS \} from '\.\/modules\/master\/master\.configs\.js';\n/g, '');
appJs = appJs.replace(/import \{ buildMasterRouter \} from '\.\/modules\/master\/master\.routes\.js';\n/g, '');

const newImports = `import prodiRoutes from './modules/master/prodi/prodi.routes.js';
import kelasRoutes from './modules/master/kelas/kelas.routes.js';
import dosenRoutes from './modules/master/dosen/dosen.routes.js';
import mahasiswaRoutes from './modules/master/mahasiswa/mahasiswa.routes.js';
import ruanganRoutes from './modules/master/ruangan/ruangan.routes.js';
import kurikulumRoutes from './modules/master/kurikulum/kurikulum.routes.js';
import matakuliahRoutes from './modules/master/matakuliah/matakuliah.routes.js';
import tahunAkademikRoutes from './modules/master/tahun-akademik/tahun-akademik.routes.js';
import jadwalRoutes from './modules/perkuliahan/jadwal/jadwal.routes.js';
`;
appJs = appJs.replace("export function createApp()", newImports + "\nexport function createApp()");

const newRoutes = `  app.use('/api/prodi', prodiRoutes);
  app.use('/api/kelas', kelasRoutes);
  app.use('/api/dosen', dosenRoutes);
  app.use('/api/mahasiswa', mahasiswaRoutes);
  app.use('/api/ruangan', ruanganRoutes);
  app.use('/api/kurikulum', kurikulumRoutes);
  app.use('/api/mata-kuliah', matakuliahRoutes);
  app.use('/api/tahun-akademik', tahunAkademikRoutes);
  app.use('/api/jadwal', jadwalRoutes);
`;
appJs = appJs.replace(/  for \(const \[key, config\] of Object\.entries\(MASTER_CONFIGS\)\) \{\n    app\.use\(\`\/api\/\$\{key\}\`, buildMasterRouter\(config\)\);\n  \}/g, newRoutes);
fs.writeFileSync(path.join(srcDir, 'app.js'), appJs);

console.log("Refactoring complete");
