import { useEffect, useState, useCallback } from 'react';
import {
  Dumbbell, Plus, Edit2, Wrench, ChevronDown, ChevronUp,
  FileText, AlertTriangle, CheckCircle, XCircle, History,
} from 'lucide-react';
import { equiposAPI } from '../services/api';
import { Badge, Button, Card, Spinner, Modal, FormField, EmptyState } from '../components/ui/index.jsx';

const ESTADOS_EQUIPO = ['operativo', 'en_mantenimiento', 'fuera_de_servicio'];
const TIPOS_MANT     = ['preventivo', 'correctivo'];
const ZONAS          = ['Sala de pesas', 'Cardio', 'Funcional', 'Vestuario', 'Recepción', 'Otra'];

// ── Formulario equipo ─────────────────────────────────────────
function EquipoForm({ inicial, onGuardar, onCancel, loading }) {
  const [form, setForm] = useState(inicial || {
    codigo_unico: '', nombre: '', marca: '', zona_equipo: '',
    fecha_adquisicion: '', estado_equipo: 'operativo', manual_pdf: '',
  });
  const [errors, setErrors] = useState({});
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    const err = {};
    if (!form.codigo_unico?.trim()) err.codigo_unico = 'Requerido';
    if (!form.nombre?.trim())       err.nombre       = 'Requerido';
    if (Object.keys(err).length) { setErrors(err); return; }
    onGuardar(form);
  };

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <FormField label="Código único *" error={errors.codigo_unico}>
          <input value={form.codigo_unico} onChange={e => set('codigo_unico', e.target.value)} placeholder="EQ-001" />
        </FormField>
        <FormField label="Nombre *" error={errors.nombre}>
          <input value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Cinta Caminadora" />
        </FormField>
        <FormField label="Marca">
          <input value={form.marca} onChange={e => set('marca', e.target.value)} placeholder="Life Fitness" />
        </FormField>
        <FormField label="Zona">
          <select value={form.zona_equipo} onChange={e => set('zona_equipo', e.target.value)}>
            <option value="">Seleccionar zona</option>
            {ZONAS.map(z => <option key={z} value={z}>{z}</option>)}
          </select>
        </FormField>
        <FormField label="Fecha adquisición">
          <input type="date" value={form.fecha_adquisicion} onChange={e => set('fecha_adquisicion', e.target.value)} />
        </FormField>
        <FormField label="Estado">
          <select value={form.estado_equipo} onChange={e => set('estado_equipo', e.target.value)}>
            {ESTADOS_EQUIPO.map(s => (
              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </FormField>
      </div>
      <FormField label="URL Manual PDF">
        <input value={form.manual_pdf} onChange={e => set('manual_pdf', e.target.value)} placeholder="https://..." />
      </FormField>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
        <Button variant="secondary" onClick={onCancel} type="button">Cancelar</Button>
        <Button type="submit" disabled={loading}>{loading ? 'Guardando...' : 'Guardar equipo'}</Button>
      </div>
    </form>
  );
}

// ── Formulario mantenimiento ──────────────────────────────────
function MantenimientoForm({ equipo, onGuardar, onCancel, loading }) {
  const [form, setForm] = useState({
    tipo: 'preventivo', descripcion: '', tecnico: '', pieza_reparada: '', costo: '',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{
        background: 'var(--bg-base)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', padding: '10px 14px',
      }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Equipo</div>
        <div style={{ fontWeight: 600, marginTop: 2 }}>{equipo.nombre}
          <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: 8, fontSize: 12 }}>
            {equipo.zona_equipo}
          </span>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <FormField label="Tipo de mantención">
          <select value={form.tipo} onChange={e => set('tipo', e.target.value)}>
            {TIPOS_MANT.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
        </FormField>
        <FormField label="Técnico responsable">
          <input value={form.tecnico} onChange={e => set('tecnico', e.target.value)} placeholder="Nombre del técnico" />
        </FormField>
        <FormField label="Pieza reparada">
          <input value={form.pieza_reparada} onChange={e => set('pieza_reparada', e.target.value)} placeholder="Correa, motor..." />
        </FormField>
        <FormField label="Costo ($)">
          <input type="number" value={form.costo} onChange={e => set('costo', e.target.value)} placeholder="0" />
        </FormField>
      </div>
      <FormField label="Descripción">
        <textarea value={form.descripcion} onChange={e => set('descripcion', e.target.value)}
          placeholder="Descripción del trabajo realizado..." rows={3}
          style={{ resize: 'vertical' }} />
      </FormField>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <Button variant="secondary" onClick={onCancel} type="button">Cancelar</Button>
        <Button onClick={() => onGuardar(form)} disabled={loading}>
          <Wrench size={14} /> {loading ? 'Registrando...' : 'Registrar mantención'}
        </Button>
      </div>
    </div>
  );
}

// ── Fila expandible con historial ─────────────────────────────
function EquipoRow({ equipo, onEditar, onMantencion, onCambiarEstado }) {
  const [expandido, setExpandido] = useState(false);
  const [historial, setHistorial] = useState([]);
  const [cargandoHist, setCargando] = useState(false);

  const cargarHistorial = async () => {
    if (expandido) { setExpandido(false); return; }
    setCargando(true);
    try {
      const { data } = await equiposAPI.listarMantenimientos({ id_equipo: equipo.id_equipo });
      setHistorial(data);
    } catch { setHistorial([]); }
    finally { setCargando(false); setExpandido(true); }
  };

  const estadoIcono = {
    operativo:         <CheckCircle size={14} color="var(--success)" />,
    en_mantenimiento:  <AlertTriangle size={14} color="var(--warning)" />,
    fuera_de_servicio: <XCircle size={14} color="var(--danger)" />,
  };

  return (
    <>
      <tr>
        <td style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--accent)' }}>{equipo.codigo_unico}</td>
        <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{equipo.nombre}</td>
        <td>{equipo.marca || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
        <td>{equipo.zona_equipo || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
        <td><Badge estado={equipo.estado_equipo} /></td>
        <td style={{ fontSize: 12 }}>
          {equipo.fecha_adquisicion
            ? new Date(equipo.fecha_adquisicion).toLocaleDateString('es-CL')
            : <span style={{ color: 'var(--text-muted)' }}>—</span>}
        </td>
        <td>
          {equipo.manual_pdf
            ? <a href={equipo.manual_pdf} target="_blank" rel="noreferrer"
                style={{ color: 'var(--accent)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                <FileText size={13} /> Ver PDF
              </a>
            : <span style={{ color: 'var(--text-muted)' }}>—</span>}
        </td>
        <td>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button onClick={() => onEditar(equipo)} title="Editar"
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 5, borderRadius: 6 }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
              <Edit2 size={14} />
            </button>
            <button onClick={() => onMantencion(equipo)} title="Registrar mantención"
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 5, borderRadius: 6 }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--warning)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
              <Wrench size={14} />
            </button>
            <button onClick={cargarHistorial} title="Ver historial"
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 5, borderRadius: 6 }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--info)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
              {cargandoHist ? <Spinner size={14} /> : expandido ? <ChevronUp size={14} /> : <History size={14} />}
            </button>
          </div>
        </td>
      </tr>
      {/* Historial expandido */}
      {expandido && (
        <tr>
          <td colSpan={8} style={{ padding: 0 }}>
            <div style={{ background: 'var(--bg-base)', borderBottom: '1px solid var(--border)', padding: '12px 16px' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <History size={13} /> Historial de mantenciones — {equipo.nombre}
              </div>
              {historial.length === 0 ? (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '8px 0' }}>Sin mantenciones registradas</div>
              ) : (
                <table style={{ fontSize: 12 }}>
                  <thead>
                    <tr>
                      <th>Fecha</th><th>Tipo</th><th>Técnico</th><th>Pieza</th><th>Costo</th><th>Descripción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historial.map(h => (
                      <tr key={h.id_mantenimiento}>
                        <td>{new Date(h.fecha).toLocaleDateString('es-CL')}</td>
                        <td>
                          <span style={{
                            padding: '2px 8px', borderRadius: 10, fontSize: 11,
                            background: h.tipo === 'preventivo' ? 'rgba(56,189,248,0.12)' : 'rgba(239,68,68,0.12)',
                            color: h.tipo === 'preventivo' ? 'var(--info)' : 'var(--danger)',
                          }}>{h.tipo}</span>
                        </td>
                        <td>{h.tecnico || '—'}</td>
                        <td>{h.pieza_reparada || '—'}</td>
                        <td>{h.costo ? `$${Number(h.costo).toLocaleString('es-CL')}` : '—'}</td>
                        <td style={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {h.descripcion || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ── Página principal ──────────────────────────────────────────
export default function EquipamientoPage() {
  const [equipos, setEquipos]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filtroEstado, setFiltro] = useState('');
  const [modal, setModal]       = useState(null); // null | 'nuevo' | { editar } | { mantencion }
  const [saving, setSaving]     = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filtroEstado) params.estado = filtroEstado;
      const { data } = await equiposAPI.listar(params);
      setEquipos(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [filtroEstado]);

  useEffect(() => { cargar(); }, [cargar]);

  const guardarEquipo = async (form) => {
    setSaving(true);
    try {
      if (modal?.editar) {
        await equiposAPI.actualizar(modal.editar.id_equipo, form);
      } else {
        await equiposAPI.crear(form);
      }
      setModal(null); cargar();
    } catch (e) { alert(e.response?.data?.error || 'Error al guardar'); }
    finally { setSaving(false); }
  };

  const guardarMantencion = async (form) => {
    setSaving(true);
    try {
      await equiposAPI.registrarMantenimiento(modal.mantencion.id_equipo, form);
      setModal(null); cargar();
    } catch (e) { alert(e.response?.data?.error || 'Error al registrar'); }
    finally { setSaving(false); }
  };

  // Contadores por estado
  const contadores = ESTADOS_EQUIPO.reduce((acc, e) => {
    acc[e] = equipos.filter(eq => eq.estado_equipo === e).length;
    return acc;
  }, {});

  return (
    <div style={{ padding: '24px 28px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>Equipamiento</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
            {equipos.length} equipo{equipos.length !== 1 ? 's' : ''} registrados
          </p>
        </div>
        <Button onClick={() => setModal('nuevo')}><Plus size={15} /> Nuevo equipo</Button>
      </div>

      {/* Tarjetas de estado */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { key: 'operativo',          label: 'Operativos',    color: 'var(--success)' },
          { key: 'en_mantenimiento',   label: 'En mantención', color: 'var(--warning)' },
          { key: 'fuera_de_servicio',  label: 'Fuera servicio',color: 'var(--danger)'  },
        ].map(({ key, label, color }) => (
          <Card key={key} style={{
            cursor: 'pointer', transition: 'var(--transition)',
            borderColor: filtroEstado === key ? color : 'var(--border)',
            background: filtroEstado === key ? `${color}0d` : 'var(--bg-card)',
          }} onClick={() => setFiltro(filtroEstado === key ? '' : key)}>
            <div style={{ fontSize: 26, fontWeight: 700, color }}>{contadores[key] ?? 0}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{label}</div>
          </Card>
        ))}
      </div>

      {/* Tabla */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner /></div>
        ) : equipos.length === 0 ? (
          <EmptyState icon={Dumbbell} title="Sin equipos" subtitle='Agrega uno con "Nuevo equipo"' />
        ) : (
          <table>
            <thead>
              <tr>
                <th>Código</th><th>Nombre</th><th>Marca</th><th>Zona</th>
                <th>Estado</th><th>Adquisición</th><th>Manual</th><th style={{ width: 120 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {equipos.map(eq => (
                <EquipoRow
                  key={eq.id_equipo}
                  equipo={eq}
                  onEditar={(eq) => setModal({ editar: eq })}
                  onMantencion={(eq) => setModal({ mantencion: eq })}
                  onCambiarEstado={cargar}
                />
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* Modal nuevo / editar */}
      <Modal
        open={modal === 'nuevo' || !!modal?.editar}
        onClose={() => setModal(null)}
        title={modal?.editar ? `Editar: ${modal.editar.nombre}` : 'Nuevo equipo'}
        width={580}
      >
        <EquipoForm
          inicial={modal?.editar}
          onGuardar={guardarEquipo}
          onCancel={() => setModal(null)}
          loading={saving}
        />
      </Modal>

      {/* Modal mantención */}
      <Modal
        open={!!modal?.mantencion}
        onClose={() => setModal(null)}
        title="Registrar mantención"
        width={520}
      >
        {modal?.mantencion && (
          <MantenimientoForm
            equipo={modal.mantencion}
            onGuardar={guardarMantencion}
            onCancel={() => setModal(null)}
            loading={saving}
          />
        )}
      </Modal>
    </div>
  );
}
