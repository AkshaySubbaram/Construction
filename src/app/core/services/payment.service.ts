import { Injectable, signal } from '@angular/core';
import { Payment, PaymentDraft, PaymentStatus } from '../models/payment.model';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly paymentsSignal = signal<Payment[]>([]);

  payments = this.paymentsSignal.asReadonly();

  getPayments(): Payment[] {
    return this.paymentsSignal();
  }

  createPayment(payload: PaymentDraft): Payment {
    const normalized: Payment = {
      ...payload,
      id: payload.id ?? `pay-${Date.now()}`,
      payment_reference: payload.payment_reference || `PAY-${Date.now()}`,
      amount: Number(payload.amount || 0),
      status: payload.status || 'planned',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.paymentsSignal.update(current => [normalized, ...current]);
    return normalized;
  }

  updatePayment(id: string, payload: Partial<PaymentDraft>): Payment | null {
    let updated: Payment | null = null;

    this.paymentsSignal.update(current =>
      current.map(item => {
        if (item.id !== id) {
          return item;
        }

        updated = { ...item, ...payload, updated_at: new Date().toISOString() } as Payment;
        return updated;
      })
    );

    return updated;
  }

  deletePayment(id: string): void {
    this.paymentsSignal.update(current => current.filter(item => item.id !== id));
  }

  getPaymentStatusSummary(): Record<PaymentStatus, number> {
    const summary: Record<PaymentStatus, number> = { planned: 0, pending: 0, paid: 0, cancelled: 0 };
    for (const payment of this.paymentsSignal()) {
      summary[payment.status] += 1;
    }
    return summary;
  }

  getTotalCommitted(): number {
    return this.paymentsSignal().reduce((sum, payment) => sum + payment.amount, 0);
  }
}
