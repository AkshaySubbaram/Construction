import { Injectable } from '@angular/core';

import { environment } from '../../../environments/environment';
import { type Agency, type AgencyDraft } from '../models/agency.model';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root',
})
export class AgencyService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly authService: AuthService,
  ) {}

  async getAgencies(): Promise<Agency[]> {
    const client = this.supabaseService.client;

    if (!client || !this.authService.isAuthenticated()) {
      return [];
    }

    try {
      const { data, error } = await client.from('agencies').select('*').order('created_at', { ascending: false });

      if (error) {
        if (this.isMissingTableOrRlsError(error)) {
          return [];
        }
        throw error;
      }

      return (data ?? []).map((row) => this.mapFromDb(row));
    } catch (error) {
      if (this.isMissingTableOrRlsError(error)) {
        return [];
      }
      throw error;
    }
  }

  async createAgency(input: AgencyDraft): Promise<Agency> {
    const agency: Agency = {
      ...input,
      id: input.id ?? crypto.randomUUID(),
      status: input.status ?? 'planned',
      agreed_amount: Number(input.agreed_amount ?? 0),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const client = this.supabaseService.client;

    if (!client || !this.authService.isAuthenticated()) {
      throw new Error('You must sign in before saving agencies.');
    }

    try {
      const { data, error } = await client.from('agencies').insert({ ...agency, project_id: 'project-1' }).select().single();

      if (error) {
        if (this.isMissingTableOrRlsError(error)) {
          throw new Error('The agencies table or RLS policy is not ready in Supabase.');
        }
        throw error;
      }

      return this.mapFromDb(data);
    } catch (error) {
      if (this.isMissingTableOrRlsError(error)) {
        throw new Error('The agencies table or RLS policy is not ready in Supabase.');
      }
      throw error;
    }
  }

  async updateAgency(id: string, changes: Partial<AgencyDraft>): Promise<Agency> {
    const client = this.supabaseService.client;

    if (!client || !this.authService.isAuthenticated()) {
      throw new Error('You must sign in before updating agencies.');
    }

    try {
      const { data, error } = await client.from('agencies').update({ ...changes, updated_at: new Date().toISOString() }).eq('id', id).select().single();

      if (error) {
        if (this.isMissingTableOrRlsError(error)) {
          throw new Error('The agencies table or RLS policy is not ready in Supabase.');
        }
        throw error;
      }

      return this.mapFromDb(data);
    } catch (error) {
      if (this.isMissingTableOrRlsError(error)) {
        throw new Error('The agencies table or RLS policy is not ready in Supabase.');
      }
      throw error;
    }
  }

  async deactivateAgency(id: string): Promise<Agency> {
    return this.updateAgency(id, { status: 'inactive' });
  }

  async deleteAgency(id: string): Promise<void> {
    const client = this.supabaseService.client;

    if (!client || !this.authService.isAuthenticated()) {
      throw new Error('You must sign in before deleting agencies.');
    }

    try {
      const { error } = await client.from('agencies').delete().eq('id', id);

      if (error) {
        if (this.isMissingTableOrRlsError(error)) {
          throw new Error('The agencies table or RLS policy is not ready in Supabase.');
        }
        throw error;
      }

      return;
    } catch (error) {
      if (this.isMissingTableOrRlsError(error)) {
        throw new Error('The agencies table or RLS policy is not ready in Supabase.');
      }
      throw error;
    }
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
      agreed_amount: Number(row['agreed_amount'] ?? 0),
      start_date: (row['start_date'] as string | null) ?? null,
      expected_completion_date: (row['expected_completion_date'] as string | null) ?? null,
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

  getDemoMode(): boolean {
    return !!environment.demoMode;
  }
}
