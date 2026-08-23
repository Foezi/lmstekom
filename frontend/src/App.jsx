import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { Layout } from './components/Layout.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import { MENU } from './constants/rbac.js';

import Login from './pages/Login.jsx';
import LengkapiProfil from './pages/LengkapiProfil.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Profil from './pages/Profil.jsx';
import LogsPage from './pages/LogsPage.jsx';
import { MasterDataPage } from './pages/master/MasterDataPage.jsx';

export default function App() {
  const masterMenu = MENU.filter((m) => m.entity);
  const rolesOf = (to) => masterMenu.find((m) => m.to === to)?.roles;

  return (
    <AuthProvider>
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
