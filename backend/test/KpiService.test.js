/**
 * TEST UNITARIO: KpiService
 * 
 * Demuestra DIP en acción: KpiService se testea sin base de datos real.
 * Se inyecta MockKpiRepository que implementa el mismo contrato que MySqlKpiRepository.
 */
const { KpiService } = require('../../src/services/KpiService');
const { IKpiRepository } = require('../../src/repositories/KpiRepository');

// ── Mock Repository (sin BD real) ────────────────────────────
class MockKpiRepository extends IKpiRepository {
  async getTotalSocios() {
    return { total: 100, activos: 80, morosos: 15, inactivos: 5 };
  }
  async getTotalIngresosMes() {
    return { ingresos_mes: 1250000, ventas_mes: 42 };
  }
  async getMembresiasPorEstado() {
    return [
      { estado_membresia: 'vigente',  cantidad: 80, total_precio: 2000000 },
      { estado_membresia: 'vencida',  cantidad: 15, total_precio:  375000 },
      { estado_membresia: 'cancelada',cantidad: 5,  total_precio:  125000 },
    ];
  }
  async getVentasPorDia() {
    return [
      { dia: '2024-06-01', ventas: 5, ingresos: 75000 },
      { dia: '2024-06-02', ventas: 8, ingresos: 120000 },
    ];
  }
  async getProductosMasVendidos() {
    return [
      { nombre: 'Proteína Whey 1kg', categoria: 'suplementos', total_vendido: 30, ingresos: 1350000 },
    ];
  }
  async getResumenEquipos() {
    return [
      { estado_equipo: 'operativo',       cantidad: 20 },
      { estado_equipo: 'en_mantenimiento',cantidad: 2  },
    ];
  }
}

// ── Tests ─────────────────────────────────────────────────────
describe('KpiService (con MockRepository - sin BD)', () => {
  let service;

  beforeEach(() => {
    // DIP: inyectamos el Mock en lugar de MySqlKpiRepository
    service = new KpiService(new MockKpiRepository());
  });

  test('getDashboard retorna estructura completa', async () => {
    const dashboard = await service.getDashboard();

    expect(dashboard).toHaveProperty('kpi_socios');
    expect(dashboard).toHaveProperty('kpi_ingresos');
    expect(dashboard).toHaveProperty('kpi_membresias');
    expect(dashboard).toHaveProperty('kpi_equipos');
    expect(dashboard).toHaveProperty('top_productos');
    expect(dashboard).toHaveProperty('ventas_diarias');
  });

  test('kpi_socios tiene los campos correctos', async () => {
    const { kpi_socios } = await service.getDashboard();
    expect(kpi_socios.total).toBe(100);
    expect(kpi_socios.activos).toBe(80);
    expect(kpi_socios.morosos).toBe(15);
  });

  test('kpi_ingresos retorna valores del mes', async () => {
    const resultado = await service.getKpiIngresos();
    expect(resultado.ingresos_mes).toBe(1250000);
    expect(resultado.ventas_mes).toBe(42);
  });

  test('kpi_equipos refleja estado de la sala', async () => {
    const equipos = await service.getKpiEquipos();
    const operativos = equipos.find(e => e.estado_equipo === 'operativo');
    expect(operativos.cantidad).toBe(20);
  });
});
