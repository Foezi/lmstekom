import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();
async function run() {
  const users = await db.user.findMany({
    include: { dosen: true }
  });
  console.log("Users:", users.map(u => ({ username: u.username, role: u.role, dosenId: u.dosenId })));
}
run();
