import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { GeneradorEtiquetasComponent } from '../../components/generador-etiquetas';
import { ImportadorCatalogoComponent } from '../../components/importador-catalogo';
import { ResumenSesion, CrearSesionRequest } from '../../models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, GeneradorEtiquetasComponent, ImportadorCatalogoComponent],
  template: `
    <div class="min-h-screen bg-crema flex flex-col">

      <main class="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8">
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div class="stat-card border-l-4 border-l-guinda-700">
            <span class="stat-label">Sesiones totales</span>
            <span class="stat-value text-guinda-800">{{ sesiones().length }}</span>
          </div>
          <div class="stat-card border-l-4 border-l-success-DEFAULT">
            <span class="stat-label">Abiertas</span>
            <span class="stat-value text-success-DEFAULT">{{ contarEstado('abierta') }}</span>
          </div>
          <div class="stat-card border-l-4 border-l-guinda-300">
            <span class="stat-label">Cerradas</span>
            <span class="stat-value text-guinda-400">{{ contarEstado('cerrada') }}</span>
          </div>
          <div class="stat-card border-l-4 border-l-dorado">
            <span class="stat-label">Bienes verificados</span>
            <span class="stat-value text-dorado-dark">{{ totalEscaneados() }}</span>
          </div>
        </div>

        <div class="flex items-center justify-between mb-5">
          <div>
            <h2 class="font-display text-xl text-guinda-800 font-semibold">
              Sesiones de inventario
            </h2>
            <p class="text-guinda-400 text-sm mt-0.5">
              Cada sesión es un acto formal de verificación patrimonial
            </p>
          </div>
          <div class="flex items-center gap-2">
            <app-generador-etiquetas></app-generador-etiquetas>
            @if (usuario()?.rol === 'admin') {
              <app-importador-catalogo></app-importador-catalogo>
            }
            @if (puedeCrearSesion()) {
              <button (click)="mostrarModal.set(true)" class="btn-primary flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                </svg>
                Nueva sesión
              </button>
            }
          </div>
        </div>

        @if (cargando()) {
          <div class="flex items-center justify-center py-20">
            <div class="flex flex-col items-center gap-3">
              <svg class="w-6 h-6 animate-spin text-guinda-500" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              <span class="text-guinda-400 text-sm">Cargando sesiones...</span>
            </div>
          </div>
        } @else if (sesiones().length === 0) {
          <div class="card text-center py-16">
            <div class="w-16 h-16 rounded-full bg-guinda-50 border-2 border-guinda-100
                        flex items-center justify-center mx-auto mb-4">
              <svg class="w-7 h-7 text-guinda-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                  d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25
                     0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0
                     1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375
                     c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"/>
              </svg>
            </div>
            <p class="text-guinda-700 font-semibold">Sin sesiones registradas</p>
            <p class="text-guinda-400 text-sm mt-1">Crea la primera sesión de inventario</p>
          </div>
        } @else {
          <div class="space-y-3">
            @for (s of sesiones(); track s.sesion_id) {
              <div class="card hover:shadow-card-hover transition-all duration-200
                          cursor-pointer group animate-slide-up border-l-4"
                   [class]="borderEstado(s.estado)"
                   (click)="irSesion(s)">
                <div class="flex items-start justify-between gap-4">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-3 mb-2 flex-wrap">
                      <span class="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-0.5
                                   rounded-full text-xs font-semibold"
                            [class]="badgeEstado(s.estado)">
                        <span class="w-1.5 h-1.5 rounded-full" [class]="dotEstado(s.estado)"></span>
                        {{ s.estado }}
                      </span>
                      <h3 class="font-semibold text-guinda-800 truncate
                                 group-hover:text-guinda-600 transition-colors text-sm sm:text-base">
                        {{ s.nombre_sesion }}
                      </h3>
                    </div>
                    <div class="flex items-center gap-3 text-xs text-guinda-400">
                      <span class="font-mono">{{ s.iniciada_at | date:'dd/MM/yyyy HH:mm' }}</span>
                      <span>·</span>
                      <span>{{ s.iniciado_por }}</span>
                    </div>
                  </div>

                  <div class="shrink-0 grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div class="text-lg font-bold font-mono text-success-DEFAULT">{{ s.coincidencias }}</div>
                      <div class="text-xs text-guinda-400">OK</div>
                    </div>
                    <div (click)="irSeccion(s, 'movidos', $event)"
                         class="cursor-pointer hover:bg-warning-bg rounded-lg px-2 py-1 transition-colors group">
                      <div class="text-lg font-bold font-mono text-warning-DEFAULT">{{ s.ubicacion_diferente }}</div>
                      <div class="text-xs text-guinda-400 group-hover:text-warning-DEFAULT transition-colors">Movidos</div>
                    </div>
                    <div (click)="irSeccion(s, 'faltantes', $event)"
                         class="cursor-pointer hover:bg-danger-bg rounded-lg px-2 py-1 transition-colors group">
                      <div class="text-lg font-bold font-mono text-danger-DEFAULT">{{ s.faltantes }}</div>
                      <div class="text-xs text-guinda-400 group-hover:text-danger-DEFAULT transition-colors">Faltan</div>
                    </div>
                  </div>

                  <div class="shrink-0 w-28 hidden lg:block">
                    <div class="flex justify-between text-xs text-guinda-400 mb-1.5">
                      <span>Progreso</span>
                      <span class="font-mono font-semibold text-guinda-600">{{ progreso(s) }}%</span>
                    </div>
                    <div class="h-2 bg-crema-dark rounded-full overflow-hidden">
                      <div class="h-full bg-guinda-600 rounded-full transition-all duration-500"
                           [style.width.%]="progreso(s)"></div>
                    </div>
                  </div>

                  <svg class="w-4 h-4 text-guinda-300 group-hover:text-guinda-600
                               transition-colors shrink-0 self-center"
                       fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                  </svg>
                </div>

                <div class="mt-4 lg:hidden">
                  <div class="flex justify-between text-xs text-guinda-400 mb-1.5">
                    <span>{{ s.total_escaneados }} / {{ s.total_en_catalogo }} bienes</span>
                    <span class="font-mono font-semibold">{{ progreso(s) }}%</span>
                  </div>
                  <div class="h-1.5 bg-crema-dark rounded-full overflow-hidden">
                    <div class="h-full bg-guinda-600 rounded-full" [style.width.%]="progreso(s)"></div>
                  </div>
                </div>
              </div>
            }
          </div>
        }
      </main>

      @if (mostrarModal()) {
        <div class="fixed inset-0 bg-guinda-950/60 backdrop-blur-sm z-50
                    flex items-center justify-center p-4"
             (click)="cerrarModal()">
          <div class="card w-full max-w-md animate-slide-up shadow-modal"
               (click)="$event.stopPropagation()">
            <div class="h-1 bg-gradient-to-r from-guinda-700 via-dorado to-guinda-700 -mx-6 -mt-6 mb-6"></div>
            <h3 class="font-display text-xl text-guinda-800 font-semibold mb-5">
              Nueva sesión de inventario
            </h3>
            <div class="space-y-4">
              <div>
                <label class="block text-xs font-semibold text-guinda-600 uppercase tracking-wider mb-1.5">
                  Nombre de la sesión *
                </label>
                <input type="text" [(ngModel)]="nuevaSesion.nombre_sesion"
                       placeholder="Ej. Inventario Piso 2 — Marzo 2026" class="input-gov"/>
              </div>
              <div>
                <label class="block text-xs font-semibold text-guinda-600 uppercase tracking-wider mb-1.5">
                  Área cubierta
                </label>
                <input type="text" [(ngModel)]="nuevaSesion.area_cubierta"
                       placeholder="Ej. Piso 2, Oficinas administrativas" class="input-gov"/>
              </div>
              <div>
                <label class="block text-xs font-semibold text-guinda-600 uppercase tracking-wider mb-1.5">
                  Descripción
                </label>
                <textarea [(ngModel)]="nuevaSesion.descripcion"
                          placeholder="Notas adicionales..." rows="3"
                          class="input-gov resize-none"></textarea>
              </div>
            </div>
            @if (errorModal()) {
              <div class="mt-4 flex items-center gap-2 bg-danger-bg border border-danger-border
                          rounded-lg px-4 py-3">
                <span class="text-sm text-danger-DEFAULT">{{ errorModal() }}</span>
              </div>
            }
            <div class="flex gap-3 mt-6">
              <button (click)="cerrarModal()" class="btn-ghost flex-1">Cancelar</button>
              <button (click)="crearSesion()"
                      [disabled]="!nuevaSesion.nombre_sesion || creando()"
                      class="btn-primary flex-1 flex items-center justify-center gap-2">
                @if (creando()) {
                  <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                }
                Crear sesión
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class DashboardComponent implements OnInit, OnDestroy {
  sesiones = signal<ResumenSesion[]>([]);
  cargando = signal(true);
  mostrarModal = signal(false);
  creando = signal(false);
  errorModal = signal('');

  private refreshInterval: any;

  nuevaSesion: CrearSesionRequest = { nombre_sesion: '', descripcion: '', area_cubierta: '' };

  constructor(
    private api: ApiService,
    public auth: AuthService,
    public router: Router,
  ) { }

  get usuario() { return this.auth.usuario; }

  ngOnInit() {
    const raw = sessionStorage.getItem('inv_user');
    console.log('inv_user en sessionStorage:', raw);
    console.log('usuario signal:', this.auth.usuario());
    this.auth.recargarUsuario();
    console.log('usuario después de recargar:', this.auth.usuario());
    this.cargarSesiones();
    this.refreshInterval = setInterval(() => this.cargarSesiones(), 30_000);
  }

  ngOnDestroy() { clearInterval(this.refreshInterval); }

  cargarSesiones() {
    this.cargando.set(true);
    this.api.listarSesiones().subscribe({
      next: data => { this.sesiones.set(data); this.cargando.set(false); },
      error: () => this.cargando.set(false),
    });
  }

  crearSesion() {
    if (!this.nuevaSesion.nombre_sesion || this.creando()) return;
    this.errorModal.set('');
    this.creando.set(true);
    this.api.crearSesion(this.nuevaSesion).subscribe({
      next: res => {
        this.creando.set(false);
        if (res.ok && res.data) { this.cerrarModal(); this.router.navigate(['/inventario/escaneo', res.data.id]); }
        else this.errorModal.set(res.error?.message ?? 'Error al crear sesión');
      },
      error: () => { this.creando.set(false); this.errorModal.set('Error al crear sesión'); },
    });
  }

  irSeccion(s: ResumenSesion, seccion: string, event: Event) {
    event.stopPropagation();
    this.router.navigate(['/inventario/sesion', s.sesion_id], { fragment: seccion });
  }

  cerrarModal() {
    this.mostrarModal.set(false);
    this.errorModal.set('');
    this.nuevaSesion = { nombre_sesion: '', descripcion: '', area_cubierta: '' };
  }

  irSesion(s: ResumenSesion) {
    if (s.estado === 'abierta' || s.estado === 'pausada') {
      this.router.navigate(['/inventario/escaneo', s.sesion_id]);
    } else {
      this.router.navigate(['/inventario/sesion', s.sesion_id]);
    }
  }
  esAdminOAuditor() { return this.auth.hasRole('admin', 'auditor'); }
  puedeCrearSesion() { return this.auth.hasRole('supervisor', 'admin'); }
  logout() { this.auth.logout(); }

  progreso(s: ResumenSesion) {
    return s.total_en_catalogo ? Math.round((s.total_escaneados / s.total_en_catalogo) * 100) : 0;
  }

  contarEstado(e: string) { return this.sesiones().filter(s => s.estado === e).length; }
  totalEscaneados() { return this.sesiones().reduce((a, s) => a + s.total_escaneados, 0); }

  borderEstado(e: string) {
    return { abierta: 'border-l-success-DEFAULT', pausada: 'border-l-warning-DEFAULT', cerrada: 'border-l-guinda-200' }[e] ?? '';
  }
  badgeEstado(e: string) {
    return {
      abierta: 'bg-success-bg border border-success-border text-success-DEFAULT',
      pausada: 'bg-warning-bg border border-warning-border text-warning-DEFAULT',
      cerrada: 'bg-crema-dark border border-crema-border text-guinda-400',
    }[e] ?? '';
  }
  dotEstado(e: string) {
    return { abierta: 'bg-success-DEFAULT animate-pulse', pausada: 'bg-warning-DEFAULT', cerrada: 'bg-guinda-300' }[e] ?? '';
  }
  rolDot(rol?: string) {
    return { admin: 'bg-dorado', supervisor: 'bg-green-400', escaner: 'bg-blue-400', auditor: 'bg-purple-400' }[rol ?? ''] ?? 'bg-white';
  }
}