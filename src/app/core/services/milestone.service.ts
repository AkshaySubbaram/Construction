import { Injectable } from '@angular/core';

import { type Milestone, type MilestoneDraft } from '../models/milestone.model';
import { AgencyService } from './agency.service';

@Injectable({
  providedIn: 'root',
})
export class MilestoneService {
  private readonly demoMilestones: Milestone[] = [
    {
      id: 'milestone-1',
      agency_id: 'agency-1',
      contract_id: 'contract-1',
      name: 'Foundation completion',
      description: 'Footings and plinth foundation completed.',
      sequence_no: 1,
      planned_start_date: '2026-02-20',
      due_date: '2026-03-15',
      agreed_amount: 320000,
      completion_percentage: 100,
      status: 'approved',
      actual_completion_date: '2026-03-12',
      completion_notes: 'All footing checks passed.',
    },
    {
      id: 'milestone-2',
      agency_id: 'agency-1',
      contract_id: 'contract-1',
      name: 'Ground-floor slab',
      description: 'Slab and column work for ground floor level.',
      sequence_no: 3,
      planned_start_date: '2026-04-10',
      due_date: '2026-05-15',
      agreed_amount: 440000,
      completion_percentage: 55,
      status: 'in_progress',
      completion_notes: 'Steel reinforcement and formwork in progress.',
    },
  ];

  constructor(private readonly agencyService: AgencyService) {}

  async getMilestones(): Promise<Milestone[]> {
    const agencies = await this.agencyService.getAgencies();
    const agencyMap = new Map(agencies.map((agency) => [agency.id, agency.name]));
    return this.demoMilestones.map((milestone) => ({
      ...milestone,
      agency_name: agencyMap.get(milestone.agency_id),
    })) as Milestone[] & { agency_name?: string };
  }

  async createMilestone(input: MilestoneDraft): Promise<Milestone> {
    const milestone: Milestone = {
      ...input,
      id: input.id ?? crypto.randomUUID(),
      agreed_amount: Number(input.agreed_amount ?? 0),
      completion_percentage: Number(input.completion_percentage ?? 0),
      sequence_no: Number(input.sequence_no ?? 1),
      status: input.status ?? 'not_started',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.demoMilestones.unshift(milestone);
    return milestone;
  }

  async updateMilestone(id: string, changes: Partial<MilestoneDraft>): Promise<Milestone> {
    const index = this.demoMilestones.findIndex((milestone) => milestone.id === id);

    if (index === -1) {
      throw new Error('Milestone not found');
    }

    const updated = {
      ...this.demoMilestones[index],
      ...changes,
      agreed_amount: Number(changes.agreed_amount ?? this.demoMilestones[index].agreed_amount),
      completion_percentage: Number(changes.completion_percentage ?? this.demoMilestones[index].completion_percentage),
      sequence_no: Number(changes.sequence_no ?? this.demoMilestones[index].sequence_no),
      updated_at: new Date().toISOString(),
    };

    this.demoMilestones[index] = updated;
    return updated;
  }
}
