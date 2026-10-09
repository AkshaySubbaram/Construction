import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';

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
export class DocumentsComponent {
  private readonly progressService = inject(ProgressService);
  private readonly paymentService = inject(PaymentService);
  private readonly supabaseService = inject(SupabaseService);
  private readonly authService = inject(AuthService);

  readonly uploadedDocuments = signal<UploadedDocument[]>([]);
  readonly selectedFiles = signal<File[]>([]);
  readonly isSaving = signal(false);
  readonly errorMessage = signal<string | null>(null);

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

    return [...this.uploadedDocuments(), ...progressDocs, ...paymentDocs];
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

  async submitSelectedFiles(): Promise<void> {
    const files = this.selectedFiles();

    if (files.length === 0) {
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);

    const savedDocs: UploadedDocument[] = [];
    const client = this.supabaseService.client;
    const authenticated = this.authService.isAuthenticated();

    try {
      if (client && authenticated) {
        for (const file of files) {
          const fileName = file.name.replace(/\s+/g, '-');
          const storagePath = `construction-evidence/${this.authService.session()?.id ?? 'user'}/${Date.now()}-${fileName}`;
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
              agency_id: null,
              title: file.name,
              document_type: file.type.startsWith('image/') ? 'photo' : 'document',
              file_url: publicUrlData.publicUrl,
              notes: 'Uploaded from site evidence',
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
            related: 'Uploaded from site',
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
            related: 'Uploaded from site',
            url: URL.createObjectURL(file),
            allowRemove: true,
          })),
        );
      }

      this.uploadedDocuments.update((current) => [...savedDocs, ...current]);
      this.selectedFiles.set([]);
    } catch (error) {
      console.error('Unable to save uploaded evidence:', error);
      const fallbackDocs = files.map((file) => ({
        id: crypto.randomUUID(),
        name: file.name,
        type: file.type.startsWith('image/') ? 'Site photo' : 'Document',
        date: new Date().toISOString().slice(0, 10),
        related: 'Uploaded from site',
        url: URL.createObjectURL(file),
        allowRemove: true,
      }));

      this.uploadedDocuments.update((current) => [...fallbackDocs, ...current]);
      this.selectedFiles.set([]);
      this.errorMessage.set('The files were saved locally for this session because the Supabase document bucket or table is not ready yet.');
    } finally {
      this.isSaving.set(false);
    }
  }

  viewDocument(document: UploadedDocument): void {
    if (document.url) {
      window.open(document.url, '_blank', 'noopener,noreferrer');
    }
  }

  async removeDocument(id: string): Promise<void> {
    const item = this.uploadedDocuments().find((document) => document.id === id);

    if (!item) {
      return;
    }

    const client = this.supabaseService.client;
    const authenticated = this.authService.isAuthenticated();

    if (item.url && item.url.startsWith('blob:')) {
      URL.revokeObjectURL(item.url);
    }

    if (item.dbId && client && authenticated) {
      try {
        await client.from('documents').delete().eq('id', item.dbId);

        if (item.storagePath) {
          await client.storage.from('documents').remove([item.storagePath]);
        }
      } catch (error) {
        console.warn('Unable to remove document from Supabase.', error);
      }
    }

    this.uploadedDocuments.update((current) => current.filter((document) => document.id !== id));
  }
}
