export type ContractStatus = 'draft' | 'active' | 'completed' | 'cancelled' | 'on_hold';

export interface Contract {
  id: string;
  agency_id: string;
  agency_name?: string;
  contract_number: string;
  title: string;
  description?: string | null;
  amount: number;
  advance_amount: number;
  retention_amount: number;
  agreed_start_date?: string | null;
  expected_completion_date?: string | null;
  scope_of_work?: string | null;
  terms_and_conditions?: string | null;
  status: ContractStatus;
  created_at?: string;
  updated_at?: string;
}

export type ContractDraft = Omit<Contract, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
};
