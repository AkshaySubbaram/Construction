import { calculateAgencyFinancialSummary } from './dashboard';

describe('calculateAgencyFinancialSummary', () => {
  it('should sum agreed amounts and track paid and remaining balances', () => {
    const agencies = [
      { id: 'a1', name: 'Alpha', work_category: 'Civil', contact_person: 'A', phone: '1', email: null, address: null, notes: null, status: 'active', agreed_amount: 500000, start_date: null, expected_completion_date: null },
      { id: 'a2', name: 'Beta', work_category: 'Electrical', contact_person: 'B', phone: '2', email: null, address: null, notes: null, status: 'planned', agreed_amount: 250000, start_date: null, expected_completion_date: null },
    ] as any;

    const payments = [
      { id: 'p1', agency_id: 'a1', amount: 150000, status: 'paid' },
      { id: 'p2', agency_id: 'a1', amount: 70000, status: 'pending' },
      { id: 'p3', agency_id: 'a2', amount: 50000, status: 'paid' },
    ] as any;

    const result = calculateAgencyFinancialSummary(agencies, payments);

    expect(result.totalAgreed).toBe(750000);
    expect(result.totalPaid).toBe(200000);
    expect(result.totalPending).toBe(70000);
    expect(result.remainingBalance).toBe(550000);
    expect(result.totalAgencies).toBe(2);
  });
});
