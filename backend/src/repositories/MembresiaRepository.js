const { IRepository } = require('./IRepository');
const { pool } = require('../config/database');

class MembresiaRepository extends IRepository {

  async findAll({ estado, id_socio } = {}) {
    let sql = `SELECT m.*, s.nombre AS nombre_socio, s.rut AS rut_socio
               FROM MEMBRESIA m JOIN SOCIO s ON s.id_socio = m.id_socio WHERE 1=1`;
    const params = [];

    if (estado)    { sql += ' AND m.estado_membresia = ?'; params.push(estado); }
    if (id_socio)  { sql += ' AND m.id_socio = ?';        params.push(id_socio); }

    sql += ' ORDER BY m.fecha_inicio DESC';
    const [rows] = await pool.query(sql, params);
    return rows;
  }

  async findById(id) {
    const [rows] = await pool.query(
      `SELECT m.*, s.nombre AS nombre_socio FROM MEMBRESIA m
       JOIN SOCIO s ON s.id_socio = m.id_socio WHERE m.id_membresia = ?`,
      [id]
    );
    return rows[0] || null;
  }

  async create({ id_socio, tipo_membresia, fecha_inicio, fecha_vencimiento, precio }) {
    const [result] = await pool.query(
      `INSERT INTO MEMBRESIA (id_socio, tipo_membresia, fecha_inicio, fecha_vencimiento, precio)
       VALUES (?, ?, ?, ?, ?)`,
      [id_socio, tipo_membresia, fecha_inicio, fecha_vencimiento, precio]
    );
    return this.findById(result.insertId);
  }

  async update(id, data) {
    const campos = Object.keys(data).map(k => `${k} = ?`).join(', ');
    const valores = [...Object.values(data), id];
    await pool.query(`UPDATE MEMBRESIA SET ${campos} WHERE id_membresia = ?`, valores);
    return this.findById(id);
  }

  async delete(id) {
    const [result] = await pool.query('DELETE FROM MEMBRESIA WHERE id_membresia = ?', [id]);
    return result.affectedRows > 0;
  }

  async registrarPago({ id_membresia, monto, metodo_pago, comprobante }) {
    const [result] = await pool.query(
      `INSERT INTO PAGO (id_membresia, monto, metodo_pago, comprobante) VALUES (?, ?, ?, ?)`,
      [id_membresia, monto, metodo_pago, comprobante]
    );
    return result.insertId;
  }

  async findVencidas() {
    const [rows] = await pool.query(
      `SELECT m.*, s.nombre, s.correo, s.id_socio
       FROM MEMBRESIA m JOIN SOCIO s ON s.id_socio = m.id_socio
       WHERE m.estado_membresia = 'vigente' AND m.fecha_vencimiento < CURDATE()`
    );
    return rows;
  }

  async marcarVencidas() {
    const [result] = await pool.query(
      `UPDATE MEMBRESIA SET estado_membresia = 'vencida'
       WHERE estado_membresia = 'vigente' AND fecha_vencimiento < CURDATE()`
    );
    return result.affectedRows;
  }
}

module.exports = { MembresiaRepository };
