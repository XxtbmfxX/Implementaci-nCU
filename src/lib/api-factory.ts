import { MockApiClient } from './mock-api-client';
import { SupabaseApiClient } from './supabase-api-client';
import type { IApiClient } from './api-contracts';

let mockInstance: MockApiClient | null = null;

export function createApiClient(): IApiClient {
  const useMocks = import.meta.env.VITE_USE_MOCKS === 'true';

  if (useMocks) {
    if (!mockInstance) {
      mockInstance = new MockApiClient();
    }
    return mockInstance;
  }

  return new SupabaseApiClient();
}
