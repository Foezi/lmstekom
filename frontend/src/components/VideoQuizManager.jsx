import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Edit2, Check } from 'lucide-react';
import { getVideoQuestions, addVideoQuestion, updateVideoQuestion, deleteVideoQuestion } from '../api/endpoints.js';
import toast from 'react-hot-toast';

export function VideoQuizManager({ materiId, onClose }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ timestamp: 0, pertanyaan: '', pilihan: [] });

  useEffect(() => {
    loadQuestions();
  }, [materiId]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const data = await getVideoQuestions(materiId);
      setQuestions(data);
    } catch (err) {
      toast.error('Gagal memuat soal interaktif');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ timestamp: 0, pertanyaan: '', pilihan: [] });
    setEditingId(null);
  };

  const handleAddChoice = () => {
    setForm(prev => ({
      ...prev,
      pilihan: [...prev.pilihan, { text: '', isCorrect: false }]
    }));
  };

  const handleUpdateChoice = (idx, text) => {
    setForm(prev => {
      const newP = [...prev.pilihan];
      newP[idx].text = text;
      return { ...prev, pilihan: newP };
    });
  };

  const handleSetCorrect = (idx) => {
    setForm(prev => {
      const newP = prev.pilihan.map((p, i) => ({ ...p, isCorrect: i === idx }));
      return { ...prev, pilihan: newP };
    });
  };

  const handleRemoveChoice = (idx) => {
    setForm(prev => ({
      ...prev,
      pilihan: prev.pilihan.filter((_, i) => i !== idx)
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.pertanyaan || form.pilihan.length < 2 || !form.pilihan.some(p => p.isCorrect)) {
      toast.error('Pastikan pertanyaan terisi, minimal ada 2 pilihan, dan 1 jawaban benar dipilih.');
      return;
    }

    try {
      if (editingId) {
        await updateVideoQuestion(materiId, editingId, form);
        toast.success('Soal berhasil diperbarui');
      } else {
        await addVideoQuestion(materiId, form);
        toast.success('Soal berhasil ditambahkan');
      }
      resetForm();
      loadQuestions();
    } catch (err) {
      toast.error('Gagal menyimpan soal');
    }
  };

  const handleEdit = (q) => {
    setEditingId(q.id);
    setForm({ timestamp: q.timestamp, pertanyaan: q.pertanyaan, pilihan: q.pilihan });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus soal ini?')) return;
    try {
      await deleteVideoQuestion(materiId, id);
      toast.success('Soal berhasil dihapus');
      loadQuestions();
    } catch (err) {
      toast.error('Gagal menghapus soal');
    }
  };

  const formatMMSS = (sec) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800">Kelola Soal Interaktif Video</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-auto p-6 flex flex-col lg:flex-row gap-6 bg-slate-50">
          {/* Form Kiri */}
          <div className="w-full lg:w-1/2 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h3 className="font-semibold text-slate-800 mb-4">{editingId ? 'Edit Soal' : 'Tambah Soal Baru'}</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Durasi Video (Detik)</label>
                <div className="flex gap-2 items-center">
                  <input 
                    type="number" min="0" required 
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    value={form.timestamp}
                    onChange={(e) => setForm({...form, timestamp: parseInt(e.target.value) || 0})}
                  />
                  <span className="text-xs text-slate-400 w-24 shrink-0 font-mono">({formatMMSS(form.timestamp)})</span>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Pertanyaan</label>
                <textarea 
                  required rows="3"
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
                  value={form.pertanyaan}
                  onChange={(e) => setForm({...form, pertanyaan: e.target.value})}
                  placeholder="Ketik pertanyaan di sini..."
                ></textarea>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-slate-600">Pilihan Jawaban</label>
                  <button type="button" onClick={handleAddChoice} className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Tambah Pilihan
                  </button>
                </div>
                
                <div className="space-y-2">
                  {form.pilihan.map((p, idx) => (
                    <div key={idx} className={`flex items-center gap-2 p-2 rounded-lg border ${p.isCorrect ? 'border-green-300 bg-green-50' : 'border-slate-200'}`}>
                      <button 
                        type="button" 
                        onClick={() => handleSetCorrect(idx)}
                        className={`p-1.5 rounded-full shrink-0 ${p.isCorrect ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-400 hover:bg-slate-300'}`}
                        title={p.isCorrect ? 'Jawaban Benar' : 'Jadikan Jawaban Benar'}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <input 
                        type="text" required 
                        className="flex-1 bg-transparent text-sm outline-none"
                        value={p.text}
                        onChange={(e) => handleUpdateChoice(idx, e.target.value)}
                        placeholder={`Pilihan ${idx + 1}`}
                      />
                      <button 
                        type="button" 
                        onClick={() => handleRemoveChoice(idx)}
                        className="p-1.5 text-slate-400 hover:text-red-500 rounded-md hover:bg-white shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {form.pilihan.length === 0 && (
                    <p className="text-xs text-slate-400 italic text-center py-4 bg-slate-50 border border-dashed border-slate-200 rounded-lg">Belum ada pilihan jawaban.</p>
                  )}
                </div>
              </div>
              
              <div className="pt-4 flex items-center gap-2">
                {editingId && (
                  <button type="button" onClick={resetForm} className="flex-1 py-2 rounded-lg font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">Batal</button>
                )}
                <button type="submit" className="flex-1 py-2 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors">
                  {editingId ? 'Simpan Perubahan' : 'Tambah Soal'}
                </button>
              </div>
            </form>
          </div>

          {/* List Kanan */}
          <div className="w-full lg:w-1/2 flex flex-col h-full overflow-hidden">
            <h3 className="font-semibold text-slate-800 mb-3 shrink-0">Daftar Cek Poin ({questions.length})</h3>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {loading ? (
                <div className="text-center py-10 text-slate-400 text-sm">Memuat...</div>
              ) : questions.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-sm bg-white border border-dashed border-slate-200 rounded-xl">Belum ada soal interaktif pada video ini.</div>
              ) : (
                questions.map(q => (
                  <div key={q.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-blue-300 transition-colors group">
                    <div className="flex justify-between items-start mb-2">
                      <span className="bg-blue-100 text-blue-700 font-mono text-xs font-bold px-2 py-1 rounded-md">
                        ⏱ {formatMMSS(q.timestamp)} ({q.timestamp}s)
                      </span>
                      <div className="flex gap-1">
                        <button onClick={() => handleEdit(q)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(q.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="font-medium text-sm text-slate-800 mb-3">{q.pertanyaan}</p>
                    <div className="space-y-1.5">
                      {q.pilihan.map((p, idx) => (
                        <div key={idx} className={`text-xs p-2 rounded-md ${p.isCorrect ? 'bg-green-100 text-green-800 font-medium border border-green-200' : 'bg-slate-50 text-slate-600 border border-slate-100'}`}>
                          {p.text}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
