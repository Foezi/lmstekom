import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const hash = (plain) => bcrypt.hashSync(plain, 10);
// Password default akun dosen/mahasiswa = "<username>@poltek", wajib diganti saat login pertama
export const defaultPassword = (username) => `${username}@poltek`;

async function main() {
  console.log('Seeding...');

  const admin = await prisma.user.upsert({
    where: { username: 'superadmin' },
    update: {},
    create: {
      username: 'superadmin',
      password: hash('admin123'),
      role: 'ADMIN',
      wajibLengkapiProfil: false,
      statusVerifikasiEmail: 'TERVERIFIKASI',
      statusVerifikasiWa: 'TERVERIFIKASI',
    },
  });
  console.log('✓ superadmin / admin123');

  const prodiTI = await prisma.prodi.upsert({
    where: { kodeProdi: 'D4-TI' },
    update: {},
    create: { kodeProdi: 'D4-TI', namaProdi: 'Teknik Informatika', jenjang: 'D4' },
  });

  await prisma.prodi.upsert({
    where: { kodeProdi: 'D3-SI' },
    update: {},
    create: { kodeProdi: 'D3-SI', namaProdi: 'Sistem Informasi', jenjang: 'D3' },
  });

  const r101 = await prisma.ruangan.upsert({
    where: { kodeRuangan: 'R-101' },
    update: {},
    create: { kodeRuangan: 'R-101', namaRuangan: 'Lab Komputer 1', kapasitas: 36, gedung: 'Gedung A' },
  });
  await prisma.ruangan.upsert({
    where: { kodeRuangan: 'R-102' },
    update: {},
    create: { kodeRuangan: 'R-102', namaRuangan: 'Ruang Kelas 2', kapasitas: 40, gedung: 'Gedung A' },
  });

  const dosen1 = await prisma.dosen.upsert({
    where: { nidn: '0012345601' },
    update: {},
    create: {
      nidn: '0012345601',
      nama: 'Dr. Budi Santoso, M.Kom',
      email: 'budi.santoso@polteksukabumi.ac.id',
      noHp: '081200000001',
      status: 'AKTIF',
      prodiId: prodiTI.id,
    },
  });
  const dosen2 = await prisma.dosen.upsert({
    where: { nidn: '0012345602' },
    update: {},
    create: {
      nidn: '0012345602',
      nama: 'Ani Rahayu, S.T., M.T.',
      email: 'ani.rahayu@polteksukabumi.ac.id',
      noHp: '081200000002',
      status: 'AKTIF',
      prodiId: prodiTI.id,
    },
  });

  for (const d of [dosen1, dosen2]) {
    await prisma.user.upsert({
      where: { username: d.nidn },
      update: {},
      create: {
        username: d.nidn,
        password: hash(defaultPassword(d.nidn)),
        role: 'DOSEN',
        dosenId: d.id,
        wajibLengkapiProfil: true,
      },
    });
  }

  await prisma.prodi.update({
    where: { id: prodiTI.id },
    data: { ketuaProdiId: dosen1.id },
  });

  // Akun Admin Prodi untuk D4-TI
  await prisma.user.upsert({
    where: { username: 'adminti' },
    update: {},
    create: {
      username: 'adminti',
      password: hash('prodi123'),
      role: 'ADMIN_PRODI',
      prodiId: prodiTI.id,
      wajibLengkapiProfil: false,
      statusVerifikasiEmail: 'TERVERIFIKASI',
      statusVerifikasiWa: 'TERVERIFIKASI',
    },
  });

  const kelasTI4A = await prisma.kelas.upsert({
    where: { prodiId_namaKelas: { prodiId: prodiTI.id, namaKelas: 'TI-4A' } },
    update: {},
    create: { prodiId: prodiTI.id, namaKelas: 'TI-4A', angkatan: 2022, semesterBerjalan: 4 },
  });
  const kelasTI2B = await prisma.kelas.upsert({
    where: { prodiId_namaKelas: { prodiId: prodiTI.id, namaKelas: 'TI-2B' } },
    update: {},
    create: { prodiId: prodiTI.id, namaKelas: 'TI-2B', angkatan: 2024, semesterBerjalan: 2 },
  });

  const mhsSeed = [
    { nim: '2204001', nama: 'Ahmad Fauzi', kelasId: kelasTI4A.id, email: 'ahmad.fauzi@gmail.com' },
    { nim: '2204002', nama: 'Siti Nurhaliza', kelasId: kelasTI4A.id, email: 'siti.nurhaliza@gmail.com' },
    { nim: '2404003', nama: 'Rizky Pratama', kelasId: kelasTI2B.id, email: 'rizky.pratama@gmail.com' },
  ];
  for (const m of mhsSeed) {
    const mhs = await prisma.mahasiswa.upsert({
      where: { nim: m.nim },
      update: {},
      create: { ...m, prodiId: prodiTI.id, status: 'AKTIF' },
    });
    await prisma.user.upsert({
      where: { username: m.nim },
      update: {},
      create: {
        username: m.nim,
        password: hash(defaultPassword(m.nim)),
        role: 'MAHASISWA',
        mahasiswaId: mhs.id,
        wajibLengkapiProfil: true,
      },
    });
  }

  await prisma.mataKuliah.upsert({
    where: { prodiId_kodeMk: { prodiId: prodiTI.id, kodeMk: 'TI-301' } },
    update: {},
    create: { prodiId: prodiTI.id, kodeMk: 'TI-301', namaMk: 'Pemrograman Web', sks: 3 },
  });
  await prisma.mataKuliah.upsert({
    where: { prodiId_kodeMk: { prodiId: prodiTI.id, kodeMk: 'TI-302' } },
    update: {},
    create: { prodiId: protiSafe(prodiTI), kodeMk: 'TI-302', namaMk: 'Basis Data Lanjut', sks: 3 },
  });

  console.log(`✓ ${mhsSeed.length} mahasiswa + akun user (password default: <NIM>@poltek)`);
  console.log(`✓ Ruangan contoh: ${r101.kodeRuangan}`);
  console.log('Seeding selesai.');
}

function protiSafe(p) {
  return p.id;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
