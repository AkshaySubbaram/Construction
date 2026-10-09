import { Injectable, signal } from '@angular/core';

import { DailyProgressDraft, DailyProgressEntry } from '../models/progress.model';

@Injectable({ providedIn: 'root' })
export class ProgressService {
  private readonly entriesSignal = signal<DailyProgressEntry[]>([
    {
      id: 'progress-1',
      date: '2026-04-13',
      location: 'Ground floor columns',
      summary: 'Column reinforcement inspection completed and slab shuttering fixed.',
      status: 'in_progress',
      progress_percent: 68,
      manpower: 22,
      weather: 'Clear',
      notes: 'Concrete mix strength check passed.',
      attachments: ['site-photo-01.jpg', 'inspection-report.pdf'],
      created_at: '2026-04-13T08:00:00.000Z',
      updated_at: '2026-04-13T08:00:00.000Z',
    },
    {
      id: 'progress-2',
      date: '2026-04-09',
      location: 'Plinth beam zone',
      summary: 'Steel placement and waterproofing under review before final pour.',
      status: 'issue',
      progress_percent: 52,
      manpower: 18,
      weather: 'Light rain',
      notes: 'Vendor requested minor rework on grade leveling.',
      attachments: ['issue-slab-01.jpg'],
      created_at: '2026-04-09T07:37:00.000Z',
      updated_at: '2026-04-09T07:37:00.000Z',
    },
  ]);

  readonly entries = this.entriesSignal.asReadonly();

  getEntries(): DailyProgressEntry[] {
    return this.entriesSignal();
  }

  createEntry(payload: DailyProgressDraft): DailyProgressEntry {
    const entry: DailyProgressEntry = {
      ...payload,
      id: payload.id ?? `progress-${Date.now()}`,
      progress_percent: Number(payload.progress_percent ?? 0),
      manpower: Number(payload.manpower ?? 0),
      attachments: payload.attachments ?? [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.entriesSignal.update(current => [entry, ...current]);
    return entry;
  }

  updateEntry(id: string, payload: Partial<DailyProgressDraft>): DailyProgressEntry | null {
    let updated: DailyProgressEntry | null = null;

    this.entriesSignal.update(current =>
      current.map((entry) => {
        if (entry.id !== id) {
          return entry;
        }

        updated = {
          ...entry,
          ...payload,
          progress_percent: Number(payload.progress_percent ?? entry.progress_percent),
          manpower: Number(payload.manpower ?? entry.manpower),
          attachments: payload.attachments ?? entry.attachments ?? [],
          updated_at: new Date().toISOString(),
        };

        return updated;
      }),
    );

    return updated;
  }

  deleteEntry(id: string): void {
    this.entriesSignal.update(current => current.filter((entry) => entry.id !== id));
  }
}
