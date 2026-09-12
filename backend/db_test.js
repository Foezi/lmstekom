import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const activeTahun = await prisma.tahunAkademik.findFirst({
    where: { status: 'AKTIF' },
  });
  console.log('Active Tahun:', activeTahun);
  
  const agendas = await prisma.kalenderAkademik.findMany({
    where: { tahunAkademikId: activeTahun.id }
  });
  console.log('Agendas:', agendas);
  
  const jadwals = await prisma.jadwal.findMany({
    where: { tahunAkademikId: activeTahun.id }
  });
  console.log('Jadwals Hari:', jadwals.map(j => j.hari));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
