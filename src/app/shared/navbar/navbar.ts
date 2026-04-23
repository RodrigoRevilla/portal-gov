import { Component, inject, ChangeDetectorRef, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService, Usuario } from '../../core/auth';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, FormsModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class NavbarComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private http = inject(HttpClient);

  usuario: Usuario | null = null;

  mostrarCambiarPass = false;
  passActual = '';
  passNueva = '';
  passConfirm = '';
  passError = '';
  passExito = false;
  guardandoPass = false;

  verActual = false;
  verNueva = false;
  verConfirm = false;

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

  abrirCambiarPass() {
    this.passActual = '';
    this.passNueva = '';
    this.passConfirm = '';
    this.passError = '';
    this.passExito = false;
    this.verActual = false;
    this.verNueva = false;
    this.verConfirm = false;
    this.mostrarCambiarPass = true;
    this.cdr.detectChanges();
  }

  cambiarPassword() {
    this.passError = '';
    this.passExito = false;

    if (!this.passActual || !this.passNueva || !this.passConfirm) {
      this.passError = 'Completa todos los campos.';
      this.cdr.detectChanges();
      return;
    }
    if (this.passNueva.length < 6) {
      this.passError = 'La nueva contraseña debe tener al menos 6 caracteres.';
      this.cdr.detectChanges();
      return;
    }
    if (this.passNueva !== this.passConfirm) {
      this.passError = 'Las contraseñas no coinciden.';
      this.cdr.detectChanges();
      return;
    }

    this.guardandoPass = true;
    this.cdr.detectChanges();

    const token = sessionStorage.getItem('portal_token')
      ?? localStorage.getItem('portal_token')
      ?? '';

    this.http.patch<any>(
      'http://localhost:9090/api/v1/auth/password',
      { actual: this.passActual, nueva: this.passNueva },
      { headers: { Authorization: `Bearer ${token}` } }
    ).subscribe({
      next: res => {
        this.guardandoPass = false;
        if (res.ok) {
          this.passExito = true;
          this.passActual = '';
          this.passNueva = '';
          this.passConfirm = '';
          setTimeout(() => {
            this.mostrarCambiarPass = false;
            this.passExito = false;
            this.cdr.detectChanges();
          }, 2000);
        } else {
          this.passError = res.error?.message ?? 'Error al cambiar contraseña.';
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.guardandoPass = false;
        this.passError = 'No se pudo conectar con el servidor.';
        this.cdr.detectChanges();
      }
    });
  }
}