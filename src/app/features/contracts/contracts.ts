import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { Agency } from '../../core/models/agency.model';
import { Contract, ContractStatus } from '../../core/models/contract.model';
import { AgencyService } from '../../core/services/agency.service';
import { ContractService } from '../../core/services/contract.service';

@Component({
  selector: 'app-contracts',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './contracts.html',
  styleUrl: './contracts.css',
})
export class ContractsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly agencyService = inject(AgencyService);
  private readonly contractService = inject(ContractService);

  readonly contracts = signal<Contract[]>([]);
  readonly agencies = signal<Agency[]>([]);
  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly statusOptions: ContractStatus[] = ['draft', 'active', 'completed', 'cancelled', 'on_hold'];

  readonly form = this.fb.nonNullable.group({
    id: [''],
    agency_id: ['', Validators.required],
    contract_number: ['', Validators.required],
    title: ['', Validators.required],
    description: [''],
    amount: [0, [Validators.required, Validators.min(0)]],
    advance_amount: [0, Validators.min(0)],
    retention_amount: [0, Validators.min(0)],
    agreed_start_date: [''],
    expected_completion_date: [''],
    scope_of_work: [''],
    terms_and_conditions: [''],
    status: ['draft' as ContractStatus, Validators.required],
  });

  async ngOnInit(): Promise<void> {
    await Promise.all([this.loadAgencies(), this.loadContracts()]);
  }

  async loadAgencies(): Promise<void> {
    this.agencies.set(await this.agencyService.getAgencies());
  }

  async loadContracts(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set('');

    try {
      this.contracts.set(await this.contractService.getContracts());
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Unable to load contracts.');
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
    const contractDraft = {
      id: payload.id || undefined,
      agency_id: payload.agency_id,
      contract_number: payload.contract_number,
      title: payload.title,
      description: payload.description || null,
      amount: Number(payload.amount),
      advance_amount: Number(payload.advance_amount),
      retention_amount: Number(payload.retention_amount),
      agreed_start_date: payload.agreed_start_date || null,
      expected_completion_date: payload.expected_completion_date || null,
      scope_of_work: payload.scope_of_work || null,
      terms_and_conditions: payload.terms_and_conditions || null,
      status: payload.status,
    };

    try {
      if (payload.id) {
        await this.contractService.updateContract(payload.id, contractDraft);
      } else {
        await this.contractService.createContract(contractDraft);
      }

      this.form.reset({
        id: '',
        agency_id: '',
        contract_number: '',
        title: '',
        description: '',
        amount: 0,
        advance_amount: 0,
        retention_amount: 0,
        agreed_start_date: '',
        expected_completion_date: '',
        scope_of_work: '',
        terms_and_conditions: '',
        status: 'draft',
      });

      await this.loadContracts();
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Unable to save contract.');
    }
  }

  editContract(contract: Contract): void {
    this.form.patchValue({
      id: contract.id,
      agency_id: contract.agency_id,
      contract_number: contract.contract_number,
      title: contract.title,
      description: contract.description ?? '',
      amount: contract.amount,
      advance_amount: contract.advance_amount,
      retention_amount: contract.retention_amount,
      agreed_start_date: contract.agreed_start_date ?? '',
      expected_completion_date: contract.expected_completion_date ?? '',
      scope_of_work: contract.scope_of_work ?? '',
      terms_and_conditions: contract.terms_and_conditions ?? '',
      status: contract.status,
    });
  }
}
