const { EquipoRepository, MantenimientoRepository } = require('../repositories/EquipoRepository');
const { eventBus, EVENTOS } = require('../patterns/observer/EventBus');

class EquipoService {
  constructor(
    equipoRepository       = new EquipoRepository(),
    mantenimientoRepository = new MantenimientoRepository()
  ) {
    this.repo       = equipoRepository;
    this.mantRepo   = mantenimientoRepository;
  }

  async listar(filtros)  { return this.repo.findAll(filtros); }

  async obtenerPorId(id) {
    const e = await this.repo.findById(id);
    if (!e) throw new Error(`Equipo ${id} no encontrado`);
    return e;
  }

  async crear(data)         { return this.repo.create(data); }
  async actualizar(id, data){ await this.obtenerPorId(id); return this.repo.update(id, data); }
  async eliminar(id)        { await this.obtenerPorId(id); return this.repo.delete(id); }

  async cambiarEstado(id, estado_equipo) {
    await this.obtenerPorId(id);
    await this.repo.updateEstado(id, estado_equipo);
    return this.repo.findById(id);
  }

  // ── Mantenimiento ─────────────────────────────────────────
  async listarMantenimientos(filtros) { return this.mantRepo.findAll(filtros); }

  async registrarMantenimiento(data) {
    const equipo = await this.obtenerPorId(data.id_equipo);
    const mant   = await this.mantRepo.create(data);

    // Si era correctivo, el equipo vuelve a operativo
    if (data.tipo === 'correctivo') {
      await this.repo.updateEstado(data.id_equipo, 'operativo');
    }

    return { mantenimiento: mant, equipo };
  }

  /**
   * Job programado: detecta equipos sin mantenimiento preventivo reciente
   * y emite evento Observer
   */
  async verificarMantenimientosPendientes(diasUmbral = 30) {
    const pendientes = await this.repo.findEquiposConMantenimientoPendiente(diasUmbral);

    for (const e of pendientes) {
      eventBus.emit(EVENTOS.MANTENIMIENTO_PENDIENTE, {
        equipo:          e.nombre,
        zona:            e.zona_equipo,
        diasSinRevision: e.dias_sin_revision ?? 'N/A (nunca revisado)',
      });
    }

    return pendientes.length;
  }
}

module.exports = { EquipoService };
