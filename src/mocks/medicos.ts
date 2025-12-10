import { User } from '../domain/types';

export const initialMedicos: User[] = [
  {
    id: '1',
    email: 'medico@clinica.cl',
    nombre: 'Dr. Juan Pérez',
    rol: 'MEDICO',
    especialidad: 'Medicina General',
    telefono: '+56911111111',
    activo: true,
  },
  {
    id: '4',
    email: 'medico2@clinica.cl',
    nombre: 'Dra. María González',
    rol: 'MEDICO',
    especialidad: 'Pediatría',
    telefono: '+56922222222',
    activo: true,
  },
  {
    id: '5',
    email: 'medico3@clinica.cl',
    nombre: 'Dr. Carlos Rodríguez',
    rol: 'MEDICO',
    especialidad: 'Ginecología',
    telefono: '+56933333333',
    activo: true,
  },
];
