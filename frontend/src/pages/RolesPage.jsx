import { useEffect, useState } from 'react';
import {
  ShieldCheck, UserPlus, Power, PowerOff, Edit2, Key,
} from 'lucide-react';
import { usuariosAPI, authAPI } from '../services/api';
import { Badge, Button, Card, Spinner, Modal, FormField, EmptyState } from '../components/ui/index.jsx';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

const ROLES = ['administrador', 'recepcionista'];

// ── Badges de rol ─────────────────────────────────────────────
function RolBadge({ rol }) {
  const esAdmin = rol === 'administrador';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
      background: esAdmin ? 'rgba(108,99,255,0.15)' : 'rgba(56,189,248,0.12)',
      color: esAdmin ? 'var(--accent)' : 'var(--info)',
      border: `1px solid ${esAdmin ? 'rgba(108,99,255,0.3)' : 'rgba(56,189,248,0.25)'}`,
    }}>
      <ShieldCheck size={10} />
      {rol.charAt(0).toUpperCase() + rol.slice(1)}
    </span>
  );
}

// ── Formulario usuario ────────────────────────────────────────
function UsuarioForm({ inicial, onGuardar, onCancel, loading }) {
  const [form, setForm] = useState(inicial || {
    rut: '', nombre: '', correo: '', contrasena: '', rol: 'recepcionista',
  });
  const [errors, setErrors] = useState({});
  const esEdicion = !!inicial;
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const validar = () => {
    const e = {};
    if (!form.rut?.trim())    e.rut    = 'RUT obligatorio';
    if (!form.nombre?.trim()) e.nombre = 'Nombre obligatorio';
    if (!form.correo?.trim()) e.correo = 'Correo obligatorio';
    if (!esEdicion && !form.contrasena?.trim()) e.contrasena = 'Contraseña obligatoria';
    if (!esEdicion && form.contrasena?.length < 6) e.contrasena = 'Mínimo 6 caracteres';
    return e;
  };

  const submit = (ev) => {
    ev.preventDefault();
    const e = validar();
    if (Object.keys(e).length) { setErrors(e); return; }
    const data = { ...form };
    if (esEdicion) delete data.contrasena; // no enviar si no se quiere cambiar
    onGuardar(data);
  };

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <FormField label="RUT *" error={errors.rut}>
          <input value={form.rut} onChange={e => set('rut', e.target.value)}
            placeholder="12345678-9" disabled={esEdicion} />
        </FormField>
        <FormField label="Nombre completo *" error={errors.nombre}>
          <input value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Juan Pérez" />
        </FormField>
        <FormField label="Correo *" error={errors.correo}>
          <input type="email" value={form.correo} onChange={e => set('correo', e.target.value)} placeholder="juan@gymflow.cl" />
        </FormField>
        <FormField label="Rol">
          <select value={form.rol} onChange={e => set('rol', e.target.value)}>
            {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
          </select>
        </FormField>
        {!esEdicion && (
          <FormField label="Contraseña *" error={errors.contrasena}>
            <input type="password" value={form.contrasena} onChange={e => set('contrasena', e.target.value)}
              placeholder="Mínimo 6 caracteres" style={{ gridColumn: '1 / -1' }} />
          </FormField>
        )}
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
        <Button variant="secondary" onClick={onCancel} type="button">Cancelar</Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Guardando...' : esEdicion ? 'Actualizar' : 'Crear usuario'}
        </Button>
      </div>
    </form>
  );
}

// ── Modal cambiar contraseña ──────────────────────────────────
function CambiarPassForm({ usuario, onGuardar, onCancel, loading }) {
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');

  const submit = (ev) => {
    ev.preventDefault();
    if (pass.length < 6) { setError('Mínimo 6 caracteres'); return; }
    onGuardar(pass);
  };

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{
        padding: '10px 14px', background: 'var(--bg-base)',
        borderRadius: 8, border: '1px solid var(--border)', fontSize: 13,
      }}>
        Cambiando contraseña de: <strong>{usuario?.nombre}</strong>
      </div>
      <FormField label="Nueva contraseña" error={error}>
        <input type="password" value={pass} onChange={e => { setPass(e.target.value); setError(''); }}
          placeholder="Mínimo 6 caracteres" autoFocus />
      </FormField>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <Button variant="secondary" onClick={onCancel} type="button">Cancelar</Button>
        <Button type="submit" disabled={loading}>
          <Key size={14} /> {loading ? 'Guardando...' : 'Cambiar contraseña'}
        </Button>
      </div>
    </form>
  );
}

