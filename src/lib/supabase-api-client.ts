import { supabase } from '../supabaseClient';
import { MockApiClient } from './mock-api-client';
import type { IApiClient } from './api-contracts';
import type { AuthPayload, User } from '../domain/types';

export class SupabaseApiClient implements IApiClient {
  private delegate = new MockApiClient();
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    this.delegate.setToken(token);
  }

  getToken() {
    return this.token ?? this.delegate.getToken();
  }

  async login(email: string, password: string) {
    const res = await supabase.auth.signInWithPassword({ email, password });
    const { data, error } = res;
    if (error) throw new Error(error.message);
    const session = data.session;
    const user = data.user;
    if (!session || !user) throw new Error('Login failed');
    this.setToken(session.access_token ?? null);
    // Map to domain user shape conservatively
    const mapped: any = {
      id: user.id,
      email: user.email ?? '',
      nombre: (user.user_metadata && (user.user_metadata.nombre || user.user_metadata.name)) || (user.email ? user.email.split('@')[0] : 'Usuario'),
      rol: (user.user_metadata?.rol as any) || 'SECRETARIA',
      telefono: user.user_metadata?.telefono,
      activo: user.user_metadata?.activo ?? true,
    } as User;
    return { user: mapped, token: session.access_token } as AuthPayload;
  }

  async getCurrentUser() {
    // Try supabase user first
    const { data, error } = await supabase.auth.getUser();
    if (!error && data?.user) {
      const u = data.user;
      return {
        id: u.id,
        email: u.email ?? '',
        nombre: (u.user_metadata && (u.user_metadata.nombre || u.user_metadata.name)) || (u.email ? u.email.split('@')[0] : 'Usuario'),
        rol: (u.user_metadata?.rol as any) || 'SECRETARIA',
        telefono: u.user_metadata?.telefono,
        activo: u.user_metadata?.activo ?? true,
      } as User;
    }
    // Fallback to mock
    return this.delegate.getCurrentUser();
  }

  // Delegate remaining methods to MockApiClient
  getPacientes = this.delegate.getPacientes.bind(this.delegate);
  getPaciente = this.delegate.getPaciente.bind(this.delegate);
  createPaciente = this.delegate.createPaciente.bind(this.delegate);
  updatePaciente = this.delegate.updatePaciente.bind(this.delegate);
  deletePaciente = this.delegate.deletePaciente.bind(this.delegate);

  getCitas = this.delegate.getCitas.bind(this.delegate);
  createCita = this.delegate.createCita.bind(this.delegate);
  updateCita = this.delegate.updateCita.bind(this.delegate);
  deleteCita = this.delegate.deleteCita.bind(this.delegate);

  getFichasByPaciente = this.delegate.getFichasByPaciente.bind(this.delegate);
  createFicha = this.delegate.createFicha.bind(this.delegate);

  getAuditLogs = this.delegate.getAuditLogs.bind(this.delegate);
  getDashboardStats = this.delegate.getDashboardStats.bind(this.delegate);

  getMedicos = this.delegate.getMedicos.bind(this.delegate);
  getMedico = this.delegate.getMedico.bind(this.delegate);
  createMedico = this.delegate.createMedico.bind(this.delegate);
  updateMedico = this.delegate.updateMedico.bind(this.delegate);
  deleteMedico = this.delegate.deleteMedico.bind(this.delegate);
}

export default SupabaseApiClient;
