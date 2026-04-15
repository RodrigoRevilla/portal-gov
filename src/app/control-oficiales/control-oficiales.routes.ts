import { Routes } from '@angular/router';

export const CONTROL_OFICIALES_ROUTES: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard').then(m => m.Dashboard)
  },
  {
    path: 'oficialias',
    loadComponent: () => import('./oficialias/oficialias').then(m => m.Oficialias)
  },
  { path: '**', redirectTo: 'dashboard' }
];