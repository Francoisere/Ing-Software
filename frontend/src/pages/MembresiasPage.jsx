import { useEffect, useState, useCallback } from 'react';
import { CreditCard, Plus, XCircle, DollarSign, RefreshCw } from 'lucide-react';
import { membresiasAPI, sociosAPI } from '../services/api';
import { Badge, Button, Card, Spinner, Modal, FormField, EmptyState } from '../components/ui/index.jsx';

const METODOS_PAGO = ['efectivo', 'transbank'];

// ── Formulario crear membresía ────────────────────────────────
function NuevaMembresiaForm({ planes, onGuardar, onCancel, loading }) {
  const [form, setForm] = useState({
    id_socio: '', tipo_membresia: 'mensual', fecha_inicio: '',
  });
  const [busqueda, setBusqueda]   = useState('');
  const [socios, setSocios]       = useState([]);
  const [buscando, setBuscando]   = useState(false);
  const [errors, setErrors]       = useState({});

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const buscarSocios = async (q) => {
    if (!q.trim()) { setSocios([]); return; }
    setBuscando(true);
    try {
      const { data } = await sociosAPI.listar({ search: q });
      setSocios(data.slice(0, 6));
    } catch { setSocios([]); }
    finally { setBuscando(false); }
  };

  useEffect(() => {
    const t = setTimeout(() => buscarSocios(busqueda), 300);
    return () => clearTimeout(t);
  }, [busqueda]);

  const planSeleccionado = planes.find(p => p.tipo === form.tipo_membresia);

  const validar = () => {
    const e = {};
    if (!form.id_socio) e.id_socio = 'Selecciona un socio';
    return e;
  };

  const submit = (ev) => {
    ev.preventDefault();
    const e = validar();
    if (Object.keys(e).length) { setErrors(e); return; }
    onGuardar(form);
  };

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Buscar socio */}
      <FormField label="Socio *" error={errors.id_socio}>
        <input
          value={busqueda}
          onChange={e => { setBusqueda(e.target.value); setForm(f => ({ ...f, id_socio: '' })); }}
          placeholder="Buscar por nombre o RUT..."
        />
        {(socios.length > 0 || buscando) && !form.id_socio && (
          <div style={{
            border: '1px solid var(--border)', borderRadius: 'var(--radius)',
            background: 'var(--bg-sidebar)', marginTop: 4, overflow: 'hidden',
          }}>
            {buscando
              ? <div style={{ padding: 10, color: 'var(--text-muted)', fontSize: 13 }}>Buscando...</div>
              : socios.map(s => (
                <div key={s.id_socio} onClick={() => {
                  set('id_socio', s.id_socio);
                  setBusqueda(`${s.nombre} (${s.rut})`);
                  setSocios([]);
                }} style={{
                  padding: '8px 12px', cursor: 'pointer', fontSize: 13,
                  borderBottom: '1px solid var(--border)',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{s.nombre}</span>
                  <span style={{ color: 'var(--text-muted)', marginLeft: 8, fontSize: 11 }}>{s.rut}</span>
                  <Badge estado={s.estado} />
                </div>
              ))
            }
          </div>
        )}
      </FormField>

      {/* Tipo de plan */}
      <FormField label="Plan de membresía *">
        <select value={form.tipo_membresia} onChange={e => set('tipo_membresia', e.target.value)}>
          {planes.map(p => (
            <option key={p.tipo} value={p.tipo}>
              {p.tipo.charAt(0).toUpperCase() + p.tipo.slice(1)} — ${p.precio.toLocaleString('es-CL')} ({p.duracionDias} días)
            </option>
          ))}
        </select>
      </FormField>

      {/* Preview del plan */}
      {planSeleccionado && (
        <div style={{
          background: 'var(--accent-dim)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', padding: '12px 14px',
        }}>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6, color: 'var(--accent)' }}>
            Plan {planSeleccionado.tipo} — ${planSeleccionado.precio.toLocaleString('es-CL')}
          </div>
          <ul style={{ paddingLeft: 16, margin: 0 }}>
            {planSeleccionado.beneficios.map((b, i) => (
              <li key={i} style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.8 }}>{b}</li>
            ))}
          </ul>
        </div>
      )}

      <FormField label="Fecha de inicio (opcional)">
        <input type="date" value={form.fecha_inicio} onChange={e => set('fecha_inicio', e.target.value)} />
      </FormField>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
        <Button variant="secondary" onClick={onCancel} type="button">Cancelar</Button>
        <Button type="submit" disabled={loading}>{loading ? 'Creando...' : 'Crear membresía'}</Button>
      </div>
    </form>
  );
}

