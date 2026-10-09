export type ProgressStatus = 'planned' | 'in_progress' | 'completed' | 'issue';

export interface DailyProgressEntry {
  id: string;
  date: string;
  location: string;
  summary: string;
  status: ProgressStatus;
  progress_percent: number;
  manpower: number;
  weather?: string | null;
  notes?: string | null;
  attachments?: string[];
  created_at?: string;
  updated_at?: string;
}

export type DailyProgressDraft = Omit<DailyProgressEntry, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
};
