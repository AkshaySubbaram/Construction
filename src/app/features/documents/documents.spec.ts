import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AgencyService } from '../../core/services/agency.service';
import { AuthService } from '../../core/services/auth.service';
import { PaymentService } from '../../core/services/payment.service';
import { ProgressService } from '../../core/services/progress.service';
import { SupabaseService } from '../../core/services/supabase.service';
import { DocumentsComponent } from './documents';

describe('DocumentsComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentsComponent],
      providers: [
        { provide: ProgressService, useValue: { entries: signal([]) } },
        { provide: PaymentService, useValue: { payments: signal([]) } },
        { provide: SupabaseService, useValue: { client: null } },
        { provide: AuthService, useValue: { session: signal({ id: 'user-1' }), isAuthenticated: () => true } },
        { provide: AgencyService, useValue: { getAgencies: async () => [] } },
      ],
    }).compileComponents();
  });

  it('starts without seeded sample evidence', () => {
    const fixture = TestBed.createComponent(DocumentsComponent);
    const component = fixture.componentInstance;

    expect(component.documents()).toEqual([]);
  });

  it('does not create fake local evidence when Supabase is unavailable', async () => {
    const fixture = TestBed.createComponent(DocumentsComponent);
    const component = fixture.componentInstance;
    const file = new File(['hello'], 'evidence.txt', { type: 'text/plain' });

    component.selectedFiles.set([file]);
    component.selectedAgencyId.set('agency-1');
    component.agencies.set([{ id: 'agency-1', name: 'Contractor A' } as any]);

    await component.submitSelectedFiles();

    expect(component.errorMessage()).toContain('bucket or table is not ready');
    expect(component.uploadedDocuments()).toEqual([]);
    expect(component.documents()).toEqual([]);
  });
});
