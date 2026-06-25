import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

// Inyecta el token en cada request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('gymflow_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Redirige al login si el token expira
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('gymflow_token');
      localStorage.removeItem('gymflow_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────────
export const authAPI = {
  login: (correo, contrasena) => api.post('/auth/login', { correo, contrasena }),
};

// ── KPI / Dashboard ───────────────────────────────────────────
export const kpiAPI = {
  dashboard:   () => api.get('/kpi/dashboard'),
  socios:      () => api.get('/kpi/socios'),
  ingresos:    () => api.get('/kpi/ingresos'),
  ventasDias:  (dias = 30) => api.get(`/kpi/ventas-dias?dias=${dias}`),
};

// ── Socios ────────────────────────────────────────────────────
export const sociosAPI = {
  listar:    (params) => api.get('/socios', { params }),
  obtener:   (id)     => api.get(`/socios/${id}`),
  crear:     (data)   => api.post('/socios', data),
  actualizar:(id, d)  => api.put(`/socios/${id}`, d),
  eliminar:  (id)     => api.delete(`/socios/${id}`),
};

// ── Membresías ────────────────────────────────────────────────
export const membresiasAPI = {
  listar:        (params) => api.get('/membresias', { params }),
  obtener:       (id)     => api.get(`/membresias/${id}`),
  planes:        ()       => api.get('/membresias/planes'),
  crear:         (data)   => api.post('/membresias', data),
  cancelar:      (id)     => api.put(`/membresias/${id}/cancelar`),
  registrarPago: (id, d)  => api.post(`/membresias/${id}/pago`, d),
};

// ── Inventario ────────────────────────────────────────────────
export const inventarioAPI = {
  listar:    (params) => api.get('/inventario', { params }),
  bajoStock: ()       => api.get('/inventario/bajo-stock'),
  crear:     (data)   => api.post('/inventario', data),
  actualizar:(id, d)  => api.put(`/inventario/${id}`, d),
};

// ── Equipos ───────────────────────────────────────────────────
export const equiposAPI = {
  listar:                 (params) => api.get('/equipos', { params }),
  obtener:                (id)     => api.get(`/equipos/${id}`),
  crear:                  (data)   => api.post('/equipos', data),
  actualizar:             (id, d)  => api.put(`/equipos/${id}`, d),
  cambiarEstado:          (id, e)  => api.patch(`/equipos/${id}/estado`, { estado_equipo: e }),
  registrarMantenimiento: (id, d)  => api.post(`/equipos/${id}/mantenimiento`, d),
  listarMantenimientos:   (params) => api.get('/mantenimientos', { params }),
};

// ── Ventas ────────────────────────────────────────────────────
export const ventasAPI = {
  listar:       (params) => api.get('/ventas', { params }),
  obtener:      (id)     => api.get(`/ventas/${id}`),
  procesarVenta:(data)   => api.post('/ventas', data),
  resumenHoy:   ()       => api.get('/ventas/resumen-hoy'),
};

// ── Usuarios (admin) ──────────────────────────────────────────
export const usuariosAPI = {
  listar:    ()        => api.get('/usuarios'),
  crear:     (data)    => api.post('/usuarios', data),
  actualizar:(id, d)   => api.put(`/usuarios/${id}`, d),
  eliminar:  (id)      => api.delete(`/usuarios/${id}`),
};

export default api;
