import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="zapotec-band w-full"></div>
    <header class="bg-guinda-700 border-b-4 border-dorado sticky top-0 z-50 shadow-md">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <div class="flex items-center gap-3">
          @if (showBack) {
            <button (click)="goBack()"
                    class="text-dorado-light hover:text-white transition-colors mr-1">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
              </svg>
            </button>
          }
          <img src="/oaxaca.png" alt="Oaxaca"
               class="h-8 w-8 object-contain" />
          <div class="border-l border-white/20 pl-3">
            <div class="text-white font-semibold text-sm leading-tight">{{ title }}</div>
            @if (subtitle) {
              <div class="text-dorado-light text-xs">{{ subtitle }}</div>
            }
          </div>
        </div>

        <div class="flex items-center gap-3">
          @if (usuario()) {
            <div class="hidden sm:flex items-center gap-2">
              <div class="w-2 h-2 rounded-full animate-pulse-dot"
                   [class]="rolDot(usuario()!.rol)"></div>
              <span class="text-white/90 text-sm">{{ usuario()!.nombre_completo }}</span>
              <span class="text-xs font-mono px-2 py-0.5 rounded bg-white/10
                           border border-white/20 text-dorado-light uppercase tracking-wider">
                {{ usuario()!.rol }}
              </span>
            </div>
          }
          <ng-content></ng-content>
          <button (click)="logout()"
                  class="text-white/70 hover:text-white text-sm border border-white/20
                         hover:border-white/40 px-3 py-1.5 rounded-lg transition-all duration-150">
            Salir
          </button>
        </div>
      </div>
    </header>
  `,
})
export class NavbarComponent {
  @Input() title    = 'Inv·Gov';
  @Input() subtitle = '';
  @Input() showBack = false;

  constructor(private auth: AuthService, private router: Router) {}

  get usuario() { return this.auth.usuario; }

  goBack()  { this.router.navigate(['/dashboard']); }
  logout()  { this.auth.logout(); }

  rolDot(rol: string) {
    return {
      admin:      'bg-dorado',
      supervisor: 'bg-green-400',
      escaner:    'bg-blue-400',
      auditor:    'bg-purple-400',
    }[rol] ?? 'bg-white';
  }
}
