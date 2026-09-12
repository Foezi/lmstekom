import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../api/client.js';
import { SidebarMenu } from '../../components/SidebarMenu.jsx';
import { Select, Input, Button } from '../../components/ui.jsx';
import { FileText, Plus, Settings, Trash2, Edit } from 'lucide-react';
import toast from 'react-hot-toast';

export default function KelolaUjianPage() {
  const navigate = useNavigate();
  const [jadwalList, setJadwalList] = useState([]);
  const [selectedJadwalId, setSelectedJadwalId] = useState('');

  const [ujianList, setUjianList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [ujianToDelete, setUjianToDelete] = useState(null);
  
  const [formData, setFormData] = useState({
    id: null,
    matakuliahId: '',
    tipeUjian: 'UTS',
    judul: '',
    deskripsi: ''
  });

  useEffect(() => {
    fetchMyJadwal();
  }, []);

  useEffect(() => {
    if (selectedJadwalId) {
      fetchUjian();
    } else {
      setUjianList([]);
    }
  }, [selectedJadwalId]);

  const fetchMyJadwal = async () => {
    try {
      const res = await api.get('/materi');
      const jadwals = res.data.data || [];
      setJadwalList(jadwals);
      if (jadwals.length > 0) {
        setSelectedJadwalId(jadwals[0].id.toString());
      }
    } catch (err) {
      toast.error('Gagal memuat daftar kelas');
    }
  };

  const fetchUjian = async () => {
    setLoading(true);
    try {
      const jadwals = await api.get('/materi');
      const jadwal = jadwals.data.data.find(j => j.id.toString() === selectedJadwalId);
      if (!jadwal) return;
      
      const res = await api.get(`/ujian?matakuliahId=${jadwal.matakuliahId}`);
      setUjianList(res.data.data || []);
      setFormData(f => ({ ...f, matakuliahId: jadwal.matakuliahId }));
    } catch (err) {
      toast.error('Gagal memuat ujian');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (tipeUjian) => {
    setFormData(f => ({
      id: null,
      matakuliahId: f.matakuliahId,
      tipeUjian,
      judul: tipeUjian === 'UTS' ? 'Ujian Tengah Semester' : 'Ujian Akhir Semester',
      deskripsi: ''
    }));
    setModalOpen(true);
  };

  const openEdit = (ujian) => {
    setFormData({
      id: ujian.id,
      matakuliahId: ujian.matakuliahId,
      tipeUjian: ujian.tipeUjian,
      judul: ujian.judul,
      deskripsi: ujian.deskripsi || ''
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      if (formData.id) {
        await api.put(`/ujian/${formData.id}`, payload);
        toast.success('Pengaturan ujian diperbarui');
      } else {
        await api.post('/ujian', payload);
        toast.success('Ujian berhasil dibuat');
      }
      setModalOpen(false);
      fetchUjian();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan ujian');
    }
  };

  const confirmDelete = (ujian) => {
    setUjianToDelete(ujian);
    setDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (!ujianToDelete) return;
    try {
      await api.delete(`/ujian/${ujianToDelete.id}`);
      toast.success('Ujian dihapus');
      fetchUjian();
      setDeleteModalOpen(false);
      setUjianToDelete(null);
    } catch (err) {
      toast.error('Gagal menghapus ujian');
    }
  };

  const renderUjianCard = (tipe) => {
    const ujian = ujianList.find(u => u.tipeUjian === tipe);
    
    if (!ujian) {
      return (
        <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-slate-50/50">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
            <FileText className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="font-bold text-slate-700 text-lg">{tipe === 'UTS' ? 'Ujian Tengah Semester' : 'Ujian Akhir Semester'}</h3>
          <p className="text-slate-500 text-sm mb-6 max-w-sm mt-2">Belum ada {tipe} yang dijadwalkan untuk mata kuliah ini.</p>
          <button
            onClick={() => handleOpenModal(tipe)}
            disabled={!formData.matakuliahId}
            className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            <Plus className="w-5 h-5" /> Buat {tipe}
          </button>
        </div>
      );
    }

    return (
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm flex flex-col">
        <div className="bg-sky-50 p-4 border-b border-sky-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-sky-100 p-2 rounded-lg">
              <FileText className="w-6 h-6 text-sky-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-sky-600 uppercase tracking-wider">{ujian.tipeUjian}</p>
              <h3 className="font-bold text-slate-800 text-lg">{ujian.judul}</h3>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => openEdit(ujian)} className="p-2 text-slate-400 hover:text-sky-600 bg-white border border-slate-200 rounded-lg shadow-sm transition-colors" title="Edit Pengaturan">
              <Settings className="w-4 h-4" />
            </button>
            <button onClick={() => confirmDelete(ujian)} className="p-2 text-slate-400 hover:text-red-600 bg-white border border-slate-200 rounded-lg shadow-sm transition-colors" title="Hapus Ujian">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="p-5 flex-1 flex flex-col">
          <div className="space-y-3 mb-6 flex-1 text-sm text-slate-600">
            <div className="flex justify-between">
              <span className="text-slate-400">Total Soal:</span>
              <span className="font-semibold text-slate-700">{ujian._count?.soal || 0} Soal</span>
            </div>
          </div>
          <div className="flex gap-3">
            <Link to={`/kuis/${ujian.id}/soal`} className="flex-1">
              <Button variant="outline" className="w-full">
                <Settings className="w-4 h-4 mr-2" /> Kelola Soal
              </Button>
            </Link>
            <Button variant="primary" className="flex-1" onClick={() => openEdit(ujian)}>
              <Edit className="w-4 h-4 mr-2" /> Pengaturan
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <SidebarMenu currentGroup="Perkuliahan" />
      
      <div className="flex-1 p-8">
        <div className="max-w-6xl mx-auto flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <FileText className="w-6 h-6 text-sky-600" /> Kelola Ujian (UTS & UAS)
              </h1>
              <p className="text-sm text-slate-500 mt-1">Buat jadwal ujian dan kelola butir soal otomatis untuk UTS dan UAS.</p>
            </div>
            <div className="w-full sm:w-80">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Pilih Kelas / Mata Kuliah</label>
              <select 
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-semibold"
                value={selectedJadwalId}
                onChange={e => setSelectedJadwalId(e.target.value)}
              >
                {jadwalList.map(j => (
                  <option key={j.id} value={j.id}>{j.namaMk} - {j.kelasNama}</option>
                ))}
                {jadwalList.length === 0 && <option disabled value="">Tidak ada jadwal kelas aktif</option>}
              </select>
            </div>
          </div>

          <div>
            {!selectedJadwalId ? (
              <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-slate-200">
                <p className="text-slate-400">Silakan pilih kelas / mata kuliah terlebih dahulu untuk mengelola Ujian.</p>
              </div>
            ) : loading ? (
              <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-slate-200">
                <p className="text-slate-500 animate-pulse">Memuat data ujian...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {renderUjianCard('UTS')}
                {renderUjianCard('UAS')}
              </div>
            )}
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800">
                {formData.id ? 'Edit Pengaturan ' : 'Buat '} {formData.tipeUjian}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4">
                <Input
                  label="Judul Ujian"
                  required
                  value={formData.judul}
                  onChange={e => setFormData(f => ({ ...f, judul: e.target.value }))}
                />
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Deskripsi</label>
                  <textarea 
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                    rows="3"
                    value={formData.deskripsi}
                    onChange={e => setFormData({...formData, deskripsi: e.target.value})}
                    placeholder="Masukkan petunjuk atau deskripsi ujian"
                  ></textarea>
                </div>
              </div>
              
              <div className="p-6 border-t border-slate-200 flex justify-end gap-3 bg-slate-50">
                <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>
                  Batal
                </Button>
                <Button variant="primary" type="submit">
                  Simpan Ujian
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 p-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Hapus Ujian?</h2>
            <p className="text-slate-500 text-sm mb-6">
              Apakah Anda yakin ingin menghapus ujian <strong>{ujianToDelete?.judul}</strong>? Seluruh soal dan jawaban dari mahasiswa akan ikut terhapus secara permanen.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setDeleteModalOpen(false)}
                className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={executeDelete}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors shadow-sm shadow-red-500/20"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
