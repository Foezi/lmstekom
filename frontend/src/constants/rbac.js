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
  'mata-kuliah': ['ADMIN', 'ADMIN_AKADEMIK', 'ADMIN_PRODI'],
};

export const IMPORT_ROLES = {
  prodi: ['ADMIN'],
  kelas: ['ADMIN', 'ADMIN_AKADEMIK'],
  dosen: ['ADMIN', 'ADMIN_AKADEMIK'],
  mahasiswa: ['ADMIN', 'ADMIN_AKADEMIK'],
  ruangan: ['ADMIN', 'ADMIN_AKADEMIK'],
  'mata-kuliah': ['ADMIN', 'ADMIN_AKADEMIK'],
};

/** Menu sidebar dinamis sesuai role. */
export const MENU = [
  { to: '/', label: 'Dashboard', roles: 'ALL' },
  { group: 'Data Master' },
  { to: '/prodi', label: 'Program Studi', entity: 'prodi', roles: ['ADMIN', 'ADMIN_AKADEMIK', 'ADMIN_PRODI'] },
  { to: '/kelas', label: 'Kelas', entity: 'kelas', roles: ['ADMIN', 'ADMIN_AKADEMIK', 'ADMIN_PRODI', 'DOSEN', 'MAHASISWA'] },
  { to: '/dosen', label: 'Dosen', entity: 'dosen', roles: ['ADMIN', 'ADMIN_AKADEMIK', 'ADMIN_PRODI'] },
  { to: '/mahasiswa', label: 'Mahasiswa', entity: 'mahasiswa', roles: ['ADMIN', 'ADMIN_AKADEMIK', 'ADMIN_PRODI', 'DOSEN'] },
  { to: '/ruangan', label: 'Ruangan', entity: 'ruangan', roles: ['ADMIN', 'ADMIN_AKADEMIK', 'ADMIN_PRODI', 'DOSEN'] },
  { to: '/mata-kuliah', label: 'Mata Kuliah', entity: 'mata-kuliah', roles: ['ADMIN', 'ADMIN_AKADEMIK', 'ADMIN_PRODI'] },
  { group: 'Lainnya' },
  { to: '/profil', label: 'Profil Saya', roles: 'ALL' },
  { to: '/logs', label: 'Log Sistem', roles: ['ADMIN'] },
];
