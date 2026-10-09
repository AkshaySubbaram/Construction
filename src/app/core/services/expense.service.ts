import { Injectable, signal } from '@angular/core';

import { Expense, ExpenseDraft } from '../models/expense.model';

@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private readonly expensesSignal = signal<Expense[]>([
    {
      id: 'exp-1001',
      agency_id: 'agency-1',
      category: 'materials',
      description: 'Cement and steel bundle purchase',
      vendor: 'Metro Build Supply',
      amount: 425000,
      incurred_date: '2026-04-12',
      status: 'paid',
      receipt_ref: 'RCPT-3321',
      notes: 'Purchased for RCC work and slab reinforcement.',
      created_at: '2026-04-12T09:45:00.000Z',
      updated_at: '2026-04-12T09:45:00.000Z',
    },
    {
      id: 'exp-1002',
      agency_id: 'agency-2',
      category: 'labour',
      description: 'Electrical labour deployment',
      vendor: 'Sunrise Electricals',
      amount: 98000,
      incurred_date: '2026-04-15',
      status: 'approved',
      receipt_ref: 'RCPT-3391',
      notes: 'Semi-skilled labour for fixture installation.',
      created_at: '2026-04-15T11:10:00.000Z',
      updated_at: '2026-04-15T11:10:00.000Z',
    },
  ]);

  readonly expenses = this.expensesSignal.asReadonly();

  getExpenses(): Expense[] {
    return this.expensesSignal();
  }

  createExpense(payload: ExpenseDraft): Expense {
    const expense: Expense = {
      ...payload,
      id: payload.id ?? `exp-${Date.now()}`,
      amount: Number(payload.amount ?? 0),
      status: payload.status ?? 'planned',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.expensesSignal.update(current => [expense, ...current]);
    return expense;
  }

  updateExpense(id: string, payload: Partial<ExpenseDraft>): Expense | null {
    let updated: Expense | null = null;

    this.expensesSignal.update(current =>
      current.map((item) => {
        if (item.id !== id) {
          return item;
        }

        updated = {
          ...item,
          ...payload,
          amount: Number(payload.amount ?? item.amount),
          updated_at: new Date().toISOString(),
        };

        return updated;
      }),
    );

    return updated;
  }

  deleteExpense(id: string): void {
    this.expensesSignal.update(current => current.filter((item) => item.id !== id));
  }

  getTotalSpent(): number {
    return this.expensesSignal().reduce((sum, expense) => sum + expense.amount, 0);
  }
}
