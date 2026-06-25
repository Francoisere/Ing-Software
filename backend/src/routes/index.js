const { Router } = require('express');
const { authMiddleware, soloRol } = require('../middleware/auth');
const {
  AuthController,
  UsuarioController,
  SocioController,
  MembresiaController,
  InventarioController,
  GestorController,
  EquipoController,
  KpiController,
} = require('../controllers/index');

const router = Router();
const admin = soloRol('administrador');
const staff = soloRol('administrador', 'recepcionista');

// ── Auth (público) ────────────────────────────────────────────
router.post('/auth/login',             AuthController.login);
router.put('/auth/cambiar-contrasena', authMiddleware, AuthController.cambiarContrasena);

// ── Usuarios (solo admin) ─────────────────────────────────────
router.get('/usuarios',          authMiddleware, admin, UsuarioController.listar);
router.post('/usuarios',         authMiddleware, admin, UsuarioController.crear);
router.put('/usuarios/:id',      authMiddleware, admin, UsuarioController.actualizar);
router.delete('/usuarios/:id',   authMiddleware, admin, UsuarioController.eliminar);

// ── Socios ────────────────────────────────────────────────────
router.get('/socios',            authMiddleware, staff, SocioController.listar);
router.get('/socios/:id',        authMiddleware, staff, SocioController.obtener);
router.post('/socios',           authMiddleware, staff, SocioController.crear);
router.put('/socios/:id',        authMiddleware, staff, SocioController.actualizar);
router.delete('/socios/:id',     authMiddleware, admin, SocioController.eliminar);

// ── Membresías ────────────────────────────────────────────────
router.get('/membresias/planes', authMiddleware, staff, MembresiaController.planes);
router.get('/membresias',        authMiddleware, staff, MembresiaController.listar);
router.get('/membresias/:id',    authMiddleware, staff, MembresiaController.obtener);
router.post('/membresias',       authMiddleware, staff, MembresiaController.crear);
router.put('/membresias/:id/cancelar', authMiddleware, staff, MembresiaController.cancelar);
router.post('/membresias/:id/pago',    authMiddleware, staff, MembresiaController.registrarPago);

// ── Inventario ────────────────────────────────────────────────
router.get('/inventario/categorias',   authMiddleware, staff, InventarioController.categorias);
router.get('/inventario/bajo-stock',   authMiddleware, staff, InventarioController.bajoStock);
router.get('/inventario',              authMiddleware, staff, InventarioController.listar);
router.get('/inventario/:id',          authMiddleware, staff, InventarioController.obtener);
router.post('/inventario',             authMiddleware, admin, InventarioController.crear);
router.put('/inventario/:id',          authMiddleware, admin, InventarioController.actualizar);
router.delete('/inventario/:id',       authMiddleware, admin, InventarioController.desactivar);

// ── Gestor de ventas (Facade) ─────────────────────────────────
router.get('/ventas',              authMiddleware, staff, GestorController.listarVentas);
router.get('/ventas/resumen-hoy',  authMiddleware, staff, GestorController.resumenDiario);
router.get('/ventas/:id',          authMiddleware, staff, GestorController.obtenerVenta);
router.post('/ventas',             authMiddleware, staff, GestorController.procesarVenta);

// ── Equipos y mantenimiento ───────────────────────────────────
router.get('/equipos',             authMiddleware, staff, EquipoController.listar);
router.get('/equipos/:id',         authMiddleware, staff, EquipoController.obtener);
router.post('/equipos',            authMiddleware, admin, EquipoController.crear);
router.put('/equipos/:id',         authMiddleware, admin, EquipoController.actualizar);
router.delete('/equipos/:id',      authMiddleware, admin, EquipoController.eliminar);
router.patch('/equipos/:id/estado',authMiddleware, staff, EquipoController.cambiarEstado);

router.get('/mantenimientos',              authMiddleware, staff, EquipoController.listarMantenimientos);
router.post('/equipos/:id/mantenimiento',  authMiddleware, staff, EquipoController.registrarMantenimiento);

// ── KPIs / Dashboard ─────────────────────────────────────────
router.get('/kpi/dashboard',   authMiddleware, staff, KpiController.dashboard);
router.get('/kpi/socios',      authMiddleware, staff, KpiController.socios);
router.get('/kpi/ingresos',    authMiddleware, staff, KpiController.ingresos);
router.get('/kpi/equipos',     authMiddleware, staff, KpiController.equipos);
router.get('/kpi/ventas-dias', authMiddleware, staff, KpiController.ventasDias);

module.exports = router;
