import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

async function run() {
  const where = {};
  where.dosenId = 1; // Simulate Dosen 1
  
  const rows = await db.jadwal.findMany({
      where,
      skip: 0,
      take: 10,
      include: {
        matakuliah: true,
      },
      orderBy: { id: 'desc' }
  });
  console.log("Rows for Dosen 1:", JSON.stringify(rows, null, 2));
}
run();
