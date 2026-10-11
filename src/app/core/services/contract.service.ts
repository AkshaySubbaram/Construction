import { Injectable } from '@angular/core';

import { type Contract, type ContractDraft } from '../models/contract.model';
import { AgencyService } from './agency.service';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root',
})
export class ContractService {
  constructor(
    private readonly agencyService: AgencyService,
    private readonly supabaseService: SupabaseService,
    private readonly authService: AuthService,
  ) {}

  async getContracts(): Promise<Contract[]> {
    const client = this.supabaseService.client;
    const agencies = await this.agencyService.getAgencies();
    const agencyMap = new Map(agencies.map((agency) => [agency.id, agency.name]));

    if (!client || !this.authService.isAuthenticated()) {
      return [];
    }

    try {
      const { data, error } = await client.from('contracts').select('*').order('created_at', { ascending: false });

      if (error) {
        if (this.isMissingTableOrRlsError(error)) {
          return [];
        }
        throw error;
      }

      return (data ?? []).map((row) => this.mapFromDb(row, agencyMap));
    } catch (error) {
      if (this.isMissingTableOrRlsError(error)) {
        return [];
      }
      throw error;
    }
  }

  async createContract(input: ContractDraft): Promise<Contract> {
    const contract: Contract = {
      ...input,
      id: input.id ?? crypto.randomUUID(),
      amount: Number(input.amount ?? 0),
      advance_amount: Number(input.advance_amount ?? 0),
      retention_amount: Number(input.retention_amount ?? 0),
      status: input.status ?? 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const client = this.supabaseService.client;
    const agencies = await this.agencyService.getAgencies();
    const agencyMap = new Map(agencies.map((agency) => [agency.id, agency.name]));

    if (!client || !this.authService.isAuthenticated()) {
      throw new Error('You must sign in before saving contracts.');
    }

    try {
      const { data, error } = await client.from('contracts').insert({ ...contract, agency_name: agencyMap.get(contract.agency_id) ?? null }).select().single();

      if (error) {
        if (this.isMissingTableOrRlsError(error)) {
          throw new Error('The contracts table or RLS policy is not ready in Supabase.');
        }
        throw error;
      }

      return this.mapFromDb(data, agencyMap);
    } catch (error) {
      if (this.isMissingTableOrRlsError(error)) {
        throw new Error('The contracts table or RLS policy is not ready in Supabase.');
      }
      throw error;
    }
  }

  async updateContract(id: string, changes: Partial<ContractDraft>): Promise<Contract> {
    const client = this.supabaseService.client;

    if (!client || !this.authService.isAuthenticated()) {
      throw new Error('You must sign in before updating contracts.');
    }

    try {
      const { data, error } = await client.from('contracts').update({ ...changes, updated_at: new Date().toISOString() }).eq('id', id).select().single();

      if (error) {
        if (this.isMissingTableOrRlsError(error)) {
          throw new Error('The contracts table or RLS policy is not ready in Supabase.');
        }
        throw error;
      }

      const agencies = await this.agencyService.getAgencies();
      const agencyMap = new Map(agencies.map((agency) => [agency.id, agency.name]));
      return this.mapFromDb(data, agencyMap);
    } catch (error) {
      if (this.isMissingTableOrRlsError(error)) {
        throw new Error('The contracts table or RLS policy is not ready in Supabase.');
      }
      throw error;
    }
  }

  private mapFromDb(row: Record<string, unknown>, agencyMap: Map<string, string>): Contract {
    const agencyId = String(row['agency_id'] ?? '');

    return {
      id: String(row['id'] ?? crypto.randomUUID()),
      agency_id: agencyId,
      agency_name: (row['agency_name'] as string | undefined) ?? agencyMap.get(agencyId) ?? 'Unknown agency',
      contract_number: String(row['contract_number'] ?? ''),
      title: String(row['title'] ?? ''),
      description: (row['description'] as string | null) ?? null,
      amount: Number(row['amount'] ?? 0),
      advance_amount: Number(row['advance_amount'] ?? 0),
      retention_amount: Number(row['retention_amount'] ?? 0),
      agreed_start_date: (row['agreed_start_date'] as string | null) ?? null,
      expected_completion_date: (row['expected_completion_date'] as string | null) ?? null,
      scope_of_work: (row['scope_of_work'] as string | null) ?? null,
      terms_and_conditions: (row['terms_and_conditions'] as string | null) ?? null,
      status: (row['status'] as Contract['status']) ?? 'draft',
      created_at: (row['created_at'] as string | undefined) ?? new Date().toISOString(),
      updated_at: (row['updated_at'] as string | undefined) ?? new Date().toISOString(),
    };
  }

  private isMissingTableOrRlsError(error: unknown): boolean {
    const message =
      typeof error === 'string'
        ? error
        : error instanceof Error
          ? error.message
          : typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string'
            ? error.message
            : JSON.stringify(error ?? '');

    const code =
      typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string' ? String(error.code) : '';

    return /relation .* does not exist|does not exist|could not find the table|schema cache|42P01|42P001|42501|PGRST205|PGRST301|RLS/i.test(`${message} ${code}`);
  }
}
