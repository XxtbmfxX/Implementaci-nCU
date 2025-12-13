import type { FichaClinica } from '../domain/types';

export const initialFichas: FichaClinica[] = [
  {
    id: '1',
    paciente_id: '1',
    medico_id: '1',
    fecha: '2025-12-01',
    anamnesis: 'Paciente refiere cefalea intermitente',
    examen_fisico: 'Presión arterial 120/80, FC 72 lpm',
    diagnostico: 'Cefalea tensional (CIE-10: G44.2)',
    tratamiento: 'Paracetamol 500mg c/8hrs por 5 días',
    observaciones: 'Control en 1 semana',
    bloqueada: true,
    addenda: [],
  },
];
