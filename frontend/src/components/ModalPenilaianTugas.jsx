import React, { useState, useEffect } from 'react';
import { Button } from './ui.jsx';
import toast from 'react-hot-toast';
import { updateNilaiTugasSubmission } from '../api/endpoints.js';
import { Check, X, FileText, User, ChevronRight } from 'lucide-react';

export function ModalPenilaianTugas({ open, onClose, title, data, onSubmissionsUpdated }) {
  const [submissions, setSubmissions] = useState([]);
  const [selectedSub, setSelectedSub] = useState(null);
  
  const [nilai, setNilai] = useState('');
  const [catatan, setCatatan] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSubmissions(data || []);
  }, [data]);

  const handleSelect = (sub) => {
    setSelectedSub(sub);
    setNilai(sub.nilai !== null && sub.nilai !== undefined ? sub.nilai : '');
    setCatatan(sub.catatanDosen || '');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!selectedSub) return;
    
    setSaving(true);
    try {
      const payload = {
        nilai: nilai === '' ? null : Number(nilai),
        catatanDosen: catatan
      };
      const res = await updateNilaiTugasSubmission(selectedSub.id, payload);
      toast.success('Nilai berhasil disimpan');
      
      // Update local state
      const updatedSubmissions = submissions.map(s => s.id === selectedSub.id ? { ...s, nilai: payload.nilai, catatanDosen: payload.catatanDosen } : s);
      setSubmissions(updatedSubmissions);
      
      // Notify parent to refresh if needed
      if (onSubmissionsUpdated) onSubmissionsUpdated(updatedSubmissions);
      
      // Update currently selected object
      setSelectedSub({ ...selectedSub, nilai: payload.nilai, catatanDosen: payload.catatanDosen });
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.error?.message || 'Gagal menyimpan nilai');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-7xl h-[90vh] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden" onMouseDown={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h2 className="font-bold text-lg text-slate-800">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
          {/* Sidebar: List Mahasiswa */}
          <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col bg-white shrink-0 lg:h-full max-h-[30vh] lg:max-h-full">
            <div className="p-3 lg:p-4 border-b border-slate-100 bg-slate-50 shrink-0">
              <h3 className="font-semibold text-sm text-slate-600">Daftar Pengumpulan ({submissions.length})</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {submissions.length === 0 ? (
                <div className="p-4 text-center text-sm text-slate-500">Belum ada yang mengumpulkan</div>
              ) : (
                submissions.map(sub => (
                  <button
                    key={sub.id}
                    onClick={() => handleSelect(sub)}
                    className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors ${selectedSub?.id === sub.id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-slate-50 border border-transparent'}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${sub.nilai !== null && sub.nilai !== undefined ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                      {sub.nilai !== null && sub.nilai !== undefined ? <Check className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="font-semibold text-sm text-slate-800 truncate">{sub.mahasiswa?.nama}</p>
                      <p className="text-xs text-slate-500">{sub.mahasiswa?.nim}</p>
                    </div>
                    <ChevronRight className={`w-4 h-4 shrink-0 ${selectedSub?.id === sub.id ? 'text-blue-500' : 'text-slate-300'}`} />
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Main Area: Preview & Grade */}
          <div className="flex-1 flex flex-col lg:flex-row bg-slate-100 overflow-hidden lg:h-full overflow-y-auto lg:overflow-hidden">
            {selectedSub ? (
              <>
                {/* PDF Viewer Area */}
                <div className="flex-1 flex flex-col p-4 min-h-[40vh] lg:min-h-0">
                  <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                    <div className="p-3 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-500" />
                      <span className="font-semibold text-sm text-slate-700">Pratinjau Dokumen</span>
                    </div>
                    <div className="flex-1 bg-slate-200">
                      {selectedSub.gdriveFileIdJawaban ? (
                        <iframe
                          src={`https://drive.google.com/file/d/${selectedSub.gdriveFileIdJawaban}/preview`}
                          className="w-full h-full border-0"
                          allow="autoplay"
                        ></iframe>
                      ) : selectedSub.gdriveLink ? (
                        <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
                          <p className="text-slate-600">Mahasiswa mengirimkan tautan:</p>
                          <a href={selectedSub.gdriveLink} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-medium break-all">
                            {selectedSub.gdriveLink}
                          </a>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full text-slate-400">
                          Tidak ada lampiran dokumen.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Grading Panel */}
                <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-slate-200 bg-white flex flex-col shrink-0">
                  <div className="p-3 lg:p-4 border-b border-slate-100 bg-slate-50 shrink-0">
                    <h3 className="font-semibold text-sm text-slate-800">Form Penilaian</h3>
                  </div>
                  <div className="p-4 lg:p-5 flex-1 overflow-y-auto">
                    <form onSubmit={handleSave} className="space-y-5">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Nama Mahasiswa</label>
                        <p className="text-sm text-slate-900 bg-slate-50 p-2 rounded-lg border border-slate-100">{selectedSub.mahasiswa?.nama}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Nilai (0 - 100)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                          placeholder="Masukkan nilai..."
                          value={nilai}
                          onChange={(e) => setNilai(e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Catatan / Umpan Balik</label>
                        <textarea
                          rows={4}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                          placeholder="Berikan umpan balik..."
                          value={catatan}
                          onChange={(e) => setCatatan(e.target.value)}
                        ></textarea>
                      </div>

                      <Button type="submit" className="w-full justify-center flex items-center gap-2" disabled={saving}>
                        {saving ? 'Menyimpan...' : (
                          <>
                            <Check className="w-4 h-4" /> Simpan Nilai
                          </>
                        )}
                      </Button>
                    </form>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                <FileText className="w-16 h-16 mb-4 text-slate-300" />
                <p>Pilih mahasiswa dari daftar untuk melihat dan menilai tugas</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
