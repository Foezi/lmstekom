import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Alert, Button, Input } from '../components/ui.jsx';
import { apiError } from '../api/client.js';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const user = await login(form.username.trim(), form.password);
      const dest = location.state?.from?.pathname;
      navigate(user.wajibLengkapiProfil ? '/lengkapi-profil' : dest || '/', { replace: true });
    } catch (err) {
      setError(apiError(err, 'Login gagal'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center text-white">
          <h1 className="text-3xl font-bold">LMS Politeknik Sukabumi</h1>
          <p className="mt-1 text-sm text-blue-200">
            Dosen login dengan <b>NIDN</b> · Mahasiswa login dengan <b>NIM</b>
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4 rounded-2xl bg-white p-7 shadow-xl">
          <h2 className="text-lg font-semibold text-slate-800">Masuk ke akun Anda</h2>
          {error && (
            <Alert type="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          <Input
            label="Username (NIDN / NIM / admin)"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            autoFocus
            required
          />
          <Input
            label="Password"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          <Button type="submit" disabled={busy} className="w-full py-2.5">
            {busy ? 'Memproses...' : 'Masuk'}
          </Button>
          <p className="text-center text-xs text-slate-400">
            Login pertama kali? Anda akan diminta melengkapi profil &amp; verifikasi akun.
          </p>
        </form>

        <p className="mt-4 text-center text-xs text-blue-200">
          Akun demo: superadmin/admin123 · adminti/prodi123 · dosen &amp; mahasiswa pakai password default
        </p>
      </div>
    </div>
  );
}
