const { MySqlKpiRepository } = require('../repositories/KpiRepository');

/**
 * KpiService aplica DIP directamente:
 * Recibe cualquier implementación de IKpiRepository.
 * En producción → MySqlKpiRepository
 * En tests → MockKpiRepository (sin BD real)
 */
class KpiService {
  constructor(kpiRepository = new MySqlKpiRepository()) {
    this.repo = kpiRepository;
  }

  async getDashboard() {
    const [socios, ingresos, membresias, equipos, topProductos, ventasDiarias] = await Promise.all([
      this.repo.getTotalSocios(),
      this.repo.getTotalIngresosMes(),
      this.repo.getMembresiasPorEstado(),
      this.repo.getResumenEquipos(),
      this.repo.getProductosMasVendidos(5),
      this.repo.getVentasPorDia(30),
    ]);

    return {
      kpi_socios: socios,
      kpi_ingresos: ingresos,
      kpi_membresias: membresias,
      kpi_equipos: equipos,
      top_productos: topProductos,
      ventas_diarias: ventasDiarias,
    };
  }

  async getKpiSocios()   { return this.repo.getTotalSocios(); }
  async getKpiIngresos() { return this.repo.getTotalIngresosMes(); }
  async getKpiEquipos()  { return this.repo.getResumenEquipos(); }
  async getVentasPorDia(dias = 30) { return this.repo.getVentasPorDia(dias); }
}

module.exports = { KpiService };
