import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { Agency } from '../../core/models/agency.model';
import { Contract } from '../../core/models/contract.model';
import { Milestone, MilestoneStatus } from '../../core/models/milestone.model';
import { AgencyService } from '../../core/services/agency.service';
import { ContractService } from '../../core/services/contract.service';
import { MilestoneService } from '../../core/services/milestone.service';

@Component({
  selector: 'app-milestones',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './milestones.html',
  styleUrl: './milestones.css',
})
export class MilestonesComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly agencyService = inject(AgencyService);
  private readonly contractService = inject(ContractService);
  private readonly milestoneService = inject(MilestoneService);

  readonly agencies = signal<Agency[]>([]);
  readonly contracts = signal<Contract[]>([]);
  readonly milestones = signal<Milestone[]>([]);
  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly statusOptions: MilestoneStatus[] = [
    'not_started',
    'in_progress',
    'submitted_for_approval',
    'approved',
    'rejected',
    'completed',
  ];

  readonly form = this.fb.nonNullable.group({
    id: [''],
    agency_id: ['', Validators.required],
    contract_id: ['', Validators.required],
    name: ['', Validators.required],
    description: [''],
    sequence_no: [1, [Validators.required, Validators.min(1)]],
    planned_start_date: [''],
    due_date: [''],
    agreed_amount: [0, [Validators.required, Validators.min(0)]],
    completion_percentage: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
    status: ['not_started' as MilestoneStatus, Validators.required],
    actual_completion_date: [''],
    completion_notes: [''],
  });

  async ngOnInit(): Promise<void> {
    await Promise.all([this.loadAgencies(), this.loadContracts(), this.loadMilestones()]);
  }

  async loadAgencies(): Promise<void> {
    this.agencies.set(await this.agencyService.getAgencies());
  }

  async loadContracts(): Promise<void> {
    this.contracts.set(await this.contractService.getContracts());
  }

  async loadMilestones(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set('');

    try {
      this.milestones.set(await this.milestoneService.getMilestones());
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Unable to load milestones.');
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
    const milestoneDraft = {
      id: payload.id || undefined,
      agency_id: payload.agency_id,
      contract_id: payload.contract_id,
      name: payload.name,
      description: payload.description || null,
      sequence_no: Number(payload.sequence_no),
      planned_start_date: payload.planned_start_date || null,
      due_date: payload.due_date || null,
      agreed_amount: Number(payload.agreed_amount),
      completion_percentage: Number(payload.completion_percentage),
      status: payload.status,
      actual_completion_date: payload.actual_completion_date || null,
      completion_notes: payload.completion_notes || null,
    };

    try {
      if (payload.id) {
        await this.milestoneService.updateMilestone(payload.id, milestoneDraft);
      } else {
        await this.milestoneService.createMilestone(milestoneDraft);
      }

      this.form.reset({
        id: '',
        agency_id: '',
        contract_id: '',
        name: '',
        description: '',
        sequence_no: 1,
        planned_start_date: '',
        due_date: '',
        agreed_amount: 0,
        completion_percentage: 0,
        status: 'not_started',
        actual_completion_date: '',
        completion_notes: '',
      });

      await this.loadMilestones();
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Unable to save milestone.');
    }
  }

  editMilestone(milestone: Milestone): void {
    this.form.patchValue({
      id: milestone.id,
      agency_id: milestone.agency_id,
      contract_id: milestone.contract_id,
      name: milestone.name,
      description: milestone.description ?? '',
      sequence_no: milestone.sequence_no,
      planned_start_date: milestone.planned_start_date ?? '',
      due_date: milestone.due_date ?? '',
      agreed_amount: milestone.agreed_amount,
      completion_percentage: milestone.completion_percentage,
      status: milestone.status,
      actual_completion_date: milestone.actual_completion_date ?? '',
      completion_notes: milestone.completion_notes ?? '',
    });
  }
}
