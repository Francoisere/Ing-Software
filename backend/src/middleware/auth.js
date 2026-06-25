const jwt = require('jsonwebtoken');

/**
 * Middleware de autenticación JWT
 * Verifica el token en el header Authorization: Bearer <token>
 */
function authMiddleware(req, res, next) {
  const header = req.headers['authorization'];
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = decoded; // { id, rol, nombre }
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

/**
 * Middleware de autorización por rol
 * @param {...string} roles - roles permitidos
 */
function soloRol(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.usuario?.rol)) {
      return res.status(403).json({ error: 'Acceso denegado: permisos insuficientes' });
    }
    next();
  };
}

module.exports = { authMiddleware, soloRol };
