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

export const MENU = [
  { to: '/', label: 'Dashboard', roles: 'ALL', icon: 'LayoutDashboard' },
  { group: 'Perkuliahan', icon: 'GraduationCap' },
  { to: '/jadwal', label: 'Jadwal Kuliah', entity: 'jadwal', roles: ['ADMIN', 'ADMIN_AKADEMIK', 'ADMIN_PRODI', 'DOSEN', 'MAHASISWA'], icon: 'Calendar' },
  { to: '/materi', label: 'Materi Pembelajaran', roles: ['ADMIN', 'DOSEN', 'MAHASISWA'], icon: 'BookOpen' },
  { to: '/tugas-kuis', label: 'Kelola Tugas & Kuis', roles: ['DOSEN'], icon: 'ClipboardList' },
  { to: '/ujian', label: 'Kelola Ujian', roles: ['DOSEN'], icon: 'FileText' },
  { to: '/presensi', label: 'Rekap Presensi', roles: ['ADMIN', 'DOSEN', 'MAHASISWA'], icon: 'UserCheck' },
  { to: '/nilai', label: 'Daftar Nilai', roles: ['ADMIN', 'MAHASISWA'], icon: 'Award' },
  { to: '/rekap-penilaian', label: 'Rekap Penilaian', roles: ['DOSEN'], icon: 'FileSpreadsheet' },
  { group: 'Ruang Diskusi', icon: 'MessageCircle' },
  { to: '/diskusi', label: 'Ruang Diskusi', roles: ['ADMIN', 'DOSEN', 'MAHASISWA'], icon: 'MessageCircle' },
  { group: 'Data Master', icon: 'Database' },
  { to: '/tahun-akademik', label: 'Tahun Akademik', entity: 'tahun-akademik', roles: ['ADMIN', 'ADMIN_AKADEMIK'], icon: 'CalendarDays' },
  { to: '/kalender-akademik', label: 'Kalender Akademik', entity: 'kalender-akademik', roles: ['ADMIN', 'ADMIN_AKADEMIK'], hidden: true, icon: 'Calendar' },
  { to: '/prodi', label: 'Program Studi', entity: 'prodi', roles: ['ADMIN', 'ADMIN_AKADEMIK', 'ADMIN_PRODI'], icon: 'Building' },
  { to: '/kurikulum', label: 'Tahun Kurikulum', entity: 'kurikulum', roles: ['ADMIN', 'ADMIN_AKADEMIK', 'ADMIN_PRODI'], icon: 'Book' },
  { to: '/mata-kuliah', label: 'Mata Kuliah', entity: 'mata-kuliah', roles: ['ADMIN', 'ADMIN_AKADEMIK', 'ADMIN_PRODI'], icon: 'Library' },
  { to: '/kelas', label: 'Kelas', entity: 'kelas', roles: ['ADMIN', 'ADMIN_AKADEMIK', 'ADMIN_PRODI'], icon: 'Users' },
  { to: '/mahasiswa', label: 'Mahasiswa', entity: 'mahasiswa', roles: ['ADMIN', 'ADMIN_AKADEMIK', 'ADMIN_PRODI'], icon: 'GraduationCap' },
  { to: '/dosen', label: 'Dosen', entity: 'dosen', roles: ['ADMIN', 'ADMIN_AKADEMIK', 'ADMIN_PRODI'], icon: 'UserCircle' },
  { to: '/ruangan', label: 'Ruangan', entity: 'ruangan', roles: ['ADMIN', 'ADMIN_AKADEMIK', 'ADMIN_PRODI'], icon: 'MapPin' },
  { group: 'Lainnya' },
  { to: '/profil', label: 'Profil Saya', roles: 'ALL', icon: 'User' },
  { to: '/logs', label: 'Log Sistem', roles: ['ADMIN'], icon: 'Activity' },
];
