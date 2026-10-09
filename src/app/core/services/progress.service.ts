import { Injectable, signal } from '@angular/core';

import { DailyProgressDraft, DailyProgressEntry } from '../models/progress.model';

@Injectable({ providedIn: 'root' })
export class ProgressService {
  private readonly entriesSignal = signal<DailyProgressEntry[]>([]);

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
