import { Injectable, signal } from '@angular/core';

import { Expense, ExpenseDraft } from '../models/expense.model';

@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private readonly expensesSignal = signal<Expense[]>([]);

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
