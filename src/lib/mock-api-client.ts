import { dashboardStatsMock } from '../mocks/dashboard';
import { initialPacientes } from '../mocks/pacientes';
import { initialMedicos } from '../mocks/medicos';
import { createInitialCitas } from '../mocks/citas';
import { initialFichas } from '../mocks/fichas';
import { initialAuditLogs } from '../mocks/audit';
import { makeToken, userFromToken, validateCredentials } from '../mocks/auth';
import type {
  AuditLog,
  Cita,
  FichaClinica,
  Paciente,
  Paginated,
  User,
} from '../domain/types';
import type { IApiClient } from './api-contracts';

const delay = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms));

function normalizeRutValue(input?: string | null): string {
  if (!input) return '';
  const raw = String(input).trim().replace(/\s+/g, '').replace(/\./g, '').replace(/-/g, '').toUpperCase();
  if (raw.length < 2) return '';
  const dv = raw.slice(-1);
  const num = raw.slice(0, -1);
  if (!/^\d+$/.test(num)) return '';
  return `${num}-${dv}`;
}

function cloneArray<T>(items: T[]): T[] {
  return items.map((item) => ({ ...item }));
}

  export class MockApiClient implements IApiClient {
    private token: string | null = null;
    private pacientes: Paciente[] = [];
    private medicos: User[] = [];
    private citas: Cita[] = [];
    private fichas: FichaClinica[] = [];
    private auditLogs: AuditLog[] = [];

  constructor() {
    this.resetData();
  }

  public resetData() {
    this.pacientes = cloneArray(initialPacientes);
    this.medicos = cloneArray(initialMedicos);
    this.citas = createInitialCitas(this.pacientes, this.medicos);
    this.fichas = cloneArray(initialFichas);
    this.auditLogs = cloneArray(initialAuditLogs);
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
      this.resetData();
    }
  }

  getToken() {
    if (!this.token) {
      this.token = localStorage.getItem('auth_token');
    }
    return this.token;
  }

  async login(email: string, password: string) {
    await delay();
    const user = validateCredentials(email, password);
    if (!user) throw new Error('Credenciales inválidas');
    return { user, token: makeToken(user.rol) };
  }

  async getCurrentUser() {
    await delay();
    const user = userFromToken(this.getToken());
    if (!user) throw new Error('No autenticado');
    return user;
  }

  async getPacientes(params?: { search?: string; page?: number; limit?: number }): Promise<Paginated<Paciente>> {
    await delay();
    const search = params?.search?.toLowerCase().trim();
    let data = [...this.pacientes];

    if (search) {
      data = data.filter((p) =>
        `${p.nombre} ${p.apellido} ${p.rut} ${p.email}`
          .toLowerCase()
          .includes(search),
      );
    }

    const total = data.length;
    const page = params?.page ?? 1;
    const limit = params?.limit ?? (data.length || 1);
    const start = (page - 1) * limit;
    const end = start + limit;

    return { data: data.slice(start, end), total };
  }

  async getPaciente(id: string) {
    await delay();
    const paciente = this.pacientes.find((p) => p.id === id);
    if (!paciente) throw new Error('Paciente no encontrado');
    return paciente;
  }

  async createPaciente(data: Omit<Paciente, 'id'>) {
    await delay();
    const newPaciente: Paciente = { ...data, id: String(Date.now()) };
    this.pacientes.push(newPaciente);
    return newPaciente;
  }

  async updatePaciente(id: string, data: Partial<Paciente>) {
    await delay();
    const idx = this.pacientes.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error('Paciente no encontrado');
    const updated = { ...this.pacientes[idx], ...data };
    this.pacientes[idx] = updated;
    return updated;
  }

  async deletePaciente(id: string) {
    await delay();
    this.pacientes = this.pacientes.filter((p) => p.id !== id);
    this.citas = this.citas.filter((c) => c.paciente_id !== id);
    return { success: true } as const;
  }

  async getCitas(params?: { fecha?: string; medico_id?: string; paciente_id?: string }): Promise<Paginated<Cita>> {
    await delay();
    const { fecha, medico_id, paciente_id } = params || {};
    let data = [...this.citas];

    if (fecha) data = data.filter((c) => c.fecha === fecha);
    if (medico_id) data = data.filter((c) => c.medico_id === medico_id);
    if (paciente_id) data = data.filter((c) => c.paciente_id === paciente_id);

    return { data, total: data.length };
  }

  async createCita(data: Omit<Cita, 'id' | 'estado'>) {
    await delay();
    const paciente = this.pacientes.find((p) => p.id === data.paciente_id);
    const medico = this.medicos.find((m) => m.id === data.medico_id);
    const newCita: Cita = {
      ...data,
      id: String(Date.now()),
      estado: 'PENDIENTE',
      paciente,
      medico,
    };
    this.citas.push(newCita);
    return newCita;
  }

  async updateCita(id: string, data: Partial<Cita>) {
    await delay();
    const idx = this.citas.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Cita no encontrada');

    const current = this.citas[idx];
    const paciente = data.paciente_id
      ? this.pacientes.find((p) => p.id === data.paciente_id)
      : current.paciente;
    const medico = data.medico_id
      ? this.medicos.find((m) => m.id === data.medico_id)
      : current.medico;

    const nextEstado = data.estado ?? current.estado;

    // Validaciones de flujo de estados
    if (nextEstado === 'COMPLETADA' && current.estado !== 'EN_ATENCION') {
      throw new Error('Solo se puede completar una cita que está EN_ATENCION');
    }
    if (nextEstado === 'EN_ATENCION' && current.estado !== 'CONFIRMADA') {
      throw new Error('Solo se puede iniciar atención desde una cita CONFIRMADA');
    }
    if (nextEstado === 'CANCELADA' && current.estado === 'COMPLETADA') {
      throw new Error('No se puede cancelar una cita completada');
    }

    // Validar entidad activa para estados que implican atención
    if (['CONFIRMADA', 'EN_ATENCION', 'COMPLETADA'].includes(nextEstado)) {
      if (medico && medico.activo === false) {
        throw new Error('El médico está inactivo');
      }
      if (paciente && paciente.activo === false) {
        throw new Error('El paciente está inactivo');
      }
    }

    // Guardar estado anterior al cancelar si no viene informado
    const estado_anterior =
      nextEstado === 'CANCELADA' ? (data.estado_anterior ?? current.estado) : undefined;

    const updated: Cita = {
      ...current,
      ...data,
      estado: nextEstado,
      estado_anterior,
      paciente,
      medico,
    } as Cita;
    this.citas[idx] = updated;

    // Registrar en auditoría de forma simple
    this.auditLogs.push({
      id: String(Date.now()),
      usuario_id: 'mock-user',
      accion: 'updateCita',
      entidad: 'cita',
      entidad_id: id,
      fecha: new Date().toISOString(),
      detalles: JSON.stringify({ de: current.estado, a: nextEstado }),
    });

    return updated;
  }

  async deleteCita(id: string) {
    await delay();
    this.citas = this.citas.filter((c) => c.id !== id);
    return { success: true } as const;
  }

  async getFichasByPaciente(pacienteId: string) {
    await delay();
    return { data: this.fichas.filter((f) => f.paciente_id === pacienteId) };
  }

  async createFicha(data: Omit<FichaClinica, 'id' | 'bloqueada'>) {
    await delay();
    const newFicha: FichaClinica = {
      ...data,
      id: String(Date.now()),
      bloqueada: false,
    };
    this.fichas.push(newFicha);
    return newFicha;
  }

  async getAuditLogs(_params?: { page?: number; limit?: number }) {
    await delay();
    return { data: this.auditLogs, total: this.auditLogs.length };
  }

  async getDashboardStats(_rol: string) {
    await delay();
    return dashboardStatsMock;
  }

  async getMedicos(): Promise<Paginated<User>> {
    await delay();
    return { data: this.medicos, total: this.medicos.length };
  }

  async getMedico(id: string) {
    await delay();
    const medico = this.medicos.find((m) => m.id === id);
    if (!medico) throw new Error('Médico no encontrado');
    return medico;
  }

  async createMedico(data: Omit<User, 'id'>) {
    await delay();
    const normalizedRut = normalizeRutValue((data as any).rut);
    if (normalizedRut) {
      const existsRut = this.medicos.some((m) => normalizeRutValue((m as any).rut) === normalizedRut);
      if (existsRut) throw new Error('Ya existe un médico con este RUT');
    }

    const registro = (data as any).numeroRegistro as string | undefined;
    if (registro) {
      if (!/^\d{1,6}$/.test(registro)) {
        throw new Error('El número de registro debe tener máximo 6 dígitos');
      }
      const existsReg = this.medicos.some((m) => (m as any).numeroRegistro === registro);
      if (existsReg) throw new Error('Ya existe un médico con este número de registro');
    }

    const newMedico: User = { ...data, rut: normalizedRut || undefined, id: String(Date.now()) };
    this.medicos.push(newMedico);
    return newMedico;
  }

  async updateMedico(id: string, data: Partial<User>) {
    await delay();
    const idx = this.medicos.findIndex((m) => m.id === id);
    if (idx === -1) throw new Error('Médico no encontrado');

    const normalizedRut = data.hasOwnProperty('rut') ? normalizeRutValue((data as any).rut) : undefined;
    if (normalizedRut !== undefined) {
      if (normalizedRut === '') throw new Error('RUT inválido');
      const existsRut = this.medicos.some((m, i) => i !== idx && normalizeRutValue((m as any).rut) === normalizedRut);
      if (existsRut) throw new Error('Ya existe un médico con este RUT');
    }

    if (data.numeroRegistro !== undefined) {
      if (data.numeroRegistro && !/^\d{1,6}$/.test(data.numeroRegistro)) {
        throw new Error('El número de registro debe tener máximo 6 dígitos');
      }
      const existsReg = this.medicos.some((m, i) => i !== idx && (m as any).numeroRegistro === data.numeroRegistro);
      if (existsReg) throw new Error('Ya existe un médico con este número de registro');
    }

    const updated = {
      ...this.medicos[idx],
      ...data,
      ...(normalizedRut !== undefined ? { rut: normalizedRut } : {}),
    } as User;
    this.medicos[idx] = updated;
    return updated;
  }

  async deleteMedico(id: string) {
    await delay();
    this.medicos = this.medicos.filter((m) => m.id !== id);
    this.citas = this.citas.filter((c) => c.medico_id !== id);
    return { success: true } as const;
  }
}
