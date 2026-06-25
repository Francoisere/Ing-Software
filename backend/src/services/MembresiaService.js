const { MembresiaRepository } = require('../repositories/MembresiaRepository');
const { SocioRepository } = require('../repositories/SocioRepository');
const { MembresiaFactory } = require('../patterns/factory/MembresiaFactory');
const { eventBus, EVENTOS } = require('../patterns/observer/EventBus');

class MembresiaService {
  constructor(
    membresiaRepository = new MembresiaRepository(),
    socioRepository     = new SocioRepository()
  ) {
    this.repo      = membresiaRepository;
    this.socioRepo = socioRepository;
  }

  async listar(filtros) {
    return this.repo.findAll(filtros);
  }

  async obtenerPorId(id) {
    const m = await this.repo.findById(id);
    if (!m) throw new Error(`Membresía ${id} no encontrada`);
    return m;
  }

  /**
   * Crea una membresía usando Factory Method para determinar precio y duración
   */
  async crear({ id_socio, tipo_membresia, fecha_inicio }) {
    // Verifica que el socio exista
    const socio = await this.socioRepo.findById(id_socio);
    if (!socio) throw new Error(`Socio ${id_socio} no encontrado`);

    // Factory Method: construye el plan sin if/else
    const plan = MembresiaFactory.crear(tipo_membresia);
    const detalles = plan.obtenerDetalles();
    const inicio = fecha_inicio ? new Date(fecha_inicio) : new Date();
    const vencimiento = plan.calcularVencimiento(inicio);

    const membresia = await this.repo.create({
      id_socio,
      tipo_membresia: detalles.tipo,
      fecha_inicio: inicio.toISOString().split('T')[0],
      fecha_vencimiento: vencimiento.toISOString().split('T')[0],
      precio: detalles.precio,
    });

    // Actualizar estado del socio a activo
    await this.socioRepo.updateEstado(id_socio, 'activo');

    return { ...membresia, detalles_plan: detalles };
  }

  async registrarPago({ id_membresia, metodo_pago, comprobante }) {
    const membresia = await this.obtenerPorId(id_membresia);
    const id_pago = await this.repo.registrarPago({
      id_membresia,
      monto: membresia.precio,
      metodo_pago,
      comprobante,
    });
    return { id_pago, monto: membresia.precio };
  }

  async cancelar(id) {
    return this.repo.update(id, { estado_membresia: 'cancelada' });
  }

  /**
   * Job programado: marca membresías vencidas y emite evento Observer
   */
  async procesarVencidas() {
    const vencidas = await this.repo.findVencidas();
    const actualizadas = await this.repo.marcarVencidas();

    for (const m of vencidas) {
      await this.socioRepo.updateEstado(m.id_socio, 'moroso');
      eventBus.emit(EVENTOS.MEMBRESIA_VENCIDA, {
        id_socio: m.id_socio,
        socio:    m.nombre,
        correo:   m.correo,
      });
    }

    return { procesadas: actualizadas };
  }

  listarPlanes() {
    return MembresiaFactory.listarPlanes();
  }
}

module.exports = { MembresiaService };
