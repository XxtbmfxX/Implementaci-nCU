import { createApiClient } from './api-factory';
import type { IApiClient } from './api-contracts';

export type {
  AuditLog,
  Cita,
  DashboardStats,
  FichaClinica,
  Paciente,
  Rol,
  User,
} from '../domain/types';

export type { IApiClient };

export const apiClient: IApiClient = createApiClient();