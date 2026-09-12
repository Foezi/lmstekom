import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();
async function run() {
  const jadwals = await db.jadwal.findMany({
    include: { matakuliah: true, dosen: true }
  });
  console.log("Jadwals:");
  jadwals.forEach(j => {
    console.log(`- Jadwal ID: ${j.id}, MK: ${j.matakuliah?.namaMk}, dosenId: ${j.dosenId}, Dosen Name: ${j.dosen?.namaDosen}`);
  });
}
run();
