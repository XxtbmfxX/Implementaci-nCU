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
    try {
      const token = apiClient.getToken();
      if (token) {
        const currentUser = await apiClient.getCurrentUser();
        setUser(currentUser);
      }
    } catch (error) {
      apiClient.setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const { user, token } = await apiClient.login(email, password);
    apiClient.setToken(token);
    setUser(user);
  };

  const logout = () => {
    apiClient.setToken(null);
    setUser(null);
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;

    const permissions: Record<string, string[]> = {
      MEDICO: ['ver_fichas', 'crear_fichas', 'ver_citas_propias', 'ver_pacientes'],
      SECRETARIA: ['ver_pacientes', 'crear_pacientes', 'actualizar_pacientes', 'ver_agenda', 'gestionar_citas'],
      GERENTE: ['ver_logs', 'gestionar_usuarios', 'ver_reportes', 'configurar_sistema'],
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
