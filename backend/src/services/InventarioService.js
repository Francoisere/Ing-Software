const { ProductoRepository } = require('../repositories/ProductoRepository');
const { eventBus, EVENTOS } = require('../patterns/observer/EventBus');

class InventarioService {
  constructor(productoRepository = new ProductoRepository()) {
    this.repo = productoRepository;
  }

  async listar(filtros) {
    return this.repo.findAll(filtros);
  }

  async obtenerPorId(id) {
    const p = await this.repo.findById(id);
    if (!p) throw new Error(`Producto ${id} no encontrado`);
    return p;
  }

  async crear(data) {
    const existe = await this.repo.findByCodigoBarra(data.codigo_barra);
    if (existe) throw new Error(`Ya existe un producto con código ${data.codigo_barra}`);
    return this.repo.create(data);
  }

  async actualizar(id, data) {
    await this.obtenerPorId(id);
    return this.repo.update(id, data);
  }

  async desactivar(id) {
    await this.obtenerPorId(id);
    return this.repo.delete(id);
  }

  getCategorias() {
    return this.repo.getCategorias();
  }

  /**
   * Descuenta stock y emite evento Observer si queda bajo el mínimo
   */
  async descontarStock(id_producto, cantidad) {
    const producto = await this.repo.descontarStock(id_producto, cantidad);

    // Observer: emite alerta si el stock quedó bajo el mínimo
    if (producto.stock_actual <= producto.stock_minimo) {
      eventBus.emit(EVENTOS.STOCK_BAJO, {
        producto:    producto.nombre,
        stock_actual: producto.stock_actual,
        stock_minimo: producto.stock_minimo,
      });
    }

    return producto;
  }

  async verificarStockBajo() {
    const productos = await this.repo.findBajoStock();
    for (const p of productos) {
      eventBus.emit(EVENTOS.STOCK_BAJO, {
        producto:    p.nombre,
        stock_actual: p.stock_actual,
        stock_minimo: p.stock_minimo,
      });
    }
    return productos;
  }
}

module.exports = { InventarioService };
