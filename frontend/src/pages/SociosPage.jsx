import { useEffect, useState, useCallback } from 'react';
import { Search, UserPlus, Edit2, Trash2, Users } from 'lucide-react';
import { sociosAPI } from '../services/api';
import { Badge, Button, Card, Spinner, Modal, FormField, EmptyState } from '../components/ui/index.jsx';

const ESTADO_OPTS = ['activo', 'moroso', 'inactivo'];

function SocioForm({ inicial, onGuardar, onCancel, loading }) {
  const [form, setForm] = useState(inicial || {
    rut: '', nombre: '', correo: '', telefono: '',
    contacto_emergencia: '', estado: 'activo',
  });
  const [errors, setErrors] = useState({});

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const validar = () => {
    const e = {};
    if (!form.rut?.trim())    e.rut    = 'El RUT es obligatorio';
    if (!form.nombre?.trim()) e.nombre = 'El nombre es obligatorio';
    return e;
  };

  const submit = (ev) => {
    ev.preventDefault();
    const e = validar();
    if (Object.keys(e).length) { setErrors(e); return; }
    onGuardar(form);
  };

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <FormField label="RUT *" error={errors.rut}>
          <input value={form.rut} onChange={e => set('rut', e.target.value)} placeholder="12345678-9" />
        </FormField>
        <FormField label="Nombre completo *" error={errors.nombre}>
          <input value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Juan Pérez" />
        </FormField>
        <FormField label="Correo electrónico">
          <input type="email" value={form.correo} onChange={e => set('correo', e.target.value)} placeholder="juan@email.com" />
        </FormField>
        <FormField label="Teléfono">
          <input value={form.telefono} onChange={e => set('telefono', e.target.value)} placeholder="+56 9 1234 5678" />
        </FormField>
        <FormField label="Contacto de emergencia">
          <input value={form.contacto_emergencia} onChange={e => set('contacto_emergencia', e.target.value)} placeholder="Nombre y teléfono" />
        </FormField>
        <FormField label="Estado">
          <select value={form.estado} onChange={e => set('estado', e.target.value)}>
            {ESTADO_OPTS.map(o => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
          </select>
        </FormField>
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
        <Button variant="secondary" onClick={onCancel} type="button">Cancelar</Button>
        <Button type="submit" disabled={loading}>{loading ? 'Guardando...' : 'Guardar'}</Button>
      </div>
    </form>
  );
}

export default function SociosPage() {
  const [socios, setSocios]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [estadoFiltro, setEstado] = useState('');
  const [modal, setModal]       = useState(null); // null | 'crear' | socio-obj
  const [saving, setSaving]     = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search)       params.search = search;
      if (estadoFiltro) params.estado = estadoFiltro;
      const { data } = await sociosAPI.listar(params);
      setSocios(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search, estadoFiltro]);

  useEffect(() => {
    const t = setTimeout(cargar, 350);
    return () => clearTimeout(t);
  }, [cargar]);

  const guardar = async (form) => {
    setSaving(true);
    try {
      if (modal === 'crear') {
        await sociosAPI.crear(form);
      } else {
        await sociosAPI.actualizar(modal.id_socio, form);
      }
      setModal(null);
      cargar();
    } catch (e) {
      alert(e.response?.data?.error || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const eliminar = async (id) => {
    try {
      await sociosAPI.eliminar(id);
      setDeleteId(null);
      cargar();
    } catch (e) {
      alert(e.response?.data?.error || 'Error al eliminar');
    }
  };

  return (
    <div style={{ padding: '24px 28px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>Socios</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
            {socios.length} resultado{socios.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => setModal('crear')}>
          <UserPlus size={15} /> Nuevo socio
        </Button>
      </div>

      {/* Filtros */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
            <Search size={15} style={{
              position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)',
              color: 'var(--text-muted)', pointerEvents: 'none',
            }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nombre o RUT..."
              style={{ paddingLeft: 34 }}
            />
          </div>
          <select value={estadoFiltro} onChange={e => setEstado(e.target.value)}
            style={{ width: 160 }}>
            <option value="">Todos los estados</option>
            {ESTADO_OPTS.map(o => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
          </select>
        </div>
      </Card>

      {/* Tabla */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner /></div>
        ) : socios.length === 0 ? (
          <EmptyState icon={Users} title="Sin socios" subtitle='Crea uno con "Nuevo socio"' />
        ) : (
          <table>
            <thead>
              <tr>
                <th>RUT</th>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Teléfono</th>
                <th>Registro</th>
                <th>Estado</th>
                <th style={{ width: 80 }}></th>
              </tr>
            </thead>
            <tbody>
              {socios.map(s => (
                <tr key={s.id_socio}>
                  <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-primary)' }}>{s.rut}</td>
                  <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{s.nombre}</td>
                  <td>{s.correo || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                  <td>{s.telefono || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                  <td style={{ fontSize: 12 }}>
                    {s.fecha_registro ? new Date(s.fecha_registro).toLocaleDateString('es-CL') : '—'}
                  </td>
                  <td><Badge estado={s.estado} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => setModal(s)} style={{
                        background: 'none', border: 'none', color: 'var(--text-muted)',
                        cursor: 'pointer', padding: 5, borderRadius: 6,
                      }}
                        title="Editar"
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => setDeleteId(s.id_socio)} style={{
                        background: 'none', border: 'none', color: 'var(--text-muted)',
                        cursor: 'pointer', padding: 5, borderRadius: 6,
                      }}
                        title="Eliminar"
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--danger)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* Modal crear / editar */}
      <Modal
        open={modal !== null}
        onClose={() => setModal(null)}
        title={modal === 'crear' ? 'Nuevo socio' : `Editar: ${modal?.nombre}`}
        width={580}
      >
        <SocioForm
          inicial={modal !== 'crear' ? modal : undefined}
          onGuardar={guardar}
          onCancel={() => setModal(null)}
          loading={saving}
        />
      </Modal>

      {/* Modal confirmar eliminar */}
      <Modal open={deleteId !== null} onClose={() => setDeleteId(null)} title="Confirmar eliminación" width={400}>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
          ¿Seguro que deseas eliminar este socio? Esta acción no se puede deshacer.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={() => setDeleteId(null)}>Cancelar</Button>
          <Button variant="danger" onClick={() => eliminar(deleteId)}>Eliminar</Button>
        </div>
      </Modal>
    </div>
  );
}
