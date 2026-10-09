import { Injectable, signal } from '@angular/core';

import { environment } from '../../../environments/environment';
import { SupabaseService } from './supabase.service';

export interface AppSession {
  id: string;
  email: string;
  displayName: string;
  isDemo: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  readonly session = signal<AppSession | null>(
    environment.demoMode
      ? {
          id: 'demo-user',
          email: 'owner@demo.local',
          displayName: 'Demo Owner',
          isDemo: true,
        }
      : null,
  );

  constructor(private readonly supabaseService: SupabaseService) {}

  isAuthenticated(): boolean {
    return !!this.session();
  }

  async signIn(email: string, password: string): Promise<void> {
    const client = this.supabaseService.client;

    if (!client) {
      this.session.set({
        id: 'demo-user',
        email,
        displayName: email.split('@')[0] || 'Demo User',
        isDemo: true,
      });
      return;
    }

    const { data, error } = await client.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    this.session.set({
      id: data.user.id,
      email: data.user.email ?? email,
      displayName: (data.user.user_metadata as Record<string, unknown> | undefined)?.['full_name']
        ? String((data.user.user_metadata as Record<string, unknown>)['full_name'])
        : data.user.email?.split('@')[0] ?? 'Project owner',
      isDemo: false,
    });
  }

  async signOut(): Promise<void> {
    const client = this.supabaseService.client;

    if (client) {
      await client.auth.signOut();
    }

    this.session.set(null);
  }
}
