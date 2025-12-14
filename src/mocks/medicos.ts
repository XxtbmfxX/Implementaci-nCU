import { User } from '../domain/types';

export const initialMedicos: User[] = [
  {
    id: '1',
    email: 'medico@clinica.cl',
    nombre: 'Dr. Juan Pérez',
    rol: 'MEDICO',
    especialidad: 'Medicina General',
    rut: '11111111-1',
    numero_registro: '100001',
    region_trabajo: 'Metropolitana de Santiago',
    titulos: ['Médico Cirujano'],
    telefono: '+56911111111',
    activo: true,
    horario: [
      // Lun–Vie 08:00–17:00
      { dia: 1, inicio: '08:00', fin: '17:00' },
      { dia: 2, inicio: '08:00', fin: '17:00' },
      { dia: 3, inicio: '08:00', fin: '17:00' },
      { dia: 4, inicio: '08:00', fin: '17:00' },
      { dia: 5, inicio: '08:00', fin: '17:00' },
    ],
  },
  {
    id: '4',
    email: 'medico2@clinica.cl',
    nombre: 'Dra. María González',
    rol: 'MEDICO',
    especialidad: 'Pediatría',
    rut: '22222222-2',
    numero_registro: '100002',
    region_trabajo: 'Valparaíso',
    titulos: ['Médico Cirujano', 'Pediatría'],
    telefono: '+56922222222',
    activo: true,
    horario: [
      // Lun–Mie 09:00–13:00
      { dia: 1, inicio: '09:00', fin: '13:00' },
      { dia: 2, inicio: '09:00', fin: '13:00' },
      { dia: 3, inicio: '09:00', fin: '13:00' },
    ],
  },
  {
    id: '5',
    email: 'medico3@clinica.cl',
    nombre: 'Dr. Carlos Rodríguez',
    rol: 'MEDICO',
    especialidad: 'Ginecología',
    rut: '33333333-3',
    numero_registro: '100003',
    region_trabajo: 'Biobío',
    titulos: ['Médico Cirujano', 'Ginecología y Obstetricia'],
    telefono: '+56933333333',
    activo: true,
    horario: [
      // Mar–Vie 14:00–19:00
      { dia: 2, inicio: '14:00', fin: '19:00' },
      { dia: 3, inicio: '14:00', fin: '19:00' },
      { dia: 4, inicio: '14:00', fin: '19:00' },
      { dia: 5, inicio: '14:00', fin: '19:00' },
    ],
  },
];
