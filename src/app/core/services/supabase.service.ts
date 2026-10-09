import { Injectable } from '@angular/core';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  readonly client: SupabaseClient | null;
  readonly isConfigured: boolean;

  constructor() {
    const supabaseUrl = environment.supabaseUrl?.trim();
    const supabaseAnonKey = environment.supabaseAnonKey?.trim();
    const hasPlaceholderValue =
      !supabaseUrl ||
      !supabaseAnonKey ||
      supabaseUrl.includes('YOUR_PROJECT_ID') ||
      supabaseAnonKey.includes('YOUR_SUPABASE') ||
      supabaseAnonKey.includes('YOUR_');

    this.isConfigured = !!supabaseUrl && !!supabaseAnonKey && !hasPlaceholderValue;

    if (!this.isConfigured) {
      this.client = null;
      return;
    }

    this.client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
}
