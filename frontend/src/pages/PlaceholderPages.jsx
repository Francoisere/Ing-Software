import { Dumbbell, ShoppingCart, BarChart3, ShieldCheck } from 'lucide-react';

function Placeholder({ icon: Icon, title, subtitle }) {
  return (
    <div style={{
      padding: '24px 28px', display: 'flex', alignItems: 'center',
      justifyContent: 'center', minHeight: '70vh',
    }}>
      <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
        <Icon size={48} strokeWidth={1} style={{ marginBottom: 16 }} />
        <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>{title}</h2>
        <p style={{ fontSize: 13 }}>{subtitle}</p>
      </div>
    </div>
  );
}

export function EquipamientoPage() {
  return <Placeholder icon={Dumbbell} title="Equipamiento" subtitle="Próximamente disponible" />;
}

export function VentasPage() {
  return <Placeholder icon={ShoppingCart} title="Ventas" subtitle="Próximamente disponible" />;
}

export function KpisPage() {
  return <Placeholder icon={BarChart3} title="KPIs" subtitle="Próximamente disponible" />;
}

export function RolesPage() {
  return <Placeholder icon={ShieldCheck} title="Roles y permisos" subtitle="Próximamente disponible" />;
}
