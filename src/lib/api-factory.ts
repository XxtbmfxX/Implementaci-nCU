import { MockApiClient } from './mock-api-client';
import { SupabaseApiClient } from './supabase-api-client';
import type { IApiClient } from './api-contracts';

export function createApiClient(): IApiClient {
  const useMocks = import.meta.env.VITE_USE_MOCKS === 'true';

  if (useMocks) {
    return new MockApiClient();
  }

  return new SupabaseApiClient();
}
