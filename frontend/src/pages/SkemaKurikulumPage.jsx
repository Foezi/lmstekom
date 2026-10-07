import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { masterApi } from '../api/endpoints.js';
import { Spinner, Button } from '../components/ui.jsx';

export function SkemaKurikulumPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [kelas, setKelas] = useState(null);
  const [mataKuliah, setMataKuliah] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);

    async function loadData() {
      try {
        const kelasData = await masterApi('kelas').get(id);
        if (!alive) return;
        setKelas(kelasData);

        if (kelasData && kelasData.prodiId && kelasData.tahunKurikulumId) {
          const res = await masterApi('mata-kuliah').list({ 
            limit: 200, 
            filters: {
              prodiId: kelasData.prodiId, 
              tahunKurikulumId: kelasData.tahunKurikulumId 
            }
          });
          if (!alive) return;
          setMataKuliah(res.rows || []);
        } else {
          setMataKuliah([]);
        }
      } catch (err) {
        if (!alive) return;
        setError('Gagal memuat data skema kurikulum kelas ini.');
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadData();
    return () => { alive = false; };
  }, [id]);

  const grouped = mataKuliah.reduce((acc, mk) => {
    const smt = mk.semester || 1;
    if (!acc[smt]) acc[smt] = [];
    acc[smt].push(mk);
    return acc;
  }, {});

  const semseters = Object.keys(grouped).sort((a, b) => Number(a) - Number(b));
  const totalSks = mataKuliah.reduce((sum, mk) => sum + (mk.sks || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate('/kelas')}>
          ← Kembali ke Kelas
        </Button>
        <h1 className="text-2xl font-bold text-slate-800">Skema Kurikulum Kelas</h1>
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
          {/* KIRI: Informasi Kelas & Kurikulum */}
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

              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Skema Kurikulum</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-slate-400 font-medium">Tahun Referensi</p>
                  <p className="text-xl font-black text-sky-600">{kelas?.tahunKurikulum ? `Kurikulum ${kelas.tahunKurikulum}` : 'Belum Diatur'}</p>
                </div>
                <div className="bg-sky-50 p-4 rounded-xl border border-sky-100 flex items-center justify-between shadow-sm">
                  <span className="text-xs font-bold text-sky-800">Total Mata Kuliah</span>
                  <span className="text-lg font-black text-sky-600">{mataKuliah.length}</span>
                </div>
                <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex items-center justify-between shadow-sm">
                  <span className="text-xs font-bold text-orange-800">Total Beban SKS</span>
                  <span className="text-lg font-black text-orange-600">{totalSks} SKS</span>
                </div>
              </div>
            </div>
          </div>

          {/* KANAN: Daftar Matakuliah per Semester */}
          <div className="w-full lg:w-2/3">
            <div className="bg-white border border-slate-200 rounded-xl p-2 min-h-[500px] shadow-sm">
              {semseters.length === 0 ? (
                <div className="flex flex-col justify-center items-center h-full min-h-[400px] text-slate-400 p-6 text-center">
                  <svg className="w-16 h-16 mb-4 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <p className="text-base text-slate-500 font-medium">Belum ada mata kuliah yang terdaftar.</p>
                  <p className="text-sm mt-1">Pastikan Anda telah mengisi data Mata Kuliah untuk Kurikulum {kelas?.tahunKurikulum}.</p>
                </div>
              ) : (
                <div className="p-4 space-y-8">
                  {semseters.map((smt) => (
                    <div key={smt} className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="h-px bg-slate-200 flex-1"></div>
                        <span className="text-sm font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-4 py-1.5 rounded-full border border-slate-200">
                          Semester {smt}
                        </span>
                        <div className="h-px bg-slate-200 flex-1"></div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {grouped[smt].map(mk => (
                          <div key={mk.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-sky-50 transition-colors group shadow-sm hover:shadow gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="text-xs text-slate-400 font-bold mb-1 tracking-wide">{mk.kodeMk}</p>
                              <p className="text-sm font-bold text-slate-700 group-hover:text-sky-700 transition-colors leading-tight break-words">{mk.namaMk}</p>
                            </div>
                            <div className="bg-white border border-slate-200 px-3 py-2 rounded-lg shadow-sm flex-shrink-0 self-start sm:self-auto">
                              <span className="text-sm font-black text-sky-600">{mk.sks} SKS</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
