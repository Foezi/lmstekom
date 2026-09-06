import React, { useState, useEffect } from 'react';
import { api } from '../../api/client.js';
import { Link } from 'react-router-dom';
import { BookOpen, Search, Filter } from 'lucide-react';
import { SidebarMenu } from '../../components/SidebarMenu.jsx';

export default function MateriList() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tahunAkademik, setTahunAkademik] = useState([]);
  const [kurikulum, setKurikulum] = useState([]);

  const [filterTA, setFilterTA] = useState('');
  const [filterKur, setFilterKur] = useState('');

  useEffect(() => {
    // Ambil opsi filter
    api.get('/tahun-akademik').then(res => setTahunAkademik(res.data.data));
    api.get('/kurikulum').then(res => setKurikulum(res.data.data));
  }, []);

  useEffect(() => {
    fetchData();
  }, [filterTA, filterKur]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.q = search;
      if (filterTA) params.tahunAkademikId = filterTA;
      if (filterKur) params.tahunKurikulumId = filterKur;

      const res = await api.get('/materi', { params });
      setData(res.data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchData();
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 items-start">
      <SidebarMenu currentGroup="Perkuliahan" />
      <div className="flex-1 w-full space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Materi Pembelajaran</h1>
          <p className="text-slate-500 text-sm">Pilih jadwal kelas untuk mengelola BAP, presensi, dan materi.</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center">
        <form onSubmit={handleSearch} className="flex-1 w-full relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama mata kuliah..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>

        <div className="flex gap-2 w-full md:w-auto">
          <select 
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
            value={filterTA}
            onChange={(e) => setFilterTA(e.target.value)}
          >
            <option value="">Semua Tahun Akademik</option>
            {tahunAkademik.map(ta => (
              <option key={ta.id} value={ta.id}>{ta.nama}</option>
            ))}
          </select>

          <select 
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
            value={filterKur}
            onChange={(e) => setFilterKur(e.target.value)}
          >
            <option value="">Semua Kurikulum</option>
            {kurikulum.map(kur => (
              <option key={kur.id} value={kur.id}>{kur.tahun}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="py-3 px-4 font-semibold text-slate-600 text-sm">Kode - Mata Kuliah</th>
                <th className="py-3 px-4 font-semibold text-slate-600 text-sm">Kelas</th>
                <th className="py-3 px-4 font-semibold text-slate-600 text-sm">Dosen</th>
                <th className="py-3 px-4 font-semibold text-slate-600 text-sm">T.A. & Kurikulum</th>
                <th className="py-3 px-4 font-semibold text-slate-600 text-sm">Jadwal</th>
                <th className="py-3 px-4 font-semibold text-slate-600 text-sm text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="py-8 text-center text-slate-500">Memuat data...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan="6" className="py-8 text-center text-slate-500">Tidak ada jadwal ditemukan</td></tr>
              ) : (
                data.map(item => (
                  <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{item.namaMk}</div>
                      <div className="text-xs text-slate-500">{item.kodeMk} • {item.sks} SKS</div>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600">{item.kelasNama}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">{item.dosenNama}</td>
                    <td className="py-3 px-4 text-sm">
                      <div className="text-slate-700">{item.tahunAkademik}</div>
                      <div className="text-xs text-slate-500">Kur: {item.kurikulum}</div>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600">
                      <div className="font-medium text-slate-700">{item.hari}</div>
                      <div className="text-xs text-slate-500">{item.waktu}</div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Link 
                        to={`/materi/${item.id}`}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                      >
                        <BookOpen className="w-4 h-4" />
                        Kelola Materi
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    </div>
  );
}
