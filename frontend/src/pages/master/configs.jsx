/**
 * Konfigurasi UI halaman master data (kolom tabel & field form).
 * Hak akses tombol mengikuti matriks RBAC blueprint §3.1 (lihat constants/rbac.js).
 */
export const MASTER_UI = {
  prodi: {
    title: 'Program Studi',
    roles: ['ADMIN', 'ADMIN_AKADEMIK', 'ADMIN_PRODI'],
    columns: [
      { key: 'kodeProdi', label: 'Kode' },
      { key: 'namaProdi', label: 'Nama Program Studi' },
      { key: 'jenjang', label: 'Jenjang' },
      { key: 'ketuaProdiNama', label: 'Ketua Prodi', render: (r) => r.ketuaProdiNama || '-' },
    ],
    fields: [
      { name: 'kodeProdi', label: 'Kode Prodi', required: true },
      { name: 'namaProdi', label: 'Nama Program Studi', required: true },
      { name: 'jenjang', label: 'Jenjang', type: 'select', required: true, options: ['D2', 'D3', 'D4', 'S1', 'S2', 'S3', 'Profesi'].map((j) => ({ value: j, label: j })) },
      { name: 'ketuaProdiId', label: 'Ketua Prodi (opsional)', type: 'ref', refEntity: 'dosen' },
    ],
  },

  kelas: {
    title: 'Kelas',
    roles: ['ADMIN', 'ADMIN_AKADEMIK', 'ADMIN_PRODI', 'DOSEN', 'MAHASISWA'],
    columns: [
      { key: 'prodiKode', label: 'Prodi' },
      { key: 'namaKelas', label: 'Nama Kelas' },
      { key: 'angkatan', label: 'Angkatan' },
      { key: 'semesterBerjalan', label: 'Smt Berjalan' },
    ],
    fields: [
      { name: 'prodiId', label: 'Program Studi', type: 'ref', refEntity: 'prodi', required: true },
      { name: 'namaKelas', label: 'Nama Kelas', required: true },
      { name: 'angkatan', label: 'Angkatan', type: 'number', required: true },
      { name: 'semesterBerjalan', label: 'Semester Berjalan', type: 'number', default: 1 },
    ],
  },

  dosen: {
    title: 'Dosen',
    roles: ['ADMIN', 'ADMIN_AKADEMIK', 'ADMIN_PRODI'],
    columns: [
      { key: 'nidn', label: 'NIDN' },
      { key: 'nama', label: 'Nama' },
      { key: 'email', label: 'Email' },
      { key: 'noHp', label: 'No. HP', render: (r) => r.noHp || '-' },
      { key: 'status', label: 'Status', render: badgeRender },
      { key: 'prodiKode', label: 'Prodi', render: (r) => r.prodiKode || '-' },
    ],
    fields: [
      { name: 'nidn', label: 'NIDN', required: true },
      { name: 'nama', label: 'Nama Lengkap (dengan gelar)', required: true },
      { name: 'email', label: 'Email' },
      { name: 'noHp', label: 'No. HP' },
      { name: 'status', label: 'Status', type: 'select', options: [
        { value: 'AKTIF', label: 'Aktif' },
        { value: 'NONAKTIF', label: 'Nonaktif' },
      ], default: 'AKTIF' },
      { name: 'prodiId', label: 'Program Studi (opsional)', type: 'ref', refEntity: 'prodi' },
    ],
  },

  mahasiswa: {
    title: 'Mahasiswa',
    roles: ['ADMIN', 'ADMIN_AKADEMIK', 'ADMIN_PRODI', 'DOSEN'],
    columns: [
      { key: 'nim', label: 'NIM' },
      { key: 'nama', label: 'Nama' },
      { key: 'kelasNama', label: 'Kelas' },
      { key: 'prodiKode', label: 'Prodi' },
      { key: 'status', label: 'Status', render: badgeRender },
    ],
    fields: [
      { name: 'nim', label: 'NIM', required: true },
      { name: 'nama', label: 'Nama Lengkap', required: true },
      { name: 'prodiId', label: 'Program Studi', type: 'ref', refEntity: 'prodi', required: true },
      { name: 'kelasId', label: 'Kelas', type: 'ref', refEntity: 'kelas', dependsOn: 'prodiId', required: true },
      { name: 'email', label: 'Email' },
      { name: 'status', label: 'Status', type: 'select', options: [
        { value: 'AKTIF', label: 'Aktif' },
        { value: 'NONAKTIF', label: 'Nonaktif' },
      ], default: 'AKTIF' },
    ],
  },

  ruangan: {
    title: 'Ruangan',
    roles: ['ADMIN', 'ADMIN_AKADEMIK', 'ADMIN_PRODI', 'DOSEN'],
    columns: [
      { key: 'kodeRuangan', label: 'Kode Ruangan' },
      { key: 'namaRuangan', label: 'Nama Ruangan' },
      { key: 'kapasitas', label: 'Kapasitas' },
      { key: 'gedung', label: 'Gedung', render: (r) => r.gedung || '-' },
    ],
    fields: [
      { name: 'kodeRuangan', label: 'Kode Ruangan', required: true },
      { name: 'namaRuangan', label: 'Nama Ruangan', required: true },
      { name: 'kapasitas', label: 'Kapasitas', type: 'number', required: true },
      { name: 'gedung', label: 'Gedung' },
    ],
  },

  'mata-kuliah': {
    title: 'Mata Kuliah',
    roles: ['ADMIN', 'ADMIN_AKADEMIK', 'ADMIN_PRODI'],
    columns: [
      { key: 'prodiKode', label: 'Prodi' },
      { key: 'kodeMk', label: 'Kode MK' },
      { key: 'namaMk', label: 'Nama Mata Kuliah' },
      { key: 'sks', label: 'SKS' },
    ],
    fields: [
      { name: 'prodiId', label: 'Program Studi', type: 'ref', refEntity: 'prodi', required: true },
      { name: 'kodeMk', label: 'Kode MK', required: true },
      { name: 'namaMk', label: 'Nama Mata Kuliah', required: true },
      { name: 'sks', label: 'SKS', type: 'number', required: true },
    ],
  },
};

function badgeRender(r) {
  return r.status;
}

export { badgeRender };
