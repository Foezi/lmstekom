import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.pertemuan.deleteMany({});
  console.log(`Deleted ${count.count} pertemuan records`);
  
  const updated = await prisma.mengajar.updateMany({
    data: { totalPertemuan: 0 }
  });
  console.log(`Updated ${updated.count} mengajar records to 0 totalPertemuan`);
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
