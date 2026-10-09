import { Injectable } from '@angular/core';

import { type Contract, type ContractDraft } from '../models/contract.model';
import { AgencyService } from './agency.service';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root',
})
export class ContractService {
  private readonly demoContracts: Contract[] = [
    {
      id: 'contract-1',
      agency_id: 'agency-1',
      agency_name: 'Prime Civil Works',
      contract_number: 'CC-2026-001',
      title: 'Structural civil work',
      description: 'Foundation, RCC, and wall construction for ground floor.',
      amount: 1850000,
      advance_amount: 200000,
      retention_amount: 50000,
      agreed_start_date: '2026-02-15',
      expected_completion_date: '2026-08-15',
      scope_of_work: 'Excavation, foundation, RCC, walls, and structural work.',
      terms_and_conditions: 'Milestone-based billing and retained amount after final completion.',
      status: 'active',
    },
    {
      id: 'contract-2',
      agency_id: 'agency-2',
      agency_name: 'Sunrise Electricals',
      contract_number: 'EL-2026-014',
      title: 'Internal electrical installation',
      description: 'Wiring, fixtures, and panel installation.',
      amount: 420000,
      advance_amount: 60000,
      retention_amount: 15000,
      agreed_start_date: '2026-03-10',
      expected_completion_date: '2026-09-05',
      scope_of_work: 'Concealed wiring, DB installation, light fixtures and fans.',
      terms_and_conditions: 'Stage completion and final testing required.',
      status: 'active',
    },
  ];

  constructor(
    private readonly agencyService: AgencyService,
    private readonly supabaseService: SupabaseService,
    private readonly authService: AuthService,
  ) {}

  async getContracts(): Promise<Contract[]> {
    const client = this.supabaseService.client;
    const agencies = await this.agencyService.getAgencies();
    const agencyMap = new Map(agencies.map((agency) => [agency.id, agency.name]));

    if (client && this.authService.isAuthenticated()) {
      try {
        const { data, error } = await client.from('contracts').select('*').order('created_at', { ascending: false });

        if (error) {
          if (this.isMissingTableOrRlsError(error)) {
            return this.demoContracts.map((contract) => ({
              ...contract,
              agency_name: agencyMap.get(contract.agency_id) ?? contract.agency_name ?? 'Unknown agency',
            }));
          }
          throw error;
        }

        return (data ?? []).map((row) => this.mapFromDb(row, agencyMap));
      } catch (error) {
        if (this.isMissingTableOrRlsError(error)) {
          return this.demoContracts.map((contract) => ({
            ...contract,
            agency_name: agencyMap.get(contract.agency_id) ?? contract.agency_name ?? 'Unknown agency',
          }));
        }
        throw error;
      }
    }

    return this.demoContracts.map((contract) => ({
      ...contract,
      agency_name: agencyMap.get(contract.agency_id) ?? contract.agency_name ?? 'Unknown agency',
    }));
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

    if (client && this.authService.isAuthenticated()) {
      try {
        const { data, error } = await client.from('contracts').insert({ ...contract, agency_name: agencyMap.get(contract.agency_id) ?? null }).select().single();

        if (error) {
          if (this.isMissingTableOrRlsError(error)) {
            const completeContract = { ...contract, agency_name: agencyMap.get(contract.agency_id) ?? 'Unknown agency' };
            this.demoContracts.unshift(completeContract);
            return completeContract;
          }
          throw error;
        }

        return this.mapFromDb(data, agencyMap);
      } catch (error) {
        if (this.isMissingTableOrRlsError(error)) {
          const completeContract = { ...contract, agency_name: agencyMap.get(contract.agency_id) ?? 'Unknown agency' };
          this.demoContracts.unshift(completeContract);
          return completeContract;
        }
        throw error;
      }
    }

    const completeContract = {
      ...contract,
      agency_name: agencyMap.get(contract.agency_id) ?? 'Unknown agency',
    };

    this.demoContracts.unshift(completeContract);
    return completeContract;
  }

  async updateContract(id: string, changes: Partial<ContractDraft>): Promise<Contract> {
    const client = this.supabaseService.client;

    if (client && this.authService.isAuthenticated()) {
      try {
        const { data, error } = await client.from('contracts').update({ ...changes, updated_at: new Date().toISOString() }).eq('id', id).select().single();

        if (error) {
          if (this.isMissingTableOrRlsError(error)) {
            return this.updateDemoContract(id, changes);
          }
          throw error;
        }

        const agencies = await this.agencyService.getAgencies();
        const agencyMap = new Map(agencies.map((agency) => [agency.id, agency.name]));
        return this.mapFromDb(data, agencyMap);
      } catch (error) {
        if (this.isMissingTableOrRlsError(error)) {
          return this.updateDemoContract(id, changes);
        }
        throw error;
      }
    }

    return this.updateDemoContract(id, changes);
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

  private updateDemoContract(id: string, changes: Partial<ContractDraft>): Contract {
    const index = this.demoContracts.findIndex((contract) => contract.id === id);

    if (index === -1) {
      throw new Error('Contract not found');
    }

    const updated = {
      ...this.demoContracts[index],
      ...changes,
      amount: Number(changes.amount ?? this.demoContracts[index].amount),
      advance_amount: Number(changes.advance_amount ?? this.demoContracts[index].advance_amount),
      retention_amount: Number(changes.retention_amount ?? this.demoContracts[index].retention_amount),
      updated_at: new Date().toISOString(),
    };

    this.demoContracts[index] = updated;
    return updated;
  }

  private isMissingTableOrRlsError(error: unknown): boolean {
    const text = error instanceof Error ? error.message : String(error ?? '');
    return /relation .* does not exist|does not exist|42P01|42501|PGRST301|RLS/i.test(text);
  }
}
