import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { PaymentService } from '../../core/services/payment.service';
import { ProgressService } from '../../core/services/progress.service';
import { DocumentsComponent } from './documents';

describe('DocumentsComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentsComponent],
      providers: [
        { provide: ProgressService, useValue: { entries: signal([]) } },
        { provide: PaymentService, useValue: { payments: signal([]) } },
      ],
    }).compileComponents();
  });

  it('starts without seeded sample evidence', () => {
    const fixture = TestBed.createComponent(DocumentsComponent);
    const component = fixture.componentInstance;

    expect(component.documents()).toEqual([]);
  });
});
