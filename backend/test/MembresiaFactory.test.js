/**
 * TEST UNITARIO: MembresiaFactory (Factory Method)
 * 
 * Verifica que cada plan se construya correctamente
 * sin tocar ningún servicio ni base de datos.
 */
const { MembresiaFactory } = require('../../src/patterns/factory/MembresiaFactory');

describe('MembresiaFactory - Factory Method', () => {

  describe('crear()', () => {
    test('crea plan mensual con precio y duración correctos', () => {
      const plan = MembresiaFactory.crear('mensual');
      const d = plan.obtenerDetalles();
      expect(d.tipo).toBe('mensual');
      expect(d.duracionDias).toBe(30);
      expect(d.precio).toBe(25000);
      expect(d.beneficios.length).toBeGreaterThan(0);
    });

    test('crea plan semestral con 180 días', () => {
      const plan = MembresiaFactory.crear('semestral');
      expect(plan.obtenerDetalles().duracionDias).toBe(180);
    });

    test('crea plan anual con mayor precio que mensual', () => {
      const mensual = MembresiaFactory.crear('mensual').obtenerDetalles();
      const anual   = MembresiaFactory.crear('anual').obtenerDetalles();
      expect(anual.precio).toBeGreaterThan(mensual.precio);
    });

    test('crea plan estudiante', () => {
      const plan = MembresiaFactory.crear('estudiante');
      expect(plan.obtenerDetalles().tipo).toBe('estudiante');
    });

    test('lanza error para tipo desconocido', () => {
      expect(() => MembresiaFactory.crear('vitalicio')).toThrow('Tipo de membresía inválido');
    });

    test('es case-insensitive', () => {
      expect(() => MembresiaFactory.crear('MENSUAL')).not.toThrow();
    });
  });

  describe('calcularVencimiento()', () => {
    test('plan mensual suma 30 días a fecha de inicio', () => {
      const plan = MembresiaFactory.crear('mensual');
      const inicio = new Date('2024-01-01');
      const venc   = plan.calcularVencimiento(inicio);
      expect(venc.toISOString().split('T')[0]).toBe('2024-01-31');
    });
  });

  describe('listarPlanes()', () => {
    test('lista todos los planes disponibles', () => {
      const planes = MembresiaFactory.listarPlanes();
      expect(planes.length).toBeGreaterThanOrEqual(4);
      const tipos = planes.map(p => p.tipo);
      expect(tipos).toContain('mensual');
      expect(tipos).toContain('semestral');
      expect(tipos).toContain('anual');
    });
  });
});
