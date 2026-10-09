import { Injectable, signal } from '@angular/core';
import { Payment, PaymentDraft, PaymentStatus } from '../models/payment.model';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly paymentsSignal = signal<Payment[]>([
    {
      id: 'pay-1001',
      agency_id: 'agency-1',
      contract_id: 'contract-1',
      milestone_id: 'milestone-1',
      payment_reference: 'INV-2024-001',
      amount: 180000,
      payment_date: '2024-05-15',
      payment_method: 'bank_transfer',
      transaction_reference: 'NEFT-845210',
      status: 'paid',
      notes: 'Foundation works advance payment',
      created_at: '2024-05-15T10:00:00.000Z',
      updated_at: '2024-05-15T10:00:00.000Z'
    },
    {
      id: 'pay-1002',
      agency_id: 'agency-2',
      contract_id: 'contract-2',
      milestone_id: 'milestone-2',
      payment_reference: 'INV-2024-002',
      amount: 95000,
      payment_date: '2024-06-08',
      payment_method: 'upi',
      transaction_reference: 'UPI-778810',
      status: 'pending',
      notes: 'Plumbing and electrical rough-in',
      created_at: '2024-06-08T12:30:00.000Z',
      updated_at: '2024-06-08T12:30:00.000Z'
    }
  ]);

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
