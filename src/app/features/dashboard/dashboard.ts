import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { jsPDF } from 'jspdf';

import { Agency } from '../../core/models/agency.model';
import { Payment } from '../../core/models/payment.model';
import { AgencyService } from '../../core/services/agency.service';
import { PaymentService } from '../../core/services/payment.service';

export function calculateAgencyFinancialSummary(agencies: Agency[], payments: Payment[]) {
  const totalAgreed = agencies.reduce((sum, agency) => sum + Number(agency.agreed_amount ?? 0), 0);
  const totalPaid = payments.filter((payment) => payment.status === 'paid').reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0);
  const totalPending = payments.filter((payment) => payment.status === 'pending').reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0);
  const remainingBalance = totalAgreed - totalPaid;

  return {
    totalAgencies: agencies.length,
    totalAgreed,
    totalPaid,
    totalPending,
    remainingBalance,
  };
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardComponent implements OnInit {
  private readonly agencyService = inject(AgencyService);
  private readonly paymentService = inject(PaymentService);
  readonly agencies = signal<Agency[]>([]);

  readonly financialSummary = computed(() => calculateAgencyFinancialSummary(this.agencies(), this.paymentService.payments()));

  readonly cards = computed(() => {
    const list = this.agencies();
    const summary = this.financialSummary();
    const active = list.filter((agency) => agency.status === 'active').length;
    const planned = list.filter((agency) => agency.status === 'planned').length;
    const completed = list.filter((agency) => agency.status === 'completed').length;
    const inactive = list.filter((agency) => agency.status === 'inactive').length;

    return [
      { label: 'Active agencies', value: String(active), tone: 'primary' },
      { label: 'Planned agencies', value: String(planned), tone: 'accent' },
      { label: 'Completed agencies', value: String(completed), tone: 'success' },
      { label: 'Inactive agencies', value: String(inactive), tone: 'neutral' },
      { label: 'Total agreed', value: `₹${summary.totalAgreed.toLocaleString('en-IN')}`, tone: 'neutral' },
      { label: 'Paid', value: `₹${summary.totalPaid.toLocaleString('en-IN')}`, tone: 'success' },
      { label: 'Balance due', value: `₹${summary.remainingBalance.toLocaleString('en-IN')}`, tone: 'accent' },
    ];
  });

  async ngOnInit(): Promise<void> {
    this.agencies.set(await this.agencyService.getAgencies());
  }

  generateReport(): void {
    const doc = new jsPDF();
    const summary = this.financialSummary();
    const agencyRows = this.agencies();
    const payments = this.paymentService.payments();

    doc.setFontSize(18);
    doc.text('Construction Management Report', 14, 20);

    doc.setFontSize(11);
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, 14, 30);
    doc.text(`Total agencies: ${summary.totalAgencies}`, 14, 40);
    doc.text(`Total agreed amount: ₹${summary.totalAgreed.toLocaleString('en-IN')}`, 14, 48);
    doc.text(`Total paid: ₹${summary.totalPaid.toLocaleString('en-IN')}`, 14, 56);
    doc.text(`Balance due: ₹${summary.remainingBalance.toLocaleString('en-IN')}`, 14, 64);

    let y = 82;
    doc.setFontSize(12);
    doc.text('Agency details', 14, y);
    y += 10;

    agencyRows.forEach((agency, index) => {
      if (y > 250) {
        doc.addPage();
        y = 20;
      }

      const paidForAgency = payments
        .filter((payment) => payment.agency_id === agency.id && payment.status === 'paid')
        .reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0);
      const remaining = Number(agency.agreed_amount ?? 0) - paidForAgency;

      doc.setFontSize(10);
      doc.text(`${index + 1}. ${agency.name} (${agency.work_category})`, 14, y);
      y += 6;
      doc.text(`Status: ${agency.status} | Agreed: ₹${Number(agency.agreed_amount ?? 0).toLocaleString('en-IN')} | Paid: ₹${paidForAgency.toLocaleString('en-IN')} | Due: ₹${remaining.toLocaleString('en-IN')}`, 14, y);
      y += 10;
    });

    doc.save(`construction-report-${new Date().toISOString().slice(0, 10)}.pdf`);
  }
}
