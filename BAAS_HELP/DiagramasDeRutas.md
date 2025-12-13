# Diagrama de Rutas (React Router v7)

Este diagrama representa la estructura de navegación implementada con React Router.

```mermaid
graph TD
    subgraph Public ["Público"]
        Login["/login (LoginForm)"]
    end

    subgraph Protected ["Protegido (Layout)"]
        Root["/ (Layout)"]
        
        Root --> Index["/ (Index Loader)"]
        Index -.->|MEDICO| CitasMedico
        Index -.->|SECRETARIA| Agenda
        Index -.->|GERENTE| Dashboard

        Root --> Dashboard["/dashboard (DashboardView)"]
        Root --> Agenda["/agenda (AgendaView)"]
        Root --> Pacientes["/pacientes (PacientesView)"]
        Root --> CitasMedico["/citas-medico (CitasMedicoView)"]
        Root --> Medicos["/medicos (MedicosView)"]
        Root --> Auditoria["/auditoria (AuditoriaView)"]
    end

    Login -->|Login Success| Root
    Root -->|Logout| Login

    %% Data Loading
    Dashboard -.->|loader| API_Dashboard[getDashboardStats]
    Agenda -.->|loader| API_Agenda[getCitas]
    Pacientes -.->|loader| API_Pacientes[getPacientes]
    CitasMedico -.->|loader| API_Citas[getCitas]
    Medicos -.->|loader| API_Medicos[getMedicos]
    Auditoria -.->|loader| API_Audit[getAuditLogs]
```

## Detalles de Implementación

- **Router**: `createBrowserRouter` en `src/router.tsx`.
- **Protección**: `protectedLoader` verifica el token antes de renderizar el Layout.
- **Redirección Inicial**: `rootIndexLoader` redirige a la vista principal según el rol del usuario.
- **Data Fetching**: Se utiliza `loader` en las rutas (ej. `dashboardLoader`) para cargar datos en paralelo a la navegación.
- **Navegación**: `<NavLink>` en el Sidebar para navegación SPA real.

    
    subgraph "Rutas / Vistas Protegidas"
        direction TB
        
        %% Vistas Compartidas
        Pacientes[PacientesView]
        Medicos[MedicosView]
        Agenda[AgendaView]
        
        %% Vistas Específicas
        CitasMedico[CitasMedicoView]
        Dashboard[DashboardView]
        Auditoria[AuditoriaView]
    end

    %% Flujo MEDICO
    RoleCheck -- MEDICO --> CitasMedico
    subgraph "Menú Médico"
        M_Link1[Citas del Día] -.-> CitasMedico
        M_Link2[Agenda General] -.-> Agenda
        M_Link3[Pacientes] -.-> Pacientes
    end

    %% Flujo SECRETARIA
    RoleCheck -- SECRETARIA --> Agenda
    subgraph "Menú Secretaria"
        S_Link1[Agenda] -.-> Agenda
        S_Link2[Pacientes] -.-> Pacientes
        S_Link3[Médicos] -.-> Medicos
    end

    %% Flujo GERENTE
    RoleCheck -- GERENTE --> Dashboard
    subgraph "Menú Gerente"
        G_Link1[Dashboard] -.-> Dashboard
        G_Link2[Médicos] -.-> Medicos
        G_Link3[Auditoría] -.-> Auditoria
    end
```

## 🎯 Navegación por Rol (Frontend)

```mermaid
graph TD
    Start([Usuario Accede]) --> Login{¿Autenticado?}

    Login -->|No| LoginForm[🔑 Login<br/>Email + Password]
    LoginForm --> Auth[Supabase Auth]
    Auth --> CheckRole{¿Rol?}

    Login -->|Sí| CheckRole

    CheckRole -->|MEDICO| M[📋 Dashboard Médico]
    CheckRole -->|SECRETARIA| S[📅 Dashboard Secretaria]
    CheckRole -->|GERENTE| G[📊 Dashboard Gerente]

    M --> M1[Citas del Día]
    M --> M2[Agenda General]
    M --> M3[Pacientes]

    S --> S1[Agenda]
    S --> S2[Pacientes]

    G --> G1[Dashboard]
    G --> G2[Médicos]
    G --> G3[Auditoría]

    style LoginForm fill:#fef3c7
    style M fill:#dbeafe
    style S fill:#dcfce7
    style G fill:#fce7f3

```