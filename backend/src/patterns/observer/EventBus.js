const { EventEmitter } = require('events');

/**
 * PATRÓN OBSERVER (GoF - Comportamiento)
 * 
 * GymFlowEventBus es el sujeto (Subject) central del sistema.
 * Emite eventos de dominio que los suscriptores escuchan de forma
 * independiente sin que el emisor conozca quién reacciona.
 * 
 * Eventos del sistema:
 *  - STOCK_BAJO        → se emite cuando stock_actual <= stock_minimo
 *  - MEMBRESIA_POR_VENCER → se emite cuando faltan ≤ 7 días para vencer
 *  - MEMBRESIA_VENCIDA → se emite al detectar membresías vencidas
 *  - MANTENIMIENTO_PENDIENTE → se emite cuando un equipo necesita revisión
 */
class GymFlowEventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(20); // soporta múltiples módulos suscritos
  }
}

// Instancia única compartida (Singleton implícito a través del módulo)
const eventBus = new GymFlowEventBus();

const EVENTOS = {
  STOCK_BAJO:               'stock:bajo',
  MEMBRESIA_POR_VENCER:     'membresia:por_vencer',
  MEMBRESIA_VENCIDA:        'membresia:vencida',
  MANTENIMIENTO_PENDIENTE:  'mantenimiento:pendiente',
  VENTA_COMPLETADA:         'venta:completada',
};

module.exports = { eventBus, EVENTOS };
