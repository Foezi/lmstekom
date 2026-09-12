import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { getMateriAkses } from '../api/endpoints.js';
import toast from 'react-hot-toast';

export function DocumentRecap({ materiId, onClose }) {
  const [aksesData, setAksesData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAkses();
  }, [materiId]);

  const loadAkses = async () => {
    try {
      setLoading(true);
      const data = await getMateriAkses(materiId);
      setAksesData(data);
    } catch (err) {
      toast.error('Gagal memuat rekap akses materi');
    } finally {
      setLoading(false);
    }
  };

  const formatTanggal = (dateString) => {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(d);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl flex flex-col overflow-hidden max-h-[80vh]">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800">Rekap Pembaca Materi</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-auto p-6 bg-white custom-scrollbar">
          {loading ? (
            <div className="text-center py-10 text-slate-400">Memuat data...</div>
          ) : aksesData.length === 0 ? (
            <div className="text-center py-10 text-slate-400 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
              Belum ada mahasiswa yang melihat/mengakses dokumen ini.
            </div>
          ) : (
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="text-xs uppercase bg-slate-100 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg">NIM</th>
                  <th className="px-4 py-3">Nama Mahasiswa</th>
                  <th className="px-4 py-3 rounded-tr-lg">Waktu Akses Terakhir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {aksesData.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-500">{p.mahasiswa.nim}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{p.mahasiswa.nama}</td>
                    <td className="px-4 py-3">{formatTanggal(p.waktuAkses)}</td>
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
