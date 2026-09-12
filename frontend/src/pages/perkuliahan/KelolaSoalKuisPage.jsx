import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ConfirmDialog } from '../../components/Modal.jsx';
import { Button } from '../../components/ui.jsx';
import { SidebarMenu } from '../../components/SidebarMenu.jsx';
import { Plus, Trash2, Edit, Save, X, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { getBankKuisById, getBankKuisSoal, createBankKuisSoal, updateBankKuisSoal, deleteBankKuisSoal } from '../../api/endpoints.js';

export default function KelolaSoalKuisPage() {
  const { kuisId } = useParams();
  const navigate = useNavigate();
  
  const [kuis, setKuis] = useState(null);
  const [soalList, setSoalList] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [soalForm, setSoalForm] = useState(initialFormState());
  const [fileLampiran, setFileLampiran] = useState(null);

  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchKuisDanSoal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kuisId]);

  function initialFormState() {
    return {
      id: null,
      tipeSoal: 'SINGLE_CHOICE',
      pertanyaan: '',
      pilihanJawaban: ['Pilihan 1', 'Pilihan 2'],
      kunciJawaban: ['0'], 
      bobotSoal: 10
    };
  }

  const fetchKuisDanSoal = async () => {
    setLoading(true);
    try {
      const kuisRes = await getBankKuisById(kuisId);
      setKuis(kuisRes);
      
      const soalRes = await getBankKuisSoal(kuisId);
      setSoalList(soalRes || []);
    } catch (err) {
      toast.error('Gagal memuat data kuis dan soal');
      navigate('/tugas-kuis');
    } finally {
      setLoading(false);
    }
  };

  const fetchSoal = async () => {
    try {
      const soalRes = await getBankKuisSoal(kuisId);
      setSoalList(soalRes || []);
    } catch (err) {
      toast.error('Gagal memuat soal kuis');
    }
  };

  const resetForm = () => {
    setSoalForm(initialFormState());
    setFileLampiran(null);
    setIsEditing(false);
  };

  const handleAddOption = () => {
    setSoalForm(prev => ({
      ...prev,
      pilihanJawaban: [...prev.pilihanJawaban, `Pilihan ${prev.pilihanJawaban.length + 1}`]
    }));
  };

  const handleRemoveOption = (indexToRemove) => {
    setSoalForm(prev => {
      const newPilihan = prev.pilihanJawaban.filter((_, i) => i !== indexToRemove);
      let newKunci = prev.kunciJawaban
        .filter(k => parseInt(k) !== indexToRemove)
        .map(k => {
          const kInt = parseInt(k);
          return kInt > indexToRemove ? (kInt - 1).toString() : k;
        });
      
      if (prev.tipeSoal === 'SINGLE_CHOICE' && newKunci.length === 0 && newPilihan.length > 0) {
        newKunci = ['0'];
      }

      return {
        ...prev,
        pilihanJawaban: newPilihan,
        kunciJawaban: newKunci
      };
    });
  };

  const handleOptionChange = (index, value) => {
    const newPilihan = [...soalForm.pilihanJawaban];
    newPilihan[index] = value;
    setSoalForm({ ...soalForm, pilihanJawaban: newPilihan });
  };

  const handleKunciChange = (index, checked) => {
    if (soalForm.tipeSoal === 'SINGLE_CHOICE') {
      setSoalForm({ ...soalForm, kunciJawaban: [index.toString()] });
    } else {
      let newKunci = [...soalForm.kunciJawaban];
      if (checked) {
        if (!newKunci.includes(index.toString())) newKunci.push(index.toString());
      } else {
        newKunci = newKunci.filter(k => k !== index.toString());
      }
      setSoalForm({ ...soalForm, kunciJawaban: newKunci });
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!soalForm.pertanyaan.trim()) return toast.error('Pertanyaan tidak boleh kosong');
    if (soalForm.pilihanJawaban.length < 2) return toast.error('Minimal 2 pilihan jawaban');
    if (soalForm.kunciJawaban.length === 0) return toast.error('Pilih setidaknya 1 kunci jawaban');

    try {
      const fd = new FormData();
      fd.append('tipeSoal', soalForm.tipeSoal);
      fd.append('pertanyaan', soalForm.pertanyaan);
      fd.append('pilihanJawaban', JSON.stringify(soalForm.pilihanJawaban));
      fd.append('kunciJawaban', soalForm.kunciJawaban.join(','));
      fd.append('bobotSoal', parseFloat(soalForm.bobotSoal) || 10);
      
      if (fileLampiran) {
        fd.append('file', fileLampiran);
      } else if (soalForm.id && !soalForm.fileUrl) {
        fd.append('hapusFile', 'true');
      }

      if (soalForm.id) {
        await updateBankKuisSoal(kuisId, soalForm.id, fd);
        toast.success('Soal diperbarui');
      } else {
        await createBankKuisSoal(kuisId, fd);
        toast.success('Soal ditambahkan');
      }
      fetchSoal();
      resetForm();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan soal');
    }
  };

  const handleEdit = (s) => {
    setSoalForm({
      id: s.id,
      tipeSoal: s.tipeSoal,
      pertanyaan: s.pertanyaan,
      pilihanJawaban: s.pilihanJawaban || [],
      kunciJawaban: s.kunciJawaban ? s.kunciJawaban.split(',') : [],
      fileUrl: s.fileUrl || '',
      bobotSoal: s.bobotSoal
    });
    setFileLampiran(null);
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteBankKuisSoal(kuisId, deletingId);
      toast.success('Soal dihapus');
      fetchSoal();
    } catch (err) {
      toast.error('Gagal menghapus soal');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <SidebarMenu currentGroup="Perkuliahan" />
        <div className="flex-1 p-8 flex items-center justify-center">
          <p className="text-slate-500">Memuat data kuis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <SidebarMenu currentGroup="Perkuliahan" />
      <div className="flex-1 p-8">
        <div className="max-w-6xl mx-auto flex flex-col gap-6">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div>
              <div className="flex items-center gap-3">
                <button onClick={() => navigate(kuis?.tipeUjian === 'UTS' || kuis?.tipeUjian === 'UAS' ? '/ujian' : '/tugas-kuis')} className="text-slate-400 hover:text-blue-600 transition-colors">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-2xl font-bold text-slate-800">Kelola Soal: {kuis?.judul}</h1>
              </div>
              <p className="text-sm text-slate-500">{kuis?.deskripsi || 'Tidak ada deskripsi'}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col md:flex-row min-h-[600px]">
            {/* Kolom Kiri: Daftar Soal */}
            <div className="w-full md:w-1/2 flex flex-col border-r border-slate-200 p-6 bg-slate-50/50">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-700 text-lg">Daftar Soal ({soalList.length})</h3>
                {isEditing && (
                  <Button variant="secondary" size="sm" onClick={resetForm}>
                    <Plus className="w-4 h-4 mr-1"/> Buat Soal Baru
                  </Button>
                )}
              </div>
              
              {soalList.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl bg-white">
                  <p className="text-sm text-slate-500">Belum ada soal untuk kuis ini.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4 overflow-y-auto">
                  {soalList.map((s, index) => (
                    <div key={s.id} className="p-4 border border-slate-200 rounded-xl bg-white shadow-sm hover:border-blue-300 transition relative group">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-md">Soal {index + 1}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            {s.tipeSoal === 'SINGLE_CHOICE' ? 'Single Choice' : 'Multiple Choice'}
                          </span>
                          <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                            Bobot: {s.bobotSoal}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-slate-800 line-clamp-3">{s.pertanyaan}</p>
                      
                      {s.fileUrl && (
                        <div className="mt-3">
                          {s.fileUrl.match(/\.(jpeg|jpg|gif|png)$/) != null ? (
                            <img src={s.fileUrl} alt="Lampiran" className="max-w-full h-auto max-h-32 object-contain rounded border" />
                          ) : s.fileUrl.match(/\.(mp4|webm|ogg)$/) != null ? (
                            <video src={s.fileUrl} controls className="max-w-full h-auto max-h-32 rounded border" />
                          ) : s.fileUrl.match(/\.(mp3|wav|ogg)$/) != null ? (
                            <audio src={s.fileUrl} controls className="w-full" />
                          ) : (
                            <a href={s.fileUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1 font-medium bg-blue-50 px-2 py-1 rounded">
                              Lihat Lampiran Media
                            </a>
                          )}
                        </div>
                      )}
                      
                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition flex gap-1.5 bg-white/80 backdrop-blur-sm p-1 rounded-lg border shadow-sm">
                        <button onClick={() => handleEdit(s)} className="p-1.5 text-blue-600 rounded hover:bg-blue-50 transition-colors"><Edit className="w-4 h-4"/></button>
                        <button onClick={() => setDeletingId(s.id)} className="p-1.5 text-red-600 rounded hover:bg-red-50 transition-colors"><Trash2 className="w-4 h-4"/></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Kolom Kanan: Form Soal */}
            <div className="w-full md:w-1/2 flex flex-col p-6">
              <h3 className="font-bold text-slate-700 text-lg mb-6 flex items-center gap-2">
                {isEditing ? <><Edit className="w-5 h-5 text-blue-500"/> Edit Soal</> : <><Plus className="w-5 h-5 text-blue-500"/> Buat Soal Baru</>}
              </h3>
              
              <form onSubmit={handleSave} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tipe Soal</label>
                  <select 
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow outline-none text-sm font-medium text-slate-700"
                    value={soalForm.tipeSoal}
                    onChange={(e) => {
                      const newType = e.target.value;
                      let newKunci = soalForm.kunciJawaban;
                      if (newType === 'SINGLE_CHOICE' && newKunci.length > 1) {
                        newKunci = [newKunci[0]];
                      }
                      setSoalForm({ ...soalForm, tipeSoal: newType, kunciJawaban: newKunci });
                    }}
                  >
                    <option value="SINGLE_CHOICE">Single Choice (1 Jawaban Benar)</option>
                    <option value="MULTIPLE_CHOICE">Multiple Choice (Banyak Jawaban Benar)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Pertanyaan</label>
                  <textarea 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow outline-none text-sm text-slate-700 min-h-[120px]"
                    required
                    placeholder="Tuliskan pertanyaan di sini..."
                    value={soalForm.pertanyaan}
                    onChange={e => setSoalForm({...soalForm, pertanyaan: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Lampiran Media (Opsional)</label>
                  {soalForm.fileUrl && (
                    <div className="mb-2 text-sm text-blue-600 flex items-center justify-between bg-blue-50 p-2 rounded-lg border border-blue-100">
                      <a href={soalForm.fileUrl} target="_blank" rel="noreferrer" className="hover:underline">Media Saat Ini (Klik untuk melihat)</a>
                      <button type="button" onClick={() => setSoalForm({ ...soalForm, fileUrl: null })} className="text-red-500 hover:text-red-700 font-medium text-xs">
                        Hapus Media
                      </button>
                    </div>
                  )}
                  <input 
                    type="file" 
                    className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    onChange={e => setFileLampiran(e.target.files[0])}
                    accept="image/*,video/*,audio/*"
                  />
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Pilihan Jawaban</label>
                    <button type="button" onClick={handleAddOption} className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 px-2.5 py-1 rounded-md transition-colors">
                      <Plus className="w-3.5 h-3.5"/> Tambah Opsi
                    </button>
                  </div>
                  
                  <div className="space-y-2.5">
                    {soalForm.pilihanJawaban.map((pil, idx) => (
                      <div key={idx} className="flex items-center gap-3 bg-white p-2 border border-slate-200 rounded-lg shadow-sm focus-within:border-blue-300 focus-within:ring-1 focus-within:ring-blue-300 transition-all">
                        <div className="pl-2">
                          {soalForm.tipeSoal === 'SINGLE_CHOICE' ? (
                            <input 
                              type="radio" 
                              name="kunci" 
                              className="w-4.5 h-4.5 text-blue-600 focus:ring-blue-500 cursor-pointer border-slate-300"
                              checked={soalForm.kunciJawaban.includes(idx.toString())}
                              onChange={() => handleKunciChange(idx, true)}
                            />
                          ) : (
                            <input 
                              type="checkbox" 
                              className="w-4.5 h-4.5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer border-slate-300"
                              checked={soalForm.kunciJawaban.includes(idx.toString())}
                              onChange={(e) => handleKunciChange(idx, e.target.checked)}
                            />
                          )}
                        </div>
                        <input 
                          type="text" 
                          className="flex-1 px-2 py-1.5 border-none bg-transparent outline-none text-sm text-slate-700"
                          value={pil}
                          placeholder={`Opsi ${idx + 1}`}
                          onChange={e => handleOptionChange(idx, e.target.value)}
                          required
                        />
                        {soalForm.pilihanJawaban.length > 2 && (
                          <button type="button" onClick={() => handleRemoveOption(idx)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors">
                            <X className="w-4 h-4"/>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 mt-3 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
                    Centang radio/checkbox di sebelah kiri untuk menandai Kunci Jawaban.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Bobot Soal</label>
                  <input 
                    type="number" 
                    className="w-full md:w-1/3 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow outline-none text-sm text-slate-700"
                    min="1"
                    required
                    value={soalForm.bobotSoal}
                    onChange={e => setSoalForm({...soalForm, bobotSoal: e.target.value})}
                  />
                </div>

                <div className="pt-6 mt-6 border-t border-slate-100 flex justify-end gap-3">
                  {isEditing && (
                    <Button type="button" variant="secondary" onClick={resetForm} className="px-6">Batal</Button>
                  )}
                  <Button type="submit" variant="primary" className="!bg-blue-600 hover:!bg-blue-700 px-6">
                    <Save className="w-4 h-4 mr-2" /> Simpan Soal
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(deletingId)}
        title="Hapus Soal"
        message="Yakin ingin menghapus soal ini? Aksi ini tidak dapat dibatalkan."
        onConfirm={handleDelete}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
}
