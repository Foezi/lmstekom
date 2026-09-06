import { useEffect, useState } from 'react';
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
    if (hasSelectedDate && j.hari !== filterDayName) return false;
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
      const check = filterDate.getTime();
      return check >= start && check <= end;
    }
    return true;
  });

  const hasActivity = (dateObj, dayName) => {
    const hasJadwal = data?.jadwals?.some(j => j.hari === dayName);
    const hasAgenda = data?.agendas?.some(a => {
      const start = new Date(a.tanggalMulai).setHours(0,0,0,0);
      const end = new Date(a.tanggalSelesai).setHours(23,59,59,999);
      const check = dateObj.getTime();
      return check >= start && check <= end;
    });
    return hasJadwal || hasAgenda;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      
      {/* KIRI: Widget Kalender & Tugas */}
      <div className="lg:col-span-1 space-y-6">
        
        {/* Widget Jadwal Minggu Ini */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 flex items-center justify-between border-b border-slate-100">
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
                        <div className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${isActiveDate ? 'bg-white' : 'bg-orange-500'}`}></div>
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

        {/* Widget Perlu Dikerjakan */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 flex items-center gap-2 border-b border-slate-100">
            <h2 className="font-bold text-slate-800 text-sm">Perlu Dikerjakan</h2>
            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs font-bold">0</span>
          </div>
          <div className="flex flex-col items-center justify-center py-10 text-center px-4">
             <div className="w-20 h-20 mb-3 opacity-50">
                <svg className="w-full h-full text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
             <p className="text-xs text-slate-500">Tidak ada yang perlu dikerjakan saat ini</p>
          </div>
        </div>

      </div>

      {/* KANAN: Konten Utama Kelas */}
      <div className="lg:col-span-3">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-full flex flex-col">
          
          {/* Tabs */}
          <div className="flex border-b border-slate-200">
            <button className="flex-1 text-center py-4 font-semibold text-sky-600 border-b-2 border-sky-500 text-sm">
              Kelas Aktif
            </button>
          </div>

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
              <button className="flex items-center justify-center gap-2 text-sky-600 hover:text-sky-700 font-medium text-sm whitespace-nowrap bg-sky-50 hover:bg-sky-100 px-4 py-2 rounded-lg transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Sinkron Kelas
              </button>
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
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 sm:text-sm transition-all" 
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
                <div key={idx} className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow cursor-pointer group flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm group-hover:text-sky-600 transition-colors line-clamp-2 leading-snug mb-1">
                      {kelas.matakuliah?.namaMk} ({kelas.kelas?.namaKelas})
                    </h3>
                    <p className="text-xs text-slate-500 mb-4">Kelas: {kelas.kelas?.namaKelas}</p>
                    
                    <p className="text-xs text-slate-400 italic mb-3">Pelaksanaan: {kelas.metode || 'OFFLINE'}</p>
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
                      {kelas.hari}, {kelas.jamMulai} - {kelas.jamSelesai} {kelas.ruangan ? `(${kelas.ruangan?.namaRuangan})` : ''}
                    </div>
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
