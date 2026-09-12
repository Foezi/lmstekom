import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Alert, Button, Card, Input } from '../components/ui.jsx';
import { apiError } from '../api/client.js';
import { connectDrive, lengkapiProfil, resendOtp, verifyOtp, fetchMe } from '../api/endpoints.js';

/**
 * Onboarding login pertama kali (blueprint §6.0b):
 * 1) form email Gmail + WA + password baru  2) verifikasi 2 OTP  3) otorisasi Google Drive (stub)
 */
export default function LengkapiProfil() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ email: '', noHp: '', passwordBaru: '', passwordLama: '' });
  const [otp, setOtp] = useState({ email: '', whatsapp: '' });
  const [devCodes, setDevCodes] = useState(null);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [busy, setBusy] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Cek query parameters dari Google OAuth callback
    const driveSuccess = searchParams.get('drive_success');
    const driveSimulated = searchParams.get('drive_simulated_success');
    const driveError = searchParams.get('drive_error');

    if (driveError) {
      setError('Gagal menghubungkan Google Drive. Silakan coba lagi.');
    } else if (driveSuccess || driveSimulated) {
      setInfo(driveSimulated ? 'Simulasi Google Drive berhasil dihubungkan.' : 'Google Drive berhasil dihubungkan.');
      // Refresh current user data
      fetchMe().then(result => updateUser(result)).catch(console.error);
    }
  }, [searchParams, updateUser]);

  useEffect(() => {
    // Jika user sudah melengkapi profil, arahkan ke dashboard setelah 2 detik
    if (user && !user.wajibLengkapiProfil) {
      const timer = setTimeout(() => {
        navigate('/', { replace: true });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [user?.wajibLengkapiProfil, navigate]);

  const step = user?.statusVerifikasiEmail === 'TERVERIFIKASI' && user?.statusVerifikasiWa === 'TERVERIFIKASI' 
    ? (user?.googleDriveConnected ? 4 : 3) 
    : 2;

  const submitProfil = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const payload = {
        email: form.email || user.email,
        noHp: form.noHp || user.noHp,
        passwordBaru: form.passwordBaru,
      };
      const result = await lengkapiProfil(payload);
      if (result.user) {
        updateUser(result.user);
        setInfo(result.pesan);
      } else {
        setDevCodes(result.devCodes ?? null);
        updateUser({ ...user, email: payload.email, noHp: payload.noHp });
        setInfo('Kode OTP dikirim ke email & WhatsApp Anda.');
      }
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
      if (result.url) {
        window.location.href = result.url; // Redirect ke Google Consent Screen atau simulasi
      }
    } catch (err) {
      setError(apiError(err));
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
            label="Email aktif (untuk integrasi Google Drive)"
            type="email"
            placeholder="nama@gmail.com"
            value={user?.email || form.email}
            disabled={Boolean(user?.email)}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            label="Nomor WhatsApp aktif"
            placeholder="08xxxxxxxxxx"
            value={user?.noHp || form.noHp}
            disabled={Boolean(user?.noHp)}
            onChange={(e) => setForm({ ...form, noHp: e.target.value })}
          />
          <Input
            label="Password baru (min. 8 karakter)"
            type="password"
            required
            minLength={8}
            value={form.passwordBaru}
            onChange={(e) => setForm({ ...form, passwordBaru: e.target.value })}
          />
          <Button type="submit" disabled={busy}>
            {busy ? 'Menyimpan...' : user?.email ? 'Perbarui Data' : 'Simpan & Kirim OTP'}
          </Button>
        </form>
      </Card>

      <Card title={`Langkah 2 · Verifikasi Email & WhatsApp ${step > 2 ? '✓' : step === 2 ? '(sedang)' : ''}`}>
        <div className="grid gap-4 sm:grid-cols-2">
          <OtpBox
            label={`OTP Email (${user?.email || '—'})`}
            value={otp.email}
            verified={user?.statusVerifikasiEmail === 'TERVERIFIKASI'}
            disabled={!user?.email}
            onChange={(v) => setOtp((o) => ({ ...o, email: v }))}
            onVerify={() => doVerify('EMAIL')}
            onResend={() => doResend('EMAIL')}
            busy={busy}
          />
          <OtpBox
            label={`OTP WhatsApp (${user?.noHp || '—'})`}
            value={otp.whatsapp}
            verified={user?.statusVerifikasiWa === 'TERVERIFIKASI'}
            disabled={!user?.noHp}
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
          Semua langkah selesai! Anda akan dialihkan ke dashboard dalam beberapa detik...
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
