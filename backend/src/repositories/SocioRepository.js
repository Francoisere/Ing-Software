const { IRepository } = require('./IRepository');
const { pool } = require('../config/database');

class SocioRepository extends IRepository {

  async findAll({ estado, search } = {}) {
    let sql = 'SELECT * FROM SOCIO WHERE 1=1';
    const params = [];

    if (estado) {
      sql += ' AND estado = ?';
      params.push(estado);
    }
    if (search) {
      sql += ' AND (nombre LIKE ? OR rut LIKE ? OR correo LIKE ?)';
      const like = `%${search}%`;
      params.push(like, like, like);
    }

    sql += ' ORDER BY nombre ASC';
    const [rows] = await pool.query(sql, params);
    return rows;
  }

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM SOCIO WHERE id_socio = ?', [id]);
    return rows[0] || null;
  }

  async findByRut(rut) {
    const [rows] = await pool.query('SELECT * FROM SOCIO WHERE rut = ?', [rut]);
    return rows[0] || null;
  }

  async create({ rut, nombre, correo, telefono, foto_perfil, contacto_emergencia }) {
    const [result] = await pool.query(
      `INSERT INTO SOCIO (rut, nombre, correo, telefono, foto_perfil, contacto_emergencia)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [rut, nombre, correo, telefono, foto_perfil, contacto_emergencia]
    );
    return this.findById(result.insertId);
  }

  async update(id, data) {
    const campos = Object.keys(data).map(k => `${k} = ?`).join(', ');
    const valores = [...Object.values(data), id];
    await pool.query(`UPDATE SOCIO SET ${campos} WHERE id_socio = ?`, valores);
    return this.findById(id);
  }

  async delete(id) {
    const [result] = await pool.query('DELETE FROM SOCIO WHERE id_socio = ?', [id]);
    return result.affectedRows > 0;
  }

  async findConMembresiaPorVencer(diasAlerta = 7) {
    const [rows] = await pool.query(
      `SELECT s.id_socio, s.nombre, s.correo, m.fecha_vencimiento,
              DATEDIFF(m.fecha_vencimiento, CURDATE()) AS dias_restantes
       FROM SOCIO s
       JOIN MEMBRESIA m ON m.id_socio = s.id_socio
       WHERE m.estado_membresia = 'vigente'
         AND DATEDIFF(m.fecha_vencimiento, CURDATE()) BETWEEN 0 AND ?
       ORDER BY dias_restantes ASC`,
      [diasAlerta]
    );
    return rows;
  }

  async updateEstado(id, estado) {
    await pool.query('UPDATE SOCIO SET estado = ? WHERE id_socio = ?', [estado, id]);
  }
}

module.exports = { SocioRepository };
