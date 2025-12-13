import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiClient } from './api-client';
import type { User } from './api-client';
import { supabase } from '../supabaseClient';

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

    const { data: authListener } = supabase.auth.onAuthStateChange((event: string, session: any) => {
      if (session?.access_token) {
        apiClient.setToken(session.access_token);
      } else {
        apiClient.setToken(null);
      }

      if (event === 'SIGNED_IN') {
        apiClient.getCurrentUser().then((u) => setUser(u)).catch(() => {});
      }

      if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe?.();
    };
  }, []);

  const checkAuth = async () => {
    setLoading(true);
    try {
      // Prefer Supabase session if available
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const session = sessionData?.session ?? null;
        if (session?.access_token) {
          apiClient.setToken(session.access_token);
          // try get Supabase user data
          const { data: userData } = await supabase.auth.getUser();
          const sUser = userData?.user ?? null;
          if (sUser) {
            const mapped: User = {
              id: sUser.id,
              email: sUser.email ?? '',
              nombre:
                (sUser.user_metadata && (sUser.user_metadata.nombre || sUser.user_metadata.name)) ||
                (sUser.email ? sUser.email.split('@')[0] : 'Usuario'),
              rol: (sUser.user_metadata?.rol as any) || 'SECRETARIA',
              telefono: sUser.user_metadata?.telefono,
              activo: sUser.user_metadata?.activo ?? true,
            } as User;
            setUser(mapped);
            return;
          }
        }
      } catch (err) {
        // ignore supabase errors and fallback to apiClient
      }

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
      const { user: loginUser, token } = await apiClient.login(email, password);
      apiClient.setToken(token);
      const currentUser = await apiClient.getCurrentUser().catch(() => loginUser);
      setUser(currentUser);
    } catch (err) {
      throw err;
    }
  };

  const logout = () => {
    apiClient.setToken(null);
    setUser(null);
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;

    const permissions: Record<string, string[]> = {
      MEDICO: ['ver_fichas', 'crear_fichas', 'ver_citas_propias', 'ver_pacientes'],
      SECRETARIA: [
        'ver_pacientes',
        'crear_pacientes',
        'actualizar_pacientes',
        'ver_agenda',
        'gestionar_citas'
      ],
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
