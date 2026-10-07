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
      { key: 'tahunKurikulum', label: 'Kurikulum', render: (r) => r.tahunKurikulum ? `Tahun ${r.tahunKurikulum}` : '-' },
    ],
    fields: [
      { name: 'prodiId', label: 'Program Studi', type: 'ref', refEntity: 'prodi', required: true },
      { name: 'namaKelas', label: 'Nama Kelas', required: true },
      { name: 'angkatan', label: 'Angkatan', type: 'number', required: true },
      { name: 'tahunKurikulumId', label: 'Tahun Kurikulum', type: 'ref', refEntity: 'kurikulum', dependsOn: 'prodiId', required: true, filter: (r, form) => r.prodiId === form.prodiId },
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
      {
        name: 'status', label: 'Status', type: 'select', options: [
          { value: 'AKTIF', label: 'Aktif' },
          { value: 'NONAKTIF', label: 'Nonaktif' },
        ], default: 'AKTIF'
      },
      { name: 'prodiId', label: 'Program Studi (opsional)', type: 'ref', refEntity: 'prodi' },
    ],
  },

  mahasiswa: {
    title: 'Mahasiswa',
    roles: ['ADMIN', 'ADMIN_AKADEMIK', 'ADMIN_PRODI', 'DOSEN'],
    columns: [
      { key: 'nim', label: 'NIM' },
      { key: 'nama', label: 'Nama' },
      { key: 'email', label: 'Email', render: (r) => r.email || '-' },
      { key: 'status', label: 'Status', render: badgeRender },
    ],
    fields: [
      { name: 'nim', label: 'NIM', required: true },
      { name: 'nama', label: 'Nama Lengkap', required: true },
      { name: 'prodiId', label: 'Program Studi', type: 'ref', refEntity: 'prodi', required: true },
      { name: 'kelasId', label: 'Kelas', type: 'ref', refEntity: 'kelas', dependsOn: 'prodiId', required: true, filter: (r, form) => r.prodiId === form.prodiId },
      { name: 'email', label: 'Email', type: 'email' },
      {
        name: 'jenisKelamin', label: 'Jenis Kelamin', type: 'select', options: [
          { value: 'L', label: 'Laki-Laki' },
          { value: 'P', label: 'Perempuan' }
        ]
      },
      { name: 'tempatLahir', label: 'Tempat Lahir' },
      { name: 'tanggalLahir', label: 'Tanggal Lahir', type: 'date' },
      { name: 'periodeMasuk', label: 'Periode Masuk (Cth: 2025/2026 Ganjil)' },
      { name: 'jalurPendaftaran', label: 'Jalur Pendaftaran (Cth: KIP/Mandiri)' },
      {
        name: 'status', label: 'Status', type: 'select', options: [
          { value: 'AKTIF', label: 'Aktif' },
          { value: 'NONAKTIF', label: 'Nonaktif' },
          { value: 'LULUS', label: 'Lulus' },
          { value: 'DO', label: 'Drop Out (DO)' },
          { value: 'MENGUNDURKAN_DIRI', label: 'Mengundurkan Diri' },
          { value: 'CUTI', label: 'Cuti' },
        ], default: 'AKTIF'
      },
      { name: 'dosenWaliId', label: 'Dosen Pembimbing (PA)', type: 'ref', refEntity: 'dosen' },
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
      { key: 'tahunKurikulum', label: 'Kurikulum', render: (r) => r.tahunKurikulum ? `Tahun ${r.tahunKurikulum}` : '-' },
      { key: 'semester', label: 'Semester' },
      { key: 'kodeMk', label: 'Kode MK' },
      { key: 'namaMk', label: 'Nama Mata Kuliah' },
      { key: 'sks', label: 'SKS' },
    ],
    fields: [
      { name: 'prodiId', label: 'Program Studi', type: 'ref', refEntity: 'prodi', required: true },
      { name: 'tahunKurikulumId', label: 'Tahun Kurikulum', type: 'ref', refEntity: 'kurikulum', dependsOn: 'prodiId', required: true, filter: (r, form) => r.prodiId === form.prodiId },
      { name: 'semester', label: 'Semester (1-8)', type: 'number', required: true, default: 1 },
      { name: 'kodeMk', label: 'Kode MK', required: true },
      { name: 'namaMk', label: 'Nama Mata Kuliah', required: true },
      { name: 'sks', label: 'SKS', type: 'number', required: true },
      { name: 'sifat', label: 'Sifat', type: 'select', options: [{ value: 'WAJIB', label: 'WAJIB' }, { value: 'PILIHAN', label: 'PILIHAN' }], required: true, default: 'WAJIB' },
      { name: 'prasyaratId', label: 'Mata Kuliah Prasyarat', type: 'ref', refEntity: 'mata-kuliah' },
    ],
  },
  kurikulum: {
    title: 'Tahun Kurikulum',
    roles: ['ADMIN', 'ADMIN_AKADEMIK', 'ADMIN_PRODI'],
    columns: [
      { key: 'prodiKode', label: 'Prodi' },
      { key: 'tahun', label: 'Tahun' },
      {
        key: 'statusAktif',
        label: 'Status',
        render: (r) => (
          <span className={`px-2 py-1 rounded text-xs font-bold ${r.statusAktif === 'AKTIF' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
            {r.statusAktif}
          </span>
        )
      },
    ],
    fields: [
      { name: 'prodiId', label: 'Program Studi', type: 'ref', refEntity: 'prodi', required: true },
      { name: 'tahun', label: 'Tahun Kurikulum', type: 'number', required: true },
      { name: 'statusAktif', label: 'Status', type: 'select', options: [{ value: 'AKTIF', label: 'AKTIF' }, { value: 'NONAKTIF', label: 'NONAKTIF' }], required: true, default: 'AKTIF' }
    ]
  },
  'tahun-akademik': {
    title: 'Tahun Akademik',
    roles: ['ADMIN', 'ADMIN_AKADEMIK'],
    columns: [
      { key: 'kode', label: 'Kode (Cth: 20241)' },
      { key: 'nama', label: 'Nama Periode' },
      { key: 'status', label: 'Status', render: badgeRender },
    ],
    fields: [
      { name: 'kode', label: 'Kode Tahun Akademik (Cth: 20241)', required: true },
      { name: 'status', label: 'Status', type: 'select', options: [{ value: 'AKTIF', label: 'AKTIF' }, { value: 'NONAKTIF', label: 'NONAKTIF' }], required: true, default: 'NONAKTIF' }
    ]
  },
  'kalender-akademik': {
    title: 'Kalender Akademik',
    roles: ['ADMIN', 'ADMIN_AKADEMIK'],
    columns: [
      { key: 'tahunAkademikNama', label: 'Tahun Akademik' },
      { key: 'namaKegiatan', label: 'Nama Kegiatan' },
      { key: 'jenisKegiatan', label: 'Jenis', render: (r) => r.jenisKegiatan === 'AWAL_KULIAH' ? <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-xs font-bold">Awal Kuliah</span> : <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs">{r.jenisKegiatan}</span> },
      { key: 'tanggalMulai', label: 'Tgl Mulai', render: (r) => new Date(r.tanggalMulai).toLocaleDateString('id-ID') },
      { key: 'tanggalSelesai', label: 'Tgl Selesai', render: (r) => new Date(r.tanggalSelesai).toLocaleDateString('id-ID') },
      { key: 'keterangan', label: 'Keterangan', render: (r) => r.keterangan || '-' }
    ],
    fields: [
      { name: 'tahunAkademikId', label: 'Tahun Akademik', type: 'ref', refEntity: 'tahun-akademik', required: true },
      { name: 'namaKegiatan', label: 'Nama Kegiatan', required: true },
      { name: 'jenisKegiatan', label: 'Jenis Kegiatan', type: 'select', required: true, default: 'LAINNYA', options: [
          { value: 'AWAL_KULIAH', label: 'Awal Kuliah' },
          { value: 'UTS', label: 'Ujian Tengah Semester (UTS)' },
          { value: 'UAS', label: 'Ujian Akhir Semester (UAS)' },
          { value: 'LIBUR', label: 'Libur Akademik' },
          { value: 'LAINNYA', label: 'Lainnya' }
        ]
      },
      { name: 'tanggalMulai', label: 'Tanggal Mulai', type: 'date', required: true },
      { name: 'tanggalSelesai', label: 'Tanggal Selesai', type: 'date', required: true },
      { name: 'keterangan', label: 'Keterangan' }
    ]
  },
  'sesi-waktu': {
    title: 'Sesi Waktu Kuliah',
    columns: [
      { key: 'kodeSesi', label: 'Sesi' },
      { key: 'jamMulai', label: 'Jam Mulai' },
      { key: 'jamSelesai', label: 'Jam Selesai' },
    ],
    fields: [
      { name: 'kodeSesi', label: 'Kode Sesi (cth: S1, S2)', type: 'text', required: true },
      { name: 'jamMulai', label: 'Jam Mulai (HH:MM)', type: 'text', required: true },
      { name: 'jamSelesai', label: 'Jam Selesai (HH:MM)', type: 'text', required: true },
    ],
  },
  jadwal: {
    title: 'Manajemen Jadwal Kuliah',
    filters: [
      { name: 'tahunAkademikId', label: 'Filter Tahun Akademik', type: 'ref', refEntity: 'tahun-akademik' }
    ],
    columns: [
      { key: 'hari', label: 'Hari' },
      { key: 'waktu', label: 'Waktu' },
      { key: 'matakuliahNama', label: 'Mata Kuliah' },
      { key: 'kelasNama', label: 'Kelas' },
      { key: 'dosenNama', label: 'Dosen' },
      { key: 'ruanganNama', label: 'Ruangan' },
      { key: 'metode', label: 'Metode' },
      { key: 'tahunAkademikNama', label: 'T.A.' },
    ],
    fields: [
      { name: 'tahunAkademikId', label: 'Tahun Akademik', type: 'ref', refEntity: 'tahun-akademik', required: true, filterOpts: (o) => o.status === 'AKTIF' },
      { name: 'prodiId', label: 'Program Studi', type: 'ref', refEntity: 'prodi', required: true },
      { name: 'tahunKurikulumId', label: 'Tahun Kurikulum', type: 'ref', refEntity: 'kurikulum', required: true, dependsOn: 'prodiId', filterOpts: (o, v) => !v.prodiId || String(o.prodiId) === String(v.prodiId) },
      { name: 'semester', label: 'Semester Target', type: 'number', required: true },
      {
        name: 'matakuliahId',
        label: 'Mata Kuliah',
        type: 'ref',
        refEntity: 'mata-kuliah',
        required: true,
        dependsOn: 'prodiId',
        filterOpts: (o, values) => {
          if (!values.prodiId) return false;
          if (String(o.prodiId) !== String(values.prodiId)) return false;
          if (values.semester && String(o.semester) !== String(values.semester)) return false;
          if (values.tahunKurikulumId && String(o.tahunKurikulumId) !== String(values.tahunKurikulumId)) return false;
          return true;
        }
      },
      { 
        name: 'kelasId', 
        label: 'Kelas', 
        type: 'ref', 
        refEntity: 'kelas', 
        required: true, 
        dependsOn: 'prodiId',
        filterOpts: (o, values) => {
          if (!values.prodiId) return false;
          if (String(o.prodiId) !== String(values.prodiId)) return false;
          if (values.tahunKurikulumId && String(o.tahunKurikulumId) !== String(values.tahunKurikulumId)) return false;
          return true;
        }
      },
      { name: 'dosenId', label: 'Dosen Pengampu', type: 'ref', refEntity: 'dosen', required: true },
      {
        name: 'metode', label: 'Metode Pelaksanaan', type: 'select', options: [
          { value: 'OFFLINE', label: 'Offline (Tatap Muka)' },
          { value: 'ONLINE', label: 'Online (Daring)' },
          { value: 'HYBRID', label: 'Hybrid (Bauran)' }
        ], required: true, default: 'OFFLINE'
      },
      { 
        name: 'ruanganId', 
        label: 'Ruangan', 
        type: 'ref', 
        refEntity: 'ruangan', 
        required: (form) => form.metode !== 'ONLINE', 
        hidden: (form) => form.metode === 'ONLINE' 
      },
      {
        name: 'hari', label: 'Hari', type: 'select', options: [
          { value: '', label: '— pilih hari —' }, { value: 'Senin', label: 'Senin' }, { value: 'Selasa', label: 'Selasa' }, { value: 'Rabu', label: 'Rabu' }, { value: 'Kamis', label: 'Kamis' }, { value: 'Jumat', label: 'Jumat' }, { value: 'Sabtu', label: 'Sabtu' }, { value: 'Minggu', label: 'Minggu' }
        ], required: true
      },
      { name: 'jamMulai', label: 'Jam Mulai', type: 'time', required: true },
      { name: 'jamSelesai', label: 'Jam Selesai', type: 'time', required: true }
    ]
  }
};

function badgeRender(r) {
  const colors = {
    AKTIF: 'bg-emerald-100 text-emerald-700',
    NONAKTIF: 'bg-slate-100 text-slate-500',
    LULUS: 'bg-blue-100 text-blue-700',
    DO: 'bg-red-100 text-red-700',
    MENGUNDURKAN_DIRI: 'bg-orange-100 text-orange-700',
    CUTI: 'bg-amber-100 text-amber-700',
  };
  const color = colors[r.status] || 'bg-slate-100 text-slate-500';
  const label = r.status?.replace('_', ' ');
  return <span className={`px-2 py-1 rounded text-xs font-bold ${color}`}>{label}</span>;
}

export { badgeRender };
