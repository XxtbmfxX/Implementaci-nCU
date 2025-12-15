import type { Rol, User } from '../domain/types';

const usersByEmail: Record<string, User & { password: string }> = {
  'medico@clinica.cl': {
    id: '1',
    email: 'medico@clinica.cl',
    nombre: 'Dr. Juan Pérez',
    rol: 'MEDICO',
    especialidad: 'Medicina General',
    password: 'password123',
  },
  'secretaria@clinica.cl': {
    id: '2',
    email: 'secretaria@clinica.cl',
    nombre: 'María González',
    rol: 'SECRETARIA',
    password: 'password123',
  },
  'gerente@clinica.cl': {
    id: '3',
    email: 'gerente@clinica.cl',
    nombre: 'Carlos Rodríguez',
    rol: 'GERENTE',
    password: 'password123',
  },
};

export function validateCredentials(email: string, password: string) {
  const user = usersByEmail[email];
  if (user && user.password === password) {
    const { password: _pw, ...safeUser } = user;
    return safeUser as User;
  }
  return null;
}

export function userFromToken(token: string | null): User | null {
  if (!token) return null;
  const roles: Rol[] = ['MEDICO', 'SECRETARIA', 'GERENTE'];
  const matchedRole = roles.find((role) => token.includes(role));
  if (!matchedRole) return null;

  const user = Object.values(usersByEmail).find((u) => u.rol === matchedRole);
  if (!user) return null;

  const { password: _pw, ...safeUser } = user;
  return safeUser;
}

export function makeToken(role: Rol) {
  return `mock_jwt_token_${role}`;
}
