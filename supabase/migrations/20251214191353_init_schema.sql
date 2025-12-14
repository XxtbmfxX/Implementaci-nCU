-- 1. Limpieza inicial (para desarrollo iterativo)
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop table if exists public.audit_logs cascade;
drop table if exists public.fichas_clinicas cascade;
drop table if exists public.citas cascade;
drop table if exists public.pacientes cascade;
drop table if exists public.users cascade;
drop table if exists public.role_permissions cascade;
drop table if exists public.permissions cascade;
drop table if exists public.roles cascade;
drop type if exists public.cita_estado_enum cascade;

-- 2. Tipos ENUM
create type public.cita_estado_enum as enum ('PENDIENTE', 'CONFIRMADA', 'EN_ATENCION', 'COMPLETADA', 'CANCELADA');

-- 3. Tabla Roles
create table public.roles (
  id uuid not null default gen_random_uuid(),
  nombre text not null unique,
  descripcion text,
  created_at timestamptz default now(),
  primary key (id)
);

-- 4. Tabla Permisos
create table public.permissions (
  id uuid not null default gen_random_uuid(),
  nombre text not null unique,
  descripcion text,
  created_at timestamptz default now(),
  primary key (id)
);

-- 5. Tabla Intermedia Roles-Permisos
create table public.role_permissions (
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

-- 6. Tabla Users (Perfiles)
create table public.users (
  id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  nombre text not null,
  rol text not null references public.roles(nombre) on update cascade default 'MEDICO',
  rut text,
  especialidad text,
  numero_registro text,
  region_trabajo text,
  titulos text[],
  telefono text,
  activo boolean default true,
  horario jsonb,
  created_at timestamptz default now(),
  primary key (id)
);

-- 7. Tabla Pacientes
create table public.pacientes (
  id uuid not null default gen_random_uuid(),
  rut text not null unique,
  nombre text not null,
  apellido text not null,
  fecha_nacimiento date not null,
  telefono text,
  email text,
  direccion text,
  prevision text,
  activo boolean default true,
  fecha_creacion timestamptz default now(),
  primary key (id)
);

-- 8. Tabla Citas
create table public.citas (
  id uuid not null default gen_random_uuid(),
  paciente_id uuid not null references public.pacientes(id),
  medico_id uuid not null references public.users(id),
  fecha date not null,
  hora_inicio time not null,
  hora_fin time not null,
  tipo_consulta text,
  estado public.cita_estado_enum not null default 'PENDIENTE',
  estado_anterior public.cita_estado_enum,
  motivo_categoria text,
  created_at timestamptz default now(),
  primary key (id)
);

-- 9. Tabla Fichas Clínicas
create table public.fichas_clinicas (
  id uuid not null default gen_random_uuid(),
  paciente_id uuid not null references public.pacientes(id),
  medico_id uuid not null references public.users(id),
  fecha timestamptz not null default now(),
  anamnesis text,
  examen_fisico text,
  diagnostico text,
  tratamiento text,
  observaciones text,
  bloqueada boolean default false,
  addenda jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  primary key (id)
);

-- 10. Tabla Audit Logs
create table public.audit_logs (
  id uuid not null default gen_random_uuid(),
  usuario_id uuid references public.users(id),
  accion text not null,
  entidad text not null,
  entidad_id text,
  fecha timestamptz default now(),
  detalles jsonb,
  primary key (id)
);

-- 11. Seed Data (Roles y Permisos Iniciales)
insert into public.roles (nombre, descripcion) values
  ('MEDICO', 'Profesional de la salud con acceso a fichas y citas propias'),
  ('SECRETARIA', 'Personal administrativo encargado de agenda y pacientes'),
  ('GERENTE', 'Administrador del sistema y gestión de personal');

-- Insertar permisos básicos (ejemplo)
insert into public.permissions (nombre, descripcion) values
  ('ver_fichas', 'Ver fichas clínicas'),
  ('crear_fichas', 'Crear nuevas fichas'),
  ('ver_agenda', 'Ver agenda completa'),
  ('gestionar_usuarios', 'Crear y editar usuarios');

-- Asignar permisos a roles (ejemplo simplificado)
-- MEDICO
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r, public.permissions p
where r.nombre = 'MEDICO' and p.nombre in ('ver_fichas', 'crear_fichas');

-- GERENTE
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r, public.permissions p
where r.nombre = 'GERENTE' and p.nombre in ('gestionar_usuarios');


-- 12. RLS Policies
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.users enable row level security;
alter table public.pacientes enable row level security;
alter table public.citas enable row level security;
alter table public.fichas_clinicas enable row level security;
alter table public.audit_logs enable row level security;

-- Políticas de lectura pública para roles (necesario para login/bootstrap)
create policy "Roles visibles para autenticados" on public.roles for select using (auth.role() = 'authenticated');
create policy "Permisos visibles para autenticados" on public.permissions for select using (auth.role() = 'authenticated');

-- Users: ver todos (para selectores), editar solo admin (o self)
create policy "Ver usuarios" on public.users for select using (auth.role() = 'authenticated');
create policy "Admin gestiona usuarios" on public.users for all using (
  exists (select 1 from public.users u where u.id = auth.uid() and u.rol = 'GERENTE')
);

-- Pacientes, Citas, Fichas: Acceso autenticado básico (refinar luego con permisos específicos)
create policy "Acceso base pacientes" on public.pacientes for all using (auth.role() = 'authenticated');
create policy "Acceso base citas" on public.citas for all using (auth.role() = 'authenticated');
create policy "Acceso base fichas" on public.fichas_clinicas for all using (auth.role() = 'authenticated');


-- 13. Trigger para nuevos usuarios
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, nombre, rol, especialidad)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nombre', 'Usuario Nuevo'),
    coalesce(new.raw_user_meta_data->>'rol', 'MEDICO'), -- Default a MEDICO si no viene rol
    new.raw_user_meta_data->>'especialidad'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
