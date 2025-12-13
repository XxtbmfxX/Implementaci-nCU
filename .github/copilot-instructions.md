# Copilot Instructions

This is a Chilean clinic management system (sistema de gestión clínica) with RBAC, mock data layer ready for Supabase integration, and compliance with local regulations (Ley N°21.668, N°21.719).

- Stack: React 18 + TypeScript + Vite + Tailwind v4 (utility classes in components; theme tokens in `src/styles/globals.css`). Entry in `src/main.tsx`, app shell in `src/App.tsx`.
- Run/Lint/Build: `npm i`, `npm run dev`; `npm run lint`; `npm run build` runs `tsc -b` then `vite build`. Default mocks enabled; set `VITE_USE_MOCKS` in `.env` when wiring a real backend.
- Auth/RBAC: `src/lib/auth-context.tsx` manages token (localStorage), current user, and `hasPermission` map (MEDICO/SECRETARIA/GERENTE). `AppContent` sets default view per role (medico→`citas-medico`, secretaria→`agenda`, gerente→`dashboard`).
- Navigation shell: `src/components/layout.tsx` builds role-scoped sidebar; logout clears token. Date header uses `toLocaleDateString('es-CL')`.
- Data layer contract: `src/lib/api-contracts.ts` defines the full surface (pacientes, citas, fichas, audit, dashboard, medicos). `src/lib/api-client.ts` exports `apiClient` from `createApiClient()`.
- Mock backend: `src/lib/mock-api-client.ts` implements `IApiClient` with in-memory arrays from `src/mocks/*`, `delay()` for latency, and token persistence. Logout resets mock data. When adding endpoints, update both the interface and mock.
- Domain types live in `src/domain/types.ts` (Rol, Paciente, Cita, FichaClinica, AuditLog, DashboardStats, Paginated, AuthPayload). Keep UI and client payloads aligned with these shapes.
- Login: `LoginForm` posts to `apiClient.login`; mock users from `src/README.md` (`medico|secretaria|gerente@clinica.cl` / `password`). Errors surface via Sonner toasts (`import { toast } from 'sonner@2.0.3'`).
- Patients: `PacientesView` enforces Chile RUT (`rut.js`), phone `+56[29]XXXXXXXX`, name/address length, DOB not future/>{100}y; uses `hasPermission` to gate create/edit and uses optimistic updates.
- Agenda (Secretaria): `AgendaView` fetches citas/pacientes/médicos; filters by day/semana/mes; validates date (≥today, <1 año), médico horario blocks, and prevents overlaps. Secretarias create/confirm/cancel; médicos see filtered agenda.
- Citas Médico: `CitasMedicoView` loads today’s citas for current médico, transitions PENDIENTE/CONFIRMADA → EN_ATENCION → COMPLETADA, and creates ficha clínica on completion before closing.
- Médicos: `MedicosView` validates nombre/email/teléfono; manages `horario` blocks (dia, inicio, fin); creates/updates MEDICO users; toggles activo with state synced to mock API.
- Auditoría: `AuditoriaView` pulls `getAuditLogs`, immutable table with status chips; highlights retention (15 años). Dashboard (`DashboardView`) shows aggregated metrics/charts only; values come from `getDashboardStats` mock.
- RBAC summary (also in `BAAS_HELP/sitemap-and-roles.md`): MEDICO: fichas+citas propias+pacientes; SECRETARIA: agenda+pacientes CRUD; GERENTE: dashboard+medicos CRUD+auditoría. Navigation and permissions follow this map. Permissions checked via `hasPermission(permission)` in `auth-context.tsx` with role-based maps.
- Supabase/BaaS notes: see `BAAS_HELP/security-checklist.md` and `BAAS_HELP/sequence-supabase-login.md` for token handling, RLS policies, and login/refresh flow. If replacing mocks, mirror `IApiClient` with Supabase RPC/REST and enforce RLS per rol claim.
- Styling: Tailwind base in `src/index.css`; color/radius tokens in `src/styles/globals.css`. Keep Spanish copy and existing tone when adding UI.
- Data reset: `MockApiClient` resets data on logout or missing token; avoid assuming persistence across sessions.
- Adding features: extend `IApiClient`, update `mock-api-client`, wire views with `apiClient`, and gate UI via `hasPermission`/role. Prefer toast errors and loading placeholders like existing views.
