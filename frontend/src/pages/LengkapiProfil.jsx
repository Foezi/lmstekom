import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { Alert, Button, Card, Input } from '../components/ui.jsx';
import { apiError } from '../api/client.js';
import { connectDrive, lengkapiProfil, resendOtp, verifyOtp } from '../api/endpoints.js';

/**
 * Onboarding login pertama kali (blueprint §6.0b):
 * 1) form email Gmail + WA + password baru  2) verifikasi 2 OTP  3) otorisasi Google Drive (stub)
 */
export default function LengkapiProfil() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ email: '', noWhatsapp: '', passwordBaru: '' });
  const [otp, setOtp] = useState({ email: '', whatsapp: '' });
  const [devCodes, setDevCodes] = useState(null);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [busy, setBusy] = useState(false);

  const step =
    !user.emailAktif ? 1 : user.statusVerifikasiEmail !== 'TERVERIFIKASI' || user.statusVerifikasiWa !== 'TERVERIFIKASI' ? 2 : user.googleDriveConnected ? 4 : 3;

  const submitProfil = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await lengkapiProfil(form);
      setDevCodes(result.devCodes ?? null);
      updateUser({ ...user, emailAktif: form.email, noWhatsapp: form.noWhatsapp });
      setInfo('Kode OTP dikirim ke email & WhatsApp Anda.');
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  const doVerify = async (jenis) => {
    setBusy(true);
    setError(null);
    try {
      const result = await verifyOtp({ jenis, kode: otp[jenis === 'EMAIL' ? 'email' : 'whatsapp'] });
      updateUser(result.user);
      if (result.user.wajibLengkapiProfil === false) setInfo('Verifikasi lengkap! Akun Anda aktif penuh.');
      else setInfo(`OTP ${jenis.toLowerCase()} terverifikasi.`);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  const doResend = async (jenis) => {
    setBusy(true);
    setError(null);
    try {
      const result = await resendOtp(jenis);
      setDevCodes((prev) => result.devCodes ? { ...prev, ...result.devCodes } : null);
      setInfo('OTP baru dikirim.');
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  const doConnectDrive = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await connectDrive();
      updateUser(result.user);
      setInfo('Google Drive berhasil dihubungkan.');
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Lengkapi Profil Akun</h1>
        <p className="mt-1 text-sm text-slate-500">
          Halo <b>{user?.nama}</b> — selesaikan langkah berikut untuk mengaktifkan seluruh fitur LMS.
        </p>
      </div>

      {error && (
        <Alert type="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {info && (
        <Alert type="success" onClose={() => setInfo(null)}>
          {info}
        </Alert>
      )}
      {devCodes && (
        <Alert type="warning">
          <b>[Mode Dev]</b> Kode OTP stub — email: <b>{devCodes.email}</b>, WhatsApp: <b>{devCodes.whatsapp}</b>
        </Alert>
      )}

      <Card title={`Langkah 1 · Data Profil ${step === 1 ? '(sedang)' : step > 1 ? '✓' : ''}`}>
        <form onSubmit={submitProfil} className="space-y-4">
          <Input
            label="Email aktif (wajib Gmail — untuk integrasi Google Drive)"
            type="email"
            placeholder="nama@gmail.com"
            value={user?.emailAktif || form.email}
            disabled={Boolean(user?.emailAktif)}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            label="Nomor WhatsApp aktif"
            placeholder="08xxxxxxxxxx"
            value={user?.noWhatsapp || form.noWhatsapp}
            disabled={Boolean(user?.noWhatsapp)}
            onChange={(e) => setForm({ ...form, noWhatsapp: e.target.value })}
          />
          <Input
            label="Password baru (min. 8 karakter)"
            type="password"
            required
            minLength={8}
            value={form.passwordBaru}
            onChange={(e) => setForm({ ...form, passwordBaru: e.target.value })}
          />
          {!user?.emailAktif && (
            <Button type="submit" disabled={busy}>
              {busy ? 'Mengirim OTP...' : 'Simpan & Kirim OTP'}
            </Button>
          )}
        </form>
      </Card>

      <Card title={`Langkah 2 · Verifikasi Email & WhatsApp ${step > 2 ? '✓' : step === 2 ? '(sedang)' : ''}`}>
        <div className="grid gap-4 sm:grid-cols-2">
          <OtpBox
            label={`OTP Email (${user?.emailAktif || '—'})`}
            value={otp.email}
            verified={user?.statusVerifikasiEmail === 'TERVERIFIKASI'}
            disabled={!user?.emailAktif}
            onChange={(v) => setOtp((o) => ({ ...o, email: v }))}
            onVerify={() => doVerify('EMAIL')}
            onResend={() => doResend('EMAIL')}
            busy={busy}
          />
          <OtpBox
            label={`OTP WhatsApp (${user?.noWhatsapp || '—'})`}
            value={otp.whatsapp}
            verified={user?.statusVerifikasiWa === 'TERVERIFIKASI'}
            disabled={!user?.noWhatsapp}
            onChange={(v) => setOtp((o) => ({ ...o, whatsapp: v }))}
            onVerify={() => doVerify('WHATSAPP')}
            onResend={() => doResend('WHATSAPP')}
            busy={busy}
          />
        </div>
      </Card>

      <Card title={`Langkah 3 · Hubungkan Google Drive ${step >= 4 ? '✓' : step === 3 ? '(sedang)' : ''}`}>
        <p className="text-sm text-slate-600">
          File materi/tugas akan disimpan di Google Drive milik Anda (server hanya menyimpan referensinya).{' '}
          <i className="text-slate-400">(stub OAuth2 — fase integrasi nyata menyusul)</i>
        </p>
        <div className="mt-3">
          {user?.googleDriveConnected ? (
            <Alert type="success">Google Drive terhubung ✓</Alert>
          ) : (
            <Button onClick={doConnectDrive} disabled={busy || step < 3}>
              Izinkan Akses Google Drive
            </Button>
          )}
        </div>
      </Card>

      {!user?.wajibLengkapiProfil && (
        <Alert type="success">
          Semua langkah selesai! Anda dapat mulai menggunakan dashboard.
        </Alert>
      )}
    </div>
  );
}

function OtpBox({ label, value, verified, disabled, onChange, onVerify, onResend, busy }) {
  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <p className="mb-2 text-xs font-medium text-slate-500">{label}</p>
      {verified ? (
        <p className="text-sm font-semibold text-emerald-600">Terverifikasi ✓</p>
      ) : (
        <div className="flex items-center gap-2">
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm tracking-widest outline-none focus:border-blue-500"
            maxLength={6}
            inputMode="numeric"
            placeholder="______"
            value={value}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value.replace(/\D/g, ''))}
          />
          <Button variant="secondary" disabled={disabled || busy || value.length !== 6} onClick={onVerify}>
            OK
          </Button>
          <Button variant="ghost" disabled={disabled || busy} onClick={onResend} title="Kirim ulang OTP">
            ⟳
          </Button>
        </div>
      )}
    </div>
  );
}
