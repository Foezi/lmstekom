-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'ADMIN_AKADEMIK', 'ADMIN_PRODI', 'DOSEN', 'MAHASISWA');

-- CreateEnum
CREATE TYPE "StatusAktif" AS ENUM ('AKTIF', 'NONAKTIF');

-- CreateEnum
CREATE TYPE "VerifikasiStatus" AS ENUM ('BELUM', 'TERVERIFIKASI');

-- CreateEnum
CREATE TYPE "OtpJenis" AS ENUM ('EMAIL', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "OtpStatus" AS ENUM ('PENDING', 'BERHASIL', 'GAGAL');

-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('SUKSES', 'SEBAGIAN', 'GAGAL');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "dosenId" INTEGER,
    "mahasiswaId" INTEGER,
    "prodiId" INTEGER,
    "emailAktif" TEXT,
    "noWhatsapp" TEXT,
    "statusVerifikasiEmail" "VerifikasiStatus" NOT NULL DEFAULT 'BELUM',
    "statusVerifikasiWa" "VerifikasiStatus" NOT NULL DEFAULT 'BELUM',
    "googleDriveConnected" BOOLEAN NOT NULL DEFAULT false,
    "wajibLengkapiProfil" BOOLEAN NOT NULL DEFAULT true,
    "firstLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerifikasiOtp" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "jenis" "OtpJenis" NOT NULL,
    "kodeOtp" TEXT NOT NULL,
    "dikirimPada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "kadaluarsaPada" TIMESTAMP(3) NOT NULL,
    "status" "OtpStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "VerifikasiOtp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "aktivitas" TEXT NOT NULL,
    "modul" TEXT NOT NULL,
    "waktu" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportLog" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "jenisData" TEXT NOT NULL,
    "jumlahBaris" INTEGER NOT NULL,
    "status" "ImportStatus" NOT NULL,
    "catatanError" JSONB,
    "waktu" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImportLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prodi" (
    "id" SERIAL NOT NULL,
    "kodeProdi" TEXT NOT NULL,
    "namaProdi" TEXT NOT NULL,
    "jenjang" TEXT NOT NULL,
    "ketuaProdiId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Prodi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Kelas" (
    "id" SERIAL NOT NULL,
    "prodiId" INTEGER NOT NULL,
    "namaKelas" TEXT NOT NULL,
    "angkatan" INTEGER NOT NULL,
    "semesterBerjalan" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Kelas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dosen" (
    "id" SERIAL NOT NULL,
    "nidn" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "email" TEXT,
    "noHp" TEXT,
    "status" "StatusAktif" NOT NULL DEFAULT 'AKTIF',
    "prodiId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dosen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mahasiswa" (
    "id" SERIAL NOT NULL,
    "nim" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "kelasId" INTEGER NOT NULL,
    "prodiId" INTEGER NOT NULL,
    "email" TEXT,
    "status" "StatusAktif" NOT NULL DEFAULT 'AKTIF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Mahasiswa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ruangan" (
    "id" SERIAL NOT NULL,
    "kodeRuangan" TEXT NOT NULL,
    "namaRuangan" TEXT NOT NULL,
    "kapasitas" INTEGER NOT NULL,
    "gedung" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ruangan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MataKuliah" (
    "id" SERIAL NOT NULL,
    "prodiId" INTEGER NOT NULL,
    "kodeMk" TEXT NOT NULL,
    "namaMk" TEXT NOT NULL,
    "sks" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MataKuliah_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_dosenId_key" ON "User"("dosenId");

-- CreateIndex
CREATE UNIQUE INDEX "User_mahasiswaId_key" ON "User"("mahasiswaId");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "VerifikasiOtp_userId_jenis_idx" ON "VerifikasiOtp"("userId", "jenis");

-- CreateIndex
CREATE INDEX "ActivityLog_waktu_idx" ON "ActivityLog"("waktu");

-- CreateIndex
CREATE INDEX "ActivityLog_modul_idx" ON "ActivityLog"("modul");

-- CreateIndex
CREATE INDEX "ImportLog_waktu_idx" ON "ImportLog"("waktu");

-- CreateIndex
CREATE UNIQUE INDEX "Prodi_kodeProdi_key" ON "Prodi"("kodeProdi");

-- CreateIndex
CREATE INDEX "Kelas_prodiId_idx" ON "Kelas"("prodiId");

-- CreateIndex
CREATE UNIQUE INDEX "Kelas_prodiId_namaKelas_key" ON "Kelas"("prodiId", "namaKelas");

-- CreateIndex
CREATE UNIQUE INDEX "Dosen_nidn_key" ON "Dosen"("nidn");

-- CreateIndex
CREATE INDEX "Dosen_prodiId_idx" ON "Dosen"("prodiId");

-- CreateIndex
CREATE UNIQUE INDEX "Mahasiswa_nim_key" ON "Mahasiswa"("nim");

-- CreateIndex
CREATE INDEX "Mahasiswa_kelasId_idx" ON "Mahasiswa"("kelasId");

-- CreateIndex
CREATE INDEX "Mahasiswa_prodiId_idx" ON "Mahasiswa"("prodiId");

-- CreateIndex
CREATE UNIQUE INDEX "Ruangan_kodeRuangan_key" ON "Ruangan"("kodeRuangan");

-- CreateIndex
CREATE INDEX "MataKuliah_prodiId_idx" ON "MataKuliah"("prodiId");

-- CreateIndex
CREATE UNIQUE INDEX "MataKuliah_prodiId_kodeMk_key" ON "MataKuliah"("prodiId", "kodeMk");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_dosenId_fkey" FOREIGN KEY ("dosenId") REFERENCES "Dosen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_mahasiswaId_fkey" FOREIGN KEY ("mahasiswaId") REFERENCES "Mahasiswa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_prodiId_fkey" FOREIGN KEY ("prodiId") REFERENCES "Prodi"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerifikasiOtp" ADD CONSTRAINT "VerifikasiOtp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportLog" ADD CONSTRAINT "ImportLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prodi" ADD CONSTRAINT "Prodi_ketuaProdiId_fkey" FOREIGN KEY ("ketuaProdiId") REFERENCES "Dosen"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kelas" ADD CONSTRAINT "Kelas_prodiId_fkey" FOREIGN KEY ("prodiId") REFERENCES "Prodi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dosen" ADD CONSTRAINT "Dosen_prodiId_fkey" FOREIGN KEY ("prodiId") REFERENCES "Prodi"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mahasiswa" ADD CONSTRAINT "Mahasiswa_kelasId_fkey" FOREIGN KEY ("kelasId") REFERENCES "Kelas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mahasiswa" ADD CONSTRAINT "Mahasiswa_prodiId_fkey" FOREIGN KEY ("prodiId") REFERENCES "Prodi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MataKuliah" ADD CONSTRAINT "MataKuliah_prodiId_fkey" FOREIGN KEY ("prodiId") REFERENCES "Prodi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
