Informe Técnico de Repositorio: Implementación Sistema Casos de Uso
1. Resumen Ejecutivo
Este repositorio contiene el código fuente de una Single Page Application (SPA) desarrollada en React con TypeScript y Vite, diseñada para la gestión clínica (Agenda, Pacientes, Fichas, Médicos). Su arquitectura está preparada para operar en dos modos: un modo de prototipado rápido usando datos simulados en memoria (Mock) y un modo persistente conectado a Supabase (PostgreSQL + Auth).

El proyecto está claramente orientado a un MVP (Producto Mínimo Viable) profesional, con énfasis en la separación de responsabilidades a través de una capa de abstracción de API (
IApiClient
). La interfaz de usuario es moderna y responsiva, utilizando Tailwind CSS y componentes de Radix UI/Shadcn. El estado del desarrollo es avanzado en cuanto a frontend y lógica de UI, pero la capa de persistencia real (Supabase) requiere maduración en seguridad y lógica de negocio en el servidor.

El público objetivo parece ser un equipo de desarrollo que necesita validar flujos funcionales de un sistema médico antes de invertir en una infraestructura backend compleja, o bien una implementación ligera tipo SaaS sobre servicios BaaS.

2. Visión de Arquitectura
El sistema sigue una arquitectura de capas simple centrada en el cliente. La capa de vista (React) se comunica exclusivamente a través de una interfaz de contrato (
IApiClient
), lo que permite intercambiar la infraestructura de datos sin tocar la UI.

mermaid
graph TD
    subgraph Client ["Cliente (Browser)"]
        UI["React Components<br>(Views/Layouts)"]
        Router["React Router"]
        Hooks["Custom Hooks<br>(useAuth)"]
    end
    subgraph Abstraction ["Capa de Abstracción"]
        Contract["Interface IApiClient<br>(src/lib/api-contracts.ts)"]
    end
    subgraph Infrastructure ["Infraestructura de Datos"]
        Mock["MockApiClient<br>(In-Memory Arrays)"]
        SupabaseImpl["SupabaseApiClient<br>(@supabase/supabase-js)"]
    end
    subgraph Backend ["Backend Services"]
        Postgres["Supabase DB<br>(PostgreSQL 17)"]
        Auth["Supabase Auth"]
    end
    UI --> Router
    Router --> Hooks
    Hooks --> Contract
    Contract <|.. Mock : Implementa
    Contract <|.. SupabaseImpl : Implementa
    SupabaseImpl --> Backend
