import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();
async function run() {
  const count = await db.jadwal.count();
  console.log("Total jadwals:", count);
  const jadwals = await db.jadwal.findMany({
    include: { matakuliah: true }
  });
  console.log("Jadwals sample:", jadwals.slice(0,2).map(j => ({ id: j.id, mkId: j.matakuliah?.id })));
}
run();
