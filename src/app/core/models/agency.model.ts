export type AgencyStatus = 'planned' | 'active' | 'completed' | 'inactive';

export interface Agency {
  id: string;
  project_id?: string;
  name: string;
  work_category: string;
  contact_person: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  status: AgencyStatus;
  start_date?: string | null;
  expected_completion_date?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type AgencyDraft = Omit<Agency, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
};
