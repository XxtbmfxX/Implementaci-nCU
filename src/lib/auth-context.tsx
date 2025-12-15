import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from './api-client';
import type { User } from './api-client';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    setLoading(true);
    try {
      const token = apiClient.getToken();
      if (token) {
        const currentUser = await apiClient.getCurrentUser();
        setUser(currentUser);
      } else {
        setUser(null);
      }
    } catch (error) {
      apiClient.setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      console.log(`🔐 Intentando iniciar sesión con: ${email}`);
      const { user: loginUser, token } = await apiClient.login(email, password);
      console.log('✅ Login exitoso. Token recibido.');
      apiClient.setToken(token);
      const currentUser = await apiClient.getCurrentUser().catch(() => loginUser);
      setUser(currentUser);
    } catch (err) {
      console.error('❌ Error en login:', err);
      throw err;
    }
  };

  const logout = () => {
    console.log('👋 Cerrando sesión...');
    apiClient.setToken(null);
    setUser(null);
    // Si quieres asegurar 100% limpieza visual:
    // window.location.reload();
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;

    const permissions: Record<string, string[]> = {
      MEDICO: [
        'ver_fichas',
        'crear_fichas',
        'ver_citas_propias',
        'ver_pacientes'
      ],
      SECRETARIA: [
        'ver_pacientes',
        'crear_pacientes',
        'actualizar_pacientes',
        'ver_agenda',
        'gestionar_citas',
        'ver_medicos'
      ],
      GERENTE: [
        'ver_logs',
        'gestionar_usuarios',
        'ver_reportes',
        'configurar_sistema',
        'ver_medicos'
      ],
    };

    return permissions[user.rol]?.includes(permission) || false;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
