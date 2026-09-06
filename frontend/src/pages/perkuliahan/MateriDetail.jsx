import React, { useState, useEffect } from 'react';
import { api } from '../../api/client.js';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Edit, Save, X, Calendar, Clock, MapPin, Users, BookOpen, Video, Link as LinkIcon, FileText, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { SidebarMenu } from '../../components/SidebarMenu.jsx';
import { Modal } from '../../components/Modal.jsx';
import { Button, Input } from '../../components/ui.jsx';

export default function MateriDetail() {
  const { id } = useParams(); // jadwalId
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [isEditingDeskripsi, setIsEditingDeskripsi] = useState(false);
  const [deskripsiForm, setDeskripsiForm] = useState('');
  
  const [jumlahPertemuan, setJumlahPertemuan] = useState(16);
  const [generating, setGenerating] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateJumlah, setGenerateJumlah] = useState(14);
  const [selesaiData, setSelesaiData] = useState(null);

  // Untuk form edit rincian pertemuan
  const [editSesiId, setEditSesiId] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const res = await api.get(`/materi/${id}/pertemuan`);
      setData(res.data.data);
      setDeskripsiForm(res.data.data.deskripsiMk || '');
    } catch (err) {
      toast.error('Gagal mengambil data BAP');
    } finally {
      setLoading(false);
    }
  };

  const saveDeskripsi = async () => {
    try {
      await api.put(`/materi/${id}/deskripsi`, { deskripsiMk: deskripsiForm });
      toast.success('Deskripsi berhasil disimpan');
      setIsEditingDeskripsi(false);
      fetchData();
    } catch (err) {
      toast.error('Gagal menyimpan deskripsi');
    }
  };

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      await api.post(`/materi/${id}/pertemuan/generate`, { jumlahPertemuan: parseInt(generateJumlah, 10) });
      toast.success('Pertemuan berhasil digenerate');
      setShowGenerateModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal generate pertemuan');
    } finally {
      setGenerating(false);
    }
  };

  const handleSyncAPI = async () => {
    try {
      setGenerating(true);
      await api.post(`/materi/${id}/pertemuan/sync`);
      toast.success('Silabus berhasil disinkronkan dari API Eksternal');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || err.response?.data?.message || 'Gagal melakukan sinkronisasi');
    } finally {
      setGenerating(false);
    }
  };

  const startEdit = (sesi) => {
    setEditSesiId(sesi.id);
    setEditForm({
      tanggal: sesi.tanggal ? sesi.tanggal.split('T')[0] : '',
      waktuMulai: sesi.waktuMulai || '',
      waktuSelesai: sesi.waktuSelesai || '',
      jenisPertemuan: sesi.jenisPertemuan || 'Kuliah',
      kelompok: sesi.kelompok || '',
      metodePembelajaran: sesi.metodePembelajaran || 'Luring',
      ruangKuliah: sesi.ruangKuliah || '',
      keteranganRuang: sesi.keteranganRuang || '',
      urlKuliahOnline: sesi.urlKuliahOnline || '',
      rencanaMateri: sesi.rencanaMateri || '',
      realisasiMateri: sesi.realisasiMateri || '',
      status: sesi.status || 'BELUM'
    });
  };

  const saveEdit = async () => {
    try {
      await api.put(`/materi/pertemuan/${editSesiId}`, editForm);
      toast.success('Rincian pertemuan diperbarui');
      setEditSesiId(null);
      fetchData();
    } catch (err) {
      toast.error('Gagal menyimpan rincian');
    }
  };

  const updateStatus = async (sesiId, status) => {
    try {
      await api.put(`/materi/pertemuan/${sesiId}`, { status });
      toast.success('Status berhasil diubah menjadi ' + status);
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Gagal mengubah status';
      toast.error(msg);
    }
  };

  const handleSelesaiKuliah = (sesi) => {
    if (sesi.rencanaMateri && sesi.realisasiMateri) {
      updateStatus(sesi.id, 'SELESAI');
    } else {
      setSelesaiData({ id: sesi.id, rencanaMateri: sesi.rencanaMateri || '', realisasiMateri: sesi.realisasiMateri || '' });
    }
  };

  const submitSelesai = async () => {
    if (!selesaiData.rencanaMateri || !selesaiData.realisasiMateri) {
      toast.error('Rencana dan realisasi materi wajib diisi');
      return;
    }
    try {
      await api.put(`/materi/pertemuan/${selesaiData.id}`, {
        status: 'SELESAI',
        rencanaMateri: selesaiData.rencanaMateri,
        realisasiMateri: selesaiData.realisasiMateri
      });
      toast.success('Kuliah selesai, data BAP berhasil disimpan');
      setSelesaiData(null);
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Gagal menyimpan data';
      toast.error(msg);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Memuat rincian...</div>;
  if (!data) return <div className="p-8 text-center text-red-500">Data tidak ditemukan</div>;

  const { jadwal, pertemuan } = data;

  return (
    <div className="flex flex-col md:flex-row gap-6 items-start">
      <SidebarMenu currentGroup="Perkuliahan" />
      <div className="flex-1 w-full space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/perkuliahan/materi" className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-700" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Administrasi Pembelajaran & Materi</h1>
          <p className="text-slate-500 text-sm">Lengkapi BAP dan materi untuk setiap pertemuan mata kuliah ini.</p>
        </div>
      </div>

      {/* Header Info Card */}
      <div className="bg-white border-t-4 border-blue-600 rounded-xl shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-1">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Program Studi</div>
            <div className="font-medium text-slate-800">{jadwal.prodiNama}</div>
          </div>
          <div className="space-y-1">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Periode</div>
            <div className="font-medium text-slate-800">{jadwal.tahunAkademik}</div>
          </div>
          <div className="space-y-1 lg:col-span-2">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Mata Kuliah</div>
            <div className="font-medium text-slate-800">{jadwal.kodeMk} - {jadwal.namaMk} ({jadwal.sks} SKS)</div>
          </div>
          <div className="space-y-1">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Kurikulum</div>
            <div className="font-medium text-slate-800">{jadwal.kurikulum}</div>
          </div>
          <div className="space-y-1">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Nama Kelas</div>
            <div className="font-medium text-slate-800">{jadwal.kelasNama}</div>
          </div>
          <div className="space-y-1 lg:col-span-2">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Dosen Pengajar</div>
            <div className="font-medium text-slate-800">{jadwal.dosenNama}</div>
          </div>
        </div>
      </div>

      {/* Deskripsi Mata Kuliah */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-slate-800">Deskripsi Mata Kuliah</h2>
          {!isEditingDeskripsi && (
            <button onClick={() => setIsEditingDeskripsi(true)} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
              <Edit className="w-4 h-4" /> Edit Deskripsi
            </button>
          )}
        </div>
        {isEditingDeskripsi ? (
          <div className="space-y-3">
            <textarea
              className="w-full p-3 border rounded-lg h-32"
              value={deskripsiForm}
              onChange={(e) => setDeskripsiForm(e.target.value)}
              placeholder="Masukkan deskripsi mata kuliah..."
            ></textarea>
            <div className="flex justify-end gap-2">
              <button onClick={() => setIsEditingDeskripsi(false)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg">Batal</button>
              <button onClick={saveDeskripsi} className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700">
                <Save className="w-4 h-4" /> Simpan
              </button>
            </div>
          </div>
        ) : (
          <p className="text-slate-600 whitespace-pre-wrap">{data.deskripsiMk || <span className="text-slate-400 italic">Belum ada deskripsi mata kuliah.</span>}</p>
        )}
      </div>

      {/* Sesi List */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-800 px-1">Daftar Pertemuan (Sesi)</h2>
        
        {pertemuan.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto">
              <Calendar className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Sesi Belum Digenerate</h3>
            <p className="text-slate-500 text-sm max-w-md mx-auto">Silakan tentukan jumlah pertemuan yang diinginkan untuk jadwal ini. Sistem akan men-generate sesi kosong yang nantinya dapat Anda lengkapi.</p>
            <div className="flex justify-center items-center gap-3 mt-4">
              <Button onClick={() => setShowGenerateModal(true)} variant="primary" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Mulai Generate Sesi
              </Button>
              <button 
                onClick={handleSyncAPI} 
                disabled={generating}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-sm flex items-center gap-2 disabled:opacity-50"
              >
                <Zap className="w-4 h-4" /> {generating ? 'Memproses...' : 'Sync Silabus via API'}
              </button>
            </div>
          </div>
        ) : (
          pertemuan.map(sesi => {
          const isEditing = editSesiId === sesi.id;

          return (
            <div key={sesi.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                    {sesi.keBerapa}
                  </div>
                  <span className="font-semibold text-slate-800">
                    Sesi {sesi.keBerapa} {sesi.jenisPertemuan !== 'Kuliah' && `- ${sesi.jenisPertemuan}`}
                  </span>
                </div>
                <div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${sesi.status === 'SELESAI' ? 'bg-emerald-100 text-emerald-700' : sesi.status === 'MULAI' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'}`}>
                    {sesi.status}
                  </span>
                </div>
              </div>

              {isEditing ? (
                <div className="p-6 space-y-6">
                  {/* Form Edit */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Jadwal<span className="text-red-500 ml-1">*</span></label>
                      <input type="date" className="w-full px-3 py-2 border rounded-lg" value={editForm.tanggal} onChange={e => setEditForm({...editForm, tanggal: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Waktu Mulai<span className="text-red-500 ml-1">*</span></label>
                      <input type="time" className="w-full px-3 py-2 border rounded-lg" value={editForm.waktuMulai} onChange={e => setEditForm({...editForm, waktuMulai: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Waktu Selesai<span className="text-red-500 ml-1">*</span></label>
                      <input type="time" className="w-full px-3 py-2 border rounded-lg" value={editForm.waktuSelesai} onChange={e => setEditForm({...editForm, waktuSelesai: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Jenis Pertemuan<span className="text-red-500 ml-1">*</span></label>
                      <select className="w-full px-3 py-2 border rounded-lg" value={editForm.jenisPertemuan} onChange={e => setEditForm({...editForm, jenisPertemuan: e.target.value})}>
                        <option value="Kuliah">Kuliah</option>
                        <option value="Praktikum">Praktikum</option>
                        <option value="UTS">UTS</option>
                        <option value="UAS">UAS</option>
                        <option value="Pengganti">Pengganti</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Metode</label>
                      <select className="w-full px-3 py-2 border rounded-lg" value={editForm.metodePembelajaran} onChange={e => setEditForm({...editForm, metodePembelajaran: e.target.value})}>
                        <option value="Luring">Luring (Offline)</option>
                        <option value="Daring">Daring (Online)</option>
                        <option value="Hybrid">Hybrid</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Ruang Kuliah<span className="text-red-500 ml-1">*</span></label>
                      <input type="text" className="w-full px-3 py-2 border rounded-lg" value={editForm.ruangKuliah} onChange={e => setEditForm({...editForm, ruangKuliah: e.target.value})} />
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-sm font-medium text-slate-700 mb-1">URL Kuliah Online (Jika Daring/Hybrid)</label>
                      <input type="url" className="w-full px-3 py-2 border rounded-lg" placeholder="https://zoom.us/j/..." value={editForm.urlKuliahOnline} onChange={e => setEditForm({...editForm, urlKuliahOnline: e.target.value})} />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-bold text-slate-800 text-lg border-b pb-2 text-emerald-700">Materi</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Rencana Materi<span className="text-red-500 ml-1">*</span></label>
                        <textarea className="w-full px-3 py-2 border rounded-lg h-24" value={editForm.rencanaMateri} onChange={e => setEditForm({...editForm, rencanaMateri: e.target.value})}></textarea>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Realisasi Materi</label>
                        <textarea className="w-full px-3 py-2 border rounded-lg h-24" value={editForm.realisasiMateri} onChange={e => setEditForm({...editForm, realisasiMateri: e.target.value})}></textarea>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <button onClick={() => setEditSesiId(null)} className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg">Batal</button>
                    <button onClick={saveEdit} className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700">
                      <Save className="w-4 h-4" /> Simpan Rincian
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-6">
                  {/* View Mode */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-8">
                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
                      <div>
                        <div className="text-xs font-semibold text-slate-500">Tanggal & Waktu</div>
                        <div className="text-sm text-slate-800 font-medium">
                          {sesi.tanggal ? new Date(sesi.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'} <br/>
                          {sesi.waktuMulai} - {sesi.waktuSelesai}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                      <div>
                        <div className="text-xs font-semibold text-slate-500">Ruangan & Metode</div>
                        <div className="text-sm text-slate-800 font-medium">
                          {sesi.ruangKuliah || '-'} <br/>
                          <span className="text-blue-600">{sesi.metodePembelajaran}</span>
                        </div>
                      </div>
                    </div>
                    {sesi.urlKuliahOnline && (
                      <div className="flex items-start gap-3 lg:col-span-1 md:col-span-2">
                        <LinkIcon className="w-5 h-5 text-slate-400 mt-0.5" />
                        <div>
                          <div className="text-xs font-semibold text-slate-500">Link Online</div>
                          <a href={sesi.urlKuliahOnline} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline break-all">
                            {sesi.urlKuliahOnline}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 border-t pt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-semibold text-emerald-700 mb-2">Rencana Materi</h4>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{sesi.rencanaMateri || '-'}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-emerald-700 mb-2">Realisasi Materi</h4>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{sesi.realisasiMateri || '-'}</p>
                    </div>
                  </div>

                  {/* Attachment Section (mockup) */}
                  <div className="mt-6 border-t pt-4">
                     <div className="flex justify-between items-center mb-3">
                        <h4 className="text-sm font-semibold text-slate-700">Lampiran File & Dokumen</h4>
                     </div>
                     {sesi.materi?.length > 0 ? (
                       <ul className="space-y-2">
                         {sesi.materi.map(m => (
                           <li key={m.id} className="flex items-center gap-2 text-sm text-slate-600 p-2 bg-slate-50 rounded-lg">
                             <FileText className="w-4 h-4 text-blue-500" />
                             {m.judul}
                           </li>
                         ))}
                       </ul>
                     ) : (
                       <p className="text-sm text-slate-400 italic">Belum ada file terlampir.</p>
                     )}
                  </div>

                  <div className="mt-6 flex flex-wrap justify-end gap-3">
                    {sesi.status === 'BELUM' && (
                      <button onClick={() => updateStatus(sesi.id, 'MULAI')} className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg flex items-center gap-2 hover:bg-blue-200 text-sm font-bold">
                        Mulai Kuliah
                      </button>
                    )}
                    {sesi.status === 'MULAI' && (
                      <button onClick={() => handleSelesaiKuliah(sesi)} className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg flex items-center gap-2 hover:bg-emerald-200 text-sm font-bold">
                        Selesai Kuliah
                      </button>
                    )}
                    {sesi.status !== 'SELESAI' && (
                      <button onClick={() => startEdit(sesi)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg flex items-center gap-2 hover:bg-slate-200 text-sm font-medium">
                        <Edit className="w-4 h-4" /> Kelola Rincian
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        }))}
      </div>
      
      <Modal open={showGenerateModal} onClose={() => setShowGenerateModal(false)} title="Generate Pertemuan">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Sistem akan men-generate sesi pertemuan sesuai dengan kalender akademik. 
            Pastikan data awal kuliah di Tahun Akademik ini sudah diisi.
          </p>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Jumlah Pertemuan<span className="text-red-500 ml-1">*</span></label>
            <input 
              type="number" 
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={generateJumlah}
              onChange={e => setGenerateJumlah(Number(e.target.value))}
              min={1}
            />
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button onClick={() => setShowGenerateModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 text-sm font-medium">Batal</button>
            <button onClick={handleGenerate} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2">
              <Zap className="w-4 h-4" /> Generate Sekarang
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={!!selesaiData} onClose={() => setSelesaiData(null)} title="Lengkapi BAP Perkuliahan">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Sebelum mengakhiri kelas, pastikan Anda telah mengisi Rencana dan Realisasi Materi secara lengkap.</p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Rencana Materi<span className="text-red-500 ml-1">*</span></label>
              <textarea 
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500" 
                rows={3} 
                value={selesaiData?.rencanaMateri || ''} 
                onChange={(e) => setSelesaiData({...selesaiData, rencanaMateri: e.target.value})} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Realisasi Materi<span className="text-red-500 ml-1">*</span></label>
              <textarea 
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500" 
                rows={3} 
                value={selesaiData?.realisasiMateri || ''} 
                onChange={(e) => setSelesaiData({...selesaiData, realisasiMateri: e.target.value})} 
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
             <button onClick={() => setSelesaiData(null)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium text-sm">Batal</button>
             <button onClick={submitSelesai} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-sm">Simpan & Akhiri Kuliah</button>
          </div>
        </div>
      </Modal>

    </div>
    </div>
  );
}
