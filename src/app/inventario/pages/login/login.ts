import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div class="min-h-screen bg-zapotec-texture flex flex-col">

      <div class="zapotec-band w-full opacity-90"></div>

      <div class="bg-guinda-700 border-b-4 border-dorado">
        <div class="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div class="flex items-center gap-4">
            <img src="/oaxaca.png" alt="Escudo Oaxaca"
                 class="h-14 w-14 object-contain drop-shadow-sm" />
            <div class="border-l border-dorado/40 pl-4">
              <p class="text-dorado-light text-xs font-medium tracking-widest uppercase">
                Gobierno del Estado de Oaxaca
              </p>
              <h1 class="text-white font-display text-xl font-semibold leading-tight">
                Secretaría de Administración
              </h1>
            </div>
          </div>
          <img src="/registro.png" alt="Registro Civil"
               class="h-16 w-16 object-contain opacity-90" />
        </div>
      </div>

      <div class="zapotec-band w-full"></div>

      <div class="flex-1 flex justify-center px-4 pt-10 pb-8">
        <div class="w-full max-w-md animate-fade-in">

          <div class="card border-crema-border overflow-hidden">
            <div class="h-1.5 bg-gradient-to-r from-guinda-700 via-dorado to-guinda-700 -mx-6 -mt-6 mb-6"></div>

            <div class="text-center mb-7">
              <div class="inline-flex items-center justify-center w-14 h-14 rounded-full
                          bg-guinda-50 border-2 border-guinda-100 mb-4">
                <svg class="w-6 h-6 text-guinda-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                    d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"/>
                </svg>
              </div>
              <h2 class="font-display text-2xl text-guinda-800 font-semibold">Acceso al sistema</h2>
              <p class="text-guinda-400 text-sm mt-1">Sistema de Verificación de Inventario</p>
            </div>

            <div class="space-y-4">
              <div>
                <label class="block text-xs font-semibold text-guinda-600 uppercase tracking-wider mb-1.5">
                  Usuario
                </label>
                <input type="text" [(ngModel)]="usuario" (keyup.enter)="login()"
                       placeholder="nombre" class="input-gov font-mono"
                       [disabled]="cargando()" autocomplete="username"/>
              </div>

              <div>
                <label class="block text-xs font-semibold text-guinda-600 uppercase tracking-wider mb-1.5">
                  Contraseña
                </label>
                <div class="relative">
                  <input [type]="mostrarPassword() ? 'text' : 'password'"
                         [(ngModel)]="password" (keyup.enter)="login()"
                         placeholder="••••••••" class="input-gov pr-11"
                         [disabled]="cargando()" autocomplete="current-password"/>
                  <button type="button"
                          (click)="mostrarPassword.set(!mostrarPassword())"
                          class="absolute right-3 top-1/2 -translate-y-1/2
                                 text-guinda-300 hover:text-guinda-600 transition-colors"
                          tabindex="-1">
                    @if (mostrarPassword()) {
                      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"
                          d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"/>
                      </svg>
                    } @else {
                      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"
                          d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                      </svg>
                    }
                  </button>
                </div>
              </div>

              @if (error()) {
                <div class="flex items-center gap-2 bg-danger-bg border border-danger-border rounded-lg px-4 py-3 animate-fade-in">
                  <svg class="w-4 h-4 text-danger-DEFAULT shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
                      clip-rule="evenodd"/>
                  </svg>
                  <span class="text-sm text-danger-DEFAULT">{{ error() }}</span>
                </div>
              }

              <button (click)="login()" [disabled]="cargando() || !usuario || !password"
                      class="btn-primary w-full flex items-center justify-center gap-2 mt-2">
                @if (cargando()) {
                  <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Autenticando...
                } @else {
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/>
                  </svg>
                  Iniciar sesión
                }
              </button>
            </div>
          </div>

          <p class="text-center text-xs text-guinda-400 mt-5 font-mono tracking-wide">
            Acceso restringido — solo personal autorizado
          </p>
        </div>
      </div>

      <footer class="bg-guinda-900 py-3 text-center">
        <p class="text-guinda-400 text-xs">
          © {{ year }} Gobierno del Estado de Oaxaca · Todos los derechos reservados
        </p>
      </footer>

    </div>
  `,
})
export class LoginComponent {
  usuario         = '';
  password        = '';
  cargando        = signal(false);
  error           = signal('');
  mostrarPassword = signal(false);
  year            = new Date().getFullYear();

  constructor(private auth: AuthService, private router: Router) {
    if (this.auth.isAuthenticated()) this.router.navigate(['/dashboard']);
  }

  login() {
    if (!this.usuario || !this.password || this.cargando()) return;
    this.error.set('');
    this.cargando.set(true);

    this.auth.login({ usuario: this.usuario, password: this.password }).subscribe({
      next: res => {
        this.cargando.set(false);
        if (res.ok) this.router.navigate(['/dashboard']);
        else this.error.set(res.error?.message ?? 'Error al iniciar sesión');
      },
      error: () => {
        this.cargando.set(false);
        this.error.set('Usuario o contraseña incorrectos');
      },
    });
  }
}
