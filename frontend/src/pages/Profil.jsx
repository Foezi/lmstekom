import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { Alert, Button, Card, Input } from '../components/ui.jsx';
import { apiError } from '../api/client.js';
import {
  changePassword,
  getDosenMe,
  getMahasiswaMe,
  updateDosenMe,
  updateMahasiswaMe,
  updateProfile
} from '../api/endpoints.js';

export default function Profil() {
  const { user } = useAuth();
  const isDosen = user.role === 'DOSEN';
  const isAdmin = !user.dosenId && !user.mahasiswaId;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Profil Saya</h1>
      <GeneralProfil />
      {isDosen ? <DosenProfil /> : !isAdmin ? <MahasiswaProfil /> : null}
      <PasswordCard />
    </div>
  );
}

function GeneralProfil() {
  const { user, updateUser } = useAuth();
  const [nickname, setNickname] = useState(user?.nickname || '');
  const [avatarPreview, setAvatarPreview] = useState(user?.avatarUrl || null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        import('react-hot-toast').then(m => m.default.error('Ukuran file maksimal 5MB'));
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setAvatarPreview(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  const save = async () => {
    setBusy(true);
    try {
      const formData = new FormData();
      if (nickname !== user.nickname) formData.append('nickname', nickname);
      if (avatarFile) formData.append('avatar', avatarFile);

      const result = await updateProfile(formData);
      updateUser(result);
      import('react-hot-toast').then(m => m.default.success('Profil berhasil diperbarui'));
      setAvatarFile(null);
    } catch (e) {
      import('react-hot-toast').then(m => m.default.error(apiError(e)));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card title="Pengaturan Akun Dasar">
      <div className="flex flex-col sm:flex-row gap-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-24 h-24 rounded-full border-4 border-slate-100 shadow-sm overflow-hidden bg-slate-50 flex items-center justify-center">
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar Preview" className="w-full h-full object-cover" />
            ) : (
              <span className="text-slate-400 font-bold text-4xl">{(user?.nickname || user?.nama || 'U').charAt(0).toUpperCase()}</span>
            )}
          </div>
          <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
          <button 
            type="button" 
            onClick={() => fileInputRef.current?.click()}
            className="text-xs font-bold text-sky-600 bg-sky-50 px-3 py-1.5 rounded-full hover:bg-sky-100 transition-colors"
          >
            Ubah Foto
          </button>
        </div>
        
        <div className="flex-1 space-y-4">
          <Input 
            label="Nickname / Nama Panggilan" 
            placeholder="Contoh: Budi" 
            value={nickname} 
            onChange={(e) => setNickname(e.target.value)} 
          />
          <Button onClick={save} disabled={busy || (nickname === (user?.nickname || '') && !avatarFile)}>
            {busy ? 'Menyimpan...' : 'Simpan Profil'}
          </Button>
        </div>
      </div>
    </Card>
  );
}

function DosenProfil() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getDosenMe().then(setData).catch((e) => setErr(apiError(e)));
  }, []);

  if (!data) return err ? <Alert type="error">{err}</Alert> : null;
  const editable = { email: data.email || '', noHp: data.noHp || '' };

  const save = async () => {
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const updated = await updateDosenMe({ email: editable.email || null, noHp: editable.noHp || null });
      setData(updated);
      setMsg('Profil diperbarui');
    } catch (e) {
      setErr(apiError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card title={`NIDN ${data.nidn} · ${user.username}`}>
      {msg && (
        <div className="mb-3">
          <Alert type="success" onClose={() => setMsg(null)}>
            {msg}
          </Alert>
        </div>
      )}
      {err && (
        <div className="mb-3">
          <Alert type="error" onClose={() => setErr(null)}>
            {err}
          </Alert>
        </div>
      )}
      <div className="grid gap-4">
        <Input label="Nama (diubah admin)" value={data.nama} disabled />
        <Input
          label="Email"
          type="email"
          value={editable.email}
          onChange={(e) => {
            editable.email = e.target.value;
            setData({ ...data });
          }}
        />
        <Input
          label="No. HP"
          value={editable.noHp}
          onChange={(e) => {
            editable.noHp = e.target.value;
            setData({ ...data });
          }}
        />
        <Button onClick={save} disabled={busy}>
          {busy ? 'Menyimpan...' : 'Simpan Perubahan'}
        </Button>
      </div>
    </Card>
  );
}

function MahasiswaProfil() {
  const [data, setData] = useState(null);
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getMahasiswaMe()
      .then((d) => {
        setData(d);
        setEmail(d.email || '');
      })
      .catch((e) => setErr(apiError(e)));
  }, []);

  if (!data) return err ? <Alert type="error">{err}</Alert> : null;

  const save = async () => {
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const updated = await updateMahasiswaMe({ email: email || null });
      setData(updated);
      setMsg('Email diperbarui');
    } catch (e) {
      setErr(apiError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card title={`NIM ${data.nim} · ${data.kelas?.namaKelas || ''}`}>
      {msg && (
        <div className="mb-3">
          <Alert type="success" onClose={() => setMsg(null)}>
            {msg}
          </Alert>
        </div>
      )}
      {err && (
        <div className="mb-3">
          <Alert type="error" onClose={() => setErr(null)}>
            {err}
          </Alert>
        </div>
      )}
      <div className="grid gap-4">
        <Input label="Nama (diubah admin)" value={data.nama} disabled />
        <Input label="Program Studi" value={`${data.prodi?.kodeProdi} — ${data.prodi?.namaProdi}`} disabled />
        <Input label="Kelas" value={`${data.kelas?.namaKelas} (angkatan ${data.kelas?.angkatan})`} disabled />
        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Button onClick={save} disabled={busy}>
          {busy ? 'Menyimpan...' : 'Simpan Perubahan'}
        </Button>
      </div>
    </Card>
  );
}

function PasswordCard() {
  const [form, setForm] = useState({ passwordLama: '', passwordBaru: '' });
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    setErr(null);
    try {
      await changePassword(form);
      setMsg('Password berhasil diubah');
      setForm({ passwordLama: '', passwordBaru: '' });
    } catch (ex) {
      setErr(apiError(ex));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card title="Ganti Password">
      {msg && (
        <div className="mb-3">
          <Alert type="success" onClose={() => setMsg(null)}>
            {msg}
          </Alert>
        </div>
      )}
      {err && (
        <div className="mb-3">
          <Alert type="error" onClose={() => setErr(null)}>
            {err}
          </Alert>
        </div>
      )}
      <form onSubmit={save} className="grid gap-4">
        <Input
          label="Password lama"
          type="password"
          required
          value={form.passwordLama}
          onChange={(e) => setForm({ ...form, passwordLama: e.target.value })}
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
          {busy ? 'Menyimpan...' : 'Ubah Password'}
        </Button>
      </form>
    </Card>
  );
}
