import type { Cita, Paciente, User } from '../domain/types';

const toISODate = (offsetDays: number) => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().split('T')[0];
};

export function createInitialCitas(pacientes: Paciente[], medicos: User[]): Cita[] {
  const pacienteById = new Map(pacientes.map((p) => [p.id, p]));
  const medicoById = new Map(medicos.map((m) => [m.id, m]));

  const entries: Omit<Cita, 'id'>[] = [
    {
      paciente_id: '1',
      medico_id: '1',
      fecha: toISODate(0),
      hora_inicio: '09:00',
      hora_fin: '09:30',
      tipo_consulta: 'Consulta Medicina General',
      estado: 'CONFIRMADA',
      motivo_categoria: 'Control',
    },
    {
      paciente_id: '2',
      medico_id: '1',
      fecha: toISODate(0),
      hora_inicio: '10:00',
      hora_fin: '10:30',
      tipo_consulta: 'Consulta Medicina General',
      estado: 'PENDIENTE',
      motivo_categoria: 'Primera Vez',
    },
    {
      paciente_id: '3',
      medico_id: '1',
      fecha: toISODate(1),
      hora_inicio: '11:00',
      hora_fin: '11:30',
      tipo_consulta: 'Control',
      estado: 'CONFIRMADA',
      motivo_categoria: 'Seguimiento',
    },
    {
      paciente_id: '1',
      medico_id: '1',
      fecha: toISODate(3),
      hora_inicio: '14:00',
      hora_fin: '14:30',
      tipo_consulta: 'Consulta Medicina General',
      estado: 'PENDIENTE',
      motivo_categoria: 'Control',
    },
    {
      paciente_id: '2',
      medico_id: '1',
      fecha: toISODate(7),
      hora_inicio: '15:00',
      hora_fin: '15:30',
      tipo_consulta: 'Procedimiento',
      estado: 'CONFIRMADA',
      motivo_categoria: 'Primera Vez',
    },
    {
      paciente_id: '3',
      medico_id: '1',
      fecha: toISODate(15),
      hora_inicio: '16:00',
      hora_fin: '16:30',
      tipo_consulta: 'Control',
      estado: 'PENDIENTE',
      motivo_categoria: 'Seguimiento',
    },

    {
      paciente_id: '3',
      medico_id: '1',
      fecha: toISODate(17),
      hora_inicio: '15:00',
      hora_fin: '16:30',
      tipo_consulta: 'Control',
      estado: 'PENDIENTE',
    motivo_categoria: 'Seguimiento',
    },
  
  ];

  return entries.map((entry, index) => ({
    id: String(index + 1),
    ...entry,
    paciente: pacienteById.get(entry.paciente_id),
    medico: medicoById.get(entry.medico_id),
  }));
}
