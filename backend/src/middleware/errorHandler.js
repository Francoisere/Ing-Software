/**
 * Middleware global de manejo de errores (SRP)
 * Centraliza el formato de respuesta de error para toda la API
 */
function errorHandler(err, req, res, next) {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);

  // Errores de negocio controlados
  if (err.message.includes('no encontrado') || err.message.includes('no existe')) {
    return res.status(404).json({ error: err.message });
  }
  if (err.message.includes('ya existe') || err.message.includes('inválido') || err.message.includes('insuficiente')) {
    return res.status(400).json({ error: err.message });
  }
  if (err.message.includes('Credenciales')) {
    return res.status(401).json({ error: err.message });
  }

  // Error genérico
  res.status(500).json({ error: 'Error interno del servidor' });
}

module.exports = { errorHandler };
