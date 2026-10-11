import { describe, expect, it, vi } from 'vitest';

import { AgencyService } from './agency.service';
import { ExpenseService } from './expense.service';

describe('Supabase-backed data services', () => {
  it('does not fall back to seeded agencies when Supabase is missing the table', async () => {
    const client = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'relation agencies does not exist', code: '42P01' },
          }),
        }),
      }),
    };

    const agencyService = new AgencyService(
      { client } as any,
      {
        isAuthenticated: () => true,
        session: () => ({ id: 'user-1' }),
      } as any,
    );

    await expect(agencyService.getAgencies()).resolves.toEqual([]);
  });

  it('starts with no seeded expense data', () => {
    const service = new ExpenseService();

    expect(service.getExpenses()).toEqual([]);
  });
});
