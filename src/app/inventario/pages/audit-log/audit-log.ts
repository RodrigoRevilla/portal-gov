import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

interface EntradaLog {
  id: string;
  operacion: string;
  tabla_afectada: string;
  datos_nuevos: any;
  created_at: string;
  nombre_completo: string;
  usuario: string;
  rol: string;
}

@Component({
  selector: 'app-audit-log',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-crema flex flex-col">
      <div class="zapotec-band w-full opacity-90"></div>
      <div class="bg-guinda-700 border-b-4 border-dorado sticky top-0 z-50 shadow-md">
        <div class="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div class="flex items-center gap-4">
            <button (click)="router.navigate(['/dashboard'])"
                    class="text-dorado-light hover:text-white transition-colors">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
              </svg>
            </button>
            <img src="/oaxaca.png" alt="Oaxaca" class="h-9 w-9 object-contain"/>
            <div class="border-l border-dorado/40 pl-4">
              <p class="text-dorado-light text-xs font-medium tracking-widest uppercase">
                Auditoría
              </p>
              <h1 class="text-white font-display text-base font-semibold leading-tight">
                Log de actividad
              </h1>
            </div>
          </div>
          <span class="text-xs font-mono bg-white/10 border border-white/20
                       text-dorado-light px-3 py-1 rounded-full">
            Últimas {{ entradas().length }} entradas
          </span>
        </div>
      </div>

      <main class="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8">
        <div class="flex flex-wrap items-center gap-3 mb-6">
          <div class="relative flex-1 min-w-48">
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-guinda-300"
                 fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0016.803 15.803z"/>
            </svg>
            <input type="text" [(ngModel)]="query" placeholder="Buscar usuario u operación..."
                   class="input-gov pl-10 text-sm"/>
          </div>
          <div class="flex gap-2 flex-wrap">
            <button (click)="filtroOp = ''"
                    class="text-xs px-3 py-1.5 rounded-full border transition-all"
                    [class]="filtroOp === ''
                      ? 'bg-guinda-700 text-white border-guinda-700'
                      : 'bg-white text-guinda-500 border-crema-border hover:border-guinda-300'">
              Todas
            </button>
            @for (op of operaciones(); track op) {
              <button (click)="filtroOp = op"
                      class="text-xs px-3 py-1.5 rounded-full border transition-all"
                      [class]="filtroOp === op
                        ? 'bg-guinda-700 text-white border-guinda-700'
                        : 'bg-white text-guinda-500 border-crema-border hover:border-guinda-300'">
                {{ op }}
              </button>
            }
          </div>
        </div>

        @if (cargando()) {
          <div class="flex items-center justify-center py-20">
            <svg class="w-6 h-6 animate-spin text-guinda-500" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          </div>
        } @else {
          <div class="card p-0 overflow-hidden">
            <div class="divide-y divide-crema-border">
              @for (e of entradasFiltradas(); track e.id) {
                <div class="px-6 py-4 hover:bg-crema/50 transition-colors animate-fade-in">
                  <div class="flex items-start justify-between gap-4">

                    <div class="flex items-start gap-3 flex-1 min-w-0">
                      <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                           [class]="iconoBg(e.operacion)">
                        <svg class="w-4 h-4" [class]="iconoColor(e.operacion)"
                             fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            [attr.d]="iconoPath(e.operacion)"/>
                        </svg>
                      </div>

                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 flex-wrap mb-1">
                          <span class="text-xs font-mono font-bold px-2 py-0.5 rounded"
                                [class]="chipOperacion(e.operacion)">
                            {{ e.operacion }}
                          </span>
                          <span class="text-xs text-guinda-500">
                            por <span class="font-semibold text-guinda-700">{{ e.nombre_completo }}</span>
                          </span>
                          <span class="text-xs font-mono px-2 py-0.5 rounded bg-crema
                                       border border-crema-border text-guinda-400 uppercase">
                            {{ e.rol }}
                          </span>
                        </div>

                        @if (e.datos_nuevos && tieneDetalles(e.datos_nuevos)) {
                          <div class="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                            @if (e.datos_nuevos.nombre_sesion) {
                              <span class="text-xs text-guinda-500">
                                Sesión: <span class="font-medium text-guinda-700">{{ e.datos_nuevos.nombre_sesion }}</span>
                              </span>
                            }
                            @if (e.datos_nuevos.nombre_archivo) {
                              <span class="text-xs text-guinda-500">
                                Archivo: <span class="font-medium text-guinda-700">{{ e.datos_nuevos.nombre_archivo }}</span>
                              </span>
                            }
                            @if (e.datos_nuevos.total_bienes) {
                              <span class="text-xs text-guinda-500">
                                Bienes: <span class="font-mono font-bold text-guinda-700">{{ e.datos_nuevos.total_bienes }}</span>
                              </span>
                            }
                            @if (e.datos_nuevos.total_escaneados) {
                              <span class="text-xs text-guinda-500">
                                Escaneados: <span class="font-mono font-bold text-guinda-700">{{ e.datos_nuevos.total_escaneados }}</span>
                              </span>
                            }
                            @if (e.datos_nuevos.hash_cierre) {
                              <span class="text-xs text-guinda-400 font-mono truncate max-w-xs"
                                    title="{{ e.datos_nuevos.hash_cierre }}">
                                Hash: {{ e.datos_nuevos.hash_cierre.slice(0, 16) }}...
                              </span>
                            }
                          </div>
                        }
                      </div>
                    </div>

                    <div class="text-right shrink-0">
                      <div class="text-xs font-mono text-guinda-600">
                        {{ e.created_at | date:'dd/MM/yyyy' }}
                      </div>
                      <div class="text-xs font-mono text-guinda-400">
                        {{ e.created_at | date:'HH:mm:ss' }}
                      </div>
                    </div>
                  </div>
                </div>
              }

              @if (entradasFiltradas().length === 0) {
                <div class="px-6 py-16 text-center">
                  <p class="text-guinda-400 text-sm">No hay entradas que coincidan con el filtro</p>
                </div>
              }
            </div>
          </div>
        }
      </main>

      <footer class="bg-guinda-900 py-3 mt-8">
        <div class="zapotec-band w-full opacity-60 mb-3"></div>
        <p class="text-center text-guinda-400 text-xs pb-1">
          © {{ year }} Gobierno del Estado de Oaxaca · Sistema de Verificación de Inventario
        </p>
      </footer>
    </div>
  `,
})
export class AuditLogComponent implements OnInit {
  entradas  = signal<EntradaLog[]>([]);
  cargando  = signal(true);
  year      = new Date().getFullYear();

  query     = '';
  filtroOp  = '';

  constructor(
    private api: ApiService,
    private auth: AuthService,
    public  router: Router,
  ) {}

  ngOnInit() {
    this.api.listarAuditLog().subscribe({
      next: data => { this.entradas.set(data); this.cargando.set(false); },
      error: ()  => this.cargando.set(false),
    });
  }

  operaciones() {
    return [...new Set(this.entradas().map(e => e.operacion))].sort();
  }

  entradasFiltradas() {
    let lista = this.entradas();
    if (this.filtroOp) lista = lista.filter(e => e.operacion === this.filtroOp);
    if (this.query.trim()) {
      const q = this.query.toLowerCase();
      lista = lista.filter(e =>
        e.nombre_completo.toLowerCase().includes(q) ||
        e.usuario.toLowerCase().includes(q) ||
        e.operacion.toLowerCase().includes(q)
      );
    }
    return lista;
  }

  tieneDetalles(d: any): boolean {
    return d && Object.keys(d).length > 0;
  }

  iconoBg(op: string): string {
    if (op.includes('CERRAR')) return 'bg-danger-bg';
    if (op.includes('ABRIR') || op.includes('CREAR')) return 'bg-success-bg';
    if (op.includes('IMPORT')) return 'bg-blue-50';
    if (op.includes('PAUSAR') || op.includes('REANUDAR')) return 'bg-warning-bg';
    return 'bg-guinda-50';
  }

  iconoColor(op: string): string {
    if (op.includes('CERRAR')) return 'text-danger-DEFAULT';
    if (op.includes('ABRIR') || op.includes('CREAR')) return 'text-success-DEFAULT';
    if (op.includes('IMPORT')) return 'text-blue-600';
    if (op.includes('PAUSAR') || op.includes('REANUDAR')) return 'text-warning-DEFAULT';
    return 'text-guinda-500';
  }

  iconoPath(op: string): string {
    if (op.includes('CERRAR')) return 'M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z';
    if (op.includes('ABRIR') || op.includes('CREAR')) return 'M12 4v16m8-8H4';
    if (op.includes('IMPORT')) return 'M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5';
    if (op.includes('PAUSAR')) return 'M15.75 5.25v13.5m-7.5-13.5v13.5';
    if (op.includes('REANUDAR')) return 'M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z';
    return 'M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z';
  }

  chipOperacion(op: string): string {
    if (op.includes('CERRAR')) return 'bg-danger-bg text-danger-DEFAULT border border-danger-border';
    if (op.includes('ABRIR') || op.includes('CREAR')) return 'bg-success-bg text-success-DEFAULT border border-success-border';
    if (op.includes('IMPORT')) return 'bg-blue-50 text-blue-700 border border-blue-200';
    if (op.includes('PAUSAR') || op.includes('REANUDAR')) return 'bg-warning-bg text-warning-DEFAULT border border-warning-border';
    return 'bg-guinda-50 text-guinda-600 border border-guinda-100';
  }
}
