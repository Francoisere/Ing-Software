const { IRepository } = require('./IRepository');
const { pool } = require('../config/database');

class UsuarioRepository extends IRepository {

  async findAll() {
    const [rows] = await pool.query(
      'SELECT id_usuario, rut, correo, nombre, rol, activo, created_at FROM USUARIO ORDER BY nombre'
    );
    return rows;
  }

  async findById(id) {
    const [rows] = await pool.query(
      'SELECT id_usuario, rut, correo, nombre, rol, activo, created_at FROM USUARIO WHERE id_usuario = ?', [id]
    );
    return rows[0] || null;
  }

  async findByCorreo(correo) {
    // Incluye contrasena solo para autenticación
    const [rows] = await pool.query('SELECT * FROM USUARIO WHERE correo = ?', [correo]);
    return rows[0] || null;
  }

  async create({ rut, correo, contrasena, nombre, rol }) {
    const [result] = await pool.query(
      'INSERT INTO USUARIO (rut, correo, contrasena, nombre, rol) VALUES (?, ?, ?, ?, ?)',
      [rut, correo, contrasena, nombre, rol || 'recepcionista']
    );
    return this.findById(result.insertId);
  }

  async update(id, data) {
    const campos = Object.keys(data).map(k => `${k} = ?`).join(', ');
    await pool.query(`UPDATE USUARIO SET ${campos} WHERE id_usuario = ?`, [...Object.values(data), id]);
    return this.findById(id);
  }

  async delete(id) {
    await pool.query('UPDATE USUARIO SET activo = 0 WHERE id_usuario = ?', [id]);
    return true;
  }
}

module.exports = { UsuarioRepository };
