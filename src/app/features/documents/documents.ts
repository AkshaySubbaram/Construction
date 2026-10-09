import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';

import { Agency } from '../../core/models/agency.model';
import { AgencyService } from '../../core/services/agency.service';
import { AuthService } from '../../core/services/auth.service';
import { PaymentService } from '../../core/services/payment.service';
import { ProgressService } from '../../core/services/progress.service';
import { SupabaseService } from '../../core/services/supabase.service';

interface UploadedDocument {
  id: string;
  name: string;
  type: string;
  date: string;
  related: string;
  url?: string;
  allowRemove?: boolean;
  dbId?: string;
  storagePath?: string;
}

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './documents.html',
  styleUrl: './documents.css',
})
export class DocumentsComponent implements OnInit {
  private readonly progressService = inject(ProgressService);
  private readonly paymentService = inject(PaymentService);
  private readonly supabaseService = inject(SupabaseService);
  private readonly authService = inject(AuthService);
  private readonly agencyService = inject(AgencyService);

  readonly uploadedDocuments = signal<UploadedDocument[]>([]);
  readonly savedDocuments = signal<UploadedDocument[]>([]);
  readonly agencies = signal<Agency[]>([]);
  readonly selectedAgencyId = signal<string>('');
  readonly selectedFiles = signal<File[]>([]);
  readonly isSaving = signal(false);
  readonly errorMessage = signal<string | null>(null);
  private readonly otherCategoryValue = 'other-category';
  private readonly selectedAgencyStorageKey = 'construction.documents.selectedAgency';

  constructor() {
    effect(() => {
      const userId = this.authService.session()?.id;

      if (userId) {
        void this.loadSavedDocuments();
      } else {
        this.savedDocuments.set([]);
      }
    });
  }

  async ngOnInit(): Promise<void> {
    await this.loadAgencies();
    await this.loadSavedDocuments();
  }

