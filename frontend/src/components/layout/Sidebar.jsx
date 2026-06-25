import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, CreditCard, Dumbbell,
  ShoppingCart, BarChart3, ShieldCheck, LogOut, Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { path: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/socios',       icon: Users,            label: 'Socios' },
  { path: '/membresias',   icon: CreditCard,       label: 'Membresías' },
  { path: '/equipamiento', icon: Dumbbell,         label: 'Equipamiento' },
  { path: '/ventas',       icon: ShoppingCart,     label: 'Ventas' },
  { path: '/kpis',         icon: BarChart3,        label: 'KPIs' },
];

export default function Sidebar() {
  const { usuario, logout, esAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside style={{
      width: 'var(--sidebar-w)', minHeight: '100vh',
      background: 'var(--bg-sidebar)',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{
        padding: '20px 16px 16px',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Zap size={17} color="#fff" fill="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, letterSpacing: '-0.02em' }}>GymFlow</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500 }}>MANAGER</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV_ITEMS.map(({ path, icon: Icon, label }) => (
          <NavLink key={path} to={path} style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 10px', borderRadius: 'var(--radius)',
            textDecoration: 'none', fontWeight: 500, fontSize: 13,
            transition: 'var(--transition)',
            background: isActive ? 'var(--accent-dim)' : 'transparent',
            color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
            borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
          })}>
            <Icon size={16} />
            {label}
          </NavLink>
        ))}

        {/* Roles — solo admin */}
        {esAdmin && (
          <NavLink to="/roles" style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 10px', borderRadius: 'var(--radius)',
            textDecoration: 'none', fontWeight: 500, fontSize: 13,
            transition: 'var(--transition)',
            background: isActive ? 'var(--accent-dim)' : 'transparent',
            color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
            borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
          })}>
            <ShieldCheck size={16} />
            Roles
          </NavLink>
        )}
      </nav>

      {/* User info + logout */}
      <div style={{
        padding: '12px 12px 16px',
        borderTop: '1px solid var(--border)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px', borderRadius: 'var(--radius)',
          background: 'var(--bg-card)',
          marginBottom: 8,
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%',
            background: 'var(--accent-dim)', border: '1px solid var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--accent)', fontWeight: 700, fontSize: 12, flexShrink: 0,
          }}>
            {usuario?.nombre?.charAt(0)?.toUpperCase()}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {usuario?.nombre}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'capitalize' }}>
              {usuario?.rol}
            </div>
          </div>
        </div>
        <button onClick={handleLogout} style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 8,
          padding: '7px 10px', borderRadius: 'var(--radius)',
          background: 'none', color: 'var(--text-muted)', fontSize: 12, fontWeight: 500,
          cursor: 'pointer', border: 'none', transition: 'var(--transition)',
        }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'none'; }}>
          <LogOut size={14} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
