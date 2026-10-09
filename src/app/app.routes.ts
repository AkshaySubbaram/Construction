import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { AgenciesComponent } from './features/agencies/agencies';
import { ContractsComponent } from './features/contracts/contracts';
import { DashboardComponent } from './features/dashboard/dashboard';
import { DocumentsComponent } from './features/documents/documents';
import { ExpensesComponent } from './features/expenses/expenses';
import { LoginComponent } from './features/login/login';
import { MilestonesComponent } from './features/milestones/milestones';
import { PaymentsComponent } from './features/payments/payments';
import { ProgressComponent } from './features/progress/progress';
import { ReportsComponent } from './features/reports/reports';
import { SettingsComponent } from './features/settings/settings';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'agencies', component: AgenciesComponent, canActivate: [authGuard] },
  { path: 'contracts', component: ContractsComponent, canActivate: [authGuard] },
  { path: 'milestones', component: MilestonesComponent, canActivate: [authGuard] },
  { path: 'payments', component: PaymentsComponent, canActivate: [authGuard] },
  { path: 'progress', component: ProgressComponent, canActivate: [authGuard] },
  { path: 'expenses', component: ExpensesComponent, canActivate: [authGuard] },
  { path: 'documents', component: DocumentsComponent, canActivate: [authGuard] },
  { path: 'reports', component: ReportsComponent, canActivate: [authGuard] },
  { path: 'settings', component: SettingsComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '/dashboard' },
];