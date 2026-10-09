import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly navItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Agencies', path: '/agencies' },
    { label: 'Contracts', path: '/contracts' },
    { label: 'Milestones', path: '/milestones' },
    { label: 'Payments', path: '/payments' },
    { label: 'Daily progress', path: '/progress' },
    { label: 'Expenses', path: '/expenses' },
    { label: 'Documents', path: '/documents' },
    { label: 'Reports', path: '/reports' },
    { label: 'Settings', path: '/settings' },
  ];

  readonly userName = computed(() => this.authService.session()?.displayName ?? 'Project owner');
  readonly initials = computed(() =>
    this.userName()
      .split(' ')
      .map((part) => part.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2),
  );

  get showShell(): boolean {
    return this.authService.isAuthenticated() && this.router.url !== '/login';
  }

  get pageTitle(): string {
    const currentPath = this.router.url;

    switch (currentPath) {
      case '/dashboard':
        return 'Dashboard';
      case '/agencies':
        return 'Agencies';
      case '/contracts':
        return 'Contracts';
      case '/milestones':
        return 'Milestones';
      case '/payments':
        return 'Payments';
      case '/progress':
        return 'Daily progress';
      case '/expenses':
        return 'Expenses';
      case '/documents':
        return 'Documents';
      case '/reports':
        return 'Reports';
      case '/settings':
        return 'Settings';
      default:
        return 'Overview';
    }
  }

  logout(): void {
    this.authService.signOut();
    this.router.navigateByUrl('/login');
  }
}