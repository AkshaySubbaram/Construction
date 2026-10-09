import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { Agency } from '../../core/models/agency.model';
import { Expense, ExpenseCategory, ExpenseStatus } from '../../core/models/expense.model';
import { AgencyService } from '../../core/services/agency.service';
import { ExpenseService } from '../../core/services/expense.service';

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './expenses.html',
  styleUrl: './expenses.css',
})
export class ExpensesComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly expenseService = inject(ExpenseService);
  private readonly agencyService = inject(AgencyService);

  readonly expenses = this.expenseService.expenses;
  readonly agencies = signal<Agency[]>([]);
  readonly totalSpent = computed(() => this.expenses().reduce((sum, item) => sum + item.amount, 0));
  readonly totalApproved = computed(() => this.expenses().filter((item) => item.status === 'approved' || item.status === 'paid').reduce((sum, item) => sum + item.amount, 0));

  readonly form = this.fb.nonNullable.group({
    id: [''],
    agency_id: [''],
    category: ['materials' as ExpenseCategory, Validators.required],
    description: ['', Validators.required],
    vendor: [''],
    amount: [0, [Validators.required, Validators.min(1)]],
    incurred_date: [new Date().toISOString().slice(0, 10), Validators.required],
    status: ['planned' as ExpenseStatus, Validators.required],
    receipt_ref: [''],
    notes: [''],
  });

  readonly formError = signal<string | null>(null);
  readonly editingId = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    this.agencies.set(await this.agencyService.getAgencies());
  }

  submitExpense(): void {
    if (this.form.invalid) {
      this.formError.set('Please complete the required expense fields.');
      return;
    }

    const payload = this.form.getRawValue();
    const item: Expense = {
      id: payload.id || `exp-${Date.now()}`,
      agency_id: payload.agency_id || null,
      category: payload.category,
      description: payload.description,
      vendor: payload.vendor || null,
      amount: Number(payload.amount),
      incurred_date: payload.incurred_date,
      status: payload.status,
      receipt_ref: payload.receipt_ref || null,
      notes: payload.notes || null,
    };

    if (this.editingId()) {
      this.expenseService.updateExpense(this.editingId()!, item);
      this.resetForm();
      return;
    }

    this.expenseService.createExpense(item);
    this.resetForm();
  }

  editExpense(expense: Expense): void {
    this.editingId.set(expense.id);
    this.form.patchValue({
      id: expense.id,
      agency_id: expense.agency_id ?? '',
      category: expense.category,
      description: expense.description,
      vendor: expense.vendor ?? '',
      amount: expense.amount,
      incurred_date: expense.incurred_date,
      status: expense.status,
      receipt_ref: expense.receipt_ref ?? '',
      notes: expense.notes ?? '',
    });
    this.formError.set(null);
  }

  deleteExpense(id: string): void {
    this.expenseService.deleteExpense(id);
    if (this.editingId() === id) {
      this.resetForm();
    }
  }

  resetForm(): void {
    this.form.reset({
      id: '',
      agency_id: '',
      category: 'materials',
      description: '',
      vendor: '',
      amount: 0,
      incurred_date: new Date().toISOString().slice(0, 10),
      status: 'planned',
      receipt_ref: '',
      notes: '',
    });
    this.editingId.set(null);
    this.formError.set(null);
  }
}
