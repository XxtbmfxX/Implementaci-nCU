import type {
  AuditLog,
  Cita,
  DashboardStats,
  FichaClinica,
  Paciente,
  Paginated,
  User,
  AuthPayload,
} from '../domain/types';

export interface IApiClient {
  setToken(token: string | null): void;
  getToken(): string | null;
  login(email: string, password: string): Promise<AuthPayload>;
  getCurrentUser(): Promise<User>;

  getPacientes(params?: { search?: string; page?: number; limit?: number }): Promise<Paginated<Paciente>>;
  getPaciente(id: string): Promise<Paciente>;
  createPaciente(data: Omit<Paciente, 'id'>): Promise<Paciente>;
  updatePaciente(id: string, data: Partial<Paciente>): Promise<Paciente>;
  deletePaciente(id: string): Promise<{ success: boolean }>;

  getCitas(params?: { fecha?: string; medico_id?: string; paciente_id?: string }): Promise<Paginated<Cita>>;
  createCita(data: Omit<Cita, 'id' | 'estado'>): Promise<Cita>;
  updateCita(id: string, data: Partial<Cita>): Promise<Cita>;
  deleteCita(id: string): Promise<{ success: boolean }>;

  getFichasByPaciente(pacienteId: string): Promise<{ data: FichaClinica[] }>;
  createFicha(data: Omit<FichaClinica, 'id' | 'bloqueada'>): Promise<FichaClinica>;

  getAuditLogs(params?: { page?: number; limit?: number }): Promise<Paginated<AuditLog>>;
  getDashboardStats(rol: string): Promise<DashboardStats>;

  getMedicos(): Promise<Paginated<User>>;
  getMedico(id: string): Promise<User>;
  createMedico(data: Omit<User, 'id'>): Promise<User>;
  updateMedico(id: string, data: Partial<User>): Promise<User>;
  deleteMedico(id: string): Promise<{ success: boolean }>;
}
