import { Component, OnInit, AfterViewInit, signal, ChangeDetectorRef, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { ExcelService } from '../../services/excel-service';
import { ResumenSesion, EscaneoDetalle, Faltante } from '../../models';

@Component({
  selector: 'app-sesion',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-crema flex flex-col">

      <main class="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8 space-y-6">

        <!-- Barra de acciones superior -->
        @if (sesion() && !cargando()) {
          <div class="flex items-center justify-between flex-wrap gap-3">
            <div class="flex items-center gap-3">
              <button (click)="router.navigate(['/inventario/dashboard'])"
                      class="text-guinda-400 hover:text-guinda-700 transition-colors flex items-center gap-1.5 text-sm">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                </svg>
                Volver
              </button>
              <span class="text-guinda-200">|</span>
              <span class="font-semibold text-guinda-800 text-sm truncate max-w-xs">
                {{ sesion()!.nombre_sesion }}
              </span>
              <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                    [class]="badgeEstado(sesion()!.estado)">
                <span class="w-1.5 h-1.5 rounded-full" [class]="dotEstado(sesion()!.estado)"></span>
                {{ sesion()!.estado }}
              </span>
            </div>

            <div class="flex items-center gap-2 flex-wrap">
              <button (click)="exportarFaltantes()"
                      [disabled]="faltantes().length === 0"
                      class="btn-ghost text-xs px-3 py-1.5 flex items-center gap-1.5
                             disabled:opacity-30 disabled:cursor-not-allowed">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5
                       12L12 16.5m0 0L7.5 12m4.5 4.5V3"/>
                </svg>
                Faltantes XLS
              </button>
              <button (click)="exportarEscaneos()"
                      [disabled]="escaneos().length === 0"
                      class="btn-ghost text-xs px-3 py-1.5 flex items-center gap-1.5
                             disabled:opacity-30 disabled:cursor-not-allowed">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5
                       12L12 16.5m0 0L7.5 12m4.5 4.5V3"/>
                </svg>
                Escaneos XLS
              </button>
              <button (click)="exportarCompleto()"
                      [disabled]="escaneos().length === 0 && faltantes().length === 0"
                      class="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5
                             disabled:opacity-30 disabled:cursor-not-allowed">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5
                       12L12 16.5m0 0L7.5 12m4.5 4.5V3"/>
                </svg>
                Reporte completo
              </button>
            </div>
          </div>
        }

        @if (cargando()) {
          <div class="flex items-center justify-center py-20">
            <svg class="w-6 h-6 animate-spin text-guinda-500" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          </div>
        } @else if (sesion()) {
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div class="stat-card border-t-2 border-t-guinda-200">
              <span class="stat-label">En catálogo</span>
              <span class="stat-value text-guinda-700">{{ sesion()!.total_en_catalogo }}</span>
            </div>
            <div class="stat-card border-t-2 border-t-guinda-500">
              <span class="stat-label">Escaneados</span>
              <span class="stat-value text-guinda-600">{{ sesion()!.total_escaneados }}</span>
            </div>
            <div class="stat-card border-t-2 border-t-success-DEFAULT">
              <span class="stat-label">Correctos</span>
              <span class="stat-value text-success-DEFAULT">{{ sesion()!.coincidencias }}</span>
            </div>
            <div class="stat-card border-t-2 border-t-warning-DEFAULT cursor-pointer
                        hover:shadow-card-hover hover:border-warning-DEFAULT transition-all duration-200 group"
                 (click)="scrollA('movidos')">
              <span class="stat-label group-hover:text-warning-DEFAULT transition-colors">Movidos</span>
              <div class="flex items-center justify-between">
                <span class="stat-value text-warning-DEFAULT">{{ sesion()!.ubicacion_diferente }}</span>
                <svg class="w-3.5 h-3.5 text-warning-DEFAULT opacity-0 group-hover:opacity-100
                            transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                </svg>
              </div>
            </div>
            <div class="stat-card border-t-2 border-t-danger-DEFAULT cursor-pointer
                        hover:shadow-card-hover hover:border-danger-DEFAULT transition-all duration-200 group"
                 (click)="scrollA('sin-registro')">
              <span class="stat-label group-hover:text-danger-DEFAULT transition-colors">Sin registro</span>
              <div class="flex items-center justify-between">
                <span class="stat-value text-danger-DEFAULT">{{ sesion()!.no_en_catalogo }}</span>
                <svg class="w-3.5 h-3.5 text-danger-DEFAULT opacity-0 group-hover:opacity-100
                            transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                </svg>
              </div>
            </div>
            <div class="stat-card border-t-2 border-t-danger-DEFAULT cursor-pointer
                        hover:shadow-card-hover hover:border-danger-DEFAULT transition-all duration-200 group"
                 (click)="scrollA('faltantes')">
              <span class="stat-label group-hover:text-danger-DEFAULT transition-colors">Faltantes</span>
              <div class="flex items-center justify-between">
                <span class="stat-value text-danger-DEFAULT">{{ sesion()!.faltantes }}</span>
                <svg class="w-3.5 h-3.5 text-danger-DEFAULT opacity-0 group-hover:opacity-100
                            transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                </svg>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="flex items-center justify-between mb-3">
              <span class="text-sm font-semibold text-guinda-700">Cobertura de verificación</span>
              <span class="font-mono font-bold text-guinda-600 text-sm">{{ progreso() }}%</span>
            </div>
            <div class="h-3 bg-crema-dark rounded-full overflow-hidden">
              <div class="h-full rounded-full transition-all duration-700"
                   [style.width.%]="progreso()"
                   [class]="progreso() === 100 ? 'bg-success-DEFAULT' : 'bg-guinda-600'"></div>
            </div>
            <div class="flex justify-between text-xs text-guinda-400 mt-2">
              <span>{{ sesion()!.total_escaneados }} verificados</span>
              <span>{{ sesion()!.faltantes }} sin verificar</span>
            </div>
          </div>

          <div class="card">
            <h3 class="text-sm font-semibold text-guinda-700 mb-4 flex items-center gap-2">
              <svg class="w-4 h-4 text-guinda-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0
                     001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"/>
              </svg>
              Información de la sesión
            </h3>
            <div class="grid sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span class="text-guinda-400 text-xs uppercase tracking-wider font-semibold">Iniciada por</span>
                <p class="text-guinda-700 mt-1 font-medium">{{ sesion()!.iniciado_por }}</p>
              </div>
              <div>
                <span class="text-guinda-400 text-xs uppercase tracking-wider font-semibold">Fecha de inicio</span>
                <p class="font-mono text-guinda-700 mt-1">
                  {{ sesion()!.iniciada_at | date:'dd/MM/yyyy HH:mm:ss' }}
                </p>
              </div>
              @if (sesion()!.cerrada_at) {
                <div>
                  <span class="text-guinda-400 text-xs uppercase tracking-wider font-semibold">Fecha de cierre</span>
                  <p class="font-mono text-guinda-700 mt-1">
                    {{ sesion()!.cerrada_at | date:'dd/MM/yyyy HH:mm:ss' }}
                  </p>
                </div>
                <div>
                  <span class="text-guinda-400 text-xs uppercase tracking-wider font-semibold">Duración</span>
                  <p class="font-mono text-guinda-700 mt-1">{{ duracion() }}</p>
                </div>
              }
            </div>
          </div>

          <div class="grid lg:grid-cols-2 gap-6">

            <!-- Faltantes -->
            <div #seccionFaltantes
                 id="faltantes"
                 class="card transition-all duration-500"
                 [class.ring-2]="seccionResaltada() === 'faltantes'"
                 [class.ring-danger-DEFAULT]="seccionResaltada() === 'faltantes'"
                 [class.ring-offset-2]="seccionResaltada() === 'faltantes'">
              <div class="flex items-center justify-between mb-4 pb-3 border-b border-crema-border">
                <h3 class="text-sm font-semibold text-guinda-700 flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full bg-danger-DEFAULT"></span>
                  Bienes faltantes
                </h3>
                <div class="flex items-center gap-2">
                  @if (faltantes().length > 0) {
                    <button (click)="exportarFaltantes()"
                            class="text-xs text-guinda-400 hover:text-success-DEFAULT
                                   border border-crema-border hover:border-success-border
                                   px-2 py-1 rounded-lg transition-all duration-150
                                   flex items-center gap-1">
                      <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021
                             18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/>
                      </svg>
                      Excel
                    </button>
                  }
                  <span class="text-xs font-mono font-semibold px-2 py-0.5 rounded-full
                               bg-danger-bg border border-danger-border text-danger-DEFAULT">
                    {{ faltantes().length }}
                  </span>
                </div>
              </div>

              @if (faltantes().length === 0) {
                <div class="text-center py-8">
                  <div class="w-12 h-12 rounded-full bg-success-bg border border-success-border
                              flex items-center justify-center mx-auto mb-3">
                    <svg class="w-6 h-6 text-success-DEFAULT" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4.5 12.75l6 6 9-13.5"/>
                    </svg>
                  </div>
                  <p class="text-success-DEFAULT font-semibold text-sm">Sin faltantes</p>
                  <p class="text-guinda-400 text-xs mt-1">Todos los bienes fueron verificados</p>
                </div>
              } @else {
                <div class="space-y-2 max-h-80 overflow-y-auto">
                  @for (f of faltantes(); track f.numero_inventario) {
                    <div class="flex items-start gap-3 p-3 rounded-lg bg-danger-bg
                                border border-danger-border/60">
                      <div class="flex-1 min-w-0">
                        <div class="inv-number">{{ f.numero_inventario }}</div>
                        <div class="text-xs text-guinda-700 font-medium truncate mt-0.5">{{ f.descripcion }}</div>
                        @if (f.marca || f.modelo) {
                          <div class="text-xs text-guinda-500 truncate">
                            {{ f.marca }}{{ f.marca && f.modelo ? ' · ' : '' }}{{ f.modelo }}
                          </div>
                        }
                        @if (f.numero_serie) {
                          <div class="text-xs text-guinda-400 font-mono">Serie: {{ f.numero_serie }}</div>
                        }
                        @if (f.resguardo) {
                          <div class="text-xs text-guinda-400">Resguardo: {{ f.resguardo }}</div>
                        }
                        @if (f.ubicacion_esperada) {
                          <div class="text-xs text-guinda-400 mt-0.5 font-mono">{{ f.ubicacion_esperada }}</div>
                        }
                      </div>
                    </div>
                  }
                </div>
              }
            </div>

            <!-- Escaneos -->
            <div #seccionEscaneos
                 id="movidos"
                 class="card transition-all duration-500"
                 [class.ring-2]="seccionResaltada() === 'movidos' || seccionResaltada() === 'sin-registro'"
                 [class.ring-warning-DEFAULT]="seccionResaltada() === 'movidos'"
                 [class.ring-danger-DEFAULT]="seccionResaltada() === 'sin-registro'"
                 [class.ring-offset-2]="seccionResaltada() === 'movidos' || seccionResaltada() === 'sin-registro'">
              <div class="flex items-center justify-between mb-4 pb-3 border-b border-crema-border">
                <h3 class="text-sm font-semibold text-guinda-700">Registro de escaneos</h3>
                <div class="flex items-center gap-2">
                  @if (escaneos().length > 0) {
                    <button (click)="exportarEscaneos()"
                            class="text-xs text-guinda-400 hover:text-success-DEFAULT
                                   border border-crema-border hover:border-success-border
                                   px-2 py-1 rounded-lg transition-all duration-150
                                   flex items-center gap-1">
                      <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021
                             18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/>
                      </svg>
                      Excel
                    </button>
                  }
                  <span class="text-xs font-mono text-guinda-400 bg-crema px-2 py-0.5
                               rounded-full border border-crema-border">
                    {{ escaneos().length }}
                  </span>
                </div>
              </div>

              @if (seccionResaltada() === 'movidos' || seccionResaltada() === 'sin-registro') {
                <div class="flex gap-2 mb-3">
                  <button (click)="filtroEscaneo.set('')"
                          class="text-xs px-3 py-1 rounded-full border transition-all"
                          [class]="filtroEscaneo() === ''
                            ? 'bg-guinda-700 text-white border-guinda-700'
                            : 'bg-white text-guinda-500 border-crema-border'">
                    Todos
                  </button>
                  <button (click)="filtroEscaneo.set('encontrado')"
                          class="text-xs px-3 py-1 rounded-full border transition-all"
                          [class]="filtroEscaneo() === 'encontrado'
                            ? 'bg-warning-DEFAULT text-white border-warning-DEFAULT'
                            : 'bg-white text-warning-DEFAULT border-warning-border'">
                    Movidos ({{ contarResultado('encontrado') }})
                  </button>
                  <button (click)="filtroEscaneo.set('no_en_catalogo')"
                          class="text-xs px-3 py-1 rounded-full border transition-all"
                          [class]="filtroEscaneo() === 'no_en_catalogo'
                            ? 'bg-danger-DEFAULT text-white border-danger-DEFAULT'
                            : 'bg-white text-danger-DEFAULT border-danger-border'">
                    Sin registro ({{ contarResultado('no_en_catalogo') }})
                  </button>
                </div>
              }

              <div class="space-y-2 max-h-80 overflow-y-auto">
                @for (e of escaneosFiltrados(); track e.id) {
                  <div class="flex items-center gap-3 p-3 rounded-lg bg-crema border border-crema-border
                              hover:border-guinda-200 transition-colors"
                       [class.bg-warning-bg]="e.resultado === 'encontrado' && seccionResaltada() === 'movidos'"
                       [class.bg-danger-bg]="e.resultado === 'no_en_catalogo' && seccionResaltada() === 'sin-registro'">
                    <div class="w-2 h-2 rounded-full shrink-0" [class]="dotResultado(e.resultado)"></div>
                    <div class="flex-1 min-w-0">
                      <div class="font-mono text-xs text-guinda-700 font-semibold truncate">{{ e.numero_inv_leido }}</div>
                      @if (e.descripcion) {
                        <div class="text-xs text-guinda-500 truncate">{{ e.descripcion }}</div>
                      }
                      @if (e.marca || e.modelo) {
                        <div class="text-xs text-guinda-400 truncate">
                          {{ e.marca }}{{ e.marca && e.modelo ? ' · ' : '' }}{{ e.modelo }}
                        </div>
                      }
                      @if (e.resultado === 'encontrado' && e.ubicacion_esperada) {
                        <div class="text-xs text-warning-DEFAULT mt-0.5 font-mono">
                          Esperado: {{ e.ubicacion_esperada }}
                        </div>
                      }
                      @if (e.observaciones) {
                        <div class="text-xs text-guinda-300 truncate italic">{{ e.observaciones }}</div>
                      }
                    </div>
                    <div class="flex flex-col items-end gap-1 shrink-0">
                      <span class="text-xs font-mono text-guinda-300">{{ e.escaneado_at | date:'HH:mm:ss' }}</span>
                      <span class="text-xs px-1.5 py-0.5 rounded font-semibold"
                            [class]="chipResultado(e.resultado)">
                        {{ labelResultado(e.resultado) }}
                      </span>
                    </div>
                  </div>
                }
              </div>
            </div>

          </div>
        }
      </main>
    </div>
  `,
})
export class SesionComponent implements OnInit, AfterViewInit {
  @ViewChild('seccionFaltantes') seccionFaltantesRef!: ElementRef;
  @ViewChild('seccionEscaneos')  seccionEscaneoRef!: ElementRef;

  sesion    = signal<ResumenSesion | null>(null);
  escaneos  = signal<EscaneoDetalle[]>([]);
  faltantes = signal<Faltante[]>([]);
  cargando  = signal(true);
  seccionResaltada = signal('');
  filtroEscaneo    = signal('');

  private fragmentDestino = '';

  constructor(
    private route: ActivatedRoute,
    public  router: Router,
    private api: ApiService,
    private auth: AuthService,
    private excel: ExcelService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.fragmentDestino = this.route.snapshot.fragment ?? '';
    const id = this.route.snapshot.paramMap.get('id')!;
    this.api.obtenerSesion(id).subscribe(s => {
      this.sesion.set(s); this.cargando.set(false); this.cdr.detectChanges();
      if (this.fragmentDestino) setTimeout(() => this.aplicarFragment(), 400);
    });
    this.api.listarEscaneos(id).subscribe(d => {
      this.escaneos.set(d); this.cdr.detectChanges();
    });
    this.api.faltantes(id).subscribe(d => {
      this.faltantes.set(d); this.cdr.detectChanges();
    });
  }

  ngAfterViewInit() {
    if (this.fragmentDestino && !this.cargando()) {
      setTimeout(() => this.aplicarFragment(), 300);
    }
  }

  private aplicarFragment() {
    const f = this.fragmentDestino;
    if (!f) return;
    this.seccionResaltada.set(f);
    if (f === 'movidos') this.filtroEscaneo.set('encontrado');
    if (f === 'sin-registro') this.filtroEscaneo.set('no_en_catalogo');
    const ref = (f === 'faltantes') ? this.seccionFaltantesRef : this.seccionEscaneoRef;
    ref?.nativeElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => { this.seccionResaltada.set(''); this.cdr.detectChanges(); }, 4000);
    this.cdr.detectChanges();
  }

  scrollA(seccion: string) {
    this.seccionResaltada.set(seccion);
    if (seccion === 'movidos') this.filtroEscaneo.set('encontrado');
    else if (seccion === 'sin-registro') this.filtroEscaneo.set('no_en_catalogo');
    else if (seccion === 'faltantes') this.filtroEscaneo.set('');
    const ref = seccion === 'faltantes' ? this.seccionFaltantesRef : this.seccionEscaneoRef;
    ref?.nativeElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => { this.seccionResaltada.set(''); this.cdr.detectChanges(); }, 4000);
    this.cdr.detectChanges();
  }

  escaneosFiltrados() {
    const f = this.filtroEscaneo();
    if (!f) return this.escaneos();
    return this.escaneos().filter(e => e.resultado === f);
  }

  contarResultado(r: string) {
    return this.escaneos().filter(e => e.resultado === r).length;
  }

  exportarFaltantes() {
    if (!this.sesion()) return;
    this.excel.exportarFaltantes(this.sesion()!, this.faltantes());
  }

  exportarEscaneos() {
    if (!this.sesion()) return;
    this.excel.exportarEscaneos(this.sesion()!, this.escaneos());
  }

  exportarCompleto() {
    if (!this.sesion()) return;
    this.excel.exportarCompleto(this.sesion()!, this.escaneos(), this.faltantes());
  }

  duracion(): string {
    const s = this.sesion();
    if (!s?.cerrada_at || !s?.iniciada_at) return '—';
    const diff = new Date(s.cerrada_at).getTime() - new Date(s.iniciada_at).getTime();
    const h   = Math.floor(diff / 3600000);
    const m   = Math.floor((diff % 3600000) / 60000);
    const seg = Math.floor((diff % 60000) / 1000);
    return `${h > 0 ? h + 'h ' : ''}${m}m ${seg}s`;
  }

  progreso() {
    const s = this.sesion();
    return s && s.total_en_catalogo ? Math.round((s.total_escaneados / s.total_en_catalogo) * 100) : 0;
  }

  badgeEstado(e: string) {
    return { abierta: 'bg-success-bg border border-success-border text-success-DEFAULT', pausada: 'bg-warning-bg border border-warning-border text-warning-DEFAULT', cerrada: 'bg-crema-dark border border-crema-border text-guinda-400' }[e] ?? '';
  }
  dotEstado(e: string) {
    return { abierta: 'bg-success-DEFAULT animate-pulse', pausada: 'bg-warning-DEFAULT', cerrada: 'bg-guinda-300' }[e] ?? '';
  }
  dotResultado(r: string) {
    return { coincide: 'bg-success-DEFAULT', encontrado: 'bg-warning-DEFAULT', no_en_catalogo: 'bg-danger-DEFAULT' }[r] ?? '';
  }
  chipResultado(r: string) {
    return { coincide: 'bg-success-bg text-success-DEFAULT', encontrado: 'bg-warning-bg text-warning-DEFAULT', no_en_catalogo: 'bg-danger-bg text-danger-DEFAULT' }[r] ?? '';
  }
  labelResultado(r: string) {
    return { coincide: 'OK', encontrado: 'Movido', no_en_catalogo: 'Ajeno' }[r] ?? r;
  }
}