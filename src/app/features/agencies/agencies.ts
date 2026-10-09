import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { Agency, AgencyStatus } from '../../core/models/agency.model';
import { AgencyService } from '../../core/services/agency.service';

@Component({
  selector: 'app-agencies',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './agencies.html',
  styleUrl: './agencies.css',
})
export class AgenciesComponent implements OnInit {
  private readonly agencyService = inject(AgencyService);
  private readonly fb = inject(FormBuilder);

  readonly agencies = signal<Agency[]>([]);
  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly statusOptions: AgencyStatus[] = ['planned', 'active', 'completed', 'inactive'];

  readonly form = this.fb.nonNullable.group({
    id: [''],
    name: ['', Validators.required],
    work_category: ['Civil construction', Validators.required],
    contact_person: [''],
    phone: [''],
    email: [''],
    address: [''],
    notes: [''],
    status: ['active' as AgencyStatus, Validators.required],
    start_date: [''],
    expected_completion_date: [''],
  });

  async ngOnInit(): Promise<void> {
    await this.loadAgencies();
  }

  async loadAgencies(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set('');

    try {
      this.agencies.set(await this.agencyService.getAgencies());
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Unable to load agencies.');
    } finally {
      this.loading.set(false);
    }
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = this.form.getRawValue();
    const agencyDetails = {
      id: payload.id || undefined,
      name: payload.name,
      work_category: payload.work_category,
      contact_person: payload.contact_person || '',
      phone: payload.phone || '',
      email: payload.email || null,
      address: payload.address || null,
      notes: payload.notes || null,
      status: payload.status,
      start_date: payload.start_date || null,
      expected_completion_date: payload.expected_completion_date || null,
    };

    try {
      if (payload.id) {
        await this.agencyService.updateAgency(payload.id, agencyDetails);
      } else {
        await this.agencyService.createAgency(agencyDetails);
      }

      this.form.reset({
        id: '',
        name: '',
        work_category: 'Civil construction',
        contact_person: '',
        phone: '',
        email: '',
        address: '',
        notes: '',
        status: 'active',
        start_date: '',
        expected_completion_date: '',
      });
      await this.loadAgencies();
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Unable to save agency.');
    }
  }

  editAgency(agency: Agency): void {
    this.form.patchValue({
      id: agency.id,
      name: agency.name,
      work_category: agency.work_category,
      contact_person: agency.contact_person,
      phone: agency.phone,
      email: agency.email ?? '',
      address: agency.address ?? '',
      notes: agency.notes ?? '',
      status: agency.status,
      start_date: agency.start_date ?? '',
      expected_completion_date: agency.expected_completion_date ?? '',
    });
  }

  async deactivateAgency(id: string): Promise<void> {
    try {
      await this.agencyService.deactivateAgency(id);
      await this.loadAgencies();
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Unable to deactivate agency.');
    }
  }
}
