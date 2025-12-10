import type { DashboardStats } from '../domain/types';

export const dashboardStatsMock: DashboardStats = {
  citas_hoy: 8,
  pacientes_activos: 145,
  atenciones_mes: 234,
  tasa_inasistencia: 12.5,
  stats_por_especialidad: [
    { nombre: 'Medicina General', total: 120 },
    { nombre: 'Pediatría', total: 80 },
    { nombre: 'Ginecología', total: 34 },
  ],
};
