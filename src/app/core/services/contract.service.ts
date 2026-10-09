import { Injectable } from '@angular/core';

import { type Contract, type ContractDraft } from '../models/contract.model';
import { AgencyService } from './agency.service';

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

  constructor(private readonly agencyService: AgencyService) {}

  async getContracts(): Promise<Contract[]> {
    const agencies = await this.agencyService.getAgencies();
    const agencyMap = new Map(agencies.map((agency) => [agency.id, agency.name]));

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

    const agencies = await this.agencyService.getAgencies();
    const agencyMap = new Map(agencies.map((agency) => [agency.id, agency.name]));
    const completeContract = {
      ...contract,
      agency_name: agencyMap.get(contract.agency_id) ?? 'Unknown agency',
    };

    this.demoContracts.unshift(completeContract);
    return completeContract;
  }

  async updateContract(id: string, changes: Partial<ContractDraft>): Promise<Contract> {
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
}
