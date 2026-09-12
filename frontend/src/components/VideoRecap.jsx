import React, { useState, useEffect } from 'react';
import { X, CheckCircle, XCircle } from 'lucide-react';
import { getVideoProgress } from '../api/endpoints.js';
import toast from 'react-hot-toast';

export function VideoRecap({ materiId, onClose }) {
  const [progressData, setProgressData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgress();
  }, [materiId]);

  const loadProgress = async () => {
    try {
      setLoading(true);
      const data = await getVideoProgress(materiId);
      setProgressData(data);
    } catch (err) {
      toast.error('Gagal memuat rekap penonton');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl flex flex-col overflow-hidden max-h-[80vh]">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800">Rekap Penonton Video</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-auto p-6 bg-white custom-scrollbar">
          {loading ? (
            <div className="text-center py-10 text-slate-400">Memuat data...</div>
          ) : progressData.length === 0 ? (
            <div className="text-center py-10 text-slate-400 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
              Belum ada mahasiswa yang menonton video ini.
            </div>
          ) : (
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="text-xs uppercase bg-slate-100 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg">Mahasiswa</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 rounded-tr-lg">Terakhir Diputar (Detik)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {progressData.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800">{p.mahasiswa.nama}</div>
                      <div className="text-xs text-slate-400">{p.mahasiswa.nim}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {p.completed ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          <CheckCircle className="w-3.5 h-3.5" /> Tuntas
                        </span>
                      ) : (
                        <div className="flex flex-col gap-1 w-full max-w-xs">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-500">
                              {p.lastTimestamp > 0 ? 'Menonton' : 'Belum Mulai'}
                            </span>
                            <span className="font-semibold text-slate-700">
                              {p.videoDuration > 0 ? Math.round((p.lastTimestamp / p.videoDuration) * 100) : 0}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-1.5">
                            <div 
                              className="bg-blue-500 h-1.5 rounded-full transition-all duration-500" 
                              style={{ width: `${p.videoDuration > 0 ? Math.min(100, (p.lastTimestamp / p.videoDuration) * 100) : 0}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {formatTime(p.lastTimestamp)} ({p.lastTimestamp}s)
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
