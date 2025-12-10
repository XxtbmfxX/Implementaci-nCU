import type { AuditLog } from '../domain/types';

export const initialAuditLogs: AuditLog[] = [
  {
    id: '1',
    usuario_id: '1',
    accion: 'CREAR',
    entidad: 'FICHA_CLINICA',
    entidad_id: '1',
    fecha: '2025-12-01T10:30:00',
    detalles: 'Creación de ficha clínica',
  },
  {
    id: '2',
    usuario_id: '2',
    accion: 'ACTUALIZAR',
    entidad: 'PACIENTE',
    entidad_id: '1',
    fecha: '2025-12-02T14:15:00',
    detalles: 'Actualización de datos demográficos',
  },
];
