// API Client with Authentication and Role-based Access Control
// Mock implementation - Replace with actual API endpoints

export interface User {
  id: string;
  email: string;
  nombre: string;
  rol: "MEDICO" | "SECRETARIA" | "GERENTE";
  especialidad?: string;
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

export interface Cita {
  id: string;
  paciente_id: string;
  medico_id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  tipo_consulta: string;
  estado:
    | "PENDIENTE"
    | "CONFIRMADA"
    | "EN_ATENCION"
    | "COMPLETADA"
    | "CANCELADA";
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

class ApiClient {
  private baseUrl = "/api";
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem("auth_token", token);
    } else {
      localStorage.removeItem("auth_token");
    }
  }

  getToken() {
    if (!this.token) {
      this.token = localStorage.getItem("auth_token");
    }
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const token = this.getToken();
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // Mock implementation - simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    // In production, replace with actual fetch:
    // const response = await fetch(`${this.baseUrl}${endpoint}`, {
    //   ...options,
    //   headers,
    // });
    // if (!response.ok) throw new Error('API Error');
    // return response.json();

    // Mock responses for demo
    return this.getMockData(endpoint, options) as Promise<T>;
  }

  // Mock data generator
  private getMockData(
    endpoint: string,
    options: RequestInit,
  ): any {
    const method = options.method || "GET";

    // Authentication
    if (endpoint === "/auth/login") {
      const body = JSON.parse(options.body as string);
      const users: Record<string, User> = {
        "medico@clinica.cl": {
          id: "1",
          email: "medico@clinica.cl",
          nombre: "Dr. Juan Pérez",
          rol: "MEDICO",
          especialidad: "Medicina General",
        },
        "secretaria@clinica.cl": {
          id: "2",
          email: "secretaria@clinica.cl",
          nombre: "María González",
          rol: "SECRETARIA",
        },
        "gerente@clinica.cl": {
          id: "3",
          email: "gerente@clinica.cl",
          nombre: "Carlos Rodríguez",
          rol: "GERENTE",
        },
      };
      const user = users[body.email];
      if (user && body.password === "password") {
        return { user, token: "mock_jwt_token_" + user.rol };
      }
      throw new Error("Credenciales inválidas");
    }

    if (endpoint === "/auth/me") {
      const token = this.getToken();
      if (token?.includes("MEDICO")) {
        return {
          id: "1",
          email: "medico@clinica.cl",
          nombre: "Dr. Juan Pérez",
          rol: "MEDICO",
          especialidad: "Medicina General",
        };
      } else if (token?.includes("SECRETARIA")) {
        return {
          id: "2",
          email: "secretaria@clinica.cl",
          nombre: "María González",
          rol: "SECRETARIA",
        };
      } else if (token?.includes("GERENTE")) {
        return {
          id: "3",
          email: "gerente@clinica.cl",
          nombre: "Carlos Rodríguez",
          rol: "GERENTE",
        };
      }
      throw new Error("No autenticado");
    }

    // Pacientes
    if (endpoint.startsWith("/pacientes")) {
      const mockPacientes: Paciente[] = [
        {
          id: "1",
          rut: "12345678-9",
          nombre: "Ana",
          apellido: "Silva",
          fecha_nacimiento: "1985-03-15",
          telefono: "+56912345678",
          email: "ana@email.com",
          direccion: "Av. Principal 123",
          prevision: "FONASA",
          activo: true,
        },
        {
          id: "2",
          rut: "23456789-0",
          nombre: "Pedro",
          apellido: "Martínez",
          fecha_nacimiento: "1990-07-22",
          telefono: "+56923456789",
          email: "pedro@email.com",
          direccion: "Calle Secundaria 456",
          prevision: "ISAPRE",
          activo: true,
        },
        {
          id: "3",
          rut: "34567890-1",
          nombre: "Carmen",
          apellido: "López",
          fecha_nacimiento: "1978-11-30",
          telefono: "+56934567890",
          email: "carmen@email.com",
          direccion: "Pasaje Los Olivos 789",
          prevision: "FONASA",
          activo: true,
        },
      ];

      // Check if it's a GET request to /pacientes (with or without query params)
      if (
        method === "GET" &&
        (endpoint === "/pacientes" ||
          endpoint.startsWith("/pacientes?"))
      ) {
        return {
          data: mockPacientes,
          total: mockPacientes.length,
        };
      }

      if (
        method === "GET" &&
        endpoint.match(/\/pacientes\/\d+/)
      ) {
        const id = endpoint.split("/")[2];
        return mockPacientes.find((p) => p.id === id);
      }

      if (method === "POST") {
        const newPaciente = {
          ...JSON.parse(options.body as string),
          id: String(Date.now()),
        };
        return newPaciente;
      }

      if (method === "PUT") {
        return { ...JSON.parse(options.body as string) };
      }

      if (method === "DELETE") {
        return { success: true };
      }
    }

    // Citas
    if (endpoint.startsWith("/citas")) {
      const hoy = new Date().toISOString().split('T')[0];
      const manana = new Date();
      manana.setDate(manana.getDate() + 1);
      const enTresDias = new Date();
      enTresDias.setDate(enTresDias.getDate() + 3);
      const enUnaSemana = new Date();
      enUnaSemana.setDate(enUnaSemana.getDate() + 7);
      const enQuinceDias = new Date();
      enQuinceDias.setDate(enQuinceDias.getDate() + 15);
      
      const mockCitas: Cita[] = [
        {
          id: "1",
          paciente_id: "1",
          medico_id: "1",
          fecha: hoy,
          hora_inicio: "09:00",
          hora_fin: "09:30",
          tipo_consulta: "Consulta Medicina General",
          estado: "CONFIRMADA",
          motivo_categoria: "Control",
          paciente: {
            id: "1",
            rut: "12345678-9",
            nombre: "Ana",
            apellido: "Silva",
            fecha_nacimiento: "1985-03-15",
            telefono: "+56912345678",
            email: "ana@email.com",
            direccion: "Av. Principal 123",
            prevision: "FONASA",
            activo: true,
          },
          medico: {
            id: "1",
            email: "medico@clinica.cl",
            nombre: "Dr. Juan Pérez",
            rol: "MEDICO",
            especialidad: "Medicina General",
          },
        },
        {
          id: "2",
          paciente_id: "2",
          medico_id: "1",
          fecha: hoy,
          hora_inicio: "10:00",
          hora_fin: "10:30",
          tipo_consulta: "Consulta Medicina General",
          estado: "PENDIENTE",
          motivo_categoria: "Primera Vez",
          paciente: {
            id: "2",
            rut: "23456789-0",
            nombre: "Pedro",
            apellido: "Martínez",
            fecha_nacimiento: "1990-07-22",
            telefono: "+56923456789",
            email: "pedro@email.com",
            direccion: "Calle Secundaria 456",
            prevision: "ISAPRE",
            activo: true,
          },
          medico: {
            id: "1",
            email: "medico@clinica.cl",
            nombre: "Dr. Juan Pérez",
            rol: "MEDICO",
            especialidad: "Medicina General",
          },
        },
        {
          id: "3",
          paciente_id: "3",
          medico_id: "1",
          fecha: manana.toISOString().split('T')[0],
          hora_inicio: "11:00",
          hora_fin: "11:30",
          tipo_consulta: "Control",
          estado: "CONFIRMADA",
          motivo_categoria: "Seguimiento",
          paciente: {
            id: "3",
            rut: "34567890-1",
            nombre: "Carmen",
            apellido: "López",
            fecha_nacimiento: "1978-11-30",
            telefono: "+56934567890",
            email: "carmen@email.com",
            direccion: "Pasaje Los Olivos 789",
            prevision: "FONASA",
            activo: true,
          },
          medico: {
            id: "1",
            email: "medico@clinica.cl",
            nombre: "Dr. Juan Pérez",
            rol: "MEDICO",
            especialidad: "Medicina General",
          },
        },
        {
          id: "4",
          paciente_id: "1",
          medico_id: "1",
          fecha: enTresDias.toISOString().split('T')[0],
          hora_inicio: "14:00",
          hora_fin: "14:30",
          tipo_consulta: "Consulta Medicina General",
          estado: "PENDIENTE",
          motivo_categoria: "Control",
          paciente: {
            id: "1",
            rut: "12345678-9",
            nombre: "Ana",
            apellido: "Silva",
            fecha_nacimiento: "1985-03-15",
            telefono: "+56912345678",
            email: "ana@email.com",
            direccion: "Av. Principal 123",
            prevision: "FONASA",
            activo: true,
          },
          medico: {
            id: "1",
            email: "medico@clinica.cl",
            nombre: "Dr. Juan Pérez",
            rol: "MEDICO",
            especialidad: "Medicina General",
          },
        },
        {
          id: "5",
          paciente_id: "2",
          medico_id: "1",
          fecha: enUnaSemana.toISOString().split('T')[0],
          hora_inicio: "15:00",
          hora_fin: "15:30",
          tipo_consulta: "Procedimiento",
          estado: "CONFIRMADA",
          motivo_categoria: "Primera Vez",
          paciente: {
            id: "2",
            rut: "23456789-0",
            nombre: "Pedro",
            apellido: "Martínez",
            fecha_nacimiento: "1990-07-22",
            telefono: "+56923456789",
            email: "pedro@email.com",
            direccion: "Calle Secundaria 456",
            prevision: "ISAPRE",
            activo: true,
          },
          medico: {
            id: "1",
            email: "medico@clinica.cl",
            nombre: "Dr. Juan Pérez",
            rol: "MEDICO",
            especialidad: "Medicina General",
          },
        },
        {
          id: "6",
          paciente_id: "3",
          medico_id: "1",
          fecha: enQuinceDias.toISOString().split('T')[0],
          hora_inicio: "16:00",
          hora_fin: "16:30",
          tipo_consulta: "Control",
          estado: "PENDIENTE",
          motivo_categoria: "Seguimiento",
          paciente: {
            id: "3",
            rut: "34567890-1",
            nombre: "Carmen",
            apellido: "López",
            fecha_nacimiento: "1978-11-30",
            telefono: "+56934567890",
            email: "carmen@email.com",
            direccion: "Pasaje Los Olivos 789",
            prevision: "FONASA",
            activo: true,
          },
          medico: {
            id: "1",
            email: "medico@clinica.cl",
            nombre: "Dr. Juan Pérez",
            rol: "MEDICO",
            especialidad: "Medicina General",
          },
        },
      ];

      if (method === "GET" && endpoint.startsWith("/citas")) {
        // Parse query params to filter citas
        const urlParts = endpoint.split("?");
        let filteredCitas = [...mockCitas];

        if (urlParts.length > 1) {
          const params = new URLSearchParams(urlParts[1]);
          const fecha = params.get("fecha");
          const medico_id = params.get("medico_id");
          const paciente_id = params.get("paciente_id");

          if (fecha) {
            filteredCitas = filteredCitas.filter(
              (c) => c.fecha === fecha,
            );
          }
          if (medico_id) {
            filteredCitas = filteredCitas.filter(
              (c) => c.medico_id === medico_id,
            );
          }
          if (paciente_id) {
            filteredCitas = filteredCitas.filter(
              (c) => c.paciente_id === paciente_id,
            );
          }
        }

        return {
          data: filteredCitas,
          total: filteredCitas.length,
        };
      }

      if (method === "POST") {
        const newCita = {
          ...JSON.parse(options.body as string),
          id: String(Date.now()),
          estado: "PENDIENTE",
        };
        return newCita;
      }

      if (method === "PUT") {
        return { ...JSON.parse(options.body as string) };
      }

      if (method === "DELETE") {
        return { success: true };
      }
    }

    // Fichas Clínicas
    if (endpoint.startsWith("/fichas")) {
      const mockFichas: FichaClinica[] = [
        {
          id: "1",
          paciente_id: "1",
          medico_id: "1",
          fecha: "2025-12-01",
          anamnesis: "Paciente refiere cefalea intermitente",
          examen_fisico: "Presión arterial 120/80, FC 72 lpm",
          diagnostico: "Cefalea tensional (CIE-10: G44.2)",
          tratamiento: "Paracetamol 500mg c/8hrs por 5 días",
          observaciones: "Control en 1 semana",
          bloqueada: true,
        },
      ];

      if (
        method === "GET" &&
        endpoint.match(/\/fichas\/paciente\/\d+/)
      ) {
        return { data: mockFichas };
      }

      if (method === "POST") {
        const newFicha = {
          ...JSON.parse(options.body as string),
          id: String(Date.now()),
          bloqueada: false,
        };
        return newFicha;
      }
    }

    // Audit Logs
    if (endpoint.startsWith("/audit")) {
      const mockLogs: AuditLog[] = [
        {
          id: "1",
          usuario_id: "1",
          accion: "CREAR",
          entidad: "FICHA_CLINICA",
          entidad_id: "1",
          fecha: "2025-12-01T10:30:00",
          detalles: "Creación de ficha clínica",
        },
        {
          id: "2",
          usuario_id: "2",
          accion: "ACTUALIZAR",
          entidad: "PACIENTE",
          entidad_id: "1",
          fecha: "2025-12-02T14:15:00",
          detalles: "Actualización de datos demográficos",
        },
      ];

      return { data: mockLogs, total: mockLogs.length };
    }

    // Dashboard stats
    if (endpoint.startsWith("/dashboard")) {
      return {
        citas_hoy: 8,
        pacientes_activos: 145,
        atenciones_mes: 234,
        tasa_inasistencia: 12.5,
        stats_por_especialidad: [
          { nombre: "Medicina General", total: 120 },
          { nombre: "Pediatría", total: 80 },
          { nombre: "Ginecología", total: 34 },
        ],
      };
    }

    // Médicos endpoints
    if (endpoint.startsWith("/medicos")) {
      const mockMedicos: User[] = [
        {
          id: "1",
          email: "medico@clinica.cl",
          nombre: "Dr. Juan Pérez",
          rol: "MEDICO",
          especialidad: "Medicina General",
        },
        {
          id: "4",
          email: "medico2@clinica.cl",
          nombre: "Dr. María González",
          rol: "MEDICO",
          especialidad: "Pediatría",
        },
        {
          id: "5",
          email: "medico3@clinica.cl",
          nombre: "Dr. Carlos Rodríguez",
          rol: "MEDICO",
          especialidad: "Ginecología",
        },
      ];

      if (method === "GET" && endpoint === "/medicos") {
        return {
          data: mockMedicos,
          total: mockMedicos.length,
        };
      }

      if (method === "GET" && endpoint.match(/\/medicos\/\d+/)) {
        const id = endpoint.split("/")[2];
        return mockMedicos.find((m) => m.id === id);
      }

      if (method === "POST") {
        const newMedico = {
          ...JSON.parse(options.body as string),
          id: String(Date.now()),
        };
        return newMedico;
      }

      if (method === "PUT") {
        return { ...JSON.parse(options.body as string) };
      }

      if (method === "DELETE") {
        return { success: true };
      }
    }

    return { error: "Endpoint no implementado" };
  }

