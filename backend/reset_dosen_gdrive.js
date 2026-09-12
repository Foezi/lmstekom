import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.user.updateMany({
    where: { role: 'DOSEN' },
    data: {
      wajibLengkapiProfil: true,
      googleDriveConnected: false,
      googleAccessToken: null,
      googleRefreshToken: null,
      googleTokenExpiry: null
    }
  });
  console.log(`✅ Berhasil me-reset ${result.count} akun Dosen. Saat login, mereka akan diarahkan kembali ke halaman Lengkapi Profil untuk menghubungkan ulang Google Drive.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
