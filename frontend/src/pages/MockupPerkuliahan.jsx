import { NavLink, useLocation } from 'react-router-dom';
import { Card, Button } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { MENU } from '../constants/rbac.js';
import { SidebarMenu } from '../components/SidebarMenu.jsx';

export default function MockupPerkuliahan() {
  const location = useLocation();
  const path = location.pathname.replace('/', '');
  const { user } = useAuth();
  
  const isAdmin = ['ADMIN', 'ADMIN_AKADEMIK', 'ADMIN_PRODI'].includes(user?.role);
  
  // Ambil sub-menu Perkuliahan dari MENU config
  let inPerkuliahanGroup = false;
  const perkuliahanMenu = MENU.reduce((acc, curr) => {
    if (curr.group === 'Perkuliahan') {
      inPerkuliahanGroup = true;
      return acc;
    }
    if (curr.group) {
      inPerkuliahanGroup = false;
    }
    if (inPerkuliahanGroup && curr.to) {
      if (curr.roles === 'ALL' || (Array.isArray(curr.roles) && curr.roles.includes(user?.role))) {
        acc.push(curr);
      }
    }
    return acc;
  }, []);

  // Mapping judul berdasarkan path
  const titleMap = {
    jadwal: isAdmin ? 'Manajemen Jadwal Kuliah' : 'Jadwal Kuliah Anda',
    materi: isAdmin ? 'Pantau Materi & Bahan Ajar' : 'Materi Pembelajaran & Bahan Ajar',
    tugas: isAdmin ? 'Pantau Tugas & Kuis' : 'Tugas, Kuis & Evaluasi',
    diskusi: isAdmin ? 'Pantau Ruang Diskusi' : 'Ruang Diskusi Kelas',
    presensi: isAdmin ? 'Laporan Presensi Kehadiran' : 'Rekapitulasi Presensi Kehadiran',
    nilai: isAdmin ? 'Laporan Daftar Nilai' : 'Daftar Nilai Mahasiswa'
  };

  const title = titleMap[path] || 'Modul Perkuliahan';
  const descMap = {
    jadwal: isAdmin ? 'Kelola penjadwalan kelas, plot dosen pengampu, dan alokasi ruangan kuliah untuk semester aktif secara terpusat.' : 'Lihat jadwal perkuliahan Anda pada semester yang sedang berjalan lengkap dengan informasi ruangan dan waktu.',
    materi: isAdmin ? 'Pantau dan kelola bank materi pembelajaran yang diunggah oleh dosen pengampu mata kuliah.' : 'Akses materi perkuliahan, modul pembelajaran, dan bahan ajar yang diberikan oleh dosen Anda.',
    tugas: isAdmin ? 'Pantau aktivitas penugasan, kuis, dan evaluasi mahasiswa pada setiap kelas.' : 'Kelola tugas perkuliahan Anda, kerjakan kuis, dan lihat batas waktu pengumpulan.',
    diskusi: isAdmin ? 'Pantau aktivitas forum diskusi kelas antara dosen dan mahasiswa.' : 'Berpartisipasi aktif dalam forum diskusi mata kuliah bersama dosen dan rekan mahasiswa.',
    presensi: isAdmin ? 'Rekapitulasi dan laporan kehadiran mahasiswa serta log aktivitas perkuliahan.' : 'Pantau rekap persentase kehadiran Anda selama semester berjalan.',
    nilai: isAdmin ? 'Laporan hasil evaluasi belajar dan rekap nilai akhir mahasiswa secara keseluruhan.' : 'Lihat transkrip dan nilai akhir dari komponen tugas, kuis, UTS, hingga UAS Anda.'
  };
  const description = descMap[path] || 'Kelola proses akademik dan administrasi perkuliahan.';

  // Dummy data dinamis tergantung halaman dan role
  const dummyItems = [
    { 
      matkul: 'Manajemen Jaringan (TK24A)', 
      desc: isAdmin ? 'Dosen: Foezi Arisandi, M.Kom | Kuota: 40 Mahasiswa' : 
            path === 'materi' ? 'Pertemuan 1: Pengantar Topologi Jaringan (PDF)' : 
            path === 'tugas' ? 'Tugas Praktikum 1: Setup Router MikroTik' : 
            path === 'jadwal' ? 'Senin, 08:00 - 10:30 WIB | Ruang Lab Komputer 1' : 'Modul aktif',
      date: isAdmin ? 'Senin, 08:00 - 10:30 WIB' : 'Oleh: Foezi Arisandi, M.Kom',
      status: 'Aktif',
      prodi: 'Teknik Komputer'
    },
    { 
      matkul: 'Pendidikan Pancasila (TK25)', 
      desc: isAdmin ? 'Dosen: Tim Dosen MKWU | Kuota: 35 Mahasiswa' :
            path === 'materi' ? 'Bahan Ajar: Sejarah Perumusan Pancasila (PPT)' : 
            path === 'tugas' ? 'Kuis Pilihan Ganda: Sila Ke-1 s/d Ke-3' : 
            path === 'jadwal' ? 'Rabu, 13:00 - 15:30 WIB | Ruang Teori 2' : 'Modul aktif',
      date: isAdmin ? 'Rabu, 13:00 - 15:30 WIB' : 'Oleh: Tim Dosen MKWU',
      status: 'Mendatang',
      prodi: 'Teknik Komputer'
    }
  ];

  return (
    <div className="flex flex-col md:flex-row gap-6 items-start">
      <SidebarMenu currentGroup="Perkuliahan" />

      {/* KANAN: Konten Utama */}
      <div className="flex-1 w-full space-y-6 animate-fade-in-up">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden flex items-center justify-between">
        <div className="relative z-10">
          <span className="inline-block px-3 py-1 bg-sky-100 text-sky-700 text-xs font-bold rounded-full mb-3 uppercase tracking-wider">
            SIAKAD {isAdmin && '• Akses Admin'}
          </span>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">
            {title}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {description}
          </p>
        </div>
        <div className="hidden sm:block absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-sky-50 to-transparent"></div>
        <div className="hidden sm:flex relative z-10 w-16 h-16 bg-white rounded-2xl shadow-lg items-center justify-center border border-slate-100 shrink-0 ml-6">
          <svg className="w-8 h-8 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14v7" />
          </svg>
        </div>
      </div>

      {/* Toolbox / Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input 
            type="text" 
            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white" 
            placeholder="Cari kelas atau nama mata kuliah..." 
          />
          <svg className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        
        {isAdmin && (
          <select className="px-4 py-2.5 border border-slate-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-700 w-full sm:w-auto">
            <option>Semua Program Studi</option>
            <option>Teknik Komputer</option>
            <option>Bisnis Digital</option>
          </select>
        )}
        
        <select className="px-4 py-2.5 border border-slate-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-700 w-full sm:w-auto">
          <option>Tahun 2025/2026</option>
        </select>
        
        <select className="px-4 py-2.5 border border-slate-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-700 w-full sm:w-auto">
          <option>Semester Genap</option>
          <option>Semester Ganjil</option>
        </select>
        
        {isAdmin && path === 'jadwal' && (
          <Button variant="primary" className="py-2.5 px-6 rounded-xl text-sm font-semibold shadow-sky-500/30 hover:shadow-sky-500/50 shadow-lg shrink-0">
            + Tambah Jadwal Baru
          </Button>
        )}
      </div>

      {/* Grid Mockup */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {dummyItems.map((item, idx) => (
          <div key={idx} className="bg-white border border-slate-200 p-5 rounded-xl hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-bold text-slate-800 group-hover:text-sky-600 transition-colors">
                  {item.matkul}
                </h3>
                {isAdmin && <p className="text-[11px] text-slate-400 font-medium uppercase mt-0.5">{item.prodi}</p>}
              </div>
              <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                item.status === 'Aktif' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {item.status}
              </span>
            </div>
            
            <p className="text-sm font-medium text-slate-700 mb-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
              {item.desc}
            </p>
            
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {isAdmin 
                    ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  }
                </svg>
                {item.date}
              </div>
              
              <div className="flex gap-2">
                {isAdmin ? (
                  <>
                    <button className="text-slate-500 hover:text-orange-500 p-1 transition-colors" title="Edit Jadwal">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button className="text-sky-600 hover:text-sky-700 font-semibold text-xs flex items-center gap-1 px-2 transition-colors border-l border-slate-200">
                      Kelola Kelas
                    </button>
                  </>
                ) : (
                  <button className="text-sky-600 hover:text-orange-500 font-semibold text-xs flex items-center gap-1 transition-colors">
                    Lihat Detail
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      </div>
    </div>
  );
}
