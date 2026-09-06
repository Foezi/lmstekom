import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { masterApi } from '../api/endpoints.js';
import { Spinner, Button } from '../components/ui.jsx';
import { badgeRender } from './master/configs.jsx';

const SIDEBAR_MENUS = [
  'Biodata',
  'Status Semester',
  'Kemajuan Belajar',
  'Kartu Rencana Studi',
  'Kartu Hasil Studi',
  'Transkrip',
  'Finalisasi MK',
  'Nilai Kuliah',
  'Kuesioner',
  'Riwayat Keuangan',
  'Berhenti Studi',
  'MK Mengulang',
  'Kurikulum Mahasiswa',
  'Sunting KRS'
];

export function DetailMahasiswaPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [mhs, setMhs] = useState(null);
  const [error, setError] = useState(null);
  const [activeMenu, setActiveMenu] = useState('Biodata');
  const [activeBiodataTab, setActiveBiodataTab] = useState('Informasi Umum');

  useEffect(() => {
    let alive = true;
    setLoading(true);

    async function loadData() {
      try {
        const data = await masterApi('mahasiswa').get(id);
        if (!alive) return;
        setMhs(data);
      } catch (err) {
        if (!alive) return;
        setError('Gagal memuat data mahasiswa.');
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadData();
    return () => { alive = false; };
  }, [id]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate('/mahasiswa')}>
          ← Kembali ke Data Mahasiswa
        </Button>
        <h1 className="text-2xl font-bold text-slate-800">Detil Mahasiswa & Akademik</h1>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Spinner />
        </div>
      ) : error ? (
        <div className="p-6 text-center text-red-500 bg-red-50 rounded-lg">
          {error}
        </div>
      ) : (
        <div className="flex flex-col md:flex-row gap-6 items-start">
          
          {/* KIRI: Sidebar Navigasi & Foto Profil */}
          <div className="w-full md:w-64 flex-shrink-0 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm md:sticky md:top-24">
            
            {/* Header Profil (Mobile) / Foto Penuh (Desktop) */}
            <div className="flex md:block items-center p-4 md:p-0 gap-4">
              <div className="relative aspect-square md:aspect-[3/4] w-16 md:w-full rounded-full md:rounded-none bg-slate-100 group overflow-hidden shrink-0 shadow-sm md:shadow-none">
                <img 
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(mhs?.nama || 'Mhs')}&background=0ea5e9&color=fff&size=512`} 
                  alt="Foto Profil" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-0 inset-x-0 bg-black/40 text-white text-xs font-semibold py-2 text-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hidden md:block">
                  Ganti Foto (1 MB)
                </div>
              </div>
              <div className="md:hidden flex-1 min-w-0">
                <h3 className="font-bold text-slate-800 text-sm truncate">{mhs?.nama}</h3>
                <p className="text-xs text-slate-500 font-medium">{mhs?.nim}</p>
              </div>
            </div>

            {/* Menu List */}
            <div className="flex md:flex-col overflow-x-auto md:overflow-visible border-t border-slate-200 md:divide-y divide-slate-100 hide-scrollbar bg-slate-50 md:bg-white">
              {SIDEBAR_MENUS.map((menu) => (
                <button
                  key={menu}
                  onClick={() => setActiveMenu(menu)}
                  className={`flex-shrink-0 text-left px-4 py-3 text-sm font-semibold transition-colors whitespace-nowrap md:whitespace-normal ${
                    activeMenu === menu
                      ? 'bg-sky-50 text-sky-600 border-b-4 md:border-b-0 md:border-l-4 border-sky-500'
                      : 'text-slate-600 hover:bg-sky-50/50 border-b-4 md:border-b-0 md:border-l-4 border-transparent'
                  }`}
                >
                  {menu}
                </button>
              ))}
            </div>
          </div>

          {/* KANAN: Konten Aktif */}
          <div className="flex-1 w-full overflow-hidden bg-white border border-slate-200 rounded-xl p-4 sm:p-8 shadow-sm min-h-[600px]">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-xl sm:text-2xl font-black text-slate-800 truncate">{activeMenu}</h2>
                <p className="text-slate-500 text-xs sm:text-sm mt-1 truncate">{mhs?.nim} — {mhs?.nama}</p>
              </div>
              <div className="shrink-0">
                {badgeRender(mhs)}
              </div>
            </div>

            {activeMenu === 'Biodata' ? (
              <div className="bg-white border border-slate-200 rounded-lg p-0 w-full text-left shadow-sm">
                
                {/* Grid Atas - Akademik */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-b border-slate-200">
                    <div className="p-4 sm:p-6 space-y-4 md:border-r border-b md:border-b-0 border-slate-200">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-0">
                        <span className="text-sky-600 font-bold text-xs sm:text-sm">NIM</span>
                        <span className="text-slate-800 font-medium text-sm">{mhs?.nim}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-0">
                        <span className="text-sky-600 font-bold text-xs sm:text-sm">Nama Mahasiswa</span>
                        <span className="text-slate-800 font-medium text-sm break-words">{mhs?.nama}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-0">
                        <span className="text-sky-600 font-bold text-xs sm:text-sm">Program Studi</span>
                        <span className="text-slate-800 font-medium text-sm">{mhs?.prodiNama || '-'}</span>
                      </div>
                      <div className="grid grid-cols-2">
                        <span className="text-sky-600 font-bold text-sm">Tahun Kurikulum</span>
                        <span className="text-slate-800 font-medium text-sm">{mhs?.tahunKurikulum || '-'}</span>
                      </div>
                      <div className="grid grid-cols-2">
                        <span className="text-sky-600 font-bold text-sm">Periode Masuk</span>
                        <span className="text-slate-800 font-medium text-sm">{mhs?.periodeMasuk || '-'}</span>
                      </div>
                      <div className="grid grid-cols-2">
                        <span className="text-sky-600 font-bold text-sm">Kelas / Kelompok</span>
                        <span className="text-slate-800 font-medium text-sm">{mhs?.kelasNama || '-'}</span>
                      </div>
                    </div>
                    
                    <div className="p-4 sm:p-6 space-y-4">
                      <div className="grid grid-cols-2">
                        <span className="text-sky-600 font-bold text-sm">Jalur Pendaftaran</span>
                        <span className="text-slate-800 font-medium text-sm">{mhs?.jalurPendaftaran || '-'}</span>
                      </div>
                      <div className="grid grid-cols-2">
                        <span className="text-sky-600 font-bold text-sm">Status Mahasiswa</span>
                        <span className="text-slate-800 font-medium text-sm capitalize">{mhs?.status?.toLowerCase() || '-'}</span>
                      </div>
                      <div className="grid grid-cols-2">
                        <span className="text-sky-600 font-bold text-sm">Biodata Valid</span>
                        <span className="text-red-500 font-bold text-sm">✖</span>
                      </div>
                      <div className="grid grid-cols-2">
                        <span className="text-sky-600 font-bold text-sm">Sistem Kuliah</span>
                        <span className="text-slate-800 font-medium text-sm">Reguler</span>
                      </div>
                      <div className="grid grid-cols-2">
                        <span className="text-sky-600 font-bold text-sm">Jenis Pendaftaran</span>
                        <span className="text-slate-800 font-medium text-sm">Peserta Didik Baru</span>
                      </div>
                    </div>
                  </div>

                  {/* Tabs Navigasi Dalam Biodata */}
                  <div className="flex gap-2 p-4 bg-slate-50 border-b border-slate-200 overflow-x-auto whitespace-nowrap hide-scrollbar">
                    {['Informasi Umum', 'Domisili', 'Orang Tua', 'Wali', 'Sekolah'].map((tab) => (
                      <button 
                        key={tab}
                        onClick={() => setActiveBiodataTab(tab)}
                        className={`font-semibold text-sm px-4 py-2 rounded transition-colors ${activeBiodataTab === tab ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  {/* Konten Tab Aktif */}
                  {activeBiodataTab === 'Informasi Umum' ? (
                    <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <h4 className="font-bold text-emerald-600 text-lg mb-4 border-b-2 border-emerald-600 inline-block">Umum</h4>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2">
                          <span className="text-sky-600 font-bold text-sm">Jenis Kelamin</span>
                          <span className="text-slate-800 text-sm">{mhs?.jenisKelamin === 'L' ? 'Laki-Laki' : mhs?.jenisKelamin === 'P' ? 'Perempuan' : '-'}</span>
                        </div>
                        <div className="grid grid-cols-2">
                          <span className="text-sky-600 font-bold text-sm">Tempat Lahir</span>
                          <span className="text-slate-800 text-sm">{mhs?.tempatLahir || '-'}</span>
                        </div>
                        <div className="grid grid-cols-2">
                          <span className="text-sky-600 font-bold text-sm">Tanggal Lahir</span>
                          <span className="text-slate-800 text-sm">{mhs?.tanggalLahir ? new Date(mhs.tanggalLahir).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'}) : '-'}</span>
                        </div>
                        <div className="grid grid-cols-2">
                          <span className="text-sky-600 font-bold text-sm">Agama</span>
                          <span className="text-slate-800 text-sm">Islam</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold text-emerald-600 text-lg mb-4 border-b-2 border-emerald-600 inline-block">Administrasi</h4>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2">
                          <span className="text-sky-600 font-bold text-sm">Kewarganegaraan</span>
                          <span className="text-slate-800 text-sm">Indonesia</span>
                        </div>
                        <div className="grid grid-cols-2">
                          <span className="text-sky-600 font-bold text-sm">NIK / No. KTP</span>
                          <span className="text-slate-800 text-sm">-</span>
                        </div>
                        <div className="grid grid-cols-2">
                          <span className="text-sky-600 font-bold text-sm">No. KK</span>
                          <span className="text-slate-800 text-sm">-</span>
                        </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-16 text-center">
                      <p className="text-slate-500 font-medium">Informasi <strong>{activeBiodataTab}</strong> saat ini belum tersedia dan akan diatur pada fase pembaruan SIAKAD.</p>
                    </div>
                  )}

              </div>
            ) : (
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-12 text-center flex flex-col items-center justify-center min-h-[400px] bg-slate-50/50">
                <div className="w-16 h-16 bg-sky-100 text-sky-500 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-slate-700 mb-2">Modul {activeMenu}</h3>
                <p className="text-slate-500 max-w-md mx-auto">
                  Antarmuka untuk fitur <strong>{activeMenu}</strong> saat ini sedang dipersiapkan untuk fase berikutnya (Migrasi Sistem Informasi Akademik / SIAKAD).
                </p>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
