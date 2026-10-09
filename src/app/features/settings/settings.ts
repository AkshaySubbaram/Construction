import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
})
export class SettingsComponent {
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.nonNullable.group({
    project_name: ['Green Valley Villa', Validators.required],
    project_location: ['Madhapur, Hyderabad', Validators.required],
    owner_name: ['Akshay Reddy', Validators.required],
    currency: ['INR'],
    total_budget: [2800000, [Validators.required, Validators.min(1)]],
    due_alert_days: [7, [Validators.required, Validators.min(1)]],
    notifications_enabled: [true],
    required_approval: [true],
    photo_upload_required: [true],
  });

  saveSettings(): void {
    const payload = this.form.getRawValue();
    console.log('Project settings saved:', payload);
  }
}
