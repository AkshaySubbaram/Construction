export type ExpenseCategory = 'labour' | 'materials' | 'equipment' | 'permit' | 'misc';
export type ExpenseStatus = 'planned' | 'approved' | 'paid' | 'rejected';

export interface Expense {
  id: string;
  agency_id?: string | null;
  category: ExpenseCategory;
  description: string;
  vendor?: string | null;
  amount: number;
  incurred_date: string;
  status: ExpenseStatus;
  receipt_ref?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type ExpenseDraft = Omit<Expense, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
};
