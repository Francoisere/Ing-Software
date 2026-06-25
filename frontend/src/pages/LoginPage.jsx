import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/index.jsx';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ correo: '', contrasena: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.correo || !form.contrasena) {
      setError('Completa todos los campos.');
      return;
    }
    setLoading(true);
    try {
      await login(form.correo, form.contrasena);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Credenciales incorrectas.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-base)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }}>
      {/* Glow de fondo */}
      <div style={{
        position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)',
        width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(108,99,255,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        width: '100%', maxWidth: 400,
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 16, padding: '36px 32px',
        position: 'relative', zIndex: 1,
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px',
            boxShadow: '0 0 24px var(--accent-glow)',
          }}>
            <Zap size={26} color="#fff" fill="#fff" />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 4 }}>
            GymFlow Manager
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            Ingresa tus credenciales para continuar
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Correo */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Correo electrónico
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={15} style={{
                position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text-muted)', pointerEvents: 'none',
              }} />
              <input
                type="email"
                value={form.correo}
                onChange={e => setForm(f => ({ ...f, correo: e.target.value }))}
                placeholder="admin@gymflow.cl"
                style={{ paddingLeft: 34 }}
                autoComplete="email"
              />
            </div>
          </div>

          {/* Contraseña */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Contraseña
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={15} style={{
                position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text-muted)', pointerEvents: 'none',
              }} />
              <input
                type="password"
                value={form.contrasena}
                onChange={e => setForm(f => ({ ...f, contrasena: e.target.value }))}
                placeholder="••••••••"
                style={{ paddingLeft: 34 }}
                autoComplete="current-password"
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 12px', borderRadius: 'var(--radius)',
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
              color: 'var(--danger)', fontSize: 13,
            }}>
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <Button type="submit" size="lg" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </Button>
        </form>
      </div>
    </div>
  );
}
