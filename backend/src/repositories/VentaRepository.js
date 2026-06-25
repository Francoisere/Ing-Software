const { IRepository } = require('./IRepository');
const { pool } = require('../config/database');

class VentaRepository extends IRepository {

  async findAll({ fechaDesde, fechaHasta, id_usuario } = {}) {
    let sql = `SELECT v.*, u.nombre AS cajero,
                      COALESCE(s.nombre, 'Público general') AS cliente
               FROM VENTA v
               JOIN USUARIO u ON u.id_usuario = v.id_usuario
               LEFT JOIN SOCIO s ON s.id_socio = v.id_socio
               WHERE 1=1`;
    const params = [];

    if (fechaDesde)  { sql += ' AND DATE(v.fecha) >= ?'; params.push(fechaDesde); }
    if (fechaHasta)  { sql += ' AND DATE(v.fecha) <= ?'; params.push(fechaHasta); }
    if (id_usuario)  { sql += ' AND v.id_usuario = ?';   params.push(id_usuario); }

    sql += ' ORDER BY v.fecha DESC';
    const [rows] = await pool.query(sql, params);
    return rows;
  }

  async findById(id) {
    const [[venta], detalles] = await Promise.all([
      pool.query(
        `SELECT v.*, u.nombre AS cajero, COALESCE(s.nombre,'Público') AS cliente
         FROM VENTA v
         JOIN USUARIO u ON u.id_usuario = v.id_usuario
         LEFT JOIN SOCIO s ON s.id_socio = v.id_socio
         WHERE v.id_venta = ?`, [id]
      ),
      pool.query(
        `SELECT dv.*, p.nombre AS producto, p.codigo_barra
         FROM DETALLE_VENTA dv JOIN PRODUCTO p ON p.id_producto = dv.id_producto
         WHERE dv.id_venta = ?`, [id]
      ),
    ]);
    if (!venta[0]) return null;
    return { ...venta[0], detalles: detalles[0] };
  }

  async create({ id_usuario, id_socio, total, metodo_pago, comprobante }, connection) {
    const db = connection || pool;
    const [result] = await db.query(
      `INSERT INTO VENTA (id_usuario, id_socio, total, metodo_pago, comprobante)
       VALUES (?, ?, ?, ?, ?)`,
      [id_usuario, id_socio || null, total, metodo_pago, comprobante || null]
    );
    return result.insertId;
  }

  async createDetalle({ id_venta, id_producto, cantidad, precio_unitario, subtotal }, connection) {
    const db = connection || pool;
    await db.query(
      `INSERT INTO DETALLE_VENTA (id_venta, id_producto, cantidad, precio_unitario, subtotal)
       VALUES (?, ?, ?, ?, ?)`,
      [id_venta, id_producto, cantidad, precio_unitario, subtotal]
    );
  }

  async getResumenDiario() {
    const [rows] = await pool.query(
      `SELECT DATE(fecha) AS dia, COUNT(*) AS total_ventas, SUM(total) AS ingresos
       FROM VENTA WHERE DATE(fecha) = CURDATE() GROUP BY dia`
    );
    return rows[0] || { dia: new Date(), total_ventas: 0, ingresos: 0 };
  }

  async getIngresosMensuales() {
    const [rows] = await pool.query(
      `SELECT MONTH(fecha) AS mes, YEAR(fecha) AS anio,
              COUNT(*) AS total_ventas, SUM(total) AS ingresos
       FROM VENTA
       WHERE fecha >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
       GROUP BY anio, mes ORDER BY anio, mes`
    );
    return rows;
  }
}

module.exports = { VentaRepository };
