-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  usuario_id uuid,
  accion text NOT NULL,
  entidad text NOT NULL,
  entidad_id text,
  fecha timestamp with time zone DEFAULT now(),
  detalles jsonb,
  CONSTRAINT audit_logs_pkey PRIMARY KEY (id),
  CONSTRAINT audit_logs_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.users(id)
);
CREATE TABLE public.citas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  paciente_id uuid NOT NULL,
  medico_id uuid NOT NULL,
  fecha date NOT NULL,
  hora_inicio time without time zone NOT NULL,
  hora_fin time without time zone NOT NULL,
  tipo_consulta text,
  estado USER-DEFINED NOT NULL DEFAULT 'PENDIENTE'::cita_estado_enum,
  estado_anterior USER-DEFINED,
  motivo_categoria text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT citas_pkey PRIMARY KEY (id),
  CONSTRAINT citas_paciente_id_fkey FOREIGN KEY (paciente_id) REFERENCES public.pacientes(id),
  CONSTRAINT citas_medico_id_fkey FOREIGN KEY (medico_id) REFERENCES public.users(id)
);
CREATE TABLE public.fichas_clinicas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  paciente_id uuid NOT NULL,
  medico_id uuid NOT NULL,
  fecha timestamp with time zone NOT NULL DEFAULT now(),
  anamnesis text,
  examen_fisico text,
  diagnostico text,
  tratamiento text,
  observaciones text,
  bloqueada boolean DEFAULT false,
  addenda jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT fichas_clinicas_pkey PRIMARY KEY (id),
  CONSTRAINT fichas_clinicas_paciente_id_fkey FOREIGN KEY (paciente_id) REFERENCES public.pacientes(id),
  CONSTRAINT fichas_clinicas_medico_id_fkey FOREIGN KEY (medico_id) REFERENCES public.users(id)
);
CREATE TABLE public.pacientes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  rut text NOT NULL UNIQUE,
  nombre text NOT NULL,
  apellido text NOT NULL,
  fecha_nacimiento date NOT NULL,
  telefono text,
  email text,
  direccion text,
  prevision text,
  activo boolean DEFAULT true,
  fecha_creacion timestamp with time zone DEFAULT now(),
  CONSTRAINT pacientes_pkey PRIMARY KEY (id)
);
CREATE TABLE public.permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nombre text NOT NULL UNIQUE,
  descripcion text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT permissions_pkey PRIMARY KEY (id)
);
CREATE TABLE public.role_permissions (
  role_id uuid NOT NULL,
  permission_id uuid NOT NULL,
  CONSTRAINT role_permissions_pkey PRIMARY KEY (role_id, permission_id),
  CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id),
  CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id)
);
CREATE TABLE public.roles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nombre text NOT NULL UNIQUE,
  descripcion text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT roles_pkey PRIMARY KEY (id)
);
CREATE TABLE public.users (
  id uuid NOT NULL,
  email text NOT NULL,
  nombre text NOT NULL,
  rol text NOT NULL DEFAULT 'MEDICO'::text,
  rut text,
  especialidad text,
  numero_registro text,
  region_trabajo text,
  titulos ARRAY,
  telefono text,
  activo boolean DEFAULT true,
  horario jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id),
  CONSTRAINT users_rol_fkey FOREIGN KEY (rol) REFERENCES public.roles(nombre)
);