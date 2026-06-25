import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../../context/AuthContext';

export default function AppLayout() {
  const { usuario } = useAuth();
  if (!usuario) return <Navigate to="/login" replace />;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{
        flex: 1, overflow: 'auto',
        background: 'var(--bg-base)',
        minHeight: '100vh',
      }}>
        <Outlet />
      </main>
    </div>
  );
}
