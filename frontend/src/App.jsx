import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { Layout } from './components/Layout.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import { Toaster } from 'react-hot-toast';
import { MENU } from './constants/rbac.js';

import Login from './pages/Login.jsx';
import LengkapiProfil from './pages/LengkapiProfil.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Profil from './pages/Profil.jsx';
import LogsPage from './pages/LogsPage.jsx';
import MateriList from './pages/perkuliahan/MateriList.jsx';
import MateriDetail from './pages/perkuliahan/MateriDetail.jsx';
import RuangDiskusi from './pages/perkuliahan/RuangDiskusi.jsx';
import PresensiPage from './pages/perkuliahan/PresensiPage.jsx';
import DaftarNilaiPage from './pages/perkuliahan/DaftarNilaiPage.jsx';
import { MasterDataPage } from './pages/master/MasterDataPage.jsx';
import MockupPerkuliahan from './pages/MockupPerkuliahan.jsx';
import { SkemaKurikulumPage } from './pages/SkemaKurikulumPage.jsx';
import { DaftarMahasiswaKelasPage } from './pages/DaftarMahasiswaKelasPage.jsx';
import { DetailMahasiswaPage } from './pages/DetailMahasiswaPage.jsx';

export default function App() {
  const masterMenu = MENU.filter((m) => m.entity);
  const rolesOf = (to) => masterMenu.find((m) => m.to === to)?.roles;

  return (
    <AuthProvider>
      <Toaster 
        position="top-center" 
        toastOptions={{
          className: '',
          style: {
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            color: '#334155',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(14, 165, 233, 0.15)',
            borderRadius: '16px',
            padding: '14px 20px',
            fontSize: '14px',
            fontWeight: '600',
            letterSpacing: '0.01em'
          },
          success: {
            iconTheme: {
              primary: '#0ea5e9', // sky-500
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444', // red-500
              secondary: '#fff',
            },
          },
        }}
      />
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={
              <PublicOnly>
                <Login />
              </PublicOnly>
            }
          />
          <Route
            path="/lengkapi-profil"
            element={
              <ProtectedRoute>
                <LengkapiProfil />
              </ProtectedRoute>
            }
          />

          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="/profil" element={<Profil />} />
            <Route path="materi" element={<MateriList />} />
            <Route path="materi/:id" element={<MateriDetail />} />
            <Route path="diskusi" element={<RuangDiskusi />} />
            <Route path="presensi" element={<PresensiPage />} />
            <Route path="nilai" element={<ProtectedRoute roles={['ADMIN', 'ADMIN_AKADEMIK', 'ADMIN_PRODI']}><DaftarNilaiPage /></ProtectedRoute>} />
            <Route path="tugas" element={<MockupPerkuliahan title="Tugas & Kuis" />} />
            <Route
              path="/logs"
              element={
                <ProtectedRoute roles={['ADMIN']}>
                  <LogsPage />
                </ProtectedRoute>
              }
            />
            {masterMenu.map((m) => (
              <Route
                key={m.to}
                path={m.to}
                element={
                  <ProtectedRoute roles={rolesOf(m.to)}>
                    <MasterDataPage entity={m.entity} />
                  </ProtectedRoute>
                }
              />
            ))}
            
            <Route path="/kelas/:id/skema" element={<SkemaKurikulumPage />} />
            <Route path="/kelas/:id/mahasiswa" element={<DaftarMahasiswaKelasPage />} />
            <Route path="/mahasiswa/:id/detail" element={<DetailMahasiswaPage />} />

            <Route path="/materi" element={<ProtectedRoute roles={['ADMIN', 'DOSEN', 'MAHASISWA']}><MateriList /></ProtectedRoute>} />
            <Route path="/materi/:id" element={<ProtectedRoute roles={['ADMIN', 'DOSEN', 'MAHASISWA']}><MateriDetail /></ProtectedRoute>} />

            {/* Mockup Routes untuk Fase 1 */}
            {MENU.filter((m) => m.to && !m.entity && !['/', '/profil', '/logs', '/materi'].includes(m.to)).map((m) => (
              <Route
                key={m.to}
                path={m.to}
                element={
                  <ProtectedRoute roles={m.roles === 'ALL' ? undefined : m.roles}>
                    <MockupPerkuliahan />
                  </ProtectedRoute>
                }
              />
            ))}
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

/** Halaman login tidak boleh diakses bila sudah login. */
function PublicOnly({ children }) {
  return children;
}
