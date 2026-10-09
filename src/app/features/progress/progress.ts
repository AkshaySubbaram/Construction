import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { DailyProgressDraft, ProgressStatus } from '../../core/models/progress.model';
import { ProgressService } from '../../core/services/progress.service';

@Component({
  selector: 'app-progress',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './progress.html',
  styleUrl: './progress.css',
})
export class ProgressComponent {
  private readonly fb = inject(FormBuilder);
  private readonly progressService = inject(ProgressService);

  readonly entries = this.progressService.entries;
  readonly averageProgress = computed(() => {
    const items = this.entries();
    if (!items.length) {
      return 0;
    }

    return Math.round(items.reduce((sum, item) => sum + item.progress_percent, 0) / items.length);
  });

  readonly form = this.fb.nonNullable.group({
    id: [''],
    date: [new Date().toISOString().slice(0, 10), Validators.required],
    location: ['', Validators.required],
    summary: ['', Validators.required],
    status: ['in_progress' as ProgressStatus, Validators.required],
    progress_percent: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
    manpower: [0, [Validators.required, Validators.min(0)]],
    weather: [''],
    notes: [''],
    attachments: [''],
  });

  readonly formError = signal<string | null>(null);
  readonly editingId = signal<string | null>(null);

  submitEntry(): void {
    if (this.form.invalid) {
      this.formError.set('Please complete the required progress fields.');
      return;
    }

    const payload = this.form.getRawValue();
    const draft: DailyProgressDraft = {
      id: payload.id || undefined,
      date: payload.date,
      location: payload.location,
      summary: payload.summary,
      status: payload.status as ProgressStatus,
      progress_percent: Number(payload.progress_percent),
      manpower: Number(payload.manpower),
      weather: payload.weather || null,
      notes: payload.notes || null,
      attachments: payload.attachments ? payload.attachments.split(',').map((item) => item.trim()).filter(Boolean) : [],
    };

    if (this.editingId()) {
      this.progressService.updateEntry(this.editingId()!, draft);
      this.resetForm();
      return;
    }

    this.progressService.createEntry(draft);
    this.resetForm();
  }

  editEntry(entry: any): void {
    this.editingId.set(entry.id);
    this.form.patchValue({
      id: entry.id,
      date: entry.date,
      location: entry.location,
      summary: entry.summary,
      status: entry.status,
      progress_percent: entry.progress_percent,
      manpower: entry.manpower,
      weather: entry.weather ?? '',
      notes: entry.notes ?? '',
      attachments: (entry.attachments ?? []).join(', '),
    });
    this.formError.set(null);
  }

  deleteEntry(id: string): void {
    this.progressService.deleteEntry(id);
    if (this.editingId() === id) {
      this.resetForm();
    }
  }

  resetForm(): void {
    this.form.reset({
      id: '',
      date: new Date().toISOString().slice(0, 10),
      location: '',
      summary: '',
      status: 'in_progress',
      progress_percent: 0,
      manpower: 0,
      weather: '',
      notes: '',
      attachments: '',
    });
    this.editingId.set(null);
    this.formError.set(null);
  }
}
