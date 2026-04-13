import { Component, inject, ChangeDetectorRef, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService, Usuario } from '../../core/auth';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class NavbarComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  usuario: Usuario | null = null;

  get inicial(): string {
    return this.usuario?.nombre?.charAt(0).toUpperCase() ?? '';
  }

  get rolLabel(): string {
    const roles: Record<string, string> = {
      super_admin: 'Super Admin',
      inventario_admin: 'Administrador · Inventario',
      registro_civil_admin: 'Administrador · Registro Civil'
    };
    return roles[this.usuario?.rol ?? ''] ?? '';
  }

  ngOnInit() {
    this.usuario = this.authService.getUsuario();
    this.cdr.detectChanges();
  }

  tieneSistema(sistema: string): boolean {
    return this.authService.tieneSistema(sistema);
  }

  logout() {
    this.authService.logout();
  }
}