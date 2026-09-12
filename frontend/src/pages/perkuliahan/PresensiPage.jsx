import React, { useState, useEffect } from 'react';
import { api } from '../../api/client.js';
import { SidebarMenu } from '../../components/SidebarMenu.jsx';
import { Users, BookOpen, BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PresensiPage() {
  const [prodiList, setProdiList] = useState([]);
  const [kurikulumList, setKurikulumList] = useState([]);
  const [tahunAkademikList, setTahunAkademikList] = useState([]);
  const [mataKuliahList, setMataKuliahList] = useState([]);

  const [selectedProdiId, setSelectedProdiId] = useState('');
  const [selectedKurikulumId, setSelectedKurikulumId] = useState('');
  const [selectedTahunAkademikId, setSelectedTahunAkademikId] = useState('');
  const [selectedMatakuliahId, setSelectedMatakuliahId] = useState('');

  const [rekapData, setRekapData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingRekap, setLoadingRekap] = useState(false);

  useEffect(() => {
    fetchMasterData();
  }, []);

  useEffect(() => {
    if (selectedProdiId && selectedKurikulumId && selectedTahunAkademikId) {
      fetchMataKuliah(selectedProdiId, selectedKurikulumId, selectedTahunAkademikId);
    } else {
      setMataKuliahList([]);
    }
  }, [selectedProdiId, selectedKurikulumId, selectedTahunAkademikId]);

  useEffect(() => {
    if (selectedMatakuliahId && selectedTahunAkademikId) {
      fetchRekap(selectedMatakuliahId, selectedTahunAkademikId);
    } else {
      setRekapData([]);
    }
  }, [selectedMatakuliahId, selectedTahunAkademikId]);

  const fetchMasterData = async () => {
    try {
      setLoading(true);
      const [resProdi, resKurikulum, resTa] = await Promise.all([
        api.get('/prodi'),
        api.get('/kurikulum'),
        api.get('/tahun-akademik')
      ]);
      setProdiList(resProdi.data.data || []);
      setKurikulumList(resKurikulum.data.data || []);
      setTahunAkademikList(resTa.data.data || []);

      if (resProdi.data.data?.length > 0) setSelectedProdiId(resProdi.data.data[0].id.toString());
      if (resKurikulum.data.data?.length > 0) setSelectedKurikulumId(resKurikulum.data.data[0].id.toString());
      if (resTa.data.data?.length > 0) setSelectedTahunAkademikId(resTa.data.data[0].id.toString());
    } catch (err) {
      toast.error('Gagal memuat data master');
    } finally {
      setLoading(false);
    }
  };

  const fetchMataKuliah = async (prodiId, kurikulumId, taId) => {
    try {
      const res = await api.get(`/presensi/mata-kuliah?prodiId=${prodiId}&tahunKurikulumId=${kurikulumId}&tahunAkademikId=${taId}`);
      const filtered = res.data.data;
      setMataKuliahList(filtered);
      if (filtered.length > 0) {
        setSelectedMatakuliahId(filtered[0].id.toString());
      } else {
        setSelectedMatakuliahId('');
      }
    } catch (err) {
      toast.error('Gagal memuat mata kuliah');
    }
  };

  const fetchRekap = async (matakuliahId, taId) => {
    try {
      setLoadingRekap(true);
      const res = await api.get(`/presensi/rekap?matakuliahId=${matakuliahId}&tahunAkademikId=${taId}`);
      const sortedData = res.data.data.sort((a, b) => b.persentase - a.persentase);
      setRekapData(sortedData);
    } catch (err) {
      toast.error('Gagal memuat rekap presensi');
    } finally {
      setLoadingRekap(false);
    }
  };

  const selectedMk = mataKuliahList.find(m => m.id.toString() === selectedMatakuliahId);
  const selectedTa = tahunAkademikList.find(t => t.id.toString() === selectedTahunAkademikId);

  return (
    <div className="flex flex-col md:flex-row gap-6 items-start">
      <SidebarMenu currentGroup="Perkuliahan" />
      
      <div className="flex-1 w-full space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-sky-600" /> Rekap Kehadiran Mata Kuliah
            </h1>
            <p className="text-sm text-slate-500 mt-1">Laporan persentase kehadiran seluruh mahasiswa dalam satu mata kuliah</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 border-t-4 border-t-orange-500 overflow-hidden flex flex-col min-h-[500px]">
          <div className="p-4 md:p-6 border-b border-orange-100 flex flex-col gap-4 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Program Studi<span className="text-red-500 ml-1">*</span></label>
                <select
                  value={selectedProdiId}
                  onChange={(e) => setSelectedProdiId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 outline-none"
                >
                  <option value="">Pilih Prodi</option>
                  {prodiList.map(p => <option key={p.id} value={p.id}>{p.namaProdi}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Tahun Kurikulum<span className="text-red-500 ml-1">*</span></label>
                <select
                  value={selectedKurikulumId}
                  onChange={(e) => setSelectedKurikulumId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 outline-none"
                >
                  <option value="">Pilih Kurikulum</option>
                  {kurikulumList.map(k => <option key={k.id} value={k.id}>{k.tahun}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Tahun Akademik<span className="text-red-500 ml-1">*</span></label>
                <select
                  value={selectedTahunAkademikId}
                  onChange={(e) => setSelectedTahunAkademikId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 outline-none"
                >
                  <option value="">Pilih Tahun Akademik</option>
                  {tahunAkademikList.map(t => <option key={t.id} value={t.id}>{t.nama}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Mata Kuliah<span className="text-red-500 ml-1">*</span></label>
                <select
                  value={selectedMatakuliahId}
                  onChange={(e) => setSelectedMatakuliahId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 outline-none"
                >
                  <option value="">{mataKuliahList.length === 0 ? 'Tidak ada Mata Kuliah' : 'Pilih Mata Kuliah'}</option>
                  {mataKuliahList.map(m => <option key={m.id} value={m.id}>{m.namaMk}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="p-4 md:p-6 flex flex-col gap-6">
            {selectedMk && selectedTa && (
              <div className="flex flex-wrap gap-4">
                <div className="bg-sky-50 border border-sky-100 px-4 py-3 rounded-lg flex items-center gap-3 w-full md:w-auto md:min-w-[300px]">
                  <BookOpen className="w-6 h-6 text-sky-600" />
                  <div>
                    <p className="text-[10px] uppercase font-bold text-sky-600 tracking-wider">Mata Kuliah Dipilih</p>
                    <p className="text-sm font-semibold text-slate-800">{selectedMk.namaMk} ({selectedMk.kodeMk})</p>
                  </div>
                </div>
              </div>
            )}

            {/* Grafik Batang Horizontal (Tailwind) */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
            <h3 className="font-bold text-slate-800 mb-6">Grafik Persentase Kehadiran</h3>
            
            {loadingRekap ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="animate-pulse flex items-center gap-4">
                    <div className="w-1/4 h-4 bg-slate-200 rounded"></div>
                    <div className="flex-1 h-6 bg-slate-200 rounded-full"></div>
                  </div>
                ))}
              </div>
            ) : !selectedMatakuliahId || !selectedTahunAkademikId ? (
              <div className="text-center py-10 text-slate-400">Pastikan Tahun Akademik dan Mata Kuliah terpilih.</div>
            ) : rekapData.length === 0 ? (
              <div className="text-center py-10 text-slate-400">Belum ada data mahasiswa atau pertemuan</div>
            ) : (
              <div className="space-y-5">
                {rekapData.map((m) => (
                  <div key={m.mahasiswaId} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <div className="w-full sm:w-1/3 md:w-1/4 shrink-0">
                      <p className="text-sm font-semibold text-slate-700 truncate" title={m.nama}>{m.nama}</p>
                      <p className="text-[10px] text-slate-500 font-medium bg-slate-100 inline-block px-1.5 py-0.5 rounded">{m.kelas}</p>
                      <p className="text-[10px] text-slate-500 ml-1 inline-block">{m.nim} • {m.hadirCount}/{m.totalPertemuan} Hadir</p>
                    </div>
                    
                    <div className="flex-1 flex items-center gap-3">
                      {/* Bar Container */}
                      <div className="flex-1 h-5 bg-slate-200 rounded-full overflow-hidden shadow-inner relative">
                        {/* Fill Bar */}
                        <div 
                          className={`h-full transition-all duration-1000 ease-out rounded-full ${
                            m.persentase >= 80 ? 'bg-emerald-500' :
                            m.persentase >= 60 ? 'bg-amber-400' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.max(m.persentase, 0)}%` }}
                        >
                          <div className="absolute inset-0 bg-white/20" style={{ backgroundImage: 'linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)'}}></div>
                        </div>
                      </div>
                      
                      {/* Percentage Label */}
                      <div className={`w-12 text-right font-bold text-sm ${
                        m.persentase >= 80 ? 'text-emerald-600' :
                        m.persentase >= 60 ? 'text-amber-600' : 'text-red-600'
                      }`}>
                        {m.persentase}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
