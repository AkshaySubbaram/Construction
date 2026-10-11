import { Injectable } from '@angular/core';

import { type Milestone, type MilestoneDraft } from '../models/milestone.model';
import { AgencyService } from './agency.service';

@Injectable({
  providedIn: 'root',
})
export class MilestoneService {
  constructor(private readonly agencyService: AgencyService) {}

  async getMilestones(): Promise<Milestone[]> {
    const agencies = await this.agencyService.getAgencies();
    const agencyMap = new Map(agencies.map((agency) => [agency.id, agency.name]));

    return [] as Milestone[] & { agency_name?: string };
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

    return milestone;
  }

  async updateMilestone(id: string, changes: Partial<MilestoneDraft>): Promise<Milestone> {
    throw new Error('Milestone updates must be saved to Supabase. No seeded milestone data is allowed.');
  }
}
