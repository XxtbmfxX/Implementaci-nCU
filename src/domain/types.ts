export type Rol = "MEDICO" | "SECRETARIA" | "GERENTE";


export interface HorarioBloque {
  // 0 = domingo ... 6 = sábado
  dia: number;
  inicio: string; // "HH:MM"
  fin: string;    // "HH:MM"
}

export interface User {
  id: string;
  email: string;
  nombre: string;
  rol: Rol;
  rut?: string;
  especialidad?: string;
  numeroRegistro?: string;
  regionTrabajo?: string;
  titulos?: string[];
  telefono?: string;
  activo?: boolean;
  horario?: HorarioBloque[];
}

export interface Paciente {
  id: string;
  rut: string;
  nombre: string;
  apellido: string;
  fecha_nacimiento: string;
  telefono: string;
  email: string;
  direccion: string;
  prevision: string;
  activo: boolean;
}

export type CitaEstado =
  | "PENDIENTE"
  | "CONFIRMADA"
  | "EN_ATENCION"
  | "COMPLETADA"
  | "CANCELADA";

export interface Cita {
  id: string;
  paciente_id: string;
  medico_id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  tipo_consulta: string;
  estado: CitaEstado;
  estado_anterior?: CitaEstado;
  motivo_categoria?: string;
  paciente?: Paciente;
  medico?: User;
}

export interface FichaClinica {
  id: string;
  paciente_id: string;
  medico_id: string;
  fecha: string;
  anamnesis: string;
  examen_fisico: string;
  diagnostico: string;
  tratamiento: string;
  observaciones: string;
  bloqueada: boolean;
}

export interface AuditLog {
  id: string;
  usuario_id: string;
  accion: string;
  entidad: string;
  entidad_id: string;
  fecha: string;
  detalles: string;
}

export interface DashboardStats {
  citas_hoy: number;
  pacientes_activos: number;
  atenciones_mes: number;
  tasa_inasistencia: number;
  stats_por_especialidad: { nombre: string; total: number }[];
}

export type Paginated<T> = {
  data: T[];
  total: number;
};

export type AuthPayload = { user: User; token: string };
