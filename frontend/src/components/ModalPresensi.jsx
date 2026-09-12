import React, { useState, useEffect } from 'react';
import { Modal } from './Modal.jsx';
import { Button } from './ui.jsx';
import toast from 'react-hot-toast';
import { getPresensiPertemuan, syncPresensiAsinkronus, savePresensiManual } from '../api/endpoints.js';
import { Check, X, RefreshCw, Save, Info } from 'lucide-react';

export function ModalPresensi({ isOpen, onClose, pertemuanId, sesiNama, skemaPresensi, isPengampu }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (isOpen && pertemuanId) {
      fetchData();
    }
  }, [isOpen, pertemuanId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getPresensiPertemuan(pertemuanId);
      // Backend mengembalikan array data presensi
      setData(res);
    } catch (err) {
      toast.error('Gagal mengambil data presensi');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    if (!isPengampu) return toast.error('Anda tidak berhak mensinkronisasi data');
    setSyncing(true);
    try {
      await syncPresensiAsinkronus(pertemuanId);
      toast.success('Sinkronisasi berhasil');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.error?.message || 'Gagal sinkronisasi');
    } finally {
      setSyncing(false);
    }
  };

  const handleSaveManual = async () => {
    if (!isPengampu) return toast.error('Anda tidak berhak menyimpan data');
    setSaving(true);
    try {
      const payload = data.map(d => ({ mahasiswaId: d.mahasiswaId, status: d.status }));
      await savePresensiManual(pertemuanId, payload);
      toast.success('Presensi berhasil disimpan');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.error?.message || 'Gagal menyimpan presensi');
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = (mId, newStatus) => {
    setData(prev => prev.map(m => m.mahasiswaId === mId ? { ...m, status: newStatus } : m));
  };

  const statusColors = {
    HADIR: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    IZIN: 'bg-blue-100 text-blue-800 border-blue-200',
    SAKIT: 'bg-amber-100 text-amber-800 border-amber-200',
    ALPA: 'bg-red-100 text-red-800 border-red-200',
  };

  return (
    <Modal open={isOpen} onClose={onClose} title={`Rekap Presensi - Sesi ${sesiNama}`}>
      <div className="p-6">
        <div className="mb-4 p-3 bg-blue-50 text-blue-800 rounded-lg border border-blue-100 flex gap-3 text-sm">
          <Info className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-semibold mb-1">Skema: {skemaPresensi}</p>
            {skemaPresensi === 'ASINKRONUS' ? (
              <p>Presensi dihitung otomatis berdasarkan aktivitas mahasiswa (membaca materi / mengumpulkan tugas/kuis). Tekan tombol <b>Sinkronkan Data</b> untuk merekap ulang. Valid hingga 1 minggu setelah jadwal.</p>
            ) : (
              <p>Anda mengatur presensi secara manual. Pastikan Anda menyimpannya pada hari jadwal perkuliahan.</p>
            )}
          </div>
        </div>

        {loading ? (
          <div className="py-8 text-center text-slate-500">Memuat data presensi...</div>
        ) : (
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">NIM</th>
                  <th className="px-4 py-3">Nama</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((m, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="px-4 py-3">{m.nim}</td>
                    <td className="px-4 py-3">{m.nama}</td>
                    <td className="px-4 py-3 text-center">
                      {skemaPresensi === 'ASINKRONUS' || !isPengampu ? (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColors[m.status]}`}>
                          {m.status}
                        </span>
                      ) : (
                        <select 
                          className={`text-xs font-semibold rounded-md border-slate-300 focus:ring-blue-500 focus:border-blue-500 ${statusColors[m.status]}`}
                          value={m.status}
                          onChange={(e) => updateStatus(m.mahasiswaId, e.target.value)}
                        >
                          <option value="HADIR">HADIR</option>
                          <option value="IZIN">IZIN</option>
                          <option value="SAKIT">SAKIT</option>
                          <option value="ALPA">ALPA</option>
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
                {data.length === 0 && (
                  <tr>
                    <td colSpan="3" className="px-4 py-8 text-center text-slate-500">
                      Tidak ada mahasiswa di kelas ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>Tutup</Button>
          
          {isPengampu && skemaPresensi === 'ASINKRONUS' && (
            <Button onClick={handleSync} disabled={loading || syncing} className="flex items-center gap-2">
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Menyinkronkan...' : 'Sinkronkan Data'}
            </Button>
          )}

          {isPengampu && skemaPresensi === 'SINKRONUS' && (
            <Button onClick={handleSaveManual} disabled={loading || saving} className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              {saving ? 'Menyimpan...' : 'Simpan Presensi'}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
