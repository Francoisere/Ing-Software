import { X } from 'lucide-react';

// ── Badge de estado ───────────────────────────────────────────
const estadoConfig = {
  activo:   { color: '#22C55E', bg: 'rgba(34,197,94,0.12)',  label: 'Activo' },
  moroso:   { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', label: 'Moroso' },
  inactivo: { color: '#8B92A8', bg: 'rgba(139,146,168,0.12)',label: 'Inactivo' },
  vigente:  { color: '#22C55E', bg: 'rgba(34,197,94,0.12)',  label: 'Vigente' },
  vencida:  { color: '#EF4444', bg: 'rgba(239,68,68,0.12)',  label: 'Vencida' },
  cancelada:{ color: '#8B92A8', bg: 'rgba(139,146,168,0.12)',label: 'Cancelada' },
  operativo:{ color: '#22C55E', bg: 'rgba(34,197,94,0.12)',  label: 'Operativo' },
  en_mantenimiento: { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', label: 'Mantención' },
  fuera_de_servicio:{ color: '#EF4444', bg: 'rgba(239,68,68,0.12)',  label: 'Fuera servicio' },
};

export function Badge({ estado }) {
  const cfg = estadoConfig[estado] || { color: '#8B92A8', bg: 'rgba(139,146,168,0.12)', label: estado };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 9px', borderRadius: 20, fontSize: 12, fontWeight: 500,
      color: cfg.color, background: cfg.bg,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
}

// ── Button ────────────────────────────────────────────────────
export function Button({ children, variant = 'primary', size = 'md', onClick, disabled, type = 'button', style }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    fontWeight: 500, borderRadius: 'var(--radius)', cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'var(--transition)', border: 'none', fontFamily: 'var(--font)',
    opacity: disabled ? 0.5 : 1,
    padding: size === 'sm' ? '6px 12px' : size === 'lg' ? '11px 22px' : '8px 16px',
    fontSize: size === 'sm' ? 12 : 14,
  };
  const variants = {
    primary:  { background: 'var(--accent)',  color: '#fff' },
    secondary:{ background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border)' },
    danger:   { background: 'rgba(239,68,68,0.15)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.3)' },
    ghost:    { background: 'transparent', color: 'var(--text-secondary)' },
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      style={{ ...base, ...variants[variant], ...style }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.filter = 'brightness(1.12)'; }}
      onMouseLeave={e => { e.currentTarget.style.filter = ''; }}>
      {children}
    </button>
  );
}

// ── Card ──────────────────────────────────────────────────────
export function Card({ children, style }) {
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: 20, ...style,
    }}>
      {children}
    </div>
  );
}

// ── Spinner ───────────────────────────────────────────────────
export function Spinner({ size = 20 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      border: `2px solid var(--border)`,
      borderTopColor: 'var(--accent)',
      animation: 'spin 0.7s linear infinite',
    }} />
  );
}

// ── Modal ─────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, width = 520 }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 16,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: width,
        maxHeight: '90vh', overflow: 'auto',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: '1px solid var(--border)',
        }}>
          <span style={{ fontWeight: 600, fontSize: 15 }}>{title}</span>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: 'var(--text-muted)',
            cursor: 'pointer', padding: 4, borderRadius: 4,
          }}>
            <X size={16} />
          </button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>
  );
}

// ── FormField ─────────────────────────────────────────────────
export function FormField({ label, error, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>{label}</label>}
      {children}
      {error && <span style={{ fontSize: 11, color: 'var(--danger)' }}>{error}</span>}
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, subtitle }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: 10, padding: '48px 20px', color: 'var(--text-muted)',
    }}>
      {Icon && <Icon size={36} strokeWidth={1.2} />}
      <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-secondary)' }}>{title}</span>
      {subtitle && <span style={{ fontSize: 13 }}>{subtitle}</span>}
    </div>
  );
}

// ── CSS animation keyframe injected once ──────────────────────
const style = document.createElement('style');
style.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
document.head.appendChild(style);
