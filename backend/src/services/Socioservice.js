const { SocioRepository } = require('../repositories/SocioRepository');
const { eventBus, EVENTOS } = require('../patterns/observer/EventBus');
 
class SocioService {
  // DIP: recibe el repo como dependencia (permite Mock en tests)
  constructor(socioRepository = new SocioRepository()) {
    this.repo = socioRepository;
  }
 
  async listar(filtros) {
    return this.repo.findAll(filtros);
  }
 
  async obtenerPorId(id) {
    const socio = await this.repo.findById(id);
    if (!socio) throw new Error(`Socio con id ${id} no encontrado`);
    return socio;
  }
 
  async crear(data) {
    const existe = await this.repo.findByRut(data.rut);
    if (existe) throw new Error(`Ya existe un socio con RUT ${data.rut}`);
    return this.repo.create(data);
  }
 
  async actualizar(id, data) {
    await this.obtenerPorId(id); // valida existencia
    return this.repo.update(id, data);
  }
 
  async eliminar(id) {
    await this.obtenerPorId(id);
    return this.repo.delete(id);
  }
 
  /**
   * Job programado: verifica membresías por vencer y emite eventos Observer
   */
  async verificarMembresiasPorVencer(diasAlerta = 7) {
    const porVencer = await this.repo.findConMembresiaPorVencer(diasAlerta);
 
    for (const s of porVencer) {
      eventBus.emit(EVENTOS.MEMBRESIA_POR_VENCER, {
        socio: s.nombre,
        correo: s.correo,
        diasRestantes: s.dias_restantes,
        fechaVencimiento: s.fecha_vencimiento,
      });
    }
 
    return porVencer.length;
  }
}
 
module.exports = { SocioService };