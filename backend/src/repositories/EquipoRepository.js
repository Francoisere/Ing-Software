const { IRepository } = require('./IRepository');
const { pool } = require('../config/database');

class EquipoRepository extends IRepository {

  async findAll({ estado, zona } = {}) {
    let sql = `SELECT e.*, u.nombre AS admin_nombre FROM EQUIPO e
               LEFT JOIN USUARIO u ON u.id_usuario = e.id_usuario_admin WHERE 1=1`;
    const params = [];

    if (estado) { sql += ' AND e.estado_equipo = ?'; params.push(estado); }
    if (zona)   { sql += ' AND e.zona_equipo = ?';   params.push(zona); }

    sql += ' ORDER BY e.zona_equipo, e.nombre';
    const [rows] = await pool.query(sql, params);
    return rows;
  }

  async findById(id) {
    const [rows] = await pool.query(
      `SELECT e.*, u.nombre AS admin_nombre FROM EQUIPO e
       LEFT JOIN USUARIO u ON u.id_usuario = e.id_usuario_admin
       WHERE e.id_equipo = ?`, [id]
    );
    return rows[0] || null;
  }

  async create(data) {
    const { codigo_unico, nombre, marca, zona_equipo, fecha_adquisicion, manual_pdf, id_usuario_admin } = data;
    const [result] = await pool.query(
      `INSERT INTO EQUIPO (codigo_unico, nombre, marca, zona_equipo, fecha_adquisicion, manual_pdf, id_usuario_admin)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [codigo_unico, nombre, marca, zona_equipo, fecha_adquisicion, manual_pdf, id_usuario_admin]
    );
    return this.findById(result.insertId);
  }

  async update(id, data) {
    const campos = Object.keys(data).map(k => `${k} = ?`).join(', ');
    await pool.query(`UPDATE EQUIPO SET ${campos} WHERE id_equipo = ?`, [...Object.values(data), id]);
    return this.findById(id);
  }

  async delete(id) {
    const [result] = await pool.query('DELETE FROM EQUIPO WHERE id_equipo = ?', [id]);
    return result.affectedRows > 0;
  }

  async updateEstado(id, estado_equipo) {
    await pool.query('UPDATE EQUIPO SET estado_equipo = ? WHERE id_equipo = ?', [estado_equipo, id]);
  }

  async findEquiposConMantenimientoPendiente(diasUmbral = 30) {
    const [rows] = await pool.query(
      `SELECT e.*,
              MAX(m.fecha) AS ultimo_mantenimiento,
              DATEDIFF(CURDATE(), MAX(m.fecha)) AS dias_sin_revision
       FROM EQUIPO e
       LEFT JOIN MANTENIMIENTO m ON m.id_equipo = e.id_equipo AND m.tipo = 'preventivo'
       WHERE e.estado_equipo = 'operativo'
       GROUP BY e.id_equipo
       HAVING ultimo_mantenimiento IS NULL OR dias_sin_revision >= ?
       ORDER BY dias_sin_revision DESC`,
      [diasUmbral]
    );
    return rows;
  }
}

class MantenimientoRepository extends IRepository {

  async findAll({ id_equipo, tipo } = {}) {
    let sql = `SELECT m.*, e.nombre AS nombre_equipo, e.zona_equipo
               FROM MANTENIMIENTO m JOIN EQUIPO e ON e.id_equipo = m.id_equipo WHERE 1=1`;
    const params = [];

    if (id_equipo) { sql += ' AND m.id_equipo = ?'; params.push(id_equipo); }
    if (tipo)      { sql += ' AND m.tipo = ?';       params.push(tipo); }

    sql += ' ORDER BY m.fecha DESC';
    const [rows] = await pool.query(sql, params);
    return rows;
  }

  async findById(id) {
    const [rows] = await pool.query(
      `SELECT m.*, e.nombre AS nombre_equipo FROM MANTENIMIENTO m
       JOIN EQUIPO e ON e.id_equipo = m.id_equipo WHERE m.id_mantenimiento = ?`, [id]
    );
    return rows[0] || null;
  }

  async create({ id_equipo, descripcion, tecnico, pieza_reparada, costo, tipo }) {
    const [result] = await pool.query(
      `INSERT INTO MANTENIMIENTO (id_equipo, descripcion, tecnico, pieza_reparada, costo, tipo)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id_equipo, descripcion, tecnico, pieza_reparada, costo, tipo]
    );
    return this.findById(result.insertId);
  }

  async update(id, data) {
    const campos = Object.keys(data).map(k => `${k} = ?`).join(', ');
    await pool.query(`UPDATE MANTENIMIENTO SET ${campos} WHERE id_mantenimiento = ?`, [...Object.values(data), id]);
    return this.findById(id);
  }

  async delete(id) {
    const [result] = await pool.query('DELETE FROM MANTENIMIENTO WHERE id_mantenimiento = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = { EquipoRepository, MantenimientoRepository };
