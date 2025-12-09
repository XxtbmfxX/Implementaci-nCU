# Checklist de seguridad (Supabase / BaaS)

## Tokens y sesión
- Usar `access_token` corto (<= 60m) y `refresh_token` rotativo; habilitar rotación obligatoria en Supabase.
- Almacenar tokens en memoria + `localStorage`/`sessionStorage` solo si es necesario; preferir `Auth Helpers` que renuevan tokens automáticamente.
- Enviar siempre `Authorization: Bearer <access_token>`; nunca exponer `service_role` en frontend.
- Invalidar sesión en logout: `supabase.auth.signOut()` + limpiar storage.

## RLS/ABAC
- Activar RLS en todas las tablas de datos sensibles (pacientes, citas, fichas, audit_logs, medicos).
- Políticas por rol (JWT claim `role`):
  - MEDICO: `medico_id = auth.uid()` en citas/fichas; acceso solo a pacientes vinculados via citas.
  - SECRETARIA: puede insertar/actualizar pacientes; ver citas para agenda general; sin acceso a fichas.
  - GERENTE: lectura amplia; escritura en medicos; lectura de auditoría.
- Añadir política de denegar por defecto: `USING false` para todo rol no contemplado.
- Separar funciones RPC para operaciones complejas y protegerlas con `SECURITY DEFINER` + chequeo de rol.

## Expiración y refresh
- Manejar `onAuthStateChange` para refrescar tokens cuando caduquen.
- Registrar intentos fallidos de refresh y forzar re-login tras 1-2 fallos consecutivos.

## Auditoría y trazabilidad
- Registrar en tabla `audit_logs`: user_id, acción, entidad, entidad_id, timestamp, ip (si disponible), contexto.
- Proteger `audit_logs` con RLS: solo GERENTE lee; inserciones solo vía `SECURITY DEFINER` trigger o RPC.

## Transporte y almacenamiento
- Habilitar TLS 1.2+; rechazar HTTP plano.
- Cifrar datos sensibles en reposo cuando aplique (campos sensibles con pgcrypto o KMS externo).
- No loggear PII completa; anonimizar en dashboards (como en `DashboardView`).

## Límites y mitigaciones
- Rate limiting / WAF frente a `/auth/*` y `/rpc/*` (Cloudflare/APIGW recomendado).
- Protección CSRF: si usas cookies de Supabase, habilitar `sameSite=strict` y `secure`; si usas Bearer, no reflejar tokens en el DOM.
- Validar inputs en frontend (RUT, teléfono, fechas) y también en backend (constraint CHECK / domain) para confianza cero.

## Gestión de secretos y configuración
- Mantener claves `SUPABASE_URL`, `SUPABASE_ANON_KEY` en envs `.env.local`; no commitear.
- Usar clave `service_role` solo en backend seguro (never frontend).
- Versionar políticas y migraciones con SQL en control de versiones.

## Recuperación y continuidad
- Backups automáticos y pruebas de restore periódicas.
- Monitoreo de uptime y alertas sobre fallos de login, tasa de 401/403 y errores 5xx.
