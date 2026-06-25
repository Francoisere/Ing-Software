/**
 * TEST UNITARIO: Observer / EventBus
 * 
 * Verifica que los eventos se emitan y los suscriptores
 * reaccionen de forma independiente.
 */
const { eventBus, EVENTOS } = require('../../src/patterns/observer/EventBus');

describe('GymFlowEventBus - Observer Pattern', () => {

  afterEach(() => {
    // Limpiar suscriptores entre tests
    eventBus.removeAllListeners();
  });

  test('STOCK_BAJO notifica a todos los suscriptores', (done) => {
    let contador = 0;

    const payload = { producto: 'Proteína', stock_actual: 2, stock_minimo: 5 };

    eventBus.on(EVENTOS.STOCK_BAJO, (data) => {
      expect(data.producto).toBe('Proteína');
      contador++;
    });
    eventBus.on(EVENTOS.STOCK_BAJO, (data) => {
      expect(data.stock_actual).toBe(2);
      contador++;
      if (contador === 2) done();
    });

    eventBus.emit(EVENTOS.STOCK_BAJO, payload);
  });

  test('MEMBRESIA_POR_VENCER llega con días restantes', (done) => {
    eventBus.on(EVENTOS.MEMBRESIA_POR_VENCER, ({ diasRestantes }) => {
      expect(diasRestantes).toBe(3);
      done();
    });
    eventBus.emit(EVENTOS.MEMBRESIA_POR_VENCER, {
      socio: 'Juan Pérez', correo: 'juan@test.com', diasRestantes: 3, fechaVencimiento: '2024-06-10',
    });
  });

  test('suscriptores de distintos eventos no se mezclan', () => {
    const escuchado = { stock: false, membresia: false };

    eventBus.on(EVENTOS.STOCK_BAJO,           () => { escuchado.stock     = true; });
    eventBus.on(EVENTOS.MEMBRESIA_POR_VENCER, () => { escuchado.membresia = true; });

    eventBus.emit(EVENTOS.STOCK_BAJO, {});
    expect(escuchado.stock).toBe(true);
    expect(escuchado.membresia).toBe(false);
  });

  test('emitir sin suscriptores no lanza error', () => {
    expect(() => eventBus.emit(EVENTOS.VENTA_COMPLETADA, {})).not.toThrow();
  });
});
