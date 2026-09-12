import { useEffect, useState } from 'react';
import { getRekapNilaiAdmin, masterApi } from '../../api/endpoints.js';
import { apiError } from '../../api/client.js';
import { SidebarMenu } from '../../components/SidebarMenu.jsx';
import { Select, Input } from '../../components/ui.jsx';

export default function DaftarNilaiPage() {
  const [prodis, setProdis] = useState([]);
  const [tahunAkademiks, setTahunAkademiks] = useState([]);
  const [kelasOptions, setKelasOptions] = useState([]);
  const [mataKuliahOptions, setMataKuliahOptions] = useState([]);
  
  const [filters, setFilters] = useState({
    prodiId: '',
    tahunAkademikId: '',
    kelasId: '',
    matakuliahId: '',
    q: ''
  });

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    masterApi('prodi').list({ limit: 1000 }).then(res => setProdis(res.rows || []));
    masterApi('tahun-akademik').list({ limit: 1000 }).then(res => setTahunAkademiks(res.rows || []));
  }, []);

  useEffect(() => {
    if (filters.prodiId) {
      masterApi('mata-kuliah')
        .list({ prodiId: filters.prodiId, limit: 1000 })
        .then(res => setMataKuliahOptions(res.rows || []));
    } else {
      setMataKuliahOptions([]);
    }
  }, [filters.prodiId]);

  useEffect(() => {
    if (filters.prodiId && filters.tahunAkademikId) {
      masterApi('kelas')
        .list({ prodiId: filters.prodiId, tahunAkademikId: filters.tahunAkademikId, limit: 1000 })
        .then(res => setKelasOptions(res.rows || []));
    } else {
      setKelasOptions([]);
    }
  }, [filters.prodiId, filters.tahunAkademikId]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getRekapNilaiAdmin({ ...filters, limit: 100 });
      // response dari backend adalah { data: [...], meta: {...} } tetapi `unwrap` mengembalikan isinya
      // tapi tunggu, unwrap(await api.get) mengembalikan res.data.data
      // di controller, res.json({ data: data.rows, meta: data.meta })
      // jadi unwrap mengembalikan `data.rows`!
      setData(res || []);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  const isFilterComplete = filters.prodiId && filters.tahunAkademikId && filters.matakuliahId && filters.kelasId;

  useEffect(() => {
    if (isFilterComplete || filters.q) {
      fetchData();
    } else {
      setData([]);
    }
  }, [filters.prodiId, filters.tahunAkademikId, filters.kelasId, filters.matakuliahId]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (isFilterComplete || filters.q) {
      fetchData();
    } else {
      import('react-hot-toast').then(module => module.default.error('Silakan lengkapi filter terlebih dahulu'));
    }
  };

  const displayedWeights = {
    kehadiran: data.length > 0 && data.every(r => r.bobotKehadiran === data[0].bobotKehadiran) ? data[0].bobotKehadiran : 10,
    tugas: data.length > 0 && data.every(r => r.bobotTugas === data[0].bobotTugas) ? data[0].bobotTugas : 20,
    uts: data.length > 0 && data.every(r => r.bobotUts === data[0].bobotUts) ? data[0].bobotUts : 30,
    uas: data.length > 0 && data.every(r => r.bobotUas === data[0].bobotUas) ? data[0].bobotUas : 40,
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 items-start">
      <SidebarMenu currentGroup="Perkuliahan" />

      <div className="flex-1 w-full space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Daftar Nilai Mahasiswa</h1>
        </div>

        {error && <div className="p-3 text-red-700 bg-red-100 rounded-lg">{error}</div>}

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 border-t-4 border-t-orange-500 overflow-hidden flex flex-col min-h-[500px]">
          {/* Toolbox / Filter */}
          <div className="p-4 md:p-6 border-b border-orange-100 flex flex-col gap-4 bg-white">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 w-full">
              <div className="relative flex-1">
                <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input 
                  type="text" 
                  value={filters.q}
                  onChange={(e) => setFilters(f => ({ ...f, q: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all text-sm" 
                  placeholder="Cari NIM atau Nama..." 
                />
              </div>
              <button type="submit" className="px-4 py-2 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors shrink-0 shadow-sm shadow-orange-500/20 text-sm">
                Cari
              </button>
            </form>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <Select
            label="Program Studi"
            required={true}
            value={filters.prodiId}
            onChange={(e) => setFilters(f => ({ ...f, prodiId: e.target.value, matakuliahId: '', kelasId: '' }))}
            options={prodis.map(p => ({ value: p.id, label: p.namaProdi }))}
            className="w-full !py-2"
            placeholder="Pilih Prodi"
          />
          
          <Select
            label="Tahun Akademik"
            required={true}
            value={filters.tahunAkademikId}
            onChange={(e) => setFilters(f => ({ ...f, tahunAkademikId: e.target.value, kelasId: '' }))}
            options={tahunAkademiks.map(t => ({ value: t.id, label: t.nama }))}
            className="w-full !py-2"
            placeholder="Pilih Tahun Akademik"
          />

          <Select
            label="Mata Kuliah"
            required={true}
            value={filters.matakuliahId}
            onChange={(e) => setFilters(f => ({ ...f, matakuliahId: e.target.value }))}
            options={mataKuliahOptions.map(mk => ({ value: mk.id, label: mk.namaMk }))}
            className="w-full !py-2"
            disabled={!filters.prodiId}
            placeholder="Pilih Mata Kuliah"
          />

          <Select
            label="Kelas"
            required={true}
            value={filters.kelasId}
            onChange={(e) => setFilters(f => ({ ...f, kelasId: e.target.value }))}
            options={kelasOptions.map(k => ({ value: k.id, label: k.namaKelas }))}
            className="w-full !py-2"
            disabled={!filters.prodiId || !filters.tahunAkademikId}
            placeholder="Pilih Kelas"
          />
          </div>
          </div>

        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="px-4 py-3">NIM</th>
                <th className="px-4 py-3">Nama</th>
                <th className="px-4 py-3 text-right">Kehadiran ({displayedWeights.kehadiran}%)</th>
                <th className="px-4 py-3 text-right">Tugas ({displayedWeights.tugas}%)</th>
                <th className="px-4 py-3 text-right">UTS ({displayedWeights.uts}%)</th>
                <th className="px-4 py-3 text-right">UAS ({displayedWeights.uas}%)</th>
                <th className="px-4 py-3 text-right">Nilai Akhir</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5 animate-spin text-sky-500" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Memuat data...
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                      </div>
                      <p className="font-medium text-slate-600">
                        {isFilterComplete || filters.q ? 'Tidak ada data nilai yang sesuai dengan filter.' : 'Belum ada data yang ditampilkan'}
                      </p>
                      {!(isFilterComplete || filters.q) && (
                        <p className="text-sm">Silakan pilih Prodi, Tahun Akademik, Mata Kuliah, dan Kelas terlebih dahulu.</p>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900">{row.nim}</td>
                    <td className="px-4 py-3">{row.nama}</td>
                    <td className="px-4 py-3 text-right">{row.kehadiran}%</td>
                    <td className="px-4 py-3 text-right">{row.nilaiTugas !== null ? row.nilaiTugas.toFixed(1) : '-'}</td>
                    <td className="px-4 py-3 text-right">{row.nilaiUts !== null ? row.nilaiUts.toFixed(1) : '-'}</td>
                    <td className="px-4 py-3 text-right">{row.nilaiUas !== null ? row.nilaiUas.toFixed(1) : '-'}</td>
                    <td className="px-4 py-3 text-right font-bold text-slate-800">{row.nilaiAkhir !== null ? row.nilaiAkhir.toFixed(1) : '-'}</td>
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