3. Mapa de Componentes Principales
Archivo/Directorio	Responsabilidad
src/lib/api-contracts.ts
Núcleo: Define las interfaces de datos (Tipos) y el contrato del servicio API.
src/lib/api-client.ts
Factory/Proxy: Instancia y exporta la implementación correcta (
Mock
 o 
Supabase
) según variables de entorno.
src/components/agenda-view.tsx
Lógica UI Compleja: Gestión de calendario, validación de traslapes y horarios médicos.
src/components/layout.tsx
Estructura: Layout principal, navegación lateral y manejo de sesión visual.
src/lib/mock-api-client.ts
Simulación: Implementación completa de lógica de negocio en memoria para desarrollo/demo.
supabase/migrations/*	Persistencia: Definición del esquema SQL real para producción.
4. Endpoints y Contratos (Interfaz 
IApiClient
)
El sistema abstrae las llamadas HTTP/DB en métodos tipados. A continuación los contratos críticos:

Método (Contrato TypeScript)	Inputs	Outputs	Auth Requerida
login
email, password	
User
, 
Token
No
getCitas
fecha, medico_id, paciente_id	Paginated<Cita>	Sí
createCita
Cita
 (sin ID/Estado)	
Cita
 (creada)	Sí
getPacientes
search, page, limit	Paginated<Paciente>	Sí
updateCita
id, Partial<Cita>	
Cita
 (actualizada)	Sí
createFicha
FichaClinica data	FichaClinica	Sí (Médico)
5. Flujo de Datos y Almacenamiento
Datos Críticos:

Pacientes: Información sensible (RUT, nombre, contacto).
Citas: Relación temporal médico-paciente-estado.
Fichas Clínicas: Datos médicos confidenciales (anamnesis, diagnósticos). Alta sensibilidad.
Almacenamiento:

Local (Dev): localStorage para token y estado volátil en arrays JS (
MockApiClient
).
Producción (Supabase): PostgreSQL 17.
Esquema definido en 
supabase/migrations/20251214191353_init_schema.sql
.
Tablas principales: pacientes, citas, fichas_clinicas, users, audit_logs.
Observación: El esquema incluye tipos ENUM para estados (cita_estado_enum) y JSONB para estructuras flexibles (addenda).
6. Dependencias
Dependencia	Versión	Tipo	Estado/Riesgo
react	^18.3.1	Core	Estable.
supabase-js	^2.87.1	Cliente DB	Actualizado.
react-router	^7.10.1	Routing	Versión muy reciente/bleeding edge. Verificar estabilidad.
tailwindcss	^4.1.17	Estilos	Versión 4 (Alpha/Beta recientes). Posibles cambios de API.
lucide-react	^0.487.0	Iconos	Seguro.
sonner	^2.0.3	UI	Seguro (Toast notifications).
Nota: El uso de react-router v7 y tailwindcss v4 sugiere que el proyecto utiliza versiones "Next" o muy recientes, lo que puede implicar inestabilidad en APIs si no se fijan versiones exactas.

7. Instrucciones de Ejecución
Prerrequisitos: Node.js 18+, NPM/PNPM. Docker (para Supabase local).

Para desarrollo (Modo Mock - Recomendado inicial):

bash
# 1. Instalar dependencias
npm install
# 2. Configurar entorno (Mock activado por defecto)
cp .env.example .env
# 3. Ejecutar servidor de desarrollo
npm run dev
# Acceder a http://localhost:5173
Para ejecutar con Supabase local:

bash
# 1. Instalar CLI de Supabase (si no está)
npm install -g supabase
# 2. Iniciar servicios Docker
supabase start
# 3. Editar .env para desactivar Mock
# VITE_USE_MOCKS=false
# VITE_SUPABASE_URL=... (output de supabase start)
# VITE_SUPABASE_ANON_KEY=...
# 4. Ejecutar aplicación
npm run dev
8. Tests
Estado: Inexistente / No configurado.
Evidencia: No hay scripts de test en 
package.json
 (solo dev, build, lint). No hay archivos *.test.ts o *.spec.ts en src/.
Cobertura: 0%.
Observación: La arquitectura facilita enormemente el testing gracias a 
MockApiClient
, pero no se ha implementado un framework de pruebas (Jest/Vitest).
9. Riesgos y Hallazgos de Seguridad
Prioridad	Riesgo	Evidencia/Ubicación
ALTA	Lógica crítica en cliente confiando en Mock. Validaciones de traslape de horarios y disponibilidad médica están en 
agenda-view.tsx
 y 
mock-api-client.ts
. En 
supabase-api-client.ts
 no existen, por lo que la integridad de datos depende de la UI, lo cual es inseguro.	src/components/agenda-view.tsx:166, src/lib/supabase-api-client.ts:180
ALTA	Políticas RLS Permisivas. Las políticas de base de datos permiten lectura/escritura a cualquier usuario autenticado (auth.role() = 'authenticated'). Un paciente podría técnicamente consultar citas de otros si descubre el endpoint, ya que no hay filtro por user_id en la política SQL.	migration...init_schema.sql:167 (create policy "Acceso base pacientes" ...)
MEDIA	Creación de usuarios Auth. El cliente Supabase intenta crear usuarios médicos directamente. Esto suele requerir permisos de administración (service_role) que no deben estar en el cliente, o un endpoint seguro (Edge Function).	src/lib/supabase-api-client.ts:313
BAJA	Versiones inestables. Dependencias core (react-router v7, tailwindcss v4) en versiones muy nuevas podrían introducir breaking changes.	
package.json
10. Tareas Accionables Priorizadas
[Alta - Corto Plazo] Migrar Lógica de Negocio a Backend: Mover la validación de "No traslape de citas" y "Horario Médico" a una Database Function en PostgreSQL o un Trigger, para que se aplique tanto en Mock como en Producción de forma segura.
[Alta - Corto Plazo] Endurecer RLS (Row Level Security): Modificar 
schema.sql
 para que los Pacientes solo vean sus propios datos y los Médicos solo sus citas asignadas.
Acción: Cambiar using (auth.role() = 'authenticated') por using (auth.uid() = paciente_id OR auth.uid() = medico_id).
[Media - Medio Plazo] Implementar Tests Unitarios: Instalar vitest y crear pruebas unitarias al menos para agenda-view (lógica de fechas) y api-client (contratos).
[Media - Largo Plazo] Edge Function para Gestión de Usuarios: Implementar función segura para crear cuentas de usuario (roles Médico/Secretaria) sin exponer privilegios administrativos en el frontend.
11. Archivos Recomendados para Inspección Manual
src/lib/api-contracts.ts
 (Líneas 1-48): Entender qué puede hacer el sistema exactamente.
src/components/agenda-view.tsx
 (Líneas 165-213): Revisar la lógica actual de detección de conflictos de agenda (susceptible a errores de zona horaria o condiciones de carrera).
supabase/migrations/20251214191353_init_schema.sql
 (Líneas 146-170): Verificar las políticas de seguridad RLS actuales.
3 Pasos Recomendados Inmediatos
Instalar Vitest y crear un primer test simple importando 
MockApiClient
 para asegurar que las validaciones de negocio funcionan automáticamente.
