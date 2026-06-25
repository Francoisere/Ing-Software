import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import SociosPage from './pages/SociosPage';
import MembresiasPage from './pages/MembresiasPage';
import { EquipamientoPage, VentasPage, KpisPage, RolesPage } from './pages/PlaceholderPages';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<AppLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard"    element={<DashboardPage />} />
            <Route path="/socios"       element={<SociosPage />} />
            <Route path="/membresias"   element={<MembresiasPage />} />
            <Route path="/equipamiento" element={<EquipamientoPage />} />
            <Route path="/ventas"       element={<VentasPage />} />
            <Route path="/kpis"         element={<KpisPage />} />
            <Route path="/roles"        element={<RolesPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
