import { useEffect, useState } from 'react';
import {
  Users, TrendingUp, AlertTriangle, Wrench,
  RefreshCw, ArrowUp,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { kpiAPI, inventarioAPI, equiposAPI } from '../services/api';
import { Card, Badge, Spinner } from '../components/ui/index.jsx';

// ── KPI card ──────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, sub, color = 'var(--accent)' }) {
  return (
    <Card style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: `${color}1a`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={18} color={color} />
        </div>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
      </div>
      <div>
        <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1 }}>
          {value}
        </div>
        {sub && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{sub}</div>}
      </div>
    </Card>
  );
}

// ── Tooltip personalizado ─────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-sidebar)', border: '1px solid var(--border)',
      borderRadius: 8, padding: '8px 12px', fontSize: 12,
    }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, fontWeight: 600 }}>
          {p.name}: {typeof p.value === 'number' && p.name?.toLowerCase().includes('ingreso')
            ? `$${p.value.toLocaleString('es-CL')}`
            : p.value}
        </div>
      ))}
    </div>
  );
}

const PIE_COLORS = ['#6C63FF', '#22C55E', '#EF4444', '#F59E0B'];

function formatCLP(n) {
  if (!n) return '$0';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

export default function DashboardPage() {
  const [data, setData]         = useState(null);
  const [stockAlerta, setStock] = useState([]);
  const [equiposFalla, setEquipos] = useState([]);
  const [loading, setLoading]   = useState(true);

  const cargar = async () => {
    setLoading(true);
    try {
      const [dashRes, stockRes, equiposRes] = await Promise.all([
        kpiAPI.dashboard(),
        inventarioAPI.bajoStock(),
        equiposAPI.listar({ estado: 'en_mantenimiento' }),
      ]);
      setData(dashRes.data);
      setStock(stockRes.data);
      setEquipos(equiposRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <Spinner size={32} />
    </div>
  );

  const socios   = data?.kpi_socios   || {};
  const ingresos = data?.kpi_ingresos || {};
  const ventasDiarias = (data?.ventas_diarias || []).map(v => ({
    ...v,
    dia: new Date(v.dia).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' }),
  }));
  const membresias = data?.kpi_membresias || [];

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1280 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>Dashboard</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>
            {new Date().toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button onClick={cargar} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '7px 13px', borderRadius: 'var(--radius)',
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          color: 'var(--text-secondary)', fontSize: 12, fontWeight: 500, cursor: 'pointer',
        }}>
          <RefreshCw size={13} /> Actualizar
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <KpiCard
          icon={Users} label="Socios activos"
          value={socios.activos ?? '—'}
          sub={`${socios.morosos ?? 0} morosos · ${socios.inactivos ?? 0} inactivos`}
          color="var(--accent)"
        />
        <KpiCard
          icon={TrendingUp} label="Ingresos del mes"
          value={formatCLP(ingresos.ingresos_mes)}
          sub={`${ingresos.ventas_mes ?? 0} transacciones`}
          color="#22C55E"
        />
        <KpiCard
          icon={AlertTriangle} label="Stock crítico"
          value={stockAlerta.length}
          sub="productos bajo mínimo"
          color="#F59E0B"
        />
        <KpiCard
          icon={Wrench} label="En mantención"
          value={equiposFalla.length}
          sub="equipos fuera de línea"
          color="#EF4444"
        />
      </div>

      {/* Gráfico de ingresos + Pie membresías */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, marginBottom: 24 }}>
        <Card>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Ingresos últimos 30 días</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Ventas diarias acumuladas</div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={ventasDiarias}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6C63FF" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6C63FF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="dia" tick={{ fill: '#555E77', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="ingresos" name="Ingresos"
                stroke="#6C63FF" strokeWidth={2} fill="url(#grad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Membresías por estado</div>
          </div>
          {membresias.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={membresias} dataKey="cantidad" nameKey="estado_membresia"
                  cx="50%" cy="45%" innerRadius={50} outerRadius={75} paddingAngle={3}>
                  {membresias.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v, n) => [v, n]} />
                <Legend
                  formatter={(v) => <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{v}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40, fontSize: 13 }}>
              Sin datos
            </div>
          )}
        </Card>
      </div>

      {/* Alertas */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Stock crítico */}
        <Card>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 7 }}>
            <AlertTriangle size={15} color="var(--warning)" />
            Stock crítico
          </div>
          {stockAlerta.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '16px 0' }}>✓ Todos los productos tienen stock suficiente</div>
          ) : (
            <table>
              <thead><tr><th>Producto</th><th>Actual</th><th>Mínimo</th></tr></thead>
              <tbody>
                {stockAlerta.map(p => (
                  <tr key={p.id_producto}>
                    <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{p.nombre}</td>
                    <td style={{ color: 'var(--danger)', fontWeight: 600 }}>{p.stock_actual}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{p.stock_minimo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        {/* Equipos en falla */}
        <Card>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 7 }}>
            <Wrench size={15} color="var(--danger)" />
            Equipos requieren atención
          </div>
          {equiposFalla.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '16px 0' }}>✓ Todos los equipos operativos</div>
          ) : (
            <table>
              <thead><tr><th>Equipo</th><th>Zona</th><th>Estado</th></tr></thead>
              <tbody>
                {equiposFalla.map(e => (
                  <tr key={e.id_equipo}>
                    <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{e.nombre}</td>
                    <td>{e.zona_equipo}</td>
                    <td><Badge estado={e.estado_equipo} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </div>
  );
}
