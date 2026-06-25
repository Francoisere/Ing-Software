const { pool } = require('../../config/database');
const { InventarioService } = require('../../services/InventarioService');
const { VentaRepository } = require('../../repositories/VentaRepository');
const { SocioRepository } = require('../../repositories/SocioRepository');
const { eventBus, EVENTOS } = require('../observer/EventBus');

/**
 * PATRÓN FACADE (GoF - Estructural)
 * 
 * GestorFacade orquesta en un solo método la lógica que antes
 * debería repetirse en cada endpoint:
 *   1. Validar stock de cada producto
 *   2. Descontar stock (y emitir eventos Observer si queda bajo mínimo)
 *   3. Crear la venta y sus detalles en una transacción SQL
 *   4. Emitir evento VENTA_COMPLETADA
 * 
 * El controlador y la UI solo ven: GestorFacade.procesarVenta()
 */
class GestorFacade {
  constructor(
    inventarioService = new InventarioService(),
    ventaRepository   = new VentaRepository(),
    socioRepository   = new SocioRepository()
  ) {
    this.inventario = inventarioService;
    this.ventaRepo  = ventaRepository;
    this.socioRepo  = socioRepository;
  }

  /**
   * Procesa una venta completa de forma transaccional
   * @param {{
   *   id_usuario: number,
   *   id_socio?: number,
   *   metodo_pago: string,
   *   comprobante?: string,
   *   items: Array<{ id_producto: number, cantidad: number }>
   * }} datosVenta
   */
  async procesarVenta({ id_usuario, id_socio, metodo_pago, comprobante, items }) {
    if (!items?.length) throw new Error('La venta debe tener al menos un producto');

    // ── 1. Pre-validar stock antes de abrir transacción ──────
    const productosConPrecio = [];
    for (const item of items) {
      const producto = await this.inventario.obtenerPorId(item.id_producto);
      if (producto.stock_actual < item.cantidad) {
        throw new Error(`Stock insuficiente para "${producto.nombre}" (disponible: ${producto.stock_actual})`);
      }
      productosConPrecio.push({ ...item, producto });
    }

    // ── 2. Calcular total ─────────────────────────────────────
    const total = productosConPrecio.reduce(
      (acc, { cantidad, producto }) => acc + producto.precio_venta * cantidad, 0
    );

    // ── 3. Transacción SQL ────────────────────────────────────
    const connection = await pool.getConnection();
    let id_venta;

    try {
      await connection.beginTransaction();

      // Crear cabecera de venta
      id_venta = await this.ventaRepo.create(
        { id_usuario, id_socio, total, metodo_pago, comprobante },
        connection
      );

      // Crear detalles y descontar stock dentro de la transacción
      for (const { id_producto, cantidad, producto } of productosConPrecio) {
        const subtotal = producto.precio_venta * cantidad;
        await this.ventaRepo.createDetalle(
          { id_venta, id_producto, cantidad, precio_unitario: producto.precio_venta, subtotal },
          connection
        );
        // Descuento de stock con UPDATE atómico
        await connection.query(
          'UPDATE PRODUCTO SET stock_actual = stock_actual - ? WHERE id_producto = ?',
          [cantidad, id_producto]
        );
      }

      await connection.commit();
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }

    // ── 4. Post-transacción: emitir eventos Observer ──────────
    for (const { id_producto, producto, cantidad } of productosConPrecio) {
      const nuevoStock = producto.stock_actual - cantidad;
      if (nuevoStock <= producto.stock_minimo) {
        eventBus.emit(EVENTOS.STOCK_BAJO, {
          producto:    producto.nombre,
          stock_actual: nuevoStock,
          stock_minimo: producto.stock_minimo,
        });
      }
    }

    eventBus.emit(EVENTOS.VENTA_COMPLETADA, { id_venta, total, id_usuario });

    // ── 5. Retornar la venta con detalle ─────────────────────
    return this.ventaRepo.findById(id_venta);
  }

  /** Historial de ventas con filtros opcionales */
  async obtenerVentas(filtros) {
    return this.ventaRepo.findAll(filtros);
  }

  async obtenerVentaPorId(id) {
    const v = await this.ventaRepo.findById(id);
    if (!v) throw new Error(`Venta ${id} no encontrada`);
    return v;
  }

  async getResumenDiario() {
    return this.ventaRepo.getResumenDiario();
  }
}

module.exports = { GestorFacade };