// ── Formulario registrar pago ─────────────────────────────────
function PagoForm({ membresia, onGuardar, onCancel, loading }) {
  const [form, setForm] = useState({ metodo_pago: 'efectivo', comprobante: '' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{
        background: 'var(--bg-base)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', padding: '12px 14px',
      }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>Monto a pagar</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--success)' }}>
          ${Number(membresia.precio).toLocaleString('es-CL')}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
          {membresia.tipo_membresia} · {membresia.nombre_socio}
        </div>
      </div>
      <FormField label="Método de pago">
        <select value={form.metodo_pago} onChange={e => set('metodo_pago', e.target.value)}>
          {METODOS_PAGO.map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
        </select>
      </FormField>
      <FormField label="N° comprobante (opcional)">
        <input value={form.comprobante} onChange={e => set('comprobante', e.target.value)} placeholder="12345" />
      </FormField>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <Button variant="secondary" onClick={onCancel} type="button">Cancelar</Button>
        <Button onClick={() => onGuardar(form)} disabled={loading}>
          <DollarSign size={14} /> {loading ? 'Registrando...' : 'Registrar pago'}
        </Button>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────
export default function MembresiasPage() {
  const [membresias, setMembresias]   = useState([]);
  const [planes, setPlanes]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [modal, setModal]             = useState(null); // null | 'nueva' | { pago: membresia }
  const [saving, setSaving]           = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filtroEstado) params.estado = filtroEstado;
      const [mRes, pRes] = await Promise.all([
        membresiasAPI.listar(params),
        membresiasAPI.planes(),
      ]);
      setMembresias(mRes.data);
      setPlanes(pRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filtroEstado]);

  useEffect(() => { cargar(); }, [cargar]);

  const crearMembresia = async (form) => {
    setSaving(true);
    try {
      await membresiasAPI.crear(form);
      setModal(null);
      cargar();
    } catch (e) {
      alert(e.response?.data?.error || 'Error al crear membresía');
    } finally {
      setSaving(false);
    }
  };

  const registrarPago = async (pagoData) => {
    setSaving(true);
    try {
      await membresiasAPI.registrarPago(modal.pago.id_membresia, pagoData);
      setModal(null);
      cargar();
    } catch (e) {
      alert(e.response?.data?.error || 'Error al registrar pago');
    } finally {
      setSaving(false);
    }
  };

  const cancelar = async (id) => {
    if (!confirm('¿Cancelar esta membresía?')) return;
    try {
      await membresiasAPI.cancelar(id);
      cargar();
    } catch (e) {
      alert(e.response?.data?.error || 'Error al cancelar');
    }
  };

  const diasRestantes = (fecha) => {
    const diff = Math.ceil((new Date(fecha) - new Date()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div style={{ padding: '24px 28px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>Membresías</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
            {membresias.length} membresía{membresias.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="secondary" onClick={cargar}><RefreshCw size={14} /> Actualizar</Button>
          <Button onClick={() => setModal('nueva')}><Plus size={15} /> Nueva membresía</Button>
        </div>
      </div>

      {/* Filtro */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {['', 'vigente', 'vencida', 'cancelada'].map(e => (
            <button key={e} onClick={() => setFiltroEstado(e)} style={{
              padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500,
              cursor: 'pointer', border: '1px solid',
              borderColor: filtroEstado === e ? 'var(--accent)' : 'var(--border)',
              background: filtroEstado === e ? 'var(--accent-dim)' : 'transparent',
              color: filtroEstado === e ? 'var(--accent)' : 'var(--text-secondary)',
            }}>
              {e === '' ? 'Todas' : e.charAt(0).toUpperCase() + e.slice(1)}
            </button>
          ))}
        </div>
      </Card>

      {/* Tabla */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner /></div>
        ) : membresias.length === 0 ? (
          <EmptyState icon={CreditCard} title="Sin membresías" subtitle='Crea una con "Nueva membresía"' />
        ) : (
          <table>
            <thead>
              <tr>
                <th>Socio</th>
                <th>RUT</th>
                <th>Plan</th>
                <th>Inicio</th>
                <th>Vencimiento</th>
                <th>Días restantes</th>
                <th>Precio</th>
                <th>Estado</th>
                <th style={{ width: 120 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {membresias.map(m => {
                const dias = diasRestantes(m.fecha_vencimiento);
                return (
                  <tr key={m.id_membresia}>
                    <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{m.nombre_socio}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{m.rut_socio}</td>
                    <td style={{ textTransform: 'capitalize' }}>{m.tipo_membresia}</td>
                    <td style={{ fontSize: 12 }}>{new Date(m.fecha_inicio).toLocaleDateString('es-CL')}</td>
                    <td style={{ fontSize: 12 }}>{new Date(m.fecha_vencimiento).toLocaleDateString('es-CL')}</td>
                    <td>
                      <span style={{
                        fontSize: 12, fontWeight: 600,
                        color: dias < 0 ? 'var(--danger)' : dias <= 7 ? 'var(--warning)' : 'var(--success)',
                      }}>
                        {dias < 0 ? `Venció hace ${Math.abs(dias)} días` : `${dias} días`}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>${Number(m.precio).toLocaleString('es-CL')}</td>
                    <td><Badge estado={m.estado_membresia} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {m.estado_membresia === 'vigente' && (
                          <button onClick={() => setModal({ pago: m })}
                            title="Registrar pago"
                            style={{
                              display: 'flex', alignItems: 'center', gap: 4,
                              padding: '4px 9px', borderRadius: 6, fontSize: 11, fontWeight: 500,
                              background: 'rgba(34,197,94,0.12)', color: 'var(--success)',
                              border: '1px solid rgba(34,197,94,0.25)', cursor: 'pointer',
                            }}>
                            <DollarSign size={12} /> Pago
                          </button>
                        )}
                        {m.estado_membresia !== 'cancelada' && (
                          <button onClick={() => cancelar(m.id_membresia)}
                            title="Cancelar"
                            style={{
                              display: 'flex', alignItems: 'center', gap: 4,
                              padding: '4px 9px', borderRadius: 6, fontSize: 11, fontWeight: 500,
                              background: 'rgba(239,68,68,0.1)', color: 'var(--danger)',
                              border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer',
                            }}>
                            <XCircle size={12} /> Cancelar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>

      {/* Modal nueva membresía */}
      <Modal
        open={modal === 'nueva'}
        onClose={() => setModal(null)}
        title="Nueva membresía"
        width={560}
      >
        <NuevaMembresiaForm
          planes={planes}
          onGuardar={crearMembresia}
          onCancel={() => setModal(null)}
          loading={saving}
        />
      </Modal>

      {/* Modal pago */}
      <Modal
        open={modal?.pago !== undefined}
        onClose={() => setModal(null)}
        title="Registrar pago"
        width={420}
      >
        {modal?.pago && (
          <PagoForm
            membresia={modal.pago}
            onGuardar={registrarPago}
            onCancel={() => setModal(null)}
            loading={saving}
          />
        )}
      </Modal>
    </div>
  );
}
