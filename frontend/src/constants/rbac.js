export const ROLES = {
  ADMIN: 'Administrator',
  ADMIN_AKADEMIK: 'Admin Akademik',
  ADMIN_PRODI: 'Admin Prodi',
  DOSEN: 'Dosen',
  MAHASISWA: 'Mahasiswa',
};

/** Mirror matriks RBAC blueprint §3.1 — dipakai untuk visibilitas tombol/menu. */
export const WRITE_ROLES = {
  prodi: ['ADMIN'],
  kelas: ['ADMIN', 'ADMIN_AKADEMIK', 'ADMIN_PRODI'],
  dosen: ['ADMIN', 'ADMIN_AKADEMIK', 'ADMIN_PRODI'],
  mahasiswa: ['ADMIN', 'ADMIN_AKADEMIK', 'ADMIN_PRODI'],
  ruangan: ['ADMIN', 'ADMIN_AKADEMIK'],
  kurikulum: ['ADMIN', 'ADMIN_AKADEMIK', 'ADMIN_PRODI'],
  'mata-kuliah': ['ADMIN', 'ADMIN_AKADEMIK', 'ADMIN_PRODI'],
  'tahun-akademik': ['ADMIN', 'ADMIN_AKADEMIK'],
  'kalender-akademik': ['ADMIN', 'ADMIN_AKADEMIK'],
  jadwal: ['ADMIN', 'ADMIN_AKADEMIK', 'ADMIN_PRODI'],
};

export const IMPORT_ROLES = {
  prodi: ['ADMIN'],
  kelas: ['ADMIN', 'ADMIN_AKADEMIK'],
  dosen: ['ADMIN', 'ADMIN_AKADEMIK'],
  mahasiswa: ['ADMIN', 'ADMIN_AKADEMIK'],
  ruangan: ['ADMIN', 'ADMIN_AKADEMIK'],
  kurikulum: ['ADMIN', 'ADMIN_AKADEMIK'],
  'mata-kuliah': ['ADMIN', 'ADMIN_AKADEMIK'],
  'tahun-akademik': ['ADMIN', 'ADMIN_AKADEMIK'],
  'kalender-akademik': ['ADMIN', 'ADMIN_AKADEMIK'],
  jadwal: ['ADMIN', 'ADMIN_AKADEMIK'],
};

/** Menu sidebar dinamis sesuai role. */
export const MENU = [
  { to: '/', label: 'Dashboard', roles: 'ALL' },
  { group: 'Perkuliahan' },
  { to: '/jadwal', label: 'Jadwal Kuliah', entity: 'jadwal', roles: ['ADMIN', 'ADMIN_AKADEMIK', 'ADMIN_PRODI', 'DOSEN', 'MAHASISWA'] },
  { to: '/materi', label: 'Materi Pembelajaran', roles: ['ADMIN', 'DOSEN', 'MAHASISWA'] },
  { to: '/tugas', label: 'Tugas & Kuis', roles: ['DOSEN', 'MAHASISWA'] },
  { to: '/diskusi', label: 'Ruang Diskusi', roles: ['ADMIN', 'DOSEN', 'MAHASISWA'] },
  { to: '/presensi', label: 'Rekap Presensi', roles: ['ADMIN', 'DOSEN', 'MAHASISWA'] },
  { to: '/nilai', label: 'Daftar Nilai', roles: ['ADMIN', 'DOSEN', 'MAHASISWA'] },
  { group: 'Data Master' },
  { to: '/tahun-akademik', label: 'Tahun Akademik', entity: 'tahun-akademik', roles: ['ADMIN', 'ADMIN_AKADEMIK'] },
  { to: '/kalender-akademik', label: 'Kalender Akademik', entity: 'kalender-akademik', roles: ['ADMIN', 'ADMIN_AKADEMIK'], hidden: true },
  { to: '/prodi', label: 'Program Studi', entity: 'prodi', roles: ['ADMIN', 'ADMIN_AKADEMIK', 'ADMIN_PRODI'] },
  { to: '/kurikulum', label: 'Tahun Kurikulum', entity: 'kurikulum', roles: ['ADMIN', 'ADMIN_AKADEMIK', 'ADMIN_PRODI'] },
  { to: '/mata-kuliah', label: 'Mata Kuliah', entity: 'mata-kuliah', roles: ['ADMIN', 'ADMIN_AKADEMIK', 'ADMIN_PRODI'] },
  { to: '/kelas', label: 'Kelas', entity: 'kelas', roles: ['ADMIN', 'ADMIN_AKADEMIK', 'ADMIN_PRODI', 'DOSEN', 'MAHASISWA'] },
  { to: '/mahasiswa', label: 'Mahasiswa', entity: 'mahasiswa', roles: ['ADMIN', 'ADMIN_AKADEMIK', 'ADMIN_PRODI', 'DOSEN'] },
  { to: '/dosen', label: 'Dosen', entity: 'dosen', roles: ['ADMIN', 'ADMIN_AKADEMIK', 'ADMIN_PRODI'] },
  { to: '/ruangan', label: 'Ruangan', entity: 'ruangan', roles: ['ADMIN', 'ADMIN_AKADEMIK', 'ADMIN_PRODI', 'DOSEN'] },
  { group: 'Lainnya' },
  { to: '/profil', label: 'Profil Saya', roles: 'ALL' },
  { to: '/logs', label: 'Log Sistem', roles: ['ADMIN'] },
];
