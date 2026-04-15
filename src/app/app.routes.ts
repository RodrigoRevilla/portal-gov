import { Routes } from '@angular/router';
import { authGuard } from './core/auth-guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login').then(m => m.LoginComponent)
  },
  {
    path: 'home',
    canActivate: [authGuard],
    loadComponent: () => import('./home/home').then(m => m.HomeComponent)
  },
  {
    path: 'inventario',
    canActivate: [authGuard],
    loadChildren: () => import('./inventario/inventario.routes').then(m => m.INVENTARIO_ROUTES)
  },
  {
    path: 'control-oficiales',
    canActivate: [authGuard],
    loadChildren: () => import('./control-oficiales/control-oficiales.routes').then(m => m.CONTROL_OFICIALES_ROUTES)
  },
  { path: '**', redirectTo: 'home' }
];