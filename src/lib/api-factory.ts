import { MockApiClient } from './mock-api-client';
import type { IApiClient } from './api-contracts';

export function createApiClient(): IApiClient {
  // Preparado para futuros data sources (Supabase/API).
  return new MockApiClient();
}