  // Auth endpoints
  async login(email: string, password: string) {
    return this.request<{ user: User; token: string }>(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ email, password }),
      },
    );
  }

  async getCurrentUser() {
    return this.request<User>("/auth/me");
  }

  // Pacientes endpoints
  async getPacientes(params?: {
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<{ data: Paciente[]; total: number }>(
      `/pacientes?${query}`,
    );
  }

  async getPaciente(id: string) {
    return this.request<Paciente>(`/pacientes/${id}`);
  }

  async createPaciente(data: Omit<Paciente, "id">) {
    return this.request<Paciente>("/pacientes", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updatePaciente(id: string, data: Partial<Paciente>) {
    return this.request<Paciente>(`/pacientes/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deletePaciente(id: string) {
    return this.request<{ success: boolean }>(
      `/pacientes/${id}`,
      {
        method: "DELETE",
      },
    );
  }

  // Citas endpoints
  async getCitas(params?: {
    fecha?: string;
    medico_id?: string;
    paciente_id?: string;
  }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<{ data: Cita[]; total: number }>(
      `/citas?${query}`,
    );
  }

  async createCita(data: Omit<Cita, "id" | "estado">) {
    return this.request<Cita>("/citas", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateCita(id: string, data: Partial<Cita>) {
    return this.request<Cita>(`/citas/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteCita(id: string) {
    return this.request<{ success: boolean }>(`/citas/${id}`, {
      method: "DELETE",
    });
  }

  // Fichas Clínicas endpoints
  async getFichasByPaciente(pacienteId: string) {
    return this.request<{ data: FichaClinica[] }>(
      `/fichas/paciente/${pacienteId}`,
    );
  }

  async createFicha(
    data: Omit<FichaClinica, "id" | "bloqueada">,
  ) {
    return this.request<FichaClinica>("/fichas", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Audit endpoints
  async getAuditLogs(params?: {
    page?: number;
    limit?: number;
  }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<{ data: AuditLog[]; total: number }>(
      `/audit?${query}`,
    );
  }

  // Dashboard endpoints
  async getDashboardStats(rol: string) {
    return this.request(`/dashboard/${rol}`);
  }

  // Médicos endpoints
  async getMedicos() {
    return this.request<{ data: User[]; total: number }>('/medicos');
  }

  async getMedico(id: string) {
    return this.request<User>(`/medicos/${id}`);
  }

  async createMedico(data: Omit<User, 'id'>) {
    return this.request<User>('/medicos', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateMedico(id: string, data: Partial<User>) {
    return this.request<User>(`/medicos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteMedico(id: string) {
    return this.request<{ success: boolean }>(`/medicos/${id}`, {
      method: 'DELETE',
    });
  }
}

export const apiClient = new ApiClient();