import { Navigate, useLocation } from 'react-router-dom';
import { Spinner } from './ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * Guard routing:
 * - belum login -> /login
 * - wajib lengkapi profil -> dipaksa ke /lengkapi-profil (blueprint §6.0b-2)
 * - role tidak sesuai -> /dashboard dengan pesan 403 visual sederhana
 */
export function ProtectedRoute({ roles, children }) {
  const { token, user, loading } = useAuth();
  const location = useLocation();

  if (!token) return <Navigate to="/login" replace state={{ from: location }} />;
  if (loading || !user) return <Spinner label="Memuat sesi..." />;

  if (user.wajibLengkapiProfil && location.pathname !== '/lengkapi-profil') {
    return <Navigate to="/lengkapi-profil" replace />;
  }
  if (!user.wajibLengkapiProfil && location.pathname === '/lengkapi-profil') {
    return <Navigate to="/" replace />;
  }
  if (roles && !roles.includes(user.role)) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
        <p className="text-lg font-semibold text-red-700">403 — Akses ditolak</p>
        <p className="mt-1 text-sm text-red-500">Halaman ini tidak tersedia untuk peran Anda.</p>
      </div>
    );
  }
  return children;
}
