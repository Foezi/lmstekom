import React, { useState, useEffect } from 'react';
import { Book, CheckCircle, FileText, ListChecks, Plus, Trash2, Edit } from 'lucide-react';
import { api } from '../../api/client.js';
import { Modal, ConfirmDialog } from '../../components/Modal.jsx';
import { Button } from '../../components/ui.jsx';
import toast from 'react-hot-toast';
import { getBankTugasByMk, createBankTugas, updateBankTugas, deleteBankTugas, getBankKuisByMk, createBankKuis, updateBankKuis, deleteBankKuis } from '../../api/endpoints.js';
import { SidebarMenu } from '../../components/SidebarMenu.jsx';
import { useNavigate } from 'react-router-dom';

export default function KelolaTugasKuis() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('tugas'); // 'tugas' or 'kuis'
  
  const [jadwalList, setJadwalList] = useState([]);
  const [matakuliahList, setMatakuliahList] = useState([]);
  const [selectedMkId, setSelectedMkId] = useState('');
  
  const [dataTugas, setDataTugas] = useState([]);
  const [dataKuis, setDataKuis] = useState([]);
  const [loading, setLoading] = useState(false);

  // Forms
  const [tugasModalOpen, setTugasModalOpen] = useState(false);
  const [tugasForm, setTugasForm] = useState({ id: null, judul: '', kategori: '', deskripsi: '', fileUrl: '' });
  const [fileLampiran, setFileLampiran] = useState(null);
  
  const [kuisModalOpen, setKuisModalOpen] = useState(false);
  const [kuisForm, setKuisForm] = useState({ id: null, judul: '', jenis: 'PILIHAN_GANDA', deskripsi: '', bobotNilai: 100, modeLockdown: false });

  const [deletingId, setDeletingId] = useState(null);
  const [isDeletingKuis, setIsDeletingKuis] = useState(false);

  useEffect(() => {
    fetchMyJadwal();
  }, []);

  useEffect(() => {
    if (selectedMkId) {
      if (activeTab === 'tugas') fetchTugas();
      else fetchKuis();
    }
  }, [selectedMkId, activeTab]);

  const fetchMyJadwal = async () => {
    try {
      const res = await api.get('/materi');
      const jadwals = res.data.data || [];
      setJadwalList(jadwals);
      
      // Extract unique matakuliah
      const mks = [];
      const mkIds = new Set();
      jadwals.forEach(j => {
        if (j.matakuliah && !mkIds.has(j.matakuliah.id)) {
          mkIds.add(j.matakuliah.id);
          mks.push(j.matakuliah);
        }
      });
      setMatakuliahList(mks);
      
      if (mks.length > 0) {
        setSelectedMkId(mks[0].id.toString());
      }
    } catch (err) {
      toast.error('Gagal mengambil data jadwal mata kuliah');
    }
  };

  const fetchTugas = async () => {
    setLoading(true);
    try {
      const res = await getBankTugasByMk(selectedMkId);
      setDataTugas(res);
    } catch (err) {
      toast.error('Gagal memuat bank tugas');
    } finally {
      setLoading(false);
    }
  };

  const fetchKuis = async () => {
    if (!selectedMkId) return;
    setLoading(true);
    try {
      const kuisList = await getBankKuisByMk(selectedMkId, 'KUIS');
      setDataKuis(kuisList || []);
    } catch (err) {
      toast.error('Gagal memuat bank kuis');
    } finally {
      setLoading(false);
    }
  };

  // --- TUGAS ACTIONS ---
  const handleSaveTugas = async (e) => {
    e.preventDefault();
    try {
      const fd = new FormData();
      fd.append('judul', tugasForm.judul);
      fd.append('kategori', tugasForm.kategori);
      fd.append('deskripsi', tugasForm.deskripsi);
      fd.append('matakuliahId', selectedMkId);
      if (fileLampiran) {
        fd.append('file', fileLampiran);
      }

      if (tugasForm.id) {
        await updateBankTugas(tugasForm.id, fd);
        toast.success('Tugas diperbarui');
      } else {
        await createBankTugas(fd);
        toast.success('Tugas dibuat');
      }
      setTugasModalOpen(false);
      setFileLampiran(null);
      fetchTugas();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan tugas');
    }
  };

  const openEditTugas = (t) => {
    setTugasForm({ id: t.id, judul: t.judul, kategori: t.kategori || '', deskripsi: t.deskripsi || '', fileUrl: t.fileUrl || '' });
    setFileLampiran(null);
    setTugasModalOpen(true);
  };

  // --- KUIS ACTIONS ---
  const handleSaveKuis = async (e) => {
    e.preventDefault();
    try {
      if (kuisForm.id) {
        await updateBankKuis(kuisForm.id, kuisForm);
        toast.success('Kuis diperbarui');
      } else {
        await createBankKuis({ ...kuisForm, matakuliahId: parseInt(selectedMkId) });
        toast.success('Kuis dibuat');
      }
      setKuisModalOpen(false);
      fetchKuis();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan kuis');
    }
  };

  const openEditKuis = (k) => {
    setKuisForm({ id: k.id, judul: k.judul, jenis: k.jenis, deskripsi: k.deskripsi || '', bobotNilai: k.bobotNilai, modeLockdown: false });
    setKuisModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      if (isDeletingKuis) {
        await deleteBankKuis(deletingId);
        fetchKuis();
      } else {
        await deleteBankTugas(deletingId);
        fetchTugas();
      }
      toast.success('Data dihapus');
      setDeletingId(null);
    } catch (err) {
      toast.error('Gagal menghapus data');
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <SidebarMenu currentGroup="Perkuliahan" />
      <div className="flex-1 p-8">
        <div className="max-w-6xl mx-auto flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Kelola Tugas & Kuis</h1>
              <p className="text-sm text-slate-500 mt-1">Buat template Tugas dan Kuis yang bisa ditugaskan berulang pada Sesi Pertemuan.</p>
            </div>
            <div className="w-full sm:w-64">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Mata Kuliah</label>
              <select 
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold"
                value={selectedMkId}
                onChange={e => setSelectedMkId(e.target.value)}
              >
                {matakuliahList.map(mk => (
                  <option key={mk.id} value={mk.id}>{mk.kodeMk} - {mk.namaMk}</option>
                ))}
                {matakuliahList.length === 0 && <option disabled value="">Tidak ada mata kuliah aktif</option>}
              </select>
            </div>
          </div>

          {selectedMkId && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="flex border-b border-slate-200">
                <button
                  onClick={() => setActiveTab('tugas')}
                  className={`flex-1 py-4 text-center text-sm font-bold border-b-2 transition-colors ${activeTab === 'tugas' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="w-4 h-4" /> Bank Tugas
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('kuis')}
                  className={`flex-1 py-4 text-center text-sm font-bold border-b-2 transition-colors ${activeTab === 'kuis' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <ListChecks className="w-4 h-4" /> Bank Kuis
                  </div>
                </button>
              </div>

              <div className="p-6">
                {activeTab === 'tugas' && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-bold text-slate-700">Daftar Template Tugas</h2>
                      <Button variant="primary" onClick={() => { setTugasForm({ id: null, judul: '', kategori: '', deskripsi: '' }); setTugasModalOpen(true); }}>
                        <Plus className="w-4 h-4 mr-2" /> Buat Tugas Baru
                      </Button>
                    </div>
                    
                    {loading ? (
                      <div className="text-center py-8 text-slate-500">Memuat data...</div>
                    ) : dataTugas.length === 0 ? (
                      <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
                        <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <h3 className="text-lg font-bold text-slate-600 mb-1">Belum ada Tugas</h3>
                        <p className="text-sm text-slate-400">Buat template tugas baru untuk mata kuliah ini.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {dataTugas.map(t => (
                          <div key={t.id} className="border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow bg-white">
                            <div className="flex justify-between items-start mb-2">
                              <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">{t.kategori || 'Tugas'}</span>
                              <div className="flex gap-1">
                                <button onClick={() => openEditTugas(t)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button onClick={() => { setDeletingId(t.id); setIsDeletingKuis(false); }} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            <h3 className="font-bold text-slate-800 line-clamp-1" title={t.judul}>{t.judul}</h3>
                            <p className="text-sm text-slate-500 mt-2 line-clamp-3 text-justify">{t.deskripsi || 'Tidak ada deskripsi'}</p>
                            {t.fileUrl && (
                              <a href={t.fileUrl} target="_blank" rel="noreferrer" className="inline-flex mt-3 text-xs font-semibold text-blue-600 hover:underline">
                                Lihat Lampiran
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'kuis' && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-bold text-slate-700">Daftar Template Kuis</h2>
                      <Button variant="primary" onClick={() => { setKuisForm({ id: null, judul: '', jenis: 'PILIHAN_GANDA', deskripsi: '', bobotNilai: 100, modeLockdown: false }); setKuisModalOpen(true); }} className="!bg-purple-600 hover:!bg-purple-700">
                        <Plus className="w-4 h-4 mr-2" /> Buat Kuis Baru
                      </Button>
                    </div>
                    
                    {loading ? (
                      <div className="text-center py-8 text-slate-500">Memuat data...</div>
                    ) : dataKuis.length === 0 ? (
                      <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
                        <ListChecks className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <h3 className="text-lg font-bold text-slate-600 mb-1">Belum ada Kuis</h3>
                        <p className="text-sm text-slate-400">Buat template kuis baru untuk mata kuliah ini.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {dataKuis.map(k => (
                          <div key={k.id} className="border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow bg-white">
                            <div className="flex justify-between items-start mb-2">
                              <span className="px-2.5 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">
                                Pilihan Ganda
                              </span>
                              <div className="flex gap-1">
                                <button onClick={() => navigate(`/kuis/${k.id}/soal`)} className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg" title="Kelola Soal">
                                  <ListChecks className="w-4 h-4" />
                                </button>
                                <button onClick={() => openEditKuis(k)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Edit Kuis">
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button onClick={() => { setDeletingId(k.id); setIsDeletingKuis(true); }} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Hapus Kuis">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            <h3 className="font-bold text-slate-800 line-clamp-1" title={k.judul}>{k.judul}</h3>
                            <p className="text-sm text-slate-500 mt-2 line-clamp-2">{k.deskripsi || 'Tidak ada deskripsi'}</p>
                            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                              <span>Bobot: {k.bobotNilai}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* MODAL TUGAS */}
          <Modal open={tugasModalOpen} onClose={() => setTugasModalOpen(false)} title={tugasForm.id ? "Edit Tugas" : "Buat Tugas Baru"}>
            <form onSubmit={handleSaveTugas} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Judul Tugas<span className="text-red-500 ml-1">*</span></label>
                <input 
                  type="text" 
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={tugasForm.judul}
                  onChange={e => setTugasForm({...tugasForm, judul: e.target.value})}
                  placeholder="Contoh: Tugas Makalah Akhir"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Kategori</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={tugasForm.kategori}
                  onChange={e => setTugasForm({...tugasForm, kategori: e.target.value})}
                  placeholder="Contoh: Makalah, Observasi, Proyek..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Deskripsi & Instruksi</label>
                <textarea 
                  className="w-full px-3 py-2 border rounded-lg h-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={tugasForm.deskripsi}
                  onChange={e => setTugasForm({...tugasForm, deskripsi: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Lampiran File (Opsional)</label>
                {tugasForm.fileUrl && (
                  <div className="mb-2 text-sm text-blue-600">
                    <a href={tugasForm.fileUrl} target="_blank" rel="noreferrer" className="hover:underline">Lampiran Saat Ini</a>
                  </div>
                )}
                <input 
                  type="file" 
                  className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  onChange={e => setFileLampiran(e.target.files[0])}
                />
              </div>
              <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
                <button type="button" onClick={() => setTugasModalOpen(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium text-sm">Batal</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm">
                  Simpan Tugas
                </button>
              </div>
            </form>
          </Modal>

          {/* MODAL KUIS */}
          <Modal open={kuisModalOpen} onClose={() => setKuisModalOpen(false)} title={kuisForm.id ? "Edit Kuis" : "Buat Kuis Baru"}>
            <form onSubmit={handleSaveKuis} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Judul Kuis<span className="text-red-500 ml-1">*</span></label>
                <input 
                  type="text" 
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={kuisForm.judul}
                  onChange={e => setKuisForm({...kuisForm, judul: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Jenis Kuis</label>
                  <select className="w-full px-3 py-2 border rounded-lg bg-slate-100" value={kuisForm.jenis} disabled>
                    <option value="PILIHAN_GANDA">Pilihan Ganda</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Bobot Nilai</label>
                  <input type="number" className="w-full px-3 py-2 border rounded-lg" value={kuisForm.bobotNilai} onChange={e => setKuisForm({...kuisForm, bobotNilai: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Deskripsi</label>
                <textarea 
                  className="w-full px-3 py-2 border rounded-lg h-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={kuisForm.deskripsi}
                  onChange={e => setKuisForm({...kuisForm, deskripsi: e.target.value})}
                />
              </div>
              <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
                <button type="button" onClick={() => setKuisModalOpen(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium text-sm">Batal</button>
                <button type="submit" className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium text-sm">
                  Simpan Kuis
                </button>
              </div>
            </form>
          </Modal>

          <ConfirmDialog
            open={Boolean(deletingId)}
            title="Konfirmasi Hapus"
            message="Apakah Anda yakin ingin menghapus data ini? Aksi ini tidak dapat dibatalkan."
            onConfirm={confirmDelete}
            onCancel={() => setDeletingId(null)}
          />
        </div>
      </div>
    </div>
  );
}