  readonly documents = computed(() => {
    const entries = this.progressService.entries();
    const paymentDocs = this.paymentService.payments().map((payment) => ({
      id: `payment-${payment.id}`,
      name: payment.transaction_reference ?? payment.payment_reference,
      type: 'Payment proof',
      date: payment.payment_date,
      related: payment.payment_reference,
      allowRemove: false,
    }));

    const progressDocs = entries.flatMap((entry) =>
      (entry.attachments ?? []).map((attachment) => ({
        id: `${entry.id}-${attachment}`,
        name: attachment,
        type: 'Site evidence',
        date: entry.date,
        related: entry.location,
        allowRemove: false,
      })),
    );

    return [...this.uploadedDocuments(), ...this.savedDocuments(), ...progressDocs, ...paymentDocs];
  });

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);

    if (files.length === 0) {
      return;
    }

    this.selectedFiles.set(files);
    this.errorMessage.set(null);
    input.value = '';
  }

  async loadAgencies(): Promise<void> {
    const agencies = await this.agencyService.getAgencies();
    this.agencies.set(agencies);

    if (typeof sessionStorage === 'undefined') {
      return;
    }

    const savedAgencyId = sessionStorage.getItem(this.selectedAgencyStorageKey);
    if (savedAgencyId && agencies.some((agency) => agency.id === savedAgencyId)) {
      this.selectedAgencyId.set(savedAgencyId);
    }
  }

  onAgencySelectionChange(value: string): void {
    this.selectedAgencyId.set(value);

    if (typeof sessionStorage === 'undefined') {
      return;
    }

    if (value) {
      sessionStorage.setItem(this.selectedAgencyStorageKey, value);
    } else {
      sessionStorage.removeItem(this.selectedAgencyStorageKey);
    }
  }

  async submitSelectedFiles(): Promise<void> {
    const files = this.selectedFiles();
    const selectedAgencyId = this.selectedAgencyId();

    if (files.length === 0) {
      return;
    }

    if (!selectedAgencyId) {
      this.errorMessage.set('Select an agency before uploading the file.');
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);

    const savedDocs: UploadedDocument[] = [];
    const client = this.supabaseService.client;
    const authenticated = this.authService.isAuthenticated();
    const userId = this.authService.session()?.id;
    const selectedAgency = this.agencies().find((agency) => agency.id === selectedAgencyId);
    const agencyIdForSave = selectedAgencyId === this.otherCategoryValue ? null : selectedAgencyId;
    const relatedLabel = selectedAgencyId === this.otherCategoryValue ? 'Other category' : (selectedAgency?.name ?? 'Agency record');

    try {
      if (client && authenticated && userId) {
        for (const file of files) {
          const fileName = file.name.replace(/\s+/g, '-');
          const storagePath = `construction-evidence/${userId}/${Date.now()}-${fileName}`;
          const { data: uploadedFile, error: uploadError } = await client.storage.from('documents').upload(storagePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

          if (uploadError) {
            throw uploadError;
          }

          const { data: publicUrlData } = client.storage.from('documents').getPublicUrl(uploadedFile.path);
          const { data: documentRow, error: insertError } = await client
            .from('documents')
            .insert({
              user_id: userId,
              agency_id: agencyIdForSave,
              title: file.name,
              document_type: file.type.startsWith('image/') ? 'photo' : 'document',
              file_url: publicUrlData.publicUrl,
              notes: JSON.stringify({ uploaded_by: userId, agency_id: agencyIdForSave, agency_name: relatedLabel, uploaded_from: 'site-evidence' }),
            })
            .select()
            .single();

          if (insertError) {
            throw insertError;
          }

          savedDocs.push({
            id: crypto.randomUUID(),
            name: file.name,
            type: file.type.startsWith('image/') ? 'Site photo' : 'Document',
            date: new Date().toISOString().slice(0, 10),
            related: relatedLabel,
            url: publicUrlData.publicUrl,
            allowRemove: true,
            dbId: documentRow?.id ? String(documentRow.id) : undefined,
            storagePath,
          });
        }
      } else {
        savedDocs.push(
          ...files.map((file) => ({
            id: crypto.randomUUID(),
            name: file.name,
            type: file.type.startsWith('image/') ? 'Site photo' : 'Document',
            date: new Date().toISOString().slice(0, 10),
            related: relatedLabel,
            url: URL.createObjectURL(file),
            allowRemove: true,
          })),
        );
      }

      this.uploadedDocuments.update((current) => [...savedDocs, ...current]);
      this.selectedFiles.set([]);
      await this.loadSavedDocuments();
    } catch (error) {
      console.error('Unable to save uploaded evidence:', error);
      const fallbackDocs = files.map((file) => ({
        id: crypto.randomUUID(),
        name: file.name,
        type: file.type.startsWith('image/') ? 'Site photo' : 'Document',
        date: new Date().toISOString().slice(0, 10),
        related: selectedAgencyId === this.otherCategoryValue ? 'Other category' : (this.agencies().find((agency) => agency.id === selectedAgencyId)?.name ?? 'Agency record'),
        url: URL.createObjectURL(file),
        allowRemove: true,
      }));

      this.uploadedDocuments.update((current) => [...fallbackDocs, ...current]);
      this.selectedFiles.set([]);
      this.errorMessage.set('The files were saved in this session because the Supabase document bucket or table is not ready yet.');
    } finally {
      this.isSaving.set(false);
    }
  }

  private async loadSavedDocuments(): Promise<void> {
    const client = this.supabaseService.client;
    const userId = this.authService.session()?.id;

    if (!client || !userId) {
      this.savedDocuments.set([]);
      return;
    }

    let query = client
      .from('documents')
      .select('*')
      .eq('user_id', userId);

    const selectedAgencyId = this.selectedAgencyId();

    if (selectedAgencyId && selectedAgencyId !== this.otherCategoryValue) {
      query = query.eq('agency_id', selectedAgencyId);
    }

    if (selectedAgencyId === this.otherCategoryValue) {
      query = query.is('agency_id', null);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.warn('Unable to load user documents:', error);
      this.savedDocuments.set([]);
      return;
    }

    const agencyMap = new Map(this.agencies().map((agency) => [agency.id, agency.name]));

    this.savedDocuments.set(
      (data ?? []).map((row) => ({
        id: `saved-${String(row['id'])}`,
        name: String(row['title'] ?? 'Document'),
        type: String(row['document_type'] ?? 'Document') === 'photo' ? 'Site photo' : 'Document',
        date: String(row['created_at'] ?? new Date().toISOString()).slice(0, 10),
        related: row['agency_id'] ? (agencyMap.get(String(row['agency_id'])) ?? 'Agency record') : 'Uploaded from site',
        url: typeof row['file_url'] === 'string' ? row['file_url'] : undefined,
        allowRemove: true,
        dbId: row['id'] ? String(row['id']) : undefined,
      })),
    );
  }

  viewDocument(document: UploadedDocument): void {
    if (document.url) {
      window.open(document.url, '_blank', 'noopener,noreferrer');
    }
  }

  downloadDocument(item: UploadedDocument): void {
    if (!item.url) {
      return;
    }

    const anchor = document.createElement('a');
    anchor.href = item.url;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    anchor.download = item.name;
    anchor.click();
  }

  async removeDocument(id: string): Promise<void> {
    const item = [...this.uploadedDocuments(), ...this.savedDocuments()].find((document) => document.id === id);

    if (!item) {
      return;
    }

    const client = this.supabaseService.client;
    const authenticated = this.authService.isAuthenticated();
    const userId = this.authService.session()?.id;

    if (item.url && item.url.startsWith('blob:')) {
      URL.revokeObjectURL(item.url);
    }

    if (item.dbId && client && authenticated && userId) {
      try {
        await client.from('documents').delete().eq('id', item.dbId).eq('user_id', userId);

        if (item.storagePath) {
          await client.storage.from('documents').remove([item.storagePath]);
        }
      } catch (error) {
        console.warn('Unable to remove document from Supabase.', error);
      }
    }

    this.uploadedDocuments.update((current) => current.filter((document) => document.id !== id));
    this.savedDocuments.update((current) => current.filter((document) => document.id !== id));
  }
}
