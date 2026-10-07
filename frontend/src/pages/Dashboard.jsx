import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { ROLES } from '../constants/rbac.js';
import { Card, Spinner } from '../components/ui.jsx';
import { getDashboardData } from '../api/endpoints.js';
import { apiError } from '../api/client.js';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [search, setSearch] = useState('');
  
  // Tanggal Hari Ini Setup
  const hariIni = new Date();
  const namaHariFull = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const namaHariSingkat = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  const namaBulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  
  const formattedDate = `${hariIni.getDate()} ${namaBulan[hariIni.getMonth()]} ${hariIni.getFullYear()}`;
  
  // Setup Kalender Minggu Ini
  const currentDayIndex = hariIni.getDay();
  const dates = [];
  const startOfWeek = new Date(hariIni);
  startOfWeek.setHours(0,0,0,0);
  startOfWeek.setDate(hariIni.getDate() - (currentDayIndex === 0 ? 6 : currentDayIndex - 1));
  
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    dates.push({
      dateObj: d,
      namaSingkat: namaHariSingkat[d.getDay()],
      namaFull: namaHariFull[d.getDay()],
      tanggal: d.getDate(),
      isToday: d.getDate() === hariIni.getDate() && d.getMonth() === hariIni.getMonth() && d.getFullYear() === hariIni.getFullYear()
    });
  }

  useEffect(() => {
    getDashboardData()
      .then(setData)
      .catch((e) => toast.error(apiError(e, 'Gagal memuat dashboard')))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner label="Memuat dashboard..." />;

  // Filter Data
  const hasSelectedDate = selectedDate !== null;
  const filterDate = hasSelectedDate ? dates[selectedDate].dateObj : null;
  const filterDayName = hasSelectedDate ? dates[selectedDate].namaFull : null;

  const filteredJadwal = (data?.jadwals || []).filter(j => {
    // Filter hari
    if (hasSelectedDate && j.hari?.toLowerCase() !== filterDayName.toLowerCase()) return false;
    // Filter pencarian
    if (search) {
      const q = search.toLowerCase();
      if (!j.matakuliah?.namaMk.toLowerCase().includes(q) &&
          !j.kelas?.namaKelas.toLowerCase().includes(q) &&
          !j.dosen?.nama.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const filteredAgenda = (data?.agendas || []).filter(a => {
    if (hasSelectedDate) {
      const start = new Date(a.tanggalMulai).setHours(0,0,0,0);
      const end = new Date(a.tanggalSelesai).setHours(23,59,59,999);
      const isLongEvent = (end - start) > 14 * 24 * 60 * 60 * 1000; // > 14 days
      const check = filterDate.getTime();
      
      if (isLongEvent) {
        return check === start;
      }
      return check >= start && check <= end;
    }
    return true;
  });

  const hasActivity = (dateObj, dayName) => {
    const hasJadwal = data?.jadwals?.some(j => j.hari?.toLowerCase() === dayName.toLowerCase());
    const hasAgenda = data?.agendas?.some(a => {
      const start = new Date(a.tanggalMulai).setHours(0,0,0,0);
      const end = new Date(a.tanggalSelesai).setHours(23,59,59,999);
      const isLongEvent = (end - start) > 14 * 24 * 60 * 60 * 1000;
      const check = dateObj.getTime();
      
      if (isLongEvent) {
        return check === start;
      }
      return check >= start && check <= end;
    });
    return hasJadwal || hasAgenda;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      
      {/* KIRI: Widget Kalender & Tugas */}
      <div className="lg:col-span-1 space-y-6">
        
        {/* Widget Jadwal Minggu Ini */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 border-t-4 border-t-orange-500 overflow-hidden">
          <div className="p-4 flex items-center justify-between border-b border-orange-100">
            <h2 className="font-bold text-slate-800 text-sm">Jadwal Minggu Ini</h2>
            <span className="text-xs text-slate-500">Hari ini: {formattedDate}</span>
          </div>
          <div className="p-4">
            <div className="flex justify-between mb-6">
              {dates.map((d, i) => {
                const isActiveDate = selectedDate === i;
                const activityMarker = hasActivity(d.dateObj, d.namaFull);
                return (
                  <button 
                    key={i} 
                    onClick={() => setSelectedDate(isActiveDate ? null : i)}
                    className="flex flex-col items-center gap-1.5 focus:outline-none"
                  >
                    <span className={`text-[11px] font-medium ${isActiveDate ? 'text-sky-600' : 'text-slate-500'}`}>
                      {d.namaSingkat}
                    </span>
                    <div className="relative">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                        isActiveDate 
                          ? 'bg-sky-500 text-white shadow-md shadow-sky-500/40 ring-2 ring-sky-200' 
                          : d.isToday 
                            ? 'bg-sky-100 text-sky-700'
                            : 'text-slate-700 hover:bg-slate-100'
                      }`}>
                        {d.tanggal}
                      </div>
                      {activityMarker && (
                        <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white bg-orange-500 shadow-sm z-10"></div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="flex flex-col items-center justify-center py-6 text-center">
              {filteredJadwal.length === 0 && filteredAgenda.length === 0 ? (
                <>
                  <div className="w-16 h-16 mb-3 opacity-50">
                    <svg className="w-full h-full text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-xs text-slate-500">Tidak ada kegiatan terjadwal{hasSelectedDate ? ' pada hari ini' : ''}</p>
                </>
              ) : (
                <div className="w-full text-left space-y-3">
                  {filteredAgenda.map(a => (
                    <div key={a.id} className="text-xs bg-orange-50 border border-orange-100 p-2 rounded text-orange-800">
                      <strong>Agenda:</strong> {a.namaKegiatan}
                    </div>
                  ))}
                  {filteredJadwal.slice(0, 3).map(j => (
                    <div key={j.id} className="text-xs bg-sky-50 border border-sky-100 p-2 rounded text-sky-800">
                      <strong>{j.jamMulai} - {j.jamSelesai}:</strong> {j.matakuliah?.namaMk}
                    </div>
                  ))}
                  {filteredJadwal.length > 3 && (
                    <p className="text-xs text-center text-slate-500 italic">+{filteredJadwal.length - 3} kelas lainnya...</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {['ADMIN', 'ADMIN_AKADEMIK', 'ADMIN_PRODI'].includes(user.role) ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 border-t-4 border-t-orange-500 overflow-hidden">
            <div className="p-4 flex items-center justify-between border-b border-orange-100">
              <h2 className="font-bold text-slate-800 text-sm">Aktivitas Terkini</h2>
              <span className="text-[10px] uppercase font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full tracking-wider">Live</span>
            </div>
            <div className="p-4 space-y-4">
              {data?.recentLogs?.length > 0 ? (
                data.recentLogs.map((log) => (
                  <div key={log.id} className="flex gap-3 text-sm">
                    <div className="w-8 h-8 shrink-0 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                      {(log.user?.nickname || log.user?.username || 'S')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-slate-800 leading-tight">
                        <span className="font-semibold">{log.user?.nickname || log.user?.username || 'Sistem'}</span> {log.aktivitas}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {new Date(log.waktu).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} • {log.modul}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <p className="text-xs text-slate-500">Belum ada aktivitas tercatat</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 border-t-4 border-t-orange-500 overflow-hidden">
            <div className="p-4 flex items-center gap-2 border-b border-orange-100">
              <h2 className="font-bold text-slate-800 text-sm">Perlu Dikerjakan</h2>
              <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs font-bold">{data?.tasks?.length || 0}</span>
            </div>
            {data?.tasks?.length > 0 ? (
              <div className="p-4 space-y-3">
                {data.tasks.map(task => (
                  <div key={task.id} className="p-3 bg-orange-50 border border-orange-100 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-orange-200 text-orange-600 flex items-center justify-center shrink-0">
                        {task.icon === 'clipboard-list' ? (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        )}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-800">{task.title}</h3>
                        <p className="text-xs text-slate-600 mt-1 leading-snug">{task.description}</p>
                        {task.link && (
                          <Link to={task.link} className="inline-block mt-2 text-xs font-semibold text-orange-600 hover:text-orange-700 hover:underline">
                            Lihat Detail →
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                 <div className="w-20 h-20 mb-3 opacity-50">
                    <svg className="w-full h-full text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                 <p className="text-xs text-slate-500">Tidak ada yang perlu dikerjakan saat ini</p>
              </div>
            )}
          </div>
        )}

      </div>

      {/* KANAN: Konten Utama Kelas */}
      <div className="lg:col-span-3">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 border-t-4 border-t-orange-500 overflow-hidden min-h-full flex flex-col">
          
          {/* Tabs */}

          <div className="p-6 flex-1 bg-slate-50/30">
            
            {/* Header Kelas */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  {hasSelectedDate ? `Kelas Aktif: ${filterDayName}` : 'Daftar Kelas Aktif'}
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  {hasSelectedDate 
                    ? `Daftar perkuliahan yang dijadwalkan pada hari ${filterDayName}`
                    : `Menampilkan jadwal perkuliahan pada semester ${data?.tahunAkademik?.nama || 'berjalan'}`}
                </p>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input 
                  type="text" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition-all" 
                  placeholder="Cari berdasarkan mata kuliah, kode kelas, atau nama dosen" 
                />
              </div>
              <div className="block w-full sm:w-auto px-4 py-2.5 text-slate-700 border border-slate-300 bg-slate-100 rounded-xl font-medium sm:text-sm">
                {data?.tahunAkademik?.nama || 'Tidak ada periode aktif'}
              </div>
            </div>

            {/* Grid Kelas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredJadwal.length === 0 ? (
                 <div className="col-span-full py-12 text-center text-slate-500">
                   Belum ada jadwal kelas yang tersedia.
                 </div>
              ) : filteredJadwal.map((kelas, idx) => (
                <div key={idx} className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow flex flex-col justify-between relative">
                  {kelas.mengajar?.pertemuan?.length > 0 && (
                    <span className="absolute top-4 right-4 inline-flex items-center gap-1 px-2 py-1 rounded-md bg-orange-100 text-orange-700 text-[10px] font-bold">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Sesi-{kelas.mengajar.pertemuan[0].keBerapa}
                    </span>
                  )}
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm group-hover:text-sky-600 transition-colors line-clamp-2 leading-snug mb-1 pr-16">
                      {kelas.matakuliah?.namaMk} ({kelas.kelas?.namaKelas})
                    </h3>
                    <p className="text-xs text-slate-500 mb-4">Kelas: {kelas.kelas?.namaKelas}</p>
                    
                    <p className="text-xs text-slate-400 italic mb-2">Pelaksanaan: {kelas.metode || 'OFFLINE'}</p>
                  </div>
                  
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {kelas.dosen?.nama || '-'}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {kelas.mengajar?.pertemuan?.length > 0 && kelas.mengajar.pertemuan[0].tanggal ? 
                        `${kelas.hari}, ${new Date(kelas.mengajar.pertemuan[0].tanggal).toLocaleDateString('id-ID', {day: '2-digit', month: 'short', year: 'numeric'})}` : 
                        kelas.hari}, {kelas.jamMulai} - {kelas.jamSelesai} {kelas.ruangan ? `(${kelas.ruangan?.namaRuangan})` : ''}
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
                    <Link 
                      to={`/materi/${kelas.id}${kelas.mengajar?.pertemuan?.length > 0 ? `?sesiId=${kelas.mengajar.pertemuan[0].id}` : ''}`} 
                      className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-xs font-bold inline-flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      {user?.role === 'MAHASISWA' ? 'Detail Perkuliahan' : 'Mulai Kelas'}
                    </Link>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>

    </div>
  );
}
