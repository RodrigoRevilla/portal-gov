import { Routes } from '@angular/router';

export const INVENTARIO_ROUTES: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.DashboardComponent),
  },
  {
    path: 'sesion/:id',
    loadComponent: () => import('./pages/sesion/sesion').then(m => m.SesionComponent),
  },
  {
    path: 'audit-log',
    loadComponent: () => import('./pages/audit-log/audit-log').then(m => m.AuditLogComponent),
  },
  {
    path: 'escaneo/:id',
    loadComponent: () => import('./pages/escaneo/escaneo').then(m => m.EscaneoComponent),
  },
  {
    path: 'usuarios',
    loadComponent: () => import('./pages/usuarios/usuarios').then(m => m.UsuariosComponent),
  },
  { path: '**', redirectTo: 'dashboard' }
];