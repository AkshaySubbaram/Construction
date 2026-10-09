import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';

import { ExpenseService } from '../../core/services/expense.service';
import { PaymentService } from '../../core/services/payment.service';
import { ProgressService } from '../../core/services/progress.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reports.html',
  styleUrl: './reports.css',
})
export class ReportsComponent {
  private readonly paymentService = inject(PaymentService);
  private readonly expenseService = inject(ExpenseService);
  private readonly progressService = inject(ProgressService);

  readonly totalCommitted = computed(() => this.paymentService.getTotalCommitted());
  readonly totalPaid = computed(() =>
    this.paymentService.payments().filter((payment) => payment.status === 'paid').reduce((sum, payment) => sum + payment.amount, 0),
  );
  readonly totalSpent = computed(() => this.expenseService.getTotalSpent());
  readonly averageProgress = computed(() => {
    const items = this.progressService.entries();
    if (!items.length) {
      return 0;
    }

    return Math.round(items.reduce((sum, item) => sum + item.progress_percent, 0) / items.length);
  });

  readonly remainingBalance = computed(() => this.totalCommitted() - this.totalPaid());
  readonly variance = computed(() => this.totalPaid() - this.totalSpent());
  readonly paymentCoverage = computed(() => {
    const committed = this.totalCommitted();
    return committed > 0 ? (this.totalPaid() / committed) * 100 : 0;
  });
}
