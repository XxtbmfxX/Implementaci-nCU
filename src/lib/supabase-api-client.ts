import { supabase } from './supabase';
import type { IApiClient } from './api-contracts';
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

export class SupabaseApiClient implements IApiClient {
  private token: string | null = null;

  setToken(token: string | null): void {
    this.token = token;
    // Supabase client manages its own session, but we can sync if needed.
    // Usually not necessary if using the singleton 'supabase' client.
  }

  getToken(): string | null {
    // Best effort to get the current session token
    // Note: This is synchronous in the interface, but Supabase might be async.
    // We'll return the cached token or try to grab it from the session if available synchronously.
    return this.token; 
  }

  async login(email: string, password: string): Promise<AuthPayload> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    if (!data.session) throw new Error('No session returned');

    this.token = data.session.access_token;
    
    // Fetch the full user profile from our 'users' table
    const user = await this.getCurrentUser();

    return {
      user,
      token: data.session.access_token,
    };
  }

  async getCurrentUser(): Promise<User> {
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    if (!authUser) throw new Error('Not authenticated');

    // Fetch profile from 'users' table
    // Assumes a table 'users' exists with columns matching User interface
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (profileError) {
      // Fallback or throw depending on strictness. 
      // For now, throw because we need the role.
      console.error('Error fetching user profile:', profileError);
      throw new Error('User profile not found');
    }

    return profile as User;
  }

  // --- Pacientes ---

  async getPacientes(params?: {
    search?: string;
    page?: number;
    limit?: number;
    medico_id?: string;
    incluir_canceladas?: boolean;
  }): Promise<Paginated<Paciente>> {
    let query = supabase.from('pacientes').select('*', { count: 'exact' });

    if (params?.search) {
      query = query.or(`nombre.ilike.%${params.search}%,rut.ilike.%${params.search}%`);
    }
    
    // Pagination
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    query = query.range(from, to);
    query = query.order('fecha_creacion', { ascending: false });

    const { data, error, count } = await query;
    if (error) throw error;

    return {
      data: (data as Paciente[]) || [],
      total: count || 0,
      page,
      limit,
    };
  }

  async getPaciente(id: string): Promise<Paciente> {
    const { data, error } = await supabase
      .from('pacientes')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data as Paciente;
  }

  async createPaciente(data: Omit<Paciente, 'id'>): Promise<Paciente> {
    const { data: newPaciente, error } = await supabase
      .from('pacientes')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return newPaciente as Paciente;
  }

  async updatePaciente(id: string, data: Partial<Paciente>): Promise<Paciente> {
    const { data: updated, error } = await supabase
      .from('pacientes')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return updated as Paciente;
  }

  async deletePaciente(id: string): Promise<{ success: boolean }> {
    const { error } = await supabase.from('pacientes').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  }

  // --- Citas ---

  async getCitas(params?: { fecha?: string; medico_id?: string; paciente_id?: string }): Promise<Paginated<Cita>> {
    let query = supabase.from('citas').select('*', { count: 'exact' });

    if (params?.fecha) {
      query = query.eq('fecha', params.fecha);
    }
    if (params?.medico_id) {
      query = query.eq('medico_id', params.medico_id);
    }
    if (params?.paciente_id) {
      query = query.eq('paciente_id', params.paciente_id);
    }

    // Default pagination for now, or fetch all if not specified
    // The interface implies pagination but params don't strictly require it for this method in the contract?
    // The contract return type is Paginated<Cita>, so we should paginate.
    const page = 1;
    const limit = 100; // Reasonable default limit
    
    const { data, error, count } = await query.range(0, limit - 1);
    if (error) throw error;

    return {
      data: (data as Cita[]) || [],
      total: count || 0,
      page,
      limit,
    };
  }

  async createCita(data: Omit<Cita, 'id' | 'estado'>): Promise<Cita> {
    const { data: newCita, error } = await supabase
      .from('citas')
      .insert({ ...data, estado: 'PENDIENTE' }) // Default state
      .select()
      .single();

    if (error) throw error;
    return newCita as Cita;
  }

  async updateCita(id: string, data: Partial<Cita>): Promise<Cita> {
    const { data: updated, error } = await supabase
      .from('citas')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return updated as Cita;
  }

  async deleteCita(id: string): Promise<{ success: boolean }> {
    const { error } = await supabase.from('citas').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  }

  // --- Fichas ---

  async getFichasByPaciente(pacienteId: string, medico_id?: string): Promise<{ data: FichaClinica[] }> {
    let query = supabase.from('fichas').select('*').eq('paciente_id', pacienteId);
    
    if (medico_id) {
      query = query.eq('medico_id', medico_id);
    }

    const { data, error } = await query;
    if (error) throw error;
    return { data: (data as FichaClinica[]) || [] };
  }

  async addAddendum(fichaId: string, data: { texto: string; medico_id: string }): Promise<FichaClinica> {
    // This likely requires a more complex update or a separate table for addendums.
    // For now, assuming 'fichas' has an 'addendums' jsonb column or similar.
    // Or we might be appending to a text field.
    // Let's assume we fetch, append, and update for simplicity, or call an RPC.
    
    // Implementation depends heavily on schema. 
    // Placeholder:
    throw new Error('Method not implemented in Supabase client yet (requires schema definition)');
  }

  async createFicha(data: Omit<FichaClinica, 'id' | 'bloqueada'>): Promise<FichaClinica> {
    const { data: newFicha, error } = await supabase
      .from('fichas')
      .insert({ ...data, bloqueada: false })
      .select()
      .single();

    if (error) throw error;
    return newFicha as FichaClinica;
  }

  // --- Audit & Dashboard ---

  async getAuditLogs(params?: { page?: number; limit?: number }): Promise<Paginated<AuditLog>> {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .range(from, to)
      .order('fecha', { ascending: false });

    if (error) throw error;

    return {
      data: (data as AuditLog[]) || [],
      total: count || 0,
      page,
      limit,
    };
  }

  async getDashboardStats(rol: string): Promise<DashboardStats> {
    // This usually requires complex aggregation queries or a dedicated view/RPC.
    // Placeholder:
    return {
      pacientes_totales: 0,
      citas_hoy: 0,
      citas_pendientes: 0,
      ingresos_mes: 0,
      citas_por_estado: {},
      pacientes_nuevos_mes: []
    };
  }

  // --- Medicos ---

  async getMedicos(): Promise<Paginated<User>> {
    // Assuming medicos are users with rol='MEDICO'
    const { data, error, count } = await supabase
      .from('users')
      .select('*', { count: 'exact' })
      .eq('rol', 'MEDICO');

    if (error) throw error;

    return {
      data: (data as User[]) || [],
      total: count || 0,
      page: 1,
      limit: count || 10,
    };
  }

  async getMedico(id: string): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .eq('rol', 'MEDICO')
      .single();

    if (error) throw error;
    return data as User;
  }

  async createMedico(data: Omit<User, 'id'>): Promise<User> {
    // Creating a medico involves creating a Supabase Auth user AND a DB record.
    // This should ideally be done via an Edge Function (Admin API) to avoid exposing service_role key on client.
    // Or, if we are just creating the DB record and the Auth user is created separately.
    
    // WARNING: Client-side creation of Auth users is not possible without auto-login or admin rights.
    // For now, we'll throw an error explaining this limitation.
    throw new Error('Creating users requires Admin API / Edge Function');
  }

  async updateMedico(id: string, data: Partial<User>): Promise<User> {
    const { data: updated, error } = await supabase
      .from('users')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return updated as User;
  }

  async deleteMedico(id: string): Promise<{ success: boolean }> {
    // Soft delete or hard delete?
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  }
}
