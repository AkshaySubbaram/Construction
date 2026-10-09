import { describe, expect, it, vi } from 'vitest';

import { AuthService } from './auth.service';
import type { SupabaseService } from './supabase.service';

describe('AuthService', () => {
  it('hydrates an existing Supabase session', async () => {
    const client = {
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: {
            session: {
              user: {
                id: 'user-1',
                email: 'owner@construction.com',
                user_metadata: { full_name: 'Project Owner' },
              },
            },
          },
          error: null,
        }),
        signInWithPassword: vi.fn(),
        signOut: vi.fn(),
        onAuthStateChange: vi.fn().mockReturnValue({
          data: { subscription: { unsubscribe: vi.fn() } },
        }),
      },
    };

    const service = new AuthService({ client } as unknown as SupabaseService);

    await service.initializeSession();

    expect(service.isAuthenticated()).toBe(true);
    expect(service.session()?.email).toBe('owner@construction.com');
    expect(service.session()?.displayName).toBe('Project Owner');
  });
});
