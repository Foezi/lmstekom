import { signToken } from './src/shared/utils/jwt.js';
import { db } from './src/core/database.js';

async function run() {
  const user = await db.user.findFirst({ where: { role: 'DOSEN' } });
  const token = signToken({ id: user.id, role: user.role, dosenId: user.dosenId });
  console.log("Token:", token);
}
run();
