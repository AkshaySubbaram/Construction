export type PaymentMethod = 'bank_transfer' | 'upi' | 'cash' | 'cheque' | 'other';
export type PaymentStatus = 'planned' | 'pending' | 'paid' | 'cancelled';

export interface Payment {
  id: string;
  agency_id: string;
  contract_id?: string | null;
  milestone_id?: string | null;
  payment_reference: string;
  amount: number;
  payment_date: string;
  payment_method: PaymentMethod;
  transaction_reference?: string | null;
  status: PaymentStatus;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type PaymentDraft = Omit<Payment, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
};
