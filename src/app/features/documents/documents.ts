import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';

import { PaymentService } from '../../core/services/payment.service';
import { ProgressService } from '../../core/services/progress.service';

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './documents.html',
  styleUrl: './documents.css',
})
export class DocumentsComponent {
  private readonly progressService = inject(ProgressService);
  private readonly paymentService = inject(PaymentService);

  readonly documents = computed(() => {
    const entries = this.progressService.entries();
    const paymentDocs = this.paymentService.payments().map((payment) => ({
      name: payment.transaction_reference ?? payment.payment_reference,
      type: 'Payment proof',
      date: payment.payment_date,
      related: payment.payment_reference,
    }));

    const progressDocs = entries.flatMap((entry) =>
      (entry.attachments ?? []).map((attachment) => ({
        name: attachment,
        type: 'Site evidence',
        date: entry.date,
        related: entry.location,
      })),
    );

    return [...progressDocs, ...paymentDocs];
  });
}
