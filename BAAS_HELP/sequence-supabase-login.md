# Diagrama de secuencia: Login + RBAC (Supabase)

Suposiciones: uso de `@supabase/supabase-js` en frontend; políticas RLS activas en tablas (pacientes, citas, fichas, audit_logs, medicos). Claims de rol vienen en el JWT (`app_metadata.role`).

```mermaid
sequenceDiagram
  autonumber
  actor U as Usuario (email/password)
  participant UI as Frontend React
  participant Auth as Supabase Auth
  participant DB as PostgreSQL + RLS

  U->>UI: Ingresar email/password
  UI->>Auth: signInWithPassword({ email, password })
  Auth-->>UI: session { access_token (JWT), refresh_token, user{role}}
  UI->>UI: guardar tokens (memoria + storage seguro)
  UI->>UI: set currentUser (rol)
  UI->>DB: fetch /rpc/get_current_user (opcional) con Authorization: Bearer access_token
  DB-->>UI: datos de usuario según RLS

  alt token expira
    UI->>Auth: refreshSession(refresh_token)
    Auth-->>UI: new session {access_token, refresh_token}
  end

  par Acceso a datos
    UI->>DB: SELECT * FROM citas WHERE ... (rol=MEDICO filtra medico_id)
    DB-->>UI: filas permitidas por RLS
    UI->>DB: SELECT * FROM pacientes ... (SECRETARIA/GERENTE según RLS)
    DB-->>UI: filas permitidas
  end

  Note over DB: Políticas RLS aplican por rol del JWT<br/>MEDICO: solo citas propias, fichas de sus pacientes<br/>SECRETARIA: agenda y pacientes<br/>GERENTE: lectura amplia, auditoría
```

## Pasos clave
1) `supabase.auth.signInWithPassword({ email, password })` → recibir `session` con `access_token`, `refresh_token`, `user`.
2) Guardar tokens: memoria + `localStorage`/`sessionStorage` (o `Secure Storage` móvil). Enviar `Authorization: Bearer <access_token>` a API/SQL.
3) Lectura del rol: `session.user.app_metadata.role` → usar en UI (menús) y en llamadas (p.ej. filtrar por médico actual).
4) Refresh: `supabase.auth.refreshSession()` al expirar el access token.
5) RLS: crear políticas en tablas usando `auth.jwt()->>'role'` para restringir filas.
