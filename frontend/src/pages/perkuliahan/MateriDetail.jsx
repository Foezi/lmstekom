import React, { useState, useEffect } from 'react';
import { api } from '../../api/client.js';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, FileText, Video, Link as LinkIcon, Plus, BookOpen, Clock, AlertCircle, X, Check, Eye, Users,
  CheckCircle, PlayCircle, Lock, LayoutList, ListChecks, ArrowUpRight, PlusCircle, PenTool, ExternalLink, Calendar, Edit, Save, MapPin, Zap, EyeOff
} from 'lucide-react';
import toast from 'react-hot-toast';
import Select from 'react-select';
import { SidebarMenu } from '../../components/SidebarMenu.jsx';
import { Modal, ConfirmDialog } from '../../components/Modal.jsx';
import { Button, Input } from '../../components/ui.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { 
  addTugasToPertemuan,
  addKuisToPertemuan,
  removeTugasFromPertemuan,
  removeKuisFromPertemuan,
  getTugasSubmissions,
  getKuisSubmissions,
  getBankTugasByMk, 
  getBankKuisByMk, 
} from '../../api/endpoints.js';
import { InteractiveVideoPlayer } from '../../components/InteractiveVideoPlayer.jsx';
import { VideoQuizManager } from '../../components/VideoQuizManager.jsx';
import { VideoRecap } from '../../components/VideoRecap.jsx';
import { DocumentRecap } from '../../components/DocumentRecap.jsx';
import { ModalPresensi } from '../../components/ModalPresensi.jsx';
import { ModalPenilaianTugas } from '../../components/ModalPenilaianTugas.jsx';

const getYoutubeId = (url) => {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
  return match ? match[1] : null;
};

const getEmbedUrl = (jenis, url) => {
  if (!url) return null;
  if (jenis === 'VIDEO') {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
    if (match && match[1]) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
  } else if (jenis === 'DOKUMEN' && url.includes('drive.google.com/file/d/')) {
    return url.replace(/\/view.*$/, '/preview');
  }
  return null;
};

