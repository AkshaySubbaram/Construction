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

  constructor(private readonly supabaseService: SupabaseService) {
    const client = this.supabaseService.client;

    if (client) {
      client.auth.onAuthStateChange((_event, session) => {
        this.syncSession(session);
      });
    }

    void this.initializeSession();
  }

  isAuthenticated(): boolean {
    return !!this.session();
  }

  async initializeSession(): Promise<void> {
    const client = this.supabaseService.client;

    if (!client) {
      return;
    }

    const { data, error } = await client.auth.getSession();

    if (error) {
      this.session.set(environment.demoMode ? this.getDemoSession() : null);
      return;
    }

    this.syncSession(data.session);
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

    this.syncSession(data.session);
  }

  async signOut(): Promise<void> {
    const client = this.supabaseService.client;

    if (client) {
      await client.auth.signOut();
    }

    this.session.set(null);
  }

  private syncSession(session: { user?: { id: string; email?: string | null; user_metadata?: Record<string, unknown> } | null } | null): void {
    const user = session?.user;

    if (!user) {
      this.session.set(environment.demoMode ? this.getDemoSession() : null);
      return;
    }

    this.session.set({
      id: user.id,
      email: user.email ?? '',
      displayName: (user.user_metadata as Record<string, unknown> | undefined)?.['full_name']
        ? String((user.user_metadata as Record<string, unknown>)['full_name'])
        : user.email?.split('@')[0] ?? 'Project owner',
      isDemo: false,
    });
  }

  private getDemoSession(): AppSession {
    return {
      id: 'demo-user',
      email: 'owner@demo.local',
      displayName: 'Demo Owner',
      isDemo: true,
    };
  }
}
