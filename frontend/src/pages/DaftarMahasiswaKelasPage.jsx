import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { masterApi } from '../api/endpoints.js';
import { Spinner, Button } from '../components/ui.jsx';
import { badgeRender } from './master/configs.jsx';

export function DaftarMahasiswaKelasPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [kelas, setKelas] = useState(null);
  const [mahasiswa, setMahasiswa] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);

    async function loadData() {
      try {
        const kelasData = await masterApi('kelas').get(id);
        if (!alive) return;
        setKelas(kelasData);

        if (kelasData) {
          const res = await masterApi('mahasiswa').list({ 
            limit: 500, 
            kelasId: kelasData.id 
          });
          if (!alive) return;
          setMahasiswa(res.rows || []);
        }
      } catch (err) {
        if (!alive) return;
        setError('Gagal memuat daftar mahasiswa kelas ini.');
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadData();
    return () => { alive = false; };
  }, [id]);

  const aktif = mahasiswa.filter((m) => m.status === 'AKTIF').length;
  const nonAktif = mahasiswa.filter((m) => m.status !== 'AKTIF').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate('/kelas')}>
          ← Kembali ke Kelas
        </Button>
        <h1 className="text-2xl font-bold text-slate-800">Daftar Mahasiswa Kelas</h1>
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
        <div className="flex flex-col lg:flex-row gap-6">
          {/* KIRI: Informasi Kelas */}
          <div className="w-full lg:w-1/3 space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Informasi Kelas</h3>
              
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-slate-400 font-medium">Program Studi</p>
                  <p className="text-sm font-semibold text-slate-800">{kelas?.prodiNama || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">Nama Kelas</p>
                  <p className="text-sm font-semibold text-slate-800">{kelas?.namaKelas || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">Angkatan</p>
                  <p className="text-sm font-semibold text-slate-800">{kelas?.angkatan || '-'}</p>
                </div>
              </div>

              <hr className="my-6 border-slate-100" />

              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Statistik Mahasiswa</h3>
              <div className="space-y-4">
                <div className="bg-sky-50 p-4 rounded-xl border border-sky-100 flex items-center justify-between shadow-sm">
                  <span className="text-xs font-bold text-sky-800">Total Mahasiswa</span>
                  <span className="text-lg font-black text-sky-600">{mahasiswa.length}</span>
                </div>
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex items-center justify-between shadow-sm">
                  <span className="text-xs font-bold text-emerald-800">Aktif</span>
                  <span className="text-lg font-black text-emerald-600">{aktif}</span>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between shadow-sm">
                  <span className="text-xs font-bold text-slate-600">Tidak Aktif / Lainnya</span>
                  <span className="text-lg font-black text-slate-500">{nonAktif}</span>
                </div>
              </div>
            </div>
          </div>

          {/* KANAN: Tabel Mahasiswa */}
          <div className="w-full lg:w-2/3">
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm min-h-[500px]">
              {mahasiswa.length === 0 ? (
                <div className="flex flex-col justify-center items-center h-full min-h-[400px] text-slate-400 p-6 text-center">
                  <p className="text-base text-slate-500 font-medium">Belum ada mahasiswa di kelas ini.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="p-3 text-xs font-bold text-slate-500 uppercase">NIM</th>
                        <th className="p-3 text-xs font-bold text-slate-500 uppercase">Nama Lengkap</th>
                        <th className="p-3 text-xs font-bold text-slate-500 uppercase">Email</th>
                        <th className="p-3 text-xs font-bold text-slate-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {mahasiswa.map((mhs) => (
                        <tr key={mhs.id} className="hover:bg-sky-50/50 transition-colors">
                          <td className="p-3 font-medium text-slate-700 text-sm">{mhs.nim}</td>
                          <td className="p-3 font-semibold text-slate-800 text-sm">{mhs.nama}</td>
                          <td className="p-3 text-slate-500 text-sm">{mhs.email || '-'}</td>
                          <td className="p-3">{badgeRender(mhs)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
