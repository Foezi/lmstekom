import { useRef, useState } from 'react';
import { Modal } from './Modal.jsx';
import { Alert, Button } from './ui.jsx';
import { apiError } from '../api/client.js';
import { saveBlob } from '../api/endpoints.js';

/**
 * Wizard import 4 langkah sesuai blueprint §6.1:
 * 1) unduh template  2) unggah file  3) preview validasi  4) konfirmasi commit
 */
export function ImportWizard({ open, onClose, master, onImported }) {
  const [step, setStep] = useState(0);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const reset = () => {
    setStep(0);
    setFile(null);
    setPreview(null);
    setError(null);
    setBusy(false);
  };

  const close = () => {
    reset();
    onClose();
  };

  const doPreview = async () => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const result = await master.importPreview(file);
      setPreview(result);
      setStep(2);
    } catch (err) {
      setError(apiError(err, 'Gagal memvalidasi file'));
    } finally {
      setBusy(false);
    }
  };

  const doCommit = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await master.importCommit(preview.batchId);
      setStep(3);
      setPreview((p) => ({ ...p, commit: result }));
      onImported?.();
    } catch (err) {
      setError(apiError(err, 'Gagal meng-commit import'));
    } finally {
      setBusy(false);
    }
  };

  const steps = ['Template', 'Unggah', 'Validasi', 'Selesai'];

  return (
    <Modal open={open} title={`Import ${master.title}`} onClose={close} wide>
      {/* stepper */}
      <ol className="mb-5 flex items-center gap-2 text-xs">
        {steps.map((s, i) => (
          <li key={s} className="flex items-center gap-2">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full font-semibold ${
                i <= step ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'
              }`}
            >
              {i + 1}
            </span>
            <span className={i === step ? 'font-semibold text-slate-800' : 'text-slate-400'}>{s}</span>
            {i < steps.length - 1 && <span className="text-slate-300">—</span>}
          </li>
        ))}
      </ol>

      {error && (
        <Alert type="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {step === 0 && (
        <div className="space-y-3 text-sm text-slate-600">
          <p>Unduh template resmi, isi datanya, lalu unggah kembali. Sistem akan memvalidasi sebelum menyimpan.</p>
          <div className="flex justify-between pt-4">
            <Button
              variant="secondary"
              onClick={() =>
                master
                  .downloadTemplate()
                  .then((res) => saveBlob(res, `template-import-${master.entity}.xlsx`))
                  .catch(() => setError('Gagal mengunduh template'))
              }
            >
              ⬇ Unduh Template (.xlsx)
            </Button>
            <Button onClick={() => setStep(1)}>
              Selanjutnya ›
            </Button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-3">
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full cursor-pointer rounded-lg border border-slate-300 p-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-blue-700"
          />
          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep(0)}>
              ‹ Kembali
            </Button>
            <Button disabled={!file || busy} onClick={doPreview}>
              {busy ? 'Memvalidasi...' : 'Validasi File'}
            </Button>
          </div>
        </div>
      )}

      {step === 2 && preview && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <Stat label="Total Baris" value={preview.totalBaris} />
            <Stat label="Valid" value={preview.jumlahValid} tone="text-emerald-600" />
            <Stat label="Error" value={preview.errors.length} tone="text-red-600" />
          </div>

          {preview.errors.length > 0 && (
            <div className="max-h-48 overflow-y-auto rounded-lg border border-red-100 bg-red-50 p-3 text-xs text-red-700">
              <table className="w-full">
                <thead>
                  <tr className="text-left uppercase tracking-wide">
                    <th className="py-1">Baris</th>
                    <th className="py-1">Kolom</th>
                    <th className="py-1">Masalah</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.errors.map((e, i) => (
                    <tr key={i}>
                      <td className="py-0.5 pr-2">{e.baris}</td>
                      <td className="py-0.5 pr-2">{e.kolom}</td>
                      <td className="py-0.5">{e.pesan}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {preview.preview.length > 0 && (
            <div className="overflow-auto max-h-96 rounded-lg border border-slate-200">
              <table className="min-w-full text-left text-xs relative">
                <thead className="bg-slate-50 uppercase tracking-wide text-slate-500 sticky top-0 shadow-sm">
                  <tr>
                    {Object.keys(preview.preview[0]).map((k) => (
                      <th key={k} className="px-2 py-2">
                        {k}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.preview.map((row, i) => (
                    <tr key={i} className="border-t border-slate-50">
                      {Object.values(row).map((v, j) => (
                        <td key={j} className="px-2 py-1.5 text-slate-600">
                          {String(v ?? '-')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep(1)} disabled={busy}>
              ‹ Ganti File
            </Button>
            <Button variant="primary" disabled={preview.jumlahValid === 0 || busy} onClick={doCommit}>
              {busy ? 'Menyimpan...' : `Konfirmasi Import (${preview.jumlahValid} baris)`}
            </Button>
          </div>
        </div>
      )}

      {step === 3 && preview?.commit && (
        <div className="space-y-4 text-center">
          <div className="text-4xl">✅</div>
          <p className="text-sm text-slate-600">{preview.commit.pesan}</p>
          <p className="text-xs text-slate-400">
            Status: {preview.commit.status} · dilewati: {preview.commit.jumlahDilewati}
          </p>
          <Button onClick={close}>Selesai</Button>
        </div>
      )}
    </Modal>
  );
}

function Stat({ label, value, tone = 'text-slate-800' }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 px-2 py-3">
      <div className={`text-xl font-bold ${tone}`}>{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}
