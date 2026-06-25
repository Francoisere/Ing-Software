/**
 * PATRÓN FACTORY METHOD (GoF - Creacional)
 * 
 * Gestiona la creación de los distintos planes de membresía sin
 * hardcodear if/else en el GestorFacade o el controlador.
 * Agregar un plan nuevo (ej. PlanEstudiante) solo requiere crear
 * una nueva clase y registrarla en MembresiaFactory.
 */

// ── Clase base (Producto abstracto) ──────────────────────────
class PlanMembresia {
  constructor() {
    if (new.target === PlanMembresia) {
      throw new Error('PlanMembresia es una clase abstracta');
    }
  }

  /** @returns {{ tipo: string, duracionDias: number, precio: number, beneficios: string[] }} */
  obtenerDetalles() {
    throw new Error('Debe implementar obtenerDetalles()');
  }

  /**
   * Calcula la fecha de vencimiento a partir de hoy
   * @param {Date} fechaInicio
   * @returns {Date}
   */
  calcularVencimiento(fechaInicio = new Date()) {
    const detalles = this.obtenerDetalles();
    const vencimiento = new Date(fechaInicio);
    vencimiento.setDate(vencimiento.getDate() + detalles.duracionDias);
    return vencimiento;
  }
}

// ── Productos Concretos ───────────────────────────────────────

class PlanMensual extends PlanMembresia {
  obtenerDetalles() {
    return {
      tipo: 'mensual',
      duracionDias: 30,
      precio: 25000,
      beneficios: ['Acceso sala de pesas', 'Acceso cardio', 'Vestuarios'],
    };
  }
}

class PlanSemestral extends PlanMembresia {
  obtenerDetalles() {
    return {
      tipo: 'semestral',
      duracionDias: 180,
      precio: 120000,
      beneficios: ['Acceso sala de pesas', 'Acceso cardio', 'Vestuarios', 'Clases grupales', '10% descuento tienda'],
    };
  }
}

class PlanAnual extends PlanMembresia {
  obtenerDetalles() {
    return {
      tipo: 'anual',
      duracionDias: 365,
      precio: 200000,
      beneficios: [
        'Acceso sala de pesas', 'Acceso cardio', 'Vestuarios',
        'Clases grupales ilimitadas', '20% descuento tienda',
        'Evaluación física semestral',
      ],
    };
  }
}

// Fácil de agregar sin tocar nada existente ↓
class PlanEstudiante extends PlanMembresia {
  obtenerDetalles() {
    return {
      tipo: 'estudiante',
      duracionDias: 30,
      precio: 15000,
      beneficios: ['Acceso sala de pesas', 'Acceso cardio', 'Vestuarios', 'Requiere credencial vigente'],
    };
  }
}

// ── Factory (Creador) ─────────────────────────────────────────
class MembresiaFactory {
  static _planes = {
    mensual:    PlanMensual,
    semestral:  PlanSemestral,
    anual:      PlanAnual,
    estudiante: PlanEstudiante,
  };

  /**
   * Crea y retorna el plan de membresía correspondiente al tipo
   * @param {string} tipo
   * @returns {PlanMembresia}
   */
  static crear(tipo) {
    const Plan = this._planes[tipo?.toLowerCase()];
    if (!Plan) {
      const disponibles = Object.keys(this._planes).join(', ');
      throw new Error(`Tipo de membresía inválido: "${tipo}". Opciones: ${disponibles}`);
    }
    return new Plan();
  }

  /** Retorna todos los planes disponibles con sus detalles */
  static listarPlanes() {
    return Object.entries(this._planes).map(([, Plan]) => new Plan().obtenerDetalles());
  }
}

module.exports = { MembresiaFactory, PlanMembresia };
