import { useAuth } from '../context/AuthContext.jsx';
import { ROLES } from '../constants/rbac.js';
import { Card } from '../components/ui.jsx';

/** Dashboard placeholder per role — statistik penuh menyusul di Fase Monitoring. */
export default function Dashboard() {
  const { user } = useAuth();

  const welcome = {
    ADMIN: 'Kelola data master, user, dan pantau seluruh sistem.',
    ADMIN_AKADEMIK: 'Pantau aktivitas akademik lintas program studi.',
    ADMIN_PRODI: 'Kelola & pantau akademik pada program studi Anda.',
    DOSEN: 'Fase berikutnya: mengajar, materi, tugas & kuis Anda akan tampil di sini.',
    MAHASISWA: 'Fase berikutnya: kelas, materi, tugas & kuis Anda akan tampil di sini.',
  }[user.role];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Selamat datang, {user.nama}</h1>
        <p className="mt-1 text-sm text-slate-500">
          Peran Anda: <b>{ROLES[user.role]}</b> · {welcome}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card title="Status Akun">
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li>Email: {user.emailAktif || '—'}</li>
            <li>WhatsApp: {user.noWhatsapp || '—'}</li>
            <li>Verifikasi email: {user.statusVerifikasiEmail.toLowerCase()}</li>
            <li>Verifikasi WA: {user.statusVerifikasiWa.toLowerCase()}</li>
            <li>Google Drive: {user.googleDriveConnected ? 'terhubung ✓' : 'belum terhubung'}</li>
          </ul>
        </Card>

        <Card title="Modul Tersedia (Fase 1)">
          <p className="text-sm text-slate-600">
            Kelola menu <b>Data Master</b> pada sidebar sesuai hak akses Anda: prodi, kelas, dosen,
            mahasiswa, ruangan, dan mata kuliah — termasuk import Excel dan export.
          </p>
        </Card>

        <Card title="Roadmap Berikutnya">
          <ol className="list-decimal space-y-1 pl-4 text-sm text-slate-600">
            <li>Fase 2: jadwal + validasi bentrok</li>
            <li>Fase 3: generate mengajar & 16 pertemuan</li>
            <li>Fase 4: materi, tugas, kuis (lockdown PG)</li>
            <li>Fase 5: monitoring dashboard</li>
          </ol>
        </Card>
      </div>
    </div>
  );
}
