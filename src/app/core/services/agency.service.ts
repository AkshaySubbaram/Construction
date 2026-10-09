import { Injectable } from '@angular/core';

import { environment } from '../../../environments/environment';
import { type Agency, type AgencyDraft } from '../models/agency.model';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root',
})
export class AgencyService {
  private readonly demoAgencies: Agency[] = [
    {
      id: 'agency-1',
      project_id: 'project-1',
      name: 'Prime Civil Works',
      work_category: 'Civil construction',
      contact_person: 'Ramesh Kumar',
      phone: '+91 98765 43210',
      email: 'ramesh@primecivil.in',
      address: 'Banjara Hills, Hyderabad',
      notes: 'Main RCC and structural work package.',
      status: 'active',
      start_date: '2026-02-10',
      expected_completion_date: '2026-08-15',
    },
    {
      id: 'agency-2',
      project_id: 'project-1',
      name: 'Sunrise Electricals',
      work_category: 'Electrical work',
      contact_person: 'Naveen Reddy',
      phone: '+91 99887 11223',
      email: 'naveen@sunriseelectricals.in',
      address: 'Madhapur, Hyderabad',
      notes: 'Wiring and fitting works in progress.',
      status: 'active',
      start_date: '2026-03-06',
      expected_completion_date: '2026-09-01',
    },
    {
      id: 'agency-3',
      project_id: 'project-1',
      name: 'BlueStone Plumbing',
      work_category: 'Plumbing',
      contact_person: 'Suresh Naik',
      phone: '+91 97222 77881',
      email: 'suresh@bluestoneplumbing.in',
      address: 'Kukatpally, Hyderabad',
      notes: 'Water supply and drainage installed.',
      status: 'planned',
      start_date: '2026-04-01',
      expected_completion_date: '2026-07-20',
    },
  ];

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly authService: AuthService,
  ) {}

  async getAgencies(): Promise<Agency[]> {
    const client = this.supabaseService.client;

    if (client && this.authService.isAuthenticated()) {
      try {
        const { data, error } = await client.from('agencies').select('*').order('created_at', { ascending: false });

        if (error) {
          if (this.isMissingTableOrRlsError(error)) {
            return [...this.demoAgencies];
          }
          throw error;
        }

        return (data ?? []).map((row) => this.mapFromDb(row));
      } catch (error) {
        if (this.isMissingTableOrRlsError(error)) {
          return [...this.demoAgencies];
        }
        throw error;
      }
    }

    return [...this.demoAgencies];
  }

  async createAgency(input: AgencyDraft): Promise<Agency> {
    const agency: Agency = {
      ...input,
      id: input.id ?? crypto.randomUUID(),
      status: input.status ?? 'planned',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const client = this.supabaseService.client;

    if (client && this.authService.isAuthenticated()) {
      try {
        const { data, error } = await client.from('agencies').insert({ ...agency, project_id: 'project-1' }).select().single();

        if (error) {
          if (this.isMissingTableOrRlsError(error)) {
            this.demoAgencies.unshift(agency);
            return agency;
          }
          throw error;
        }

        return this.mapFromDb(data);
      } catch (error) {
        if (this.isMissingTableOrRlsError(error)) {
          this.demoAgencies.unshift(agency);
          return agency;
        }
        throw error;
      }
    }

    this.demoAgencies.unshift(agency);
    return agency;
  }

  async updateAgency(id: string, changes: Partial<AgencyDraft>): Promise<Agency> {
    const client = this.supabaseService.client;

    if (client && this.authService.isAuthenticated()) {
      try {
        const { data, error } = await client.from('agencies').update({ ...changes, updated_at: new Date().toISOString() }).eq('id', id).select().single();

        if (error) {
          if (this.isMissingTableOrRlsError(error)) {
            return this.updateDemoAgency(id, changes);
          }
          throw error;
        }

        return this.mapFromDb(data);
      } catch (error) {
        if (this.isMissingTableOrRlsError(error)) {
          return this.updateDemoAgency(id, changes);
        }
        throw error;
      }
    }

    const index = this.demoAgencies.findIndex((agency) => agency.id === id);

    if (index === -1) {
      throw new Error('Agency not found');
    }

    const updated = {
      ...this.demoAgencies[index],
      ...changes,
      updated_at: new Date().toISOString(),
    };

    this.demoAgencies[index] = updated;
    return updated;
  }

  async deactivateAgency(id: string): Promise<Agency> {
    return this.updateAgency(id, { status: 'inactive' });
  }

  async deleteAgency(id: string): Promise<void> {
    const client = this.supabaseService.client;

    if (client && this.authService.isAuthenticated()) {
      try {
        const { error } = await client.from('agencies').delete().eq('id', id);

        if (error) {
          if (this.isMissingTableOrRlsError(error)) {
            this.removeDemoAgency(id);
            return;
          }
          throw error;
        }

        return;
      } catch (error) {
        if (this.isMissingTableOrRlsError(error)) {
          this.removeDemoAgency(id);
          return;
        }
        throw error;
      }
    }

    this.removeDemoAgency(id);
  }

  private mapFromDb(row: Record<string, unknown>): Agency {
    return {
      id: String(row['id'] ?? crypto.randomUUID()),
      project_id: (row['project_id'] as string | undefined) ?? 'project-1',
      name: String(row['name'] ?? ''),
      work_category: String(row['work_category'] ?? 'General work'),
      contact_person: String(row['contact_person'] ?? ''),
      phone: String(row['phone'] ?? ''),
      email: (row['email'] as string | null) ?? null,
      address: (row['address'] as string | null) ?? null,
      notes: (row['notes'] as string | null) ?? null,
      status: (row['status'] as Agency['status']) ?? 'planned',
      start_date: (row['start_date'] as string | null) ?? null,
      expected_completion_date: (row['expected_completion_date'] as string | null) ?? null,
      created_at: (row['created_at'] as string | undefined) ?? new Date().toISOString(),
      updated_at: (row['updated_at'] as string | undefined) ?? new Date().toISOString(),
    };
  }

  private updateDemoAgency(id: string, changes: Partial<AgencyDraft>): Agency {
    const index = this.demoAgencies.findIndex((agency) => agency.id === id);

    if (index === -1) {
      throw new Error('Agency not found');
    }

    const updated = {
      ...this.demoAgencies[index],
      ...changes,
      updated_at: new Date().toISOString(),
    };

    this.demoAgencies[index] = updated;
    return updated;
  }

  private removeDemoAgency(id: string): void {
    const index = this.demoAgencies.findIndex((agency) => agency.id === id);

    if (index === -1) {
      throw new Error('Agency not found');
    }

    this.demoAgencies.splice(index, 1);
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

  getDemoMode(): boolean {
    return !environment.supabaseUrl || !environment.supabaseAnonKey || !this.supabaseService.isConfigured;
  }
}
