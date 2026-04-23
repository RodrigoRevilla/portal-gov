import { Component, OnInit, OnDestroy, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { ResumenSesion, Faltante } from '../../models';

@Component({
  selector: 'app-supervisor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-crema flex flex-col">

      <header class="bg-guinda-700 border-b-4 border-dorado sticky top-0 z-50 shadow-md">
        <div class="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <button (click)="router.navigate(['/inventario/dashboard'])"
                    class="text-dorado-light hover:text-white transition-colors">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
              </svg>
            </button>
            <div class="border-l border-white/20 pl-3">
              <div class="text-white font-semibold text-sm truncate max-w-xs">
                {{ sesion()?.nombre_sesion ?? 'Cargando...' }}
              </div>
              <div class="flex items-center gap-1.5 text-xs">
                <span class="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                <span class="text-dorado-light">Vista de supervisión — actualización automática</span>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-xs text-white/50 font-mono">
              Última actualización: {{ ultimaActualizacion() }}
            </span>
            <div class="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
          </div>
        </div>
      </header>

      <main class="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        @if (sesion()) {
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            <div class="card text-center py-8">
              <div class="font-display text-5xl font-bold text-guinda-800 mb-2">
                {{ sesion()!.total_escaneados }}
              </div>
              <div class="text-xs font-semibold uppercase tracking-widest text-guinda-400">
                Escaneados
              </div>
              <div class="text-xs text-guinda-300 mt-1">
                de {{ sesion()!.total_en_catalogo }} en catálogo
              </div>
              <div class="mt-4 h-2 bg-crema-dark rounded-full overflow-hidden">
                <div class="h-full bg-guinda-600 rounded-full transition-all duration-700"
                     [style.width.%]="progreso()"></div>
              </div>
              <div class="text-xs font-mono font-semibold text-guinda-500 mt-1">
                {{ progreso() }}%
              </div>
            </div>

            <div class="card text-center py-8 border-t-4 border-t-success-DEFAULT">
              <div class="font-display text-5xl font-bold text-success-DEFAULT mb-2">
                {{ sesion()!.coincidencias }}
              </div>
              <div class="text-xs font-semibold uppercase tracking-widest text-guinda-400">
                Correctos
              </div>
              <div class="text-xs text-guinda-300 mt-1">En su ubicación</div>
            </div>

            <div class="card text-center py-8 border-t-4 border-t-warning-DEFAULT">
              <div class="font-display text-5xl font-bold text-warning-DEFAULT mb-2">
                {{ sesion()!.ubicacion_diferente }}
              </div>
              <div class="text-xs font-semibold uppercase tracking-widest text-guinda-400">
                Movidos
              </div>
              <div class="text-xs text-guinda-300 mt-1">Ubicación diferente</div>
            </div>

            <div class="card text-center py-8 border-t-4 border-t-danger-DEFAULT">
              <div class="font-display text-5xl font-bold text-danger-DEFAULT mb-2">
                {{ sesion()!.faltantes }}
              </div>
              <div class="text-xs font-semibold uppercase tracking-widest text-guinda-400">
                Faltantes
              </div>
              <div class="text-xs text-guinda-300 mt-1">Sin verificar</div>
            </div>
          </div>
        }

        <div class="card">
          <div class="flex items-center justify-between mb-5 pb-4 border-b border-crema-border flex-wrap gap-3">
            <div class="flex items-center gap-3">
              <h2 class="font-display text-lg text-guinda-800 font-semibold">
                Bienes faltantes
              </h2>
              <span class="text-xs px-2.5 py-1 rounded-full font-mono font-semibold"
                    [class]="faltantesFiltrados().length > 0
                      ? 'bg-danger-bg text-danger-DEFAULT border border-danger-border'
                      : 'bg-success-bg text-success-DEFAULT border border-success-border'">
                {{ faltantesFiltrados().length }}
                @if (busqueda) {
                  <span class="opacity-60"> de {{ faltantes().length }}</span>
                }
              </span>
            </div>
            <div class="flex items-center gap-3">
              <!-- Buscador -->
              <div class="relative">
                <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-guinda-300"
                     fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0016.803 15.803z"/>
                </svg>
                <input type="text"
                       [(ngModel)]="busqueda"
                       placeholder="Buscar por número, descripción, ubicación..."
                       class="input-gov pl-10 text-sm w-72"/>
                @if (busqueda) {
                  <button (click)="busqueda = ''"
                          class="absolute right-3 top-1/2 -translate-y-1/2 text-guinda-300 hover:text-guinda-600">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                }
              </div>
              <div class="flex items-center gap-2 text-xs text-guinda-400">
                <span class="w-2 h-2 rounded-full bg-danger-DEFAULT animate-pulse"></span>
                Tiempo real
              </div>
            </div>
          </div>

          @if (cargando()) {
            <div class="flex items-center justify-center py-16">
              <svg class="w-6 h-6 animate-spin text-guinda-400" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            </div>
          } @else if (faltantesFiltrados().length === 0 && !busqueda) {
            <div class="text-center py-16">
              <div class="w-16 h-16 rounded-full bg-success-bg border-2 border-success-border
                          flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8 text-success-DEFAULT" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4.5 12.75l6 6 9-13.5"/>
                </svg>
              </div>
              <p class="text-success-DEFAULT font-semibold text-lg">¡Sin faltantes!</p>
              <p class="text-guinda-400 text-sm mt-1">Todos los bienes han sido verificados</p>
            </div>
          } @else if (faltantesFiltrados().length === 0 && busqueda) {
            <div class="text-center py-16">
              <p class="text-guinda-500 font-semibold">Sin resultados</p>
              <p class="text-guinda-400 text-sm mt-1">No se encontró ningún bien con "<span class="font-mono">{{ busqueda }}</span>"</p>
            </div>
          } @else {
            <div class="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              @for (f of faltantesFiltrados(); track f.numero_inventario) {
                <div class="bg-danger-bg border border-danger-border/60 rounded-lg p-3 animate-fade-in">
                  <div class="font-mono text-sm text-danger-DEFAULT font-bold mb-1">
                    {{ f.numero_inventario }}
                  </div>
                  <div class="text-xs text-guinda-700 font-medium leading-tight mb-1">
                    {{ f.descripcion }}
                  </div>
                  @if (f.marca || f.modelo) {
                    <div class="text-xs text-guinda-500">
                      {{ f.marca }}{{ f.marca && f.modelo ? ' · ' : '' }}{{ f.modelo }}
                    </div>
                  }
                  @if (f.ubicacion_esperada) {
                    <div class="text-xs text-guinda-400 font-mono mt-1 flex items-center gap-1">
                      <svg class="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/>
                      </svg>
                      {{ f.ubicacion_esperada }}
                    </div>
                  }
                  @if (f.resguardo) {
                    <div class="text-xs text-guinda-400 mt-0.5">{{ f.resguardo }}</div>
                  }
                </div>
              }
            </div>
          }
        </div>

      </main>
    </div>
  `,
})
export class SupervisorComponent implements OnInit, OnDestroy {
  sesion              = signal<ResumenSesion | null>(null);
  faltantes           = signal<Faltante[]>([]);
  cargando            = signal(true);
  ultimaActualizacion = signal('--:--:--');
  busqueda            = '';

  private sesionId = '';
  private refreshInterval: any;

  constructor(
    private route: ActivatedRoute,
    public  router: Router,
    private api: ApiService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.sesionId = this.route.snapshot.paramMap.get('id')!;
    this.cargar();
    this.refreshInterval = setInterval(() => this.cargar(), 8_000);
  }

  ngOnDestroy() { clearInterval(this.refreshInterval); }

  cargar() {
    this.api.obtenerSesion(this.sesionId).subscribe(s => {
      this.sesion.set(s);
      this.cdr.detectChanges();
    });
    this.api.faltantes(this.sesionId).subscribe({
      next: data => {
        this.faltantes.set(data);
        this.cargando.set(false);
        const now = new Date();
        this.ultimaActualizacion.set(
          `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`
        );
        this.cdr.detectChanges();
      },
      error: () => { this.cargando.set(false); this.cdr.detectChanges(); }
    });
  }

  get faltantesFiltrados(): () => Faltante[] {
    return () => {
      const q = this.busqueda.toLowerCase().trim();
      if (!q) return this.faltantes();
      return this.faltantes().filter(f =>
        f.numero_inventario.toLowerCase().includes(q) ||
        f.descripcion.toLowerCase().includes(q) ||
        (f.ubicacion_esperada ?? '').toLowerCase().includes(q) ||
        (f.resguardo ?? '').toLowerCase().includes(q) ||
        (f.marca ?? '').toLowerCase().includes(q) ||
        (f.modelo ?? '').toLowerCase().includes(q)
      );
    };
  }

  progreso() {
    const s = this.sesion();
    return s && s.total_en_catalogo
      ? Math.round((s.total_escaneados / s.total_en_catalogo) * 100)
      : 0;
  }
}