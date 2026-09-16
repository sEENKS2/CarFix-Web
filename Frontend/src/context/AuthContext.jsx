import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axiosClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      if (token && savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (nombreUsuario, password) => {
    // Nota: Si usaste el AuthController que armamos arriba, la ruta debería ser '/auth/login'
    // Dejo '/Usuarios/login' como lo tenías en tu código por si lo manejás en UsuariosController.
    const response = await api.post('/Usuarios/login', { 
      nombreUsuario, 
      password 
    });

    const userData = response.data;
    // Si la API no retorna token todavía, guardamos un token provisorio para mantener la sesión activa
    const token = userData.token || 'demo-token-session';

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);

    return userData;
  };
  
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  // --- NUEVA FUNCIÓN DE SEGURIDAD BASADA EN ROLES ---
  const tieneRol = (rolesPermitidos) => {
    if (!user) return false;
    
    // El usuario 'admin' nativo o el grupo 'Administradores' siempre tienen acceso total (Bypass)
    if (user.usuario === 'admin' || user.nombreUsuario === 'admin' || user.roles?.includes('Administradores')) {
      return true;
    }

    // Si pasamos un array vacío (roles: []), significa que SOLO el admin puede entrar
    if (!rolesPermitidos || rolesPermitidos.length === 0) return false;

    // Validamos si el usuario tiene alguno de los roles requeridos en su perfil
    // (Asume que el backend devuelve los grupos del usuario en la propiedad "roles" o "grupos")
    const rolesUsuario = user.roles || user.grupos || [];
    return rolesPermitidos.some(rol => rolesUsuario.includes(rol));
  };

  return (
    // Agregamos tieneRol al Provider para que esté disponible en toda la app
    <AuthContext.Provider value={{ user, login, logout, loading, tieneRol }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);