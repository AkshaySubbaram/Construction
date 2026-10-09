import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { Agency } from '../../core/models/agency.model';
import { Contract } from '../../core/models/contract.model';
import { Milestone } from '../../core/models/milestone.model';
import { PaymentDraft, PaymentMethod, PaymentStatus } from '../../core/models/payment.model';
import { AgencyService } from '../../core/services/agency.service';
import { ContractService } from '../../core/services/contract.service';
import { MilestoneService } from '../../core/services/milestone.service';
import { PaymentService } from '../../core/services/payment.service';

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './payments.html',
  styleUrl: './payments.css'
})
export class PaymentsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly agencyService = inject(AgencyService);
  private readonly contractService = inject(ContractService);
  private readonly milestoneService = inject(MilestoneService);
  private readonly paymentService = inject(PaymentService);

  readonly payments = this.paymentService.payments;
  readonly agencies = signal<Agency[]>([]);
  readonly contracts = signal<Contract[]>([]);
  readonly milestones = signal<Milestone[]>([]);

  readonly totalCommitted = computed(() => this.payments().reduce((sum, payment) => sum + payment.amount, 0));
  readonly paidTotal = computed(() => this.payments().filter(payment => payment.status === 'paid').reduce((sum, payment) => sum + payment.amount, 0));
  readonly pendingTotal = computed(() => this.payments().filter(payment => payment.status === 'pending').reduce((sum, payment) => sum + payment.amount, 0));

  readonly paymentForm = this.fb.nonNullable.group({
    agency_id: ['', Validators.required],
    contract_id: [''],
    milestone_id: [''],
    payment_reference: ['', Validators.required],
    amount: [0, [Validators.required, Validators.min(1)]],
    payment_date: [new Date().toISOString().slice(0, 10), Validators.required],
    payment_method: ['bank_transfer' as PaymentMethod, Validators.required],
    transaction_reference: [''],
    status: ['planned' as PaymentStatus, Validators.required],
    notes: ['']
  });

  formError = signal<string | null>(null);
  editingId = signal<string | null>(null);

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
    this.milestones.set(await this.milestoneService.getMilestones());
  }

  submitPayment(): void {
    if (this.paymentForm.invalid) {
      this.formError.set('Please complete all required payment fields.');
      return;
    }

    const payload = this.paymentForm.getRawValue();
    const data: PaymentDraft = {
      agency_id: payload.agency_id,
      contract_id: payload.contract_id || null,
      milestone_id: payload.milestone_id || null,
      payment_reference: payload.payment_reference,
      amount: Number(payload.amount),
      payment_date: payload.payment_date,
      payment_method: payload.payment_method as PaymentMethod,
      transaction_reference: payload.transaction_reference || null,
      status: payload.status as PaymentStatus,
      notes: payload.notes || null,
    };

    if (this.editingId()) {
      this.paymentService.updatePayment(this.editingId()!, data);
      this.resetForm();
      return;
    }

    this.paymentService.createPayment(data);
    this.resetForm();
  }

  editPayment(payment: any): void {
    this.editingId.set(payment.id);
    this.paymentForm.patchValue({
      agency_id: payment.agency_id,
      contract_id: payment.contract_id ?? '',
      milestone_id: payment.milestone_id ?? '',
      payment_reference: payment.payment_reference,
      amount: payment.amount,
      payment_date: payment.payment_date,
      payment_method: payment.payment_method,
      transaction_reference: payment.transaction_reference ?? '',
      status: payment.status,
      notes: payment.notes ?? ''
    });
    this.formError.set(null);
  }

  deletePayment(id: string): void {
    this.paymentService.deletePayment(id);
    if (this.editingId() === id) {
      this.resetForm();
    }
  }

  resetForm(): void {
    this.paymentForm.reset({
      agency_id: '',
      contract_id: '',
      milestone_id: '',
      payment_reference: '',
      amount: 0,
      payment_date: new Date().toISOString().slice(0, 10),
      payment_method: 'bank_transfer',
      transaction_reference: '',
      status: 'planned',
      notes: ''
    });
    this.editingId.set(null);
    this.formError.set(null);
  }
}
