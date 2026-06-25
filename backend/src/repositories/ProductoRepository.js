const { IRepository } = require('./IRepository');
const { pool } = require('../config/database');

class ProductoRepository extends IRepository {

  async findAll({ categoria, activo, search } = {}) {
    let sql = 'SELECT * FROM PRODUCTO WHERE 1=1';
    const params = [];

    if (activo !== undefined) { sql += ' AND activo = ?';       params.push(activo); }
    if (categoria)            { sql += ' AND categoria = ?';    params.push(categoria); }
    if (search) {
      sql += ' AND (nombre LIKE ? OR codigo_barra LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    sql += ' ORDER BY nombre ASC';

    const [rows] = await pool.query(sql, params);
    return rows;
  }

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM PRODUCTO WHERE id_producto = ?', [id]);
    return rows[0] || null;
  }

  async findByCodigoBarra(codigo) {
    const [rows] = await pool.query('SELECT * FROM PRODUCTO WHERE codigo_barra = ?', [codigo]);
    return rows[0] || null;
  }

  async create(data) {
    const { codigo_barra, nombre, categoria, precio_venta, precio_compra, stock_actual, stock_minimo } = data;
    const [result] = await pool.query(
      `INSERT INTO PRODUCTO (codigo_barra, nombre, categoria, precio_venta, precio_compra, stock_actual, stock_minimo)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [codigo_barra, nombre, categoria, precio_venta, precio_compra, stock_actual ?? 0, stock_minimo ?? 5]
    );
    return this.findById(result.insertId);
  }

  async update(id, data) {
    const campos = Object.keys(data).map(k => `${k} = ?`).join(', ');
    await pool.query(`UPDATE PRODUCTO SET ${campos} WHERE id_producto = ?`, [...Object.values(data), id]);
    return this.findById(id);
  }

  async delete(id) {
    await pool.query('UPDATE PRODUCTO SET activo = 0 WHERE id_producto = ?', [id]);
    return true;
  }

  async descontarStock(id_producto, cantidad) {
    const [result] = await pool.query(
      'UPDATE PRODUCTO SET stock_actual = stock_actual - ? WHERE id_producto = ? AND stock_actual >= ?',
      [cantidad, id_producto, cantidad]
    );
    if (result.affectedRows === 0) throw new Error('Stock insuficiente');
    return this.findById(id_producto);
  }

  async findBajoStock() {
    const [rows] = await pool.query(
      'SELECT * FROM PRODUCTO WHERE stock_actual <= stock_minimo AND activo = 1'
    );
    return rows;
  }

  async getCategorias() {
    const [rows] = await pool.query(
      'SELECT DISTINCT categoria FROM PRODUCTO WHERE activo = 1 ORDER BY categoria'
    );
    return rows.map(r => r.categoria);
  }
}

module.exports = { ProductoRepository };
