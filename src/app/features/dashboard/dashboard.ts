import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';

import { Agency } from '../../core/models/agency.model';
import { AgencyService } from '../../core/services/agency.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardComponent implements OnInit {
  private readonly agencyService = inject(AgencyService);
  readonly agencies = signal<Agency[]>([]);

  readonly cards = computed(() => {
    const list = this.agencies();
    const active = list.filter((agency) => agency.status === 'active').length;
    const planned = list.filter((agency) => agency.status === 'planned').length;
    const completed = list.filter((agency) => agency.status === 'completed').length;
    const inactive = list.filter((agency) => agency.status === 'inactive').length;

    return [
      { label: 'Active agencies', value: String(active), tone: 'primary' },
      { label: 'Planned agencies', value: String(planned), tone: 'accent' },
      { label: 'Completed agencies', value: String(completed), tone: 'success' },
      { label: 'Inactive agencies', value: String(inactive), tone: 'neutral' },
    ];
  });

  async ngOnInit(): Promise<void> {
    this.agencies.set(await this.agencyService.getAgencies());
  }
}
