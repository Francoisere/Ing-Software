const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { UsuarioRepository } = require('../repositories/UsuarioRepository');

const usuarioRepo = new UsuarioRepository();

class AuthService {

  async login(correo, contrasena) {
    const usuario = await usuarioRepo.findByCorreo(correo);
    if (!usuario || !usuario.activo) {
      throw new Error('Credenciales inválidas');
    }

    const esValida = await bcrypt.compare(contrasena, usuario.contrasena);
    if (!esValida) throw new Error('Credenciales inválidas');

    const token = jwt.sign(
      { id: usuario.id_usuario, rol: usuario.rol, nombre: usuario.nombre },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    const { contrasena: _, ...usuarioSinPass } = usuario;
    return { token, usuario: usuarioSinPass };
  }

  async crearUsuario({ rut, correo, contrasena, nombre, rol }) {
    const hash = await bcrypt.hash(contrasena, 10);
    return usuarioRepo.create({ rut, correo, contrasena: hash, nombre, rol });
  }

  async cambiarContrasena(id, contrasenaActual, nuevaContrasena) {
    const usuario = await usuarioRepo.findByCorreo(
      (await usuarioRepo.findById(id)).correo
    );
    const esValida = await bcrypt.compare(contrasenaActual, usuario.contrasena);
    if (!esValida) throw new Error('Contraseña actual incorrecta');

    const hash = await bcrypt.hash(nuevaContrasena, 10);
    await usuarioRepo.update(id, { contrasena: hash });
    return { mensaje: 'Contraseña actualizada' };
  }
}

module.exports = { AuthService };
