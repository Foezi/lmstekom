import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Alert, Button, Input } from '../components/ui.jsx';
import { apiError } from '../api/client.js';
import { AuthLayout } from '../layouts/AuthLayout.jsx';

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
      setError(apiError(err, 'Login gagal, periksa kembali username dan password.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout>
      <div className="w-full max-w-sm mx-auto animate-fade-in-up">
        <div className="mb-8 text-center md:text-left">
          <h2 className="text-3xl font-extrabold text-slate-800 mb-2 tracking-tight">Selamat Datang 👋</h2>
          <p className="text-slate-500 text-sm font-medium">Masuk untuk melanjutkan ke dashboard akademik Anda.</p>
        </div>

        <form onSubmit={submit} className="space-y-6">
          {error && (
            <Alert type="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          
          <div className="space-y-5">
            <Input
              label="Username (NIDN / NIM)"
              placeholder="Masukkan username Anda"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              autoFocus
              required
              className="py-3 px-4 rounded-xl bg-slate-50 border-slate-200 focus:bg-white focus:border-sky-400 focus:ring-sky-500/20 transition-all font-medium text-slate-800 placeholder-slate-400 shadow-sm"
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              className="py-3 px-4 rounded-xl bg-slate-50 border-slate-200 focus:bg-white focus:border-sky-400 focus:ring-sky-500/20 transition-all font-medium text-slate-800 placeholder-slate-400 shadow-sm"
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input type="checkbox" className="rounded text-sky-500 focus:ring-sky-500 w-4 h-4 border-slate-300" />
              <span className="text-slate-600 font-medium group-hover:text-slate-800 transition-colors">Ingat Saya</span>
            </label>
            <a href="#" className="text-orange-500 font-semibold hover:text-orange-600 hover:underline transition-colors">Lupa Password?</a>
          </div>

          <Button 
            type="submit" 
            disabled={busy} 
            className="w-full py-3.5 rounded-xl text-base font-bold bg-sky-500 hover:bg-sky-600 text-white shadow-lg shadow-sky-500/30 hover:shadow-sky-500/50 hover-float transition-all"
          >
            {busy ? 'Memproses Autentikasi...' : 'Masuk Sekarang'}
          </Button>
        </form>

        <div className="mt-8 text-center text-xs text-slate-400 border-t border-slate-100 pt-6">
          <p className="font-medium mb-1 text-slate-500">LMS Version 1.0.0 &copy; {new Date().getFullYear()}</p>
          <p>Login pertama kali wajib melewati tahap Onboarding.</p>
        </div>
      </div>
    </AuthLayout>
  );
}
