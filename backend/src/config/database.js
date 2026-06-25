const mysql = require('mysql2/promise');
require('dotenv').config();

// Singleton implícito: el pool se crea una sola vez al importar el módulo
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '-04:00', // Chile
});

/**
 * Prueba la conexión al iniciar el servidor
 */
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log(' Conexión a MySQL establecida correctamente');
    connection.release();
  } catch (error) {
    console.error(' Error al conectar con MySQL:', error.message);
    process.exit(1);
  }
}

module.exports = { pool, testConnection };
