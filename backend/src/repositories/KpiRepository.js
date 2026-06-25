/**
 * KpiRepository - Aplica DIP directamente
 * KpiService recibe cualquier implementación de este contrato.
 * En tests se inyecta MockKpiRepository.
 */
class IKpiRepository {
  async getTotalSocios()         { throw new Error('No implementado'); }
  async getTotalIngresosMes()    { throw new Error('No implementado'); }
  async getMembresiasPorEstado() { throw new Error('No implementado'); }
  async getVentasPorDia(dias)    { throw new Error('No implementado'); }
  async getProductosMasVendidos(limit) { throw new Error('No implementado'); }
  async getResumenEquipos()      { throw new Error('No implementado'); }
}

const { pool } = require('../config/database');

class MySqlKpiRepository extends IKpiRepository {

  async getTotalSocios() {
    const [rows] = await pool.query(
      `SELECT
         COUNT(*) AS total,
         SUM(estado = 'activo') AS activos,
         SUM(estado = 'moroso') AS morosos,
         SUM(estado = 'inactivo') AS inactivos
       FROM SOCIO`
    );
    return rows[0];
  }

  async getTotalIngresosMes() {
    const [rows] = await pool.query(
      `SELECT
         COALESCE(SUM(total),0) AS ingresos_mes,
         COUNT(*) AS ventas_mes
       FROM VENTA
       WHERE MONTH(fecha) = MONTH(CURDATE()) AND YEAR(fecha) = YEAR(CURDATE())`
    );
    return rows[0];
  }

  async getMembresiasPorEstado() {
    const [rows] = await pool.query(
      `SELECT estado_membresia, COUNT(*) AS cantidad, SUM(precio) AS total_precio
       FROM MEMBRESIA GROUP BY estado_membresia`
    );
    return rows;
  }

  async getVentasPorDia(dias = 30) {
    const [rows] = await pool.query(
      `SELECT DATE(fecha) AS dia, COUNT(*) AS ventas, SUM(total) AS ingresos
       FROM VENTA
       WHERE fecha >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY dia ORDER BY dia ASC`,
      [dias]
    );
    return rows;
  }

  async getProductosMasVendidos(limit = 5) {
    const [rows] = await pool.query(
      `SELECT p.nombre, p.categoria, SUM(dv.cantidad) AS total_vendido, SUM(dv.subtotal) AS ingresos
       FROM DETALLE_VENTA dv JOIN PRODUCTO p ON p.id_producto = dv.id_producto
       GROUP BY dv.id_producto ORDER BY total_vendido DESC LIMIT ?`,
      [limit]
    );
    return rows;
  }

  async getResumenEquipos() {
    const [rows] = await pool.query(
      `SELECT estado_equipo, COUNT(*) AS cantidad FROM EQUIPO GROUP BY estado_equipo`
    );
    return rows;
  }
}

module.exports = { IKpiRepository, MySqlKpiRepository };
