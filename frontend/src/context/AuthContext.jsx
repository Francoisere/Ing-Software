import { createContext, useContext, useState, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    try {
      const u = localStorage.getItem('gymflow_user');
      return u ? JSON.parse(u) : null;
    } catch { return null; }
  });

  const login = useCallback(async (correo, contrasena) => {
    const { data } = await authAPI.login(correo, contrasena);
    localStorage.setItem('gymflow_token', data.token);
    localStorage.setItem('gymflow_user', JSON.stringify(data.usuario));
    setUsuario(data.usuario);
    return data.usuario;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('gymflow_token');
    localStorage.removeItem('gymflow_user');
    setUsuario(null);
  }, []);

  const esAdmin = usuario?.rol === 'administrador';

  return (
    <AuthContext.Provider value={{ usuario, login, logout, esAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