// ── Página ────────────────────────────────────────────────────
export default function RolesPage() {
  const { usuario: usuarioActual, esAdmin } = useAuth();

  if (!esAdmin) return <Navigate to="/dashboard" replace />;

  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(null); // null | 'crear' | { editar: u } | { pass: u }
  const [saving, setSaving]     = useState(false);

  const cargar = async () => {
    setLoading(true);
    try {
      const { data } = await usuariosAPI.listar();
      setUsuarios(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { cargar(); }, []);

  const guardar = async (data) => {
    setSaving(true);
    try {
      if (modal === 'crear') {
        await usuariosAPI.crear(data);
      } else if (modal?.editar) {
        await usuariosAPI.actualizar(modal.editar.id_usuario, data);
      }
      setModal(null);
      cargar();
    } catch (e) {
      alert(e.response?.data?.error || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const cambiarPass = async (nuevaPass) => {
    setSaving(true);
    try {
      // Usamos el endpoint de cambio de contraseña vía actualizar usuario (admin)
      await usuariosAPI.actualizar(modal.pass.id_usuario, { contrasena: nuevaPass });
      setModal(null);
      alert('Contraseña actualizada correctamente');
    } catch (e) {
      alert(e.response?.data?.error || 'Error al cambiar contraseña');
    } finally {
      setSaving(false);
    }
  };

  const toggleActivo = async (u) => {
    const accion = u.activo ? 'deshabilitar' : 'habilitar';
    if (!confirm(`¿Deseas ${accion} a ${u.nombre}?`)) return;
    try {
      await usuariosAPI.actualizar(u.id_usuario, { activo: u.activo ? 0 : 1 });
      cargar();
    } catch (e) {
      alert(e.response?.data?.error || 'Error al actualizar');
    }
  };

  // Stats
  const admins       = usuarios.filter(u => u.rol === 'administrador').length;
  const recepcionistas = usuarios.filter(u => u.rol === 'recepcionista').length;
  const inactivos    = usuarios.filter(u => !u.activo).length;

  return (
    <div style={{ padding: '24px 28px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>Roles y permisos</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
            Gestión de accesos del personal — solo visible para administradores
          </p>
        </div>
        <Button onClick={() => setModal('crear')}>
          <UserPlus size={15} /> Nuevo usuario
        </Button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Administradores', value: admins,          color: 'var(--accent)' },
          { label: 'Recepcionistas',  value: recepcionistas,  color: 'var(--info)' },
          { label: 'Deshabilitados',  value: inactivos,       color: 'var(--text-muted)' },
        ].map(({ label, value, color }) => (
          <Card key={label} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{label}</div>
          </Card>
        ))}
      </div>

      {/* Tabla */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {loading
          ? <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner /></div>
          : usuarios.length === 0
            ? <EmptyState icon={ShieldCheck} title="Sin usuarios" subtitle='Crea el primer usuario con "Nuevo usuario"' />
            : (
              <table>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>RUT</th>
                    <th>Correo</th>
                    <th>Rol</th>
                    <th>Creado</th>
                    <th>Estado</th>
                    <th style={{ width: 120 }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map(u => {
                    const esMiCuenta = u.id_usuario === usuarioActual?.id;
                    return (
                      <tr key={u.id_usuario} style={{ opacity: u.activo ? 1 : 0.5 }}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                              width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                              background: 'var(--accent-dim)', border: '1px solid var(--accent)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: 'var(--accent)', fontWeight: 700, fontSize: 12,
                            }}>
                              {u.nombre?.charAt(0)?.toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: 13 }}>
                                {u.nombre}
                                {esMiCuenta && (
                                  <span style={{
                                    marginLeft: 6, fontSize: 10, fontWeight: 600,
                                    color: 'var(--accent)', background: 'var(--accent-dim)',
                                    padding: '1px 6px', borderRadius: 10,
                                  }}>Tú</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{u.rut}</td>
                        <td style={{ fontSize: 12 }}>{u.correo}</td>
                        <td><RolBadge rol={u.rol} /></td>
                        <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {u.created_at ? new Date(u.created_at).toLocaleDateString('es-CL') : '—'}
                        </td>
                        <td>
                          <span style={{
                            fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 20,
                            background: u.activo ? 'rgba(34,197,94,0.12)' : 'rgba(139,146,168,0.12)',
                            color: u.activo ? 'var(--success)' : 'var(--text-muted)',
                          }}>
                            {u.activo ? 'Activo' : 'Deshabilitado'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            {/* Editar */}
                            <button onClick={() => setModal({ editar: u })}
                              title="Editar"
                              style={{
                                background: 'none', border: 'none', color: 'var(--text-muted)',
                                cursor: 'pointer', padding: 5, borderRadius: 6,
                              }}
                              onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
                              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                              <Edit2 size={13} />
                            </button>
                            {/* Cambiar contraseña */}
                            <button onClick={() => setModal({ pass: u })}
                              title="Cambiar contraseña"
                              style={{
                                background: 'none', border: 'none', color: 'var(--text-muted)',
                                cursor: 'pointer', padding: 5, borderRadius: 6,
                              }}
                              onMouseEnter={e => e.currentTarget.style.color = 'var(--warning)'}
                              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                              <Key size={13} />
                            </button>
                            {/* Habilitar / Deshabilitar (no puede hacerlo con su propia cuenta) */}
                            {!esMiCuenta && (
                              <button onClick={() => toggleActivo(u)}
                                title={u.activo ? 'Deshabilitar acceso' : 'Habilitar acceso'}
                                style={{
                                  background: 'none', border: 'none',
                                  color: u.activo ? 'var(--text-muted)' : 'var(--success)',
                                  cursor: 'pointer', padding: 5, borderRadius: 6,
                                }}
                                onMouseEnter={e => e.currentTarget.style.color = u.activo ? 'var(--danger)' : 'var(--success)'}
                                onMouseLeave={e => e.currentTarget.style.color = u.activo ? 'var(--text-muted)' : 'var(--success)'}>
                                {u.activo ? <PowerOff size={13} /> : <Power size={13} />}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )
        }
      </Card>

      {/* Aviso de permisos */}
      <div style={{
        marginTop: 16, padding: '10px 14px', borderRadius: 8,
        background: 'rgba(108,99,255,0.07)', border: '1px solid rgba(108,99,255,0.2)',
        fontSize: 12, color: 'var(--text-muted)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <ShieldCheck size={13} color="var(--accent)" />
        Solo los administradores pueden acceder a esta sección. Los recepcionistas no la verán en su menú.
      </div>

      {/* Modal crear */}
      <Modal open={modal === 'crear'} onClose={() => setModal(null)} title="Nuevo usuario" width={520}>
        <UsuarioForm onGuardar={guardar} onCancel={() => setModal(null)} loading={saving} />
      </Modal>

      {/* Modal editar */}
      <Modal open={!!modal?.editar} onClose={() => setModal(null)} title={`Editar: ${modal?.editar?.nombre}`} width={520}>
        {modal?.editar && (
          <UsuarioForm inicial={modal.editar} onGuardar={guardar} onCancel={() => setModal(null)} loading={saving} />
        )}
      </Modal>

      {/* Modal cambiar contraseña */}
      <Modal open={!!modal?.pass} onClose={() => setModal(null)} title="Cambiar contraseña" width={420}>
        {modal?.pass && (
          <CambiarPassForm usuario={modal.pass} onGuardar={cambiarPass} onCancel={() => setModal(null)} loading={saving} />
        )}
      </Modal>
    </div>
  );
}