export default function MateriDetail() {
  const { user } = useAuth();
  const { id } = useParams(); // jadwalId
  const [searchParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [isEditingDeskripsi, setIsEditingDeskripsi] = useState(false);
  const [deskripsiForm, setDeskripsiForm] = useState('');
  
  const [jumlahPertemuan, setJumlahPertemuan] = useState(16);
  const [generating, setGenerating] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [activePresensiSesi, setActivePresensiSesi] = useState(null);
  const [deletingMateri, setDeletingMateri] = useState(null);
  const [generateJumlah, setGenerateJumlah] = useState(14);
  const [selesaiData, setSelesaiData] = useState(null);
  const [previewStates, setPreviewStates] = useState({});
  const togglePreview = (id) => setPreviewStates(prev => ({...prev, [id]: !prev[id]}));

  const [manageQuizId, setManageQuizId] = useState(null);
  const [recapId, setRecapId] = useState(null);
  const [documentRecapId, setDocumentRecapId] = useState(null);

  // Untuk form edit rincian pertemuan
  const [editSesiId, setEditSesiId] = useState(null);
  const [editForm, setEditForm] = useState({});

  // Untuk form tambah materi
  const [tambahMateriSesiId, setTambahMateriSesiId] = useState(null);
  const [materiForm, setMateriForm] = useState({ judul: '', deskripsi: '', jenis: 'DOKUMEN', urlAtauLink: '' });
  const [materiFile, setMateriFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Untuk form tambah tugas & kuis
  const [bankTugasList, setBankTugasList] = useState([]);
  const [bankKuisList, setBankKuisList] = useState([]);

  const [tambahTugasSesiId, setTambahTugasSesiId] = useState(null);
  const [tugasForm, setTugasForm] = useState({ 
    bankTugasId: '', judul: '', deskripsi: '', kategori: '', 
    tanggalBuka: '', waktuMulai: '', tanggalTutup: '', waktuSelesai: '' 
  });
  
  const [tambahKuisSesiId, setTambahKuisSesiId] = useState(null);
  const [tambahUjianSesiId, setTambahUjianSesiId] = useState(null);
  const [kuisForm, setKuisForm] = useState({ 
    bankKuisId: '', judul: '', jenis: 'PILIHAN_GANDA', deskripsi: '', bobotNilai: 100, 
    waktuMulai: '', waktuSelesai: '', durasiMenit: 60 
  });

  const [submissionsModal, setSubmissionsModal] = useState({ isOpen: false, type: '', title: '', data: [], loading: false });

  const [deletingTugas, setDeletingTugas] = useState(null);
  const [deletingKuis, setDeletingKuis] = useState(null);

  const handleHapusTugas = async () => {
    if(!deletingTugas) return;
    try {
      await removeTugasFromPertemuan(deletingTugas.id);
      toast.success('Tugas dihapus dari sesi');
      setDeletingTugas(null);
      fetchData();
    } catch (err) {
      toast.error('Gagal menghapus tugas');
      setDeletingTugas(null);
    }
  };

  const handleHapusKuis = async () => {
    if(!deletingKuis) return;
    try {
      await removeKuisFromPertemuan(deletingKuis.id);
      toast.success('Kuis dihapus dari sesi');
      setDeletingKuis(null);
      fetchData();
    } catch (err) {
      toast.error('Gagal menghapus kuis');
      setDeletingKuis(null);
    }
  };

  const handleLihatSubmissions = async (type, id, judul) => {
    setSubmissionsModal({ isOpen: true, type, title: `Pengerjaan ${type === 'Tugas' ? 'Tugas' : 'Kuis'}: ${judul}`, data: [], loading: true });
    try {
      let res = type === 'Tugas' ? await getTugasSubmissions(id) : await getKuisSubmissions(id);
      
      // Inject dummy data for testing UI if empty
      if (type === 'Tugas' && (!res || res.length === 0)) {
        res = [
          {
            id: 9991,
            mahasiswa: { id: 101, nim: '12345678', nama: 'Budi Santoso' },
            gdriveFileIdJawaban: '1H-kO7Mpsq1X65aGfT-L7W5U2-z4Q1pXk', // Example file ID (placeholder)
            gdriveLink: 'https://docs.google.com/document/d/1H-kO7Mpsq1X65aGfT-L7W5U2-z4Q1pXk/preview',
            nilai: null,
            catatanDosen: null
          },
          {
            id: 9992,
            mahasiswa: { id: 102, nim: '87654321', nama: 'Siti Aminah' },
            gdriveFileIdJawaban: null,
            gdriveLink: 'https://github.com/mahasiswa/tugas-pemrograman',
            nilai: 85,
            catatanDosen: 'Pekerjaan sudah cukup baik, perhatikan kembali struktur folder.'
          }
        ];
      }

      setSubmissionsModal(prev => ({ ...prev, data: res, loading: false }));
    } catch (err) {
      toast.error('Gagal memuat data pengerjaan');
      setSubmissionsModal(prev => ({ ...prev, loading: false }));
    }
  };

  const handleSelectTugas = (selectedOption) => {
    if (!selectedOption) return;
    const selected = bankTugasList.find(t => t.id === selectedOption.value);
    if (selected) {
      setTugasForm(prev => ({ ...prev, bankTugasId: selected.id, judul: selected.judul, kategori: selected.kategori, deskripsi: selected.deskripsi }));
    }
  };

  const handleSelectKuis = (selectedOption) => {
    if (!selectedOption) return;
    const selected = bankKuisList.find(k => k.id === selectedOption.value);
    if (selected) {
      setKuisForm(prev => ({ ...prev, bankKuisId: selected.id, judul: selected.judul, jenis: selected.jenis, deskripsi: selected.deskripsi, bobotNilai: selected.bobotNilai, tipeUjian: selected.tipeUjian }));
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const res = await api.get(`/materi/${id}/pertemuan`);
      setData(res.data.data);
      setDeskripsiForm(res.data.data.deskripsiMk || '');

      if (res.data.data && res.data.data.matakuliahId) {
        const mkId = res.data.data.matakuliahId;
        const resTugas = await getBankTugasByMk(mkId);
        const resKuis = await getBankKuisByMk(mkId);
        setBankTugasList(resTugas || []);
        setBankKuisList(resKuis || []);
      }
      
      // Auto-scroll jika ada parameter sesiId
      const targetSesiId = searchParams.get('sesiId');
      if (targetSesiId) {
        setTimeout(() => {
          const el = document.getElementById(`sesi-${targetSesiId}`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 500);
      }
    } catch (err) {
      toast.error('Gagal mengambil data BAP');
    } finally {
      setLoading(false);
    }
  };

  const submitTugas = async (e) => {
    e.preventDefault();
    try {
      setUploading(true);
      await addTugasToPertemuan(tambahTugasSesiId, tugasForm);
      toast.success('Tugas berhasil ditambahkan');
      setTambahTugasSesiId(null);
      setTugasForm({ bankTugasId: '', judul: '', deskripsi: '', kategori: '', tanggalBuka: '', waktuMulai: '', tanggalTutup: '', waktuSelesai: '' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menambahkan tugas');
    } finally {
      setUploading(false);
    }
  };

  const submitKuis = async (e) => {
    e.preventDefault();
    try {
      setUploading(true);
      await addKuisToPertemuan(tambahKuisSesiId || tambahUjianSesiId, kuisForm);
      toast.success(tambahUjianSesiId ? 'Ujian berhasil ditambahkan' : 'Kuis berhasil ditambahkan');
      setTambahKuisSesiId(null);
      setTambahUjianSesiId(null);
      setKuisForm({ bankKuisId: '', judul: '', jenis: 'PILIHAN_GANDA', deskripsi: '', bobotNilai: 100, waktuMulai: '', waktuSelesai: '', durasiMenit: 60 });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menambahkan kuis');
    } finally {
      setUploading(false);
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
      skemaPresensi: sesi.skemaPresensi || 'SINKRONUS',
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

  const handleDeleteMateri = async () => {
    if (!deletingMateri) return;
    try {
      await api.delete(`/materi/${deletingMateri.id}`);
      toast.success('Materi berhasil dihapus');
      fetchData();
    } catch (err) {
      toast.error('Gagal menghapus materi');
    } finally {
      setDeletingMateri(null);
    }
  };

  const handleUploadMateri = async () => {
    if (!materiForm.judul) return toast.error('Judul materi wajib diisi');
    if (materiForm.jenis === 'DOKUMEN' && !materiFile) return toast.error('File dokumen wajib diunggah');
    if (materiForm.jenis !== 'DOKUMEN' && !materiForm.urlAtauLink) return toast.error('URL/Link wajib diisi');

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('judul', materiForm.judul);
      formData.append('deskripsi', materiForm.deskripsi);
      formData.append('jenis', materiForm.jenis);
      if (materiForm.jenis === 'DOKUMEN') {
        formData.append('file', materiFile);
      } else {
        formData.append('urlAtauLink', materiForm.urlAtauLink);
      }

      await api.post(`/materi/pertemuan/${tambahMateriSesiId}/materi`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      toast.success('Materi berhasil diunggah!');
      setTambahMateriSesiId(null);
      setMateriForm({ judul: '', deskripsi: '', jenis: 'DOKUMEN', urlAtauLink: '' });
      setMateriFile(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || err.response?.data?.message || 'Gagal mengunggah materi');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Memuat rincian...</div>;
  if (!data) return <div className="p-8 text-center text-red-500">Data tidak ditemukan</div>;

  const { jadwal, pertemuan } = data;

  return (
    <div className="flex flex-col md:flex-row gap-4 sm:gap-6 items-start px-2 sm:px-6">
      <SidebarMenu currentGroup="Perkuliahan" />
      <div className="flex-1 w-full space-y-4 sm:space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/perkuliahan/materi" className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-700" />
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Administrasi Pembelajaran & Materi</h1>
          <p className="text-slate-500 text-xs sm:text-sm">Lengkapi BAP dan materi untuk setiap pertemuan mata kuliah ini.</p>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white border-t-4 border-t-orange-500 rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Header Info Card */}
        <div className="p-6 border-b border-orange-100">
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
        <div className="p-6 border-b border-orange-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-slate-800">Deskripsi Mata Kuliah</h2>
            {!isEditingDeskripsi && data?.isPengampu && (
              <button onClick={() => setIsEditingDeskripsi(true)} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                <Edit className="w-4 h-4" /> Edit Deskripsi
              </button>
            )}
          </div>
          {isEditingDeskripsi ? (
            <div className="space-y-3">
              <textarea
                className="w-full p-3 border rounded-lg h-32 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                value={deskripsiForm}
                onChange={(e) => setDeskripsiForm(e.target.value)}
                placeholder="Masukkan deskripsi mata kuliah..."
              ></textarea>
              <div className="flex justify-end gap-2">
                <button onClick={() => setIsEditingDeskripsi(false)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg font-medium hover:bg-slate-200">Batal</button>
                <button onClick={saveDeskripsi} className="px-4 py-2 bg-orange-500 text-white rounded-lg flex items-center gap-2 hover:bg-orange-600 font-medium">
                  <Save className="w-4 h-4" /> Simpan
                </button>
              </div>
            </div>
          ) : (
            <p className="text-slate-600 whitespace-pre-wrap">{data.deskripsiMk || <span className="text-slate-400 italic">Belum ada deskripsi mata kuliah.</span>}</p>
          )}
        </div>

        {/* UTS / UAS Section Removed */}

        {/* Sesi List */}
        <div className="p-6 bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800 px-1 mb-4">Daftar Pertemuan (Sesi)</h2>
          
          {pertemuan.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center space-y-4">
              <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto">
                <Calendar className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Sesi Belum Digenerate</h3>
              <p className="text-slate-500 text-sm max-w-md mx-auto">Silakan tentukan jumlah pertemuan yang diinginkan untuk jadwal ini. Sistem akan men-generate sesi kosong yang nantinya dapat Anda lengkapi.</p>
              
              {data?.isPengampu && (
                <div className="flex justify-center items-center gap-3 mt-4">
                  <button onClick={() => setShowGenerateModal(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Mulai Generate Sesi
                  </button>
                  <button 
                    onClick={handleSyncAPI} 
                    disabled={generating}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-sm flex items-center gap-2 disabled:opacity-50"
                  >
                    <Zap className="w-4 h-4" /> {generating ? 'Memproses...' : 'Sync Silabus via API'}
                  </button>
                </div>
              )}
            </div>
          ) : (
          (() => {
            const hasGlobalUTS = pertemuan.some(p => p.kuis?.some(k => k.tipeUjian === 'UTS')) || false;
            const hasGlobalUAS = pertemuan.some(p => p.kuis?.some(k => k.tipeUjian === 'UAS')) || false;

            return pertemuan.map(sesi => {
              const isUjianSession = sesi.kuis?.some(k => k.tipeUjian === 'UTS' || k.tipeUjian === 'UAS');
              const isPerkuliahanSession = (sesi.materi?.length > 0) || (sesi.tugas?.length > 0) || (sesi.kuis?.some(k => k.tipeUjian === 'KUIS'));
              const isEditing = editSesiId === sesi.id;

              return (
            <div key={sesi.id} id={`sesi-${sesi.id}`} className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mb-4 scroll-mt-24">
              <div className="bg-white px-6 py-3 border-b border-slate-200 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                    {sesi.keBerapa}
                  </div>
                  <span className="font-semibold text-slate-800">
                    Sesi {sesi.keBerapa} {sesi.jenisPertemuan !== 'Kuliah' && `- ${sesi.jenisPertemuan}`}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${sesi.status === 'SELESAI' ? 'bg-emerald-100 text-emerald-700' : sesi.status === 'MULAI' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'}`}>
                    {sesi.status}
                  </span>
                  <button
                    onClick={() => setActivePresensiSesi(sesi)}
                    className="px-3 py-1 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Users className="w-3.5 h-3.5" /> Presensi
                  </button>
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
                      <label className="block text-sm font-medium text-slate-700 mb-1">Skema Presensi<span className="text-red-500 ml-1">*</span></label>
                      <select className="w-full px-3 py-2 border rounded-lg" value={editForm.skemaPresensi} onChange={e => setEditForm({...editForm, skemaPresensi: e.target.value})}>
                        <option value="SINKRONUS">Sinkronus (Dosen Manual)</option>
                        <option value="ASINKRONUS">Asinkronus (Otomatis dari Aktivitas)</option>
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

                  <div className="mt-6 border-t pt-4">
                     <div className="flex justify-between items-center mb-3">
                        <h4 className="text-sm font-semibold text-slate-700">Materi, Tugas & Kuis</h4>
                        <div className="flex gap-2">
                          {data?.isPengampu && (
                            <>
                              {!isUjianSession && (
                                <>
                                  <button 
                                    onClick={() => setTambahMateriSesiId(sesi.id)} 
                                    className="px-3 py-1 bg-sky-100 text-sky-700 hover:bg-sky-200 rounded-lg text-xs font-bold transition-colors"
                                  >
                                    + Tambah Materi
                                  </button>
                                  <button 
                                    onClick={() => setTambahTugasSesiId(sesi.id)} 
                                    className="px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg text-xs font-bold transition-colors"
                                  >
                                    + Tambah Tugas
                                  </button>
                                  <button 
                                    onClick={() => setTambahKuisSesiId(sesi.id)} 
                                    className="px-3 py-1 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-lg text-xs font-bold transition-colors"
                                  >
                                    + Tambah Kuis
                                  </button>
                                </>
                              )}
                              {!isPerkuliahanSession && (!hasGlobalUTS || !hasGlobalUAS || isUjianSession) && (
                                <button 
                                  onClick={() => setTambahUjianSesiId(sesi.id)} 
                                  className="px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg text-xs font-bold transition-colors"
                                >
                                  + Tambah Ujian (UTS/UAS)
                                </button>
                              )}
                            </>
                          )}
                        </div>
                     </div>
                     {sesi.materi?.length > 0 && (
                        <div className="mb-4">
                          <h5 className="text-xs font-bold text-slate-400 mb-2 uppercase">Materi</h5>
                          <ul className="space-y-2">
                         {sesi.materi.map(m => (
                           <li key={m.id} className="flex flex-col gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg group">
                             <div className="flex items-center justify-between">
                               <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                                  {m.jenis === 'VIDEO' ? <Video className="w-4 h-4" /> : m.jenis === 'LINK' ? <LinkIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                               </div>
                               <div className="flex items-center gap-1 shrink-0">
                                 {getEmbedUrl(m.jenis, m.urlAtauLink) && (
                                   <button
                                     onClick={() => togglePreview(m.id)}
                                     className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                     title={previewStates[m.id] ? 'Sembunyikan' : 'Preview'}
                                   >
                                     {previewStates[m.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                   </button>
                                 )}
                                 {m.jenis === 'VIDEO' && (
                                   <>
                                     {data?.isPengampu && (
                                       <button onClick={() => setManageQuizId(m.id)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Kelola Soal Interaktif">
                                         <ListChecks className="w-4 h-4" />
                                       </button>
                                     )}
                                     {(user?.role === 'DOSEN' || user?.role === 'ADMIN') && (
                                       <button onClick={() => setRecapId(m.id)} className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all" title="Rekap Penonton">
                                         <Users className="w-4 h-4" />
                                       </button>
                                     )}
                                   </>
                                 )}
                                 {(m.jenis === 'DOKUMEN' || m.jenis === 'LINK') && (user?.role === 'DOSEN' || user?.role === 'ADMIN') && (
                                   <button onClick={() => setDocumentRecapId(m.id)} className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all" title="Rekap Pembaca">
                                     <Users className="w-4 h-4" />
                                   </button>
                                 )}
                                 {data?.isPengampu && (
                                   <button 
                                     onClick={() => setDeletingMateri(m)}
                                     className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                     title="Hapus Materi"
                                   >
                                     <X className="w-4 h-4" />
                                   </button>
                                 )}
                               </div>
                             </div>
                             <div className="mt-1">
                               <a href={m.urlAtauLink} target="_blank" rel="noreferrer" className="text-sm font-semibold text-blue-600 hover:underline break-words block">{m.judul}</a>
                               {m.deskripsi && <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{m.deskripsi}</p>}
                             </div>
                             {previewStates[m.id] && (() => {
                               if (m.jenis === 'VIDEO') {
                                 const yId = getYoutubeId(m.urlAtauLink);
                                 if (!yId) return null;
                                 return (
                                   <div className="mt-3 mb-1 -mx-3 sm:mx-0 w-[calc(100%+24px)] sm:w-full max-w-4xl">
                                     <InteractiveVideoPlayer materiId={m.id} youtubeId={yId} role={user?.role} />
                                   </div>
                                 );
                               }

                               const embedUrl = getEmbedUrl(m.jenis, m.urlAtauLink);
                               if (!embedUrl) return null;
                               return (
                                 <div className="mt-3 w-full rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shadow-sm" style={{ height: '400px' }}>
                                   <iframe src={embedUrl} className="w-full h-full" allowFullScreen allow="autoplay; encrypted-media"></iframe>
                                 </div>
                               );
                             })()}
                           </li>
                         ))}
                       </ul>
                     </div>
                     )}

                     {sesi.tugas?.length > 0 && (
                       <div className="mb-4">
                         <h5 className="text-xs font-bold text-slate-400 mb-2 uppercase">Tugas</h5>
                         <ul className="space-y-2">
                           {sesi.tugas.map(t => (
                             <li key={t.id} className="flex flex-col gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg group">
                               <div className="flex items-center justify-between">
                                 <div className="flex items-center gap-2">
                                   <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                                      <FileText className="w-4 h-4" />
                                   </div>
                                 </div>
                                 <div className="flex items-center gap-1 shrink-0">
                                   <button onClick={() => handleLihatSubmissions('Tugas', t.id, t.judul)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Lihat Pengerjaan">
                                     <Users className="w-4 h-4" />
                                   </button>
                                   {data?.isPengampu && (
                                     <button onClick={() => setDeletingTugas(t)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Hapus Tugas">
                                       <X className="w-4 h-4" />
                                     </button>
                                   )}
                                 </div>
                               </div>
                               <div className="mt-1">
                                  <span className="text-sm font-semibold text-blue-600">{t.judul}</span>
                                  {t.deskripsi && <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{t.deskripsi}</p>}
                                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 font-medium">
                                    <div className="flex items-center gap-1">
                                      <Calendar className="w-3.5 h-3.5" />
                                      <span>{new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(t.tanggalBuka))} - {new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(t.tanggalTutup))}</span>
                                    </div>
                                  </div>
                                </div>
                             </li>
                           ))}
                         </ul>
                       </div>
                     )}

                     {sesi.kuis?.length > 0 && (
                       <div className="mb-4">
                         <h5 className="text-xs font-bold text-slate-400 mb-2 uppercase">Kuis / Ujian</h5>
                         <ul className="space-y-2">
                           {sesi.kuis.map(k => (
                             <li key={k.id} className="flex flex-col gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg group">
                               <div className="flex items-center justify-between">
                                 <div className="flex items-center gap-2">
                                   <div className={`w-8 h-8 rounded-full ${k.tipeUjian === 'UTS' || k.tipeUjian === 'UAS' ? 'bg-red-100 text-red-600' : 'bg-purple-100 text-purple-600'} flex items-center justify-center shrink-0`}>
                                      <ListChecks className="w-4 h-4" />
                                   </div>
                                 </div>
                                 <div className="flex items-center gap-1 shrink-0">
                                   <button onClick={() => handleLihatSubmissions('Kuis', k.id, k.judul)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Lihat Pengerjaan">
                                     <Users className="w-4 h-4" />
                                   </button>
                                   {data?.isPengampu && (
                                     <button onClick={() => setDeletingKuis(k)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Hapus Kuis">
                                       <X className="w-4 h-4" />
                                     </button>
                                   )}
                                 </div>
                               </div>
                               <div className="mt-1">
                                  <span className={`text-sm font-semibold ${k.tipeUjian === 'UTS' || k.tipeUjian === 'UAS' ? 'text-red-600' : 'text-purple-600'}`}>{k.tipeUjian !== 'KUIS' ? `[${k.tipeUjian}] ` : ''}{k.judul}</span>
                                  {k.deskripsi && <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{k.deskripsi}</p>}
                                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 font-medium">
                                    <div className="flex items-center gap-1">
                                      <Calendar className="w-3.5 h-3.5" />
                                      <span>{new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(k.waktuMulai))} - {new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(k.waktuSelesai))}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Clock className="w-3.5 h-3.5" />
                                      <span>{k.durasiMenit} Menit</span>
                                    </div>
                                  </div>
                                </div>
                             </li>
                           ))}
                         </ul>
                       </div>
                     )}

                     {!(sesi.materi?.length > 0) && !(sesi.tugas?.length > 0) && !(sesi.kuis?.length > 0) && (
                       <p className="text-sm text-slate-400 italic bg-slate-50 p-3 rounded-lg border border-dashed border-slate-200">Belum ada materi/tugas terlampir.</p>
                     )}
                  </div>

                  {data?.isPengampu && (
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
                  )}
                </div>
              )}
            </div>
          );
        });
      })()
      )}
      </div>
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

      <Modal open={!!tambahMateriSesiId} onClose={() => { setTambahMateriSesiId(null); setMateriFile(null); }} title="Tambah Materi Pembelajaran">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Judul Materi<span className="text-red-500 ml-1">*</span></label>
            <input 
              type="text" 
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={materiForm.judul}
              onChange={e => setMateriForm({...materiForm, judul: e.target.value})}
              placeholder="Contoh: Modul 1 - Pengenalan"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Deskripsi Pendek</label>
            <textarea 
              className="w-full px-3 py-2 border rounded-lg h-20 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={materiForm.deskripsi}
              onChange={e => setMateriForm({...materiForm, deskripsi: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Jenis Materi</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="jenisMateri" checked={materiForm.jenis === 'DOKUMEN'} onChange={() => setMateriForm({...materiForm, jenis: 'DOKUMEN'})} className="text-blue-600 focus:ring-blue-500" />
                <span className="text-sm text-slate-700">Dokumen/PDF (via GDrive)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="jenisMateri" checked={materiForm.jenis === 'VIDEO'} onChange={() => setMateriForm({...materiForm, jenis: 'VIDEO'})} className="text-blue-600 focus:ring-blue-500" />
                <span className="text-sm text-slate-700">Video (YouTube)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="jenisMateri" checked={materiForm.jenis === 'LINK'} onChange={() => setMateriForm({...materiForm, jenis: 'LINK'})} className="text-blue-600 focus:ring-blue-500" />
                <span className="text-sm text-slate-700">Link Eksternal</span>
              </label>
            </div>
          </div>

          {materiForm.jenis === 'DOKUMEN' ? (
            <div className="p-4 bg-orange-50 border border-orange-100 rounded-lg">
              <label className="block text-sm font-medium text-slate-700 mb-2">Upload File PDF/PPT</label>
              <input 
                type="file" 
                className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-orange-500 file:text-white hover:file:bg-orange-600 transition-colors"
                accept=".pdf,.ppt,.pptx,.doc,.docx"
                onChange={e => setMateriFile(e.target.files[0])}
              />
              <p className="text-xs text-slate-500 mt-2">File akan langsung diunggah dan disimpan ke dalam akun Google Drive Anda. Pastikan Anda sudah mengotorisasi Google Drive di menu Profil.</p>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">URL / Link {materiForm.jenis === 'VIDEO' ? 'YouTube' : ''}</label>
              <input 
                type="url" 
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={materiForm.urlAtauLink}
                onChange={e => setMateriForm({...materiForm, urlAtauLink: e.target.value})}
                placeholder={materiForm.jenis === 'VIDEO' ? "https://youtube.com/watch?v=..." : "https://..."}
              />
            </div>
          )}
          
          <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
            <button onClick={() => { setTambahMateriSesiId(null); setMateriFile(null); }} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium text-sm">Batal</button>
            <button onClick={handleUploadMateri} disabled={uploading} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm flex items-center gap-2 disabled:opacity-50">
              {uploading ? 'Mengunggah...' : 'Unggah Materi'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={!!tambahTugasSesiId} onClose={() => setTambahTugasSesiId(null)} title="Tambah Tugas ke Sesi">
        <form onSubmit={submitTugas} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Pilih Data Tugas dari Bank Tugas<span className="text-red-500 ml-1">*</span></label>
            <Select 
              options={bankTugasList.map(t => ({ value: t.id, label: t.judul }))}
              onChange={handleSelectTugas}
              placeholder="-- Ketik atau Pilih Tugas --"
              isSearchable
              noOptionsMessage={() => "Tugas tidak ditemukan"}
              value={tugasForm.bankTugasId ? { value: tugasForm.bankTugasId, label: tugasForm.judul } : null}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Deskripsi Tugas</label>
            <textarea 
              className="w-full px-3 py-2 border rounded-lg h-20 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={tugasForm.deskripsi}
              onChange={e => setTugasForm({...tugasForm, deskripsi: e.target.value})}
              placeholder="Tambahkan instruksi tambahan untuk pengerjaan tugas di sesi ini..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Buka<span className="text-red-500 ml-1">*</span></label>
              <input type="date" required className="w-full px-3 py-2 border rounded-lg" value={tugasForm.tanggalBuka} onChange={e => setTugasForm({...tugasForm, tanggalBuka: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Waktu Mulai<span className="text-red-500 ml-1">*</span></label>
              <input type="time" required className="w-full px-3 py-2 border rounded-lg" value={tugasForm.waktuMulai} onChange={e => setTugasForm({...tugasForm, waktuMulai: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Tutup (Tenggat)<span className="text-red-500 ml-1">*</span></label>
              <input type="date" required className="w-full px-3 py-2 border rounded-lg" value={tugasForm.tanggalTutup} onChange={e => setTugasForm({...tugasForm, tanggalTutup: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Waktu Selesai<span className="text-red-500 ml-1">*</span></label>
              <input type="time" required className="w-full px-3 py-2 border rounded-lg" value={tugasForm.waktuSelesai} onChange={e => setTugasForm({...tugasForm, waktuSelesai: e.target.value})} />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
            <button type="button" onClick={() => setTambahTugasSesiId(null)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium text-sm">Batal</button>
            <button type="submit" disabled={uploading || !tugasForm.judul} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm disabled:opacity-50">
              {uploading ? 'Menyimpan...' : 'Tambahkan Tugas'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={!!tambahKuisSesiId} onClose={() => setTambahKuisSesiId(null)} title="Tambah Kuis ke Sesi">
        <form onSubmit={submitKuis} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Pilih Data dari Bank Kuis<span className="text-red-500 ml-1">*</span></label>
            <Select 
              options={bankKuisList.filter(k => k.tipeUjian === 'KUIS').map(k => ({ value: k.id, label: k.judul }))}
              onChange={handleSelectKuis}
              placeholder="-- Ketik atau Pilih Kuis --"
              isSearchable
              noOptionsMessage={() => "Kuis tidak ditemukan"}
              value={kuisForm.bankKuisId ? { value: kuisForm.bankKuisId, label: kuisForm.judul } : null}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Deskripsi Kuis</label>
            <textarea 
              className="w-full px-3 py-2 border rounded-lg h-20 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={kuisForm.deskripsi}
              onChange={e => setKuisForm({...kuisForm, deskripsi: e.target.value})}
              placeholder="Tambahkan instruksi pengerjaan kuis..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mulai<span className="text-red-500 ml-1">*</span></label>
              <input type="datetime-local" required className="w-full px-3 py-2 border rounded-lg text-sm" value={kuisForm.waktuMulai} onChange={e => setKuisForm({...kuisForm, waktuMulai: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Selesai<span className="text-red-500 ml-1">*</span></label>
              <input type="datetime-local" required className="w-full px-3 py-2 border rounded-lg text-sm" value={kuisForm.waktuSelesai} onChange={e => setKuisForm({...kuisForm, waktuSelesai: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Durasi Pengerjaan (Menit)<span className="text-red-500 ml-1">*</span></label>
              <input type="number" required className="w-full px-3 py-2 border rounded-lg" value={kuisForm.durasiMenit} onChange={e => setKuisForm({...kuisForm, durasiMenit: e.target.value})} />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
            <button type="button" onClick={() => setTambahKuisSesiId(null)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium text-sm">Batal</button>
            <button type="submit" disabled={uploading || !kuisForm.judul} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm disabled:opacity-50">
              {uploading ? 'Menyimpan...' : 'Tambahkan Kuis'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={!!tambahUjianSesiId} onClose={() => setTambahUjianSesiId(null)} title="Tambah Ujian ke Sesi">
        <form onSubmit={submitKuis} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Pilih Data dari Bank Ujian<span className="text-red-500 ml-1">*</span></label>
            {(() => {
              const hasGlobalUTS = data?.pertemuan?.some(p => p.kuis?.some(k => k.tipeUjian === 'UTS')) || false;
              const hasGlobalUAS = data?.pertemuan?.some(p => p.kuis?.some(k => k.tipeUjian === 'UAS')) || false;
              
              return (
                <Select 
                  options={bankKuisList.filter(k => (k.tipeUjian === 'UTS' && !hasGlobalUTS) || (k.tipeUjian === 'UAS' && !hasGlobalUAS)).map(k => ({ value: k.id, label: `[${k.tipeUjian}] ${k.judul}` }))}
                  onChange={handleSelectKuis}
                  placeholder="-- Ketik atau Pilih Ujian --"
                  isSearchable
                  noOptionsMessage={() => "Ujian tidak ditemukan"}
                  value={kuisForm.bankKuisId ? { value: kuisForm.bankKuisId, label: `[${kuisForm.tipeUjian || 'Ujian'}] ${kuisForm.judul}` } : null}
                />
              );
            })()}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Deskripsi Ujian</label>
            <textarea 
              className="w-full px-3 py-2 border rounded-lg h-20 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={kuisForm.deskripsi}
              onChange={e => setKuisForm({...kuisForm, deskripsi: e.target.value})}
              placeholder="Tambahkan instruksi pengerjaan ujian..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mulai<span className="text-red-500 ml-1">*</span></label>
              <input type="datetime-local" required className="w-full px-3 py-2 border rounded-lg text-sm" value={kuisForm.waktuMulai} onChange={e => setKuisForm({...kuisForm, waktuMulai: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Selesai<span className="text-red-500 ml-1">*</span></label>
              <input type="datetime-local" required className="w-full px-3 py-2 border rounded-lg text-sm" value={kuisForm.waktuSelesai} onChange={e => setKuisForm({...kuisForm, waktuSelesai: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Durasi (Menit)<span className="text-red-500 ml-1">*</span></label>
              <input type="number" required className="w-full px-3 py-2 border rounded-lg" value={kuisForm.durasiMenit} onChange={e => setKuisForm({...kuisForm, durasiMenit: e.target.value})} />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
            <button type="button" onClick={() => setTambahUjianSesiId(null)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium text-sm">Batal</button>
            <button type="submit" disabled={uploading || !kuisForm.judul} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-sm disabled:opacity-50">
              {uploading ? 'Menyimpan...' : 'Tambahkan Ujian'}
            </button>
          </div>
        </form>
      </Modal>

      {submissionsModal.type === 'Tugas' ? (
        <ModalPenilaianTugas
          open={submissionsModal.isOpen}
          onClose={() => setSubmissionsModal({ ...submissionsModal, isOpen: false })}
          title={submissionsModal.title}
          data={submissionsModal.data}
          onSubmissionsUpdated={(newData) => setSubmissionsModal(prev => ({ ...prev, data: newData }))}
        />
      ) : (
        <Modal open={submissionsModal.isOpen} onClose={() => setSubmissionsModal({ ...submissionsModal, isOpen: false })} title={submissionsModal.title}>
          <div className="max-h-[60vh] overflow-y-auto">
            {submissionsModal.loading ? (
              <div className="text-center py-4 text-slate-500">Memuat data...</div>
            ) : submissionsModal.data.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                <p className="text-slate-500 text-sm">Belum ada mahasiswa yang mengumpulkan.</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm mt-2">
                <thead className="bg-slate-50 border-y border-slate-200">
                  <tr>
                    <th className="px-3 py-2">NIM</th>
                    <th className="px-3 py-2">Nama Mahasiswa</th>
                    <th className="px-3 py-2">Nilai</th>
                  </tr>
                </thead>
                <tbody>
                  {submissionsModal.data.map((sub, idx) => (
                    <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-3 py-2">{sub.mahasiswa?.nim}</td>
                      <td className="px-3 py-2 font-medium">{sub.mahasiswa?.nama}</td>
                      <td className="px-3 py-2">
                        {sub.nilai !== undefined ? sub.nilai : sub.totalNilai !== undefined ? sub.totalNilai : 'Belum dinilai'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Modal>
      )}

      <ConfirmDialog
        open={Boolean(deletingMateri)}
        message={`Hapus materi "${deletingMateri?.judul}"? Jika ini adalah lampiran dokumen, maka berkas juga akan dihapus dari Google Drive Anda. Tindakan ini tidak dapat dibatalkan.`}
        onCancel={() => setDeletingMateri(null)}
        onConfirm={handleDeleteMateri}
      />

      <ConfirmDialog
        open={Boolean(deletingTugas)}
        message={`Keluarkan tugas "${deletingTugas?.judul}" dari Sesi Pertemuan ini? (Tugas ini tetap ada di Bank Tugas).`}
        onCancel={() => setDeletingTugas(null)}
        onConfirm={handleHapusTugas}
      />

      <ConfirmDialog
        open={Boolean(deletingKuis)}
        message={`Keluarkan kuis "${deletingKuis?.judul}" dari Sesi Pertemuan ini? (Kuis ini tetap ada di Bank Kuis).`}
        onCancel={() => setDeletingKuis(null)}
        onConfirm={handleHapusKuis}
      />

      {manageQuizId && <VideoQuizManager materiId={manageQuizId} onClose={() => setManageQuizId(null)} />}
      {recapId && <VideoRecap materiId={recapId} onClose={() => setRecapId(null)} />}
      {documentRecapId && <DocumentRecap materiId={documentRecapId} onClose={() => setDocumentRecapId(null)} />}

      {activePresensiSesi && (
        <ModalPresensi
          isOpen={true}
          onClose={() => setActivePresensiSesi(null)}
          pertemuanId={activePresensiSesi.id}
          sesiNama={activePresensiSesi.keBerapa}
          skemaPresensi={activePresensiSesi.skemaPresensi}
          isPengampu={data?.isPengampu}
        />
      )}
      </div>
    </div>
  );
}
