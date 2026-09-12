import React, { useState, useEffect } from 'react';
import { api } from '../../api/client.js';
import { SidebarMenu } from '../../components/SidebarMenu.jsx';
import { BookOpen, FileSpreadsheet } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RekapPenilaianDosenPage() {
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
      const res = await api.get(`/nilai/dosen/rekap?matakuliahId=${matakuliahId}&tahunAkademikId=${taId}`);
      setRekapData(res.data.data || []);
    } catch (err) {
      toast.error('Gagal memuat rekap penilaian');
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
              <FileSpreadsheet className="w-6 h-6 text-sky-600" /> Rekap Penilaian Dosen
            </h1>
            <p className="text-sm text-slate-500 mt-1">Laporan rekapitulasi nilai tugas dan kuis mahasiswa pada suatu kelas.</p>
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

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-slate-200 bg-slate-50">
                <h3 className="font-bold text-slate-800">Tabel Rekap Penilaian</h3>
              </div>
              
              <div className="overflow-x-auto">
                {loadingRekap ? (
                  <div className="p-8 text-center text-slate-500 animate-pulse">Memuat data...</div>
                ) : !selectedMatakuliahId || !selectedTahunAkademikId ? (
                  <div className="p-10 text-center text-slate-400">Pastikan Tahun Akademik dan Mata Kuliah terpilih.</div>
                ) : rekapData.length === 0 ? (
                  <div className="p-10 text-center text-slate-400">Belum ada data mahasiswa atau pertemuan</div>
                ) : (
                  <div className="p-4 space-y-8">
                    {rekapData.map((kelasData) => (
                      <div key={kelasData.mengajarId} className="border border-slate-200 rounded-lg overflow-hidden">
                        <div className="bg-slate-100 px-4 py-2 border-b border-slate-200">
                          <span className="font-semibold text-slate-700">Kelas: {kelasData.kelas}</span>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-white border-b border-slate-200 text-slate-600">
                              <tr>
                                <th className="px-4 py-3 font-semibold border-r border-slate-200">NIM</th>
                                <th className="px-4 py-3 font-semibold border-r border-slate-200">Nama Mahasiswa</th>
                                <th className="px-4 py-3 text-center font-semibold border-r border-slate-200">Kehadiran (10%)</th>
                                <th className="px-4 py-3 text-center font-semibold border-r border-slate-200">Tugas & Kuis (20%)</th>
                                <th className="px-4 py-3 text-center font-semibold border-r border-slate-200">UTS (30%)</th>
                                <th className="px-4 py-3 text-center font-semibold border-r border-slate-200">UAS (40%)</th>
                                <th className="px-4 py-3 text-center font-semibold border-r border-slate-200">Nilai Akhir</th>
                              </tr>
                            </thead>
                            <tbody>
                              {kelasData.mahasiswaList.map((mhs) => (
                                <tr key={mhs.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                  <td className="px-4 py-3 text-slate-500 border-r border-slate-100">{mhs.nim}</td>
                                  <td className="px-4 py-3 font-medium text-slate-800 border-r border-slate-100">{mhs.nama}</td>
                                  <td className="px-4 py-3 text-center text-slate-700 border-r border-slate-100">{mhs.kehadiran}%</td>
                                  <td className={`px-4 py-3 text-center border-r border-slate-100 ${mhs.tugas === 0 ? 'text-red-500 font-medium' : 'text-slate-700'}`}>{mhs.tugas}</td>
                                  <td className={`px-4 py-3 text-center border-r border-slate-100 ${mhs.uts === 0 ? 'text-red-500 font-medium' : 'text-slate-700'}`}>{mhs.uts}</td>
                                  <td className={`px-4 py-3 text-center border-r border-slate-100 ${mhs.uas === 0 ? 'text-red-500 font-medium' : 'text-slate-700'}`}>{mhs.uas}</td>
                                  <td className="px-4 py-3 text-center font-bold text-slate-800 border-r border-slate-100">{mhs.nilaiAkhir}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
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
    </div>
  );
}
