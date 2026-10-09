export type MilestoneStatus =
  | 'not_started'
  | 'in_progress'
  | 'submitted_for_approval'
  | 'approved'
  | 'rejected'
  | 'completed';

export interface Milestone {
  id: string;
  agency_id: string;
  contract_id: string;
  name: string;
  description?: string | null;
  sequence_no: number;
  planned_start_date?: string | null;
  due_date?: string | null;
  agreed_amount: number;
  completion_percentage: number;
  status: MilestoneStatus;
  actual_completion_date?: string | null;
  completion_notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type MilestoneDraft = Omit<Milestone, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
};
