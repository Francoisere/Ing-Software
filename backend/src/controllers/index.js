const { AuthService }      = require('../services/AuthService');
const { SocioService }     = require('../services/SocioService');
const { MembresiaService } = require('../services/MembresiaService');
const { InventarioService }= require('../services/InventarioService');
const { EquipoService }    = require('../services/EquipoService');
const { KpiService }       = require('../services/KpiService');
const { GestorFacade }     = require('../patterns/facade/GestorFacade');
const { UsuarioRepository }= require('../repositories/UsuarioRepository');

const authService      = new AuthService();
const socioService     = new SocioService();
const membresiaService = new MembresiaService();
const inventarioService= new InventarioService();
const equipoService    = new EquipoService();
const kpiService       = new KpiService();
const gestorFacade     = new GestorFacade();
const usuarioRepo      = new UsuarioRepository();

// ── Wrapper para capturar errores async ──────────────────────
const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// ════════════════════════════════════════════════════════════
// AUTH
// ════════════════════════════════════════════════════════════
const AuthController = {
  login: asyncHandler(async (req, res) => {
    const result = await authService.login(req.body.correo, req.body.contrasena);
    res.json(result);
  }),
  cambiarContrasena: asyncHandler(async (req, res) => {
    const result = await authService.cambiarContrasena(
      req.usuario.id, req.body.contrasena_actual, req.body.nueva_contrasena
    );
    res.json(result);
  }),
};

// ════════════════════════════════════════════════════════════
// USUARIOS
// ════════════════════════════════════════════════════════════
const UsuarioController = {
  listar: asyncHandler(async (req, res) => {
    res.json(await usuarioRepo.findAll());
  }),
  crear: asyncHandler(async (req, res) => {
    const u = await authService.crearUsuario(req.body);
    res.status(201).json(u);
  }),
  actualizar: asyncHandler(async (req, res) => {
    const { contrasena, ...data } = req.body; // no permitir cambio de pass aquí
    res.json(await usuarioRepo.update(req.params.id, data));
  }),
  eliminar: asyncHandler(async (req, res) => {
    await usuarioRepo.delete(req.params.id);
    res.json({ mensaje: 'Usuario desactivado' });
  }),
};

// ════════════════════════════════════════════════════════════
// SOCIOS
// ════════════════════════════════════════════════════════════
const SocioController = {
  listar:    asyncHandler(async (req, res) => res.json(await socioService.listar(req.query))),
  obtener:   asyncHandler(async (req, res) => res.json(await socioService.obtenerPorId(req.params.id))),
  crear:     asyncHandler(async (req, res) => res.status(201).json(await socioService.crear(req.body))),
  actualizar:asyncHandler(async (req, res) => res.json(await socioService.actualizar(req.params.id, req.body))),
  eliminar:  asyncHandler(async (req, res) => {
    await socioService.eliminar(req.params.id);
    res.json({ mensaje: 'Socio eliminado' });
  }),
};

// ════════════════════════════════════════════════════════════
// MEMBRESÍAS
// ════════════════════════════════════════════════════════════
const MembresiaController = {
  listar:   asyncHandler(async (req, res) => res.json(await membresiaService.listar(req.query))),
  obtener:  asyncHandler(async (req, res) => res.json(await membresiaService.obtenerPorId(req.params.id))),
  crear:    asyncHandler(async (req, res) => res.status(201).json(await membresiaService.crear(req.body))),
  cancelar: asyncHandler(async (req, res) => res.json(await membresiaService.cancelar(req.params.id))),
  planes:   asyncHandler(async (req, res) => res.json(membresiaService.listarPlanes())),
  registrarPago: asyncHandler(async (req, res) => {
    const pago = await membresiaService.registrarPago({ id_membresia: req.params.id, ...req.body });
    res.status(201).json(pago);
  }),
};

// ════════════════════════════════════════════════════════════
// INVENTARIO
// ════════════════════════════════════════════════════════════
const InventarioController = {
  listar:     asyncHandler(async (req, res) => res.json(await inventarioService.listar(req.query))),
  obtener:    asyncHandler(async (req, res) => res.json(await inventarioService.obtenerPorId(req.params.id))),
  crear:      asyncHandler(async (req, res) => res.status(201).json(await inventarioService.crear(req.body))),
  actualizar: asyncHandler(async (req, res) => res.json(await inventarioService.actualizar(req.params.id, req.body))),
  desactivar: asyncHandler(async (req, res) => {
    await inventarioService.desactivar(req.params.id);
    res.json({ mensaje: 'Producto desactivado' });
  }),
  categorias: asyncHandler(async (req, res) => res.json(await inventarioService.getCategorias())),
  bajoStock:  asyncHandler(async (req, res) => res.json(await inventarioService.verificarStockBajo())),
};

// ════════════════════════════════════════════════════════════
// GESTOR (VENTAS) — Facade
// ════════════════════════════════════════════════════════════
const GestorController = {
  procesarVenta: asyncHandler(async (req, res) => {
    const venta = await gestorFacade.procesarVenta({
      id_usuario: req.usuario.id,
      ...req.body,
    });
    res.status(201).json(venta);
  }),
  listarVentas:  asyncHandler(async (req, res) => res.json(await gestorFacade.obtenerVentas(req.query))),
  obtenerVenta:  asyncHandler(async (req, res) => res.json(await gestorFacade.obtenerVentaPorId(req.params.id))),
  resumenDiario: asyncHandler(async (req, res) => res.json(await gestorFacade.getResumenDiario())),
};

// ════════════════════════════════════════════════════════════
// EQUIPOS Y MANTENIMIENTO
// ════════════════════════════════════════════════════════════
const EquipoController = {
  listar:      asyncHandler(async (req, res) => res.json(await equipoService.listar(req.query))),
  obtener:     asyncHandler(async (req, res) => res.json(await equipoService.obtenerPorId(req.params.id))),
  crear:       asyncHandler(async (req, res) => res.status(201).json(await equipoService.crear(req.body))),
  actualizar:  asyncHandler(async (req, res) => res.json(await equipoService.actualizar(req.params.id, req.body))),
  eliminar:    asyncHandler(async (req, res) => {
    await equipoService.eliminar(req.params.id);
    res.json({ mensaje: 'Equipo eliminado' });
  }),
  cambiarEstado: asyncHandler(async (req, res) =>
    res.json(await equipoService.cambiarEstado(req.params.id, req.body.estado_equipo))
  ),
  listarMantenimientos: asyncHandler(async (req, res) =>
    res.json(await equipoService.listarMantenimientos(req.query))
  ),
  registrarMantenimiento: asyncHandler(async (req, res) =>
    res.status(201).json(await equipoService.registrarMantenimiento({ id_equipo: req.params.id, ...req.body }))
  ),
};

// ════════════════════════════════════════════════════════════
// KPIs — Dashboard
// ════════════════════════════════════════════════════════════
const KpiController = {
  dashboard:  asyncHandler(async (req, res) => res.json(await kpiService.getDashboard())),
  socios:     asyncHandler(async (req, res) => res.json(await kpiService.getKpiSocios())),
  ingresos:   asyncHandler(async (req, res) => res.json(await kpiService.getKpiIngresos())),
  equipos:    asyncHandler(async (req, res) => res.json(await kpiService.getKpiEquipos())),
  ventasDias: asyncHandler(async (req, res) =>
    res.json(await kpiService.getVentasPorDia(Number(req.query.dias) || 30))
  ),
};

module.exports = {
  AuthController,
  UsuarioController,
  SocioController,
  MembresiaController,
  InventarioController,
  GestorController,
  EquipoController,
  KpiController,
};
