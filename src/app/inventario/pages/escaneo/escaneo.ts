import { Component, OnInit, OnDestroy, signal, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { PdfService } from '../../services/pdf.service';
import { BuscadorCatalogoComponent } from '../../components/buscador-catalogo';
import { EscaneoResponse, ResumenSesion, ResultadoEscaneo } from '../../models';

@Component({
  selector: 'app-escaneo',
  standalone: true,
  imports: [CommonModule, FormsModule, BuscadorCatalogoComponent],
  template: `
    <div class="min-h-screen bg-crema flex flex-col">
      <div class="zapotec-band w-full"></div>

      <header class="bg-guinda-700 border-b-4 border-dorado sticky top-0 z-50 shadow-md">
        <div class="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <button (click)="router.navigate(['/dashboard'])"
                    class="text-dorado-light hover:text-white transition-colors">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
              </svg>
            </button>
            <img src="/oaxaca.png" alt="Oaxaca" class="h-7 w-7 object-contain"/>
            <div class="border-l border-white/20 pl-3">
              <div class="text-white font-semibold text-sm leading-tight truncate max-w-[180px] sm:max-w-xs">
                {{ sesion()?.nombre_sesion ?? 'Cargando...' }}
              </div>
              <div class="flex items-center gap-1.5 text-xs">
                @if (sesion()?.estado === 'pausada') {
                  <span class="w-1.5 h-1.5 rounded-full bg-warning-DEFAULT"></span>
                  <span class="text-warning-light font-semibold">Sesión pausada</span>
                } @else {
                  <span class="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                  <span class="text-dorado-light">Sesión abierta</span>
                }
              </div>
            </div>
          </div>

          @if (puedeGestionar()) {
            <div class="flex items-center gap-2">
              @if (sesion()?.estado === 'abierta') {
                <button (click)="pausarSesion()"
                        [disabled]="cambiandoEstado()"
                        class="text-white/70 hover:text-white text-xs border border-white/20
                               hover:border-warning-light hover:text-warning-light px-3 py-1.5
                               rounded-lg transition-all duration-150 flex items-center gap-1.5
                               disabled:opacity-50">
                  @if (cambiandoEstado()) {
                    <svg class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                  } @else {
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M15.75 5.25v13.5m-7.5-13.5v13.5"/>
                    </svg>
                  }
                  Pausar
                </button>
              } @else if (sesion()?.estado === 'pausada') {
                <button (click)="reanudarSesion()"
                        [disabled]="cambiandoEstado()"
                        class="text-white/70 hover:text-white text-xs border border-white/20
                               hover:border-green-400 hover:text-green-300 px-3 py-1.5
                               rounded-lg transition-all duration-150 flex items-center gap-1.5
                               disabled:opacity-50">
                  @if (cambiandoEstado()) {
                    <svg class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                  } @else {
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125
                           0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z"/>
                    </svg>
                  }
                  Reanudar
                </button>
              }

              <button (click)="mostrarConfirmCierre.set(true)"
                      class="text-white/70 hover:text-white text-xs border border-white/20
                             hover:border-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg
                             transition-all duration-150 flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73
                       0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898
                       0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
                </svg>
                Cerrar sesión
              </button>
            </div>
          }
        </div>
      </header>

      @if (sesion()?.estado === 'pausada') {
        <div class="bg-warning-bg border-b border-warning-border px-4 py-3
                    flex items-center justify-center gap-3 animate-fade-in">
          <svg class="w-4 h-4 text-warning-DEFAULT shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M15.75 5.25v13.5m-7.5-13.5v13.5"/>
          </svg>
          <p class="text-sm text-warning-DEFAULT font-medium">
            Sesión pausada — No se pueden registrar escaneos hasta reanudarla
          </p>
        </div>
      }

      <div class="flex-1 max-w-5xl mx-auto w-full px-4 py-6 grid lg:grid-cols-5 gap-6">
        <div class="lg:col-span-3 space-y-5">

          @if (sesion()) {
            <div class="grid grid-cols-4 gap-3">
              <div class="stat-card text-center border-t-2 border-t-guinda-200">
                <span class="stat-value text-guinda-800 text-xl">{{ sesion()!.total_escaneados }}</span>
                <span class="stat-label">Escaneados</span>
              </div>
              <div class="stat-card text-center border-t-2 border-t-success-DEFAULT">
                <span class="stat-value text-success-DEFAULT text-xl">{{ sesion()!.coincidencias }}</span>
                <span class="stat-label">Correctos</span>
              </div>
              <div class="stat-card text-center border-t-2 border-t-warning-DEFAULT">
                <span class="stat-value text-warning-DEFAULT text-xl">{{ sesion()!.ubicacion_diferente }}</span>
                <span class="stat-label">Movidos</span>
              </div>
              <div class="stat-card text-center border-t-2 border-t-danger-DEFAULT">
                <span class="stat-value text-danger-DEFAULT text-xl">{{ sesion()!.faltantes }}</span>
                <span class="stat-label">Faltan</span>
              </div>
            </div>
          }

          <div class="card border-crema-border transition-colors duration-500"
               [class]="flashClass()">

            <div class="relative h-14 mb-5 overflow-hidden rounded-lg"
                 [class]="sesion()?.estado === 'pausada'
                   ? 'bg-warning-bg border border-warning-border'
                   : 'bg-guinda-50 border border-guinda-100'">
              <div class="scanner-beam"
                   [class.opacity-0]="!escaneando() || sesion()?.estado === 'pausada'"></div>
              <div class="absolute inset-0 flex items-center justify-center gap-2">
                @if (sesion()?.estado === 'pausada') {
                  <svg class="w-5 h-5 text-warning-DEFAULT" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M15.75 5.25v13.5m-7.5-13.5v13.5"/>
                  </svg>
                  <span class="text-warning-DEFAULT text-xs font-mono tracking-widest">SESIÓN PAUSADA</span>
                } @else {
                  <svg class="w-5 h-5 text-guinda-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                      d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125
                         1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75
                         9.375v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0
                         1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125
                         1.125 0 0113.5 9.375v-4.5z"/>
                  </svg>
                  <span class="text-guinda-300 text-xs font-mono tracking-widest">LISTO PARA ESCANEAR</span>
                }
              </div>
            </div>

            <div class="mb-4">
              <label class="block text-xs font-semibold text-guinda-600 uppercase tracking-wider mb-1.5">
                Código de inventario
              </label>
              <div class="flex gap-2">
                <input
                  #inputCodigo
                  type="text"
                  [(ngModel)]="codigoLeido"
                  (keyup.enter)="escanear()"
                  placeholder="Escanea o escribe el código..."
                  class="input-gov font-mono text-base flex-1"
                  [disabled]="escaneando() || sesion()?.estado === 'pausada'"
                  autocomplete="off"
                  autocorrect="off"
                  spellcheck="false"
                />
                <app-buscador-catalogo
                  (codigoSeleccionado)="onCodigoSeleccionado($event)">
                </app-buscador-catalogo>
                <button (click)="escanear()"
                        [disabled]="!codigoLeido || escaneando() || sesion()?.estado === 'pausada'"
                        class="btn-primary px-4 disabled:opacity-40 disabled:cursor-not-allowed">
                  @if (escaneando()) {
                    <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                  } @else {
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0016.803 15.803z"/>
                    </svg>
                  }
                </button>
              </div>
              <p class="text-xs text-guinda-300 mt-1.5 flex items-center gap-1">
                <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987
                       8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0
                       016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018
                       18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"/>
                </svg>
                Usa el ícono del libro para buscar por nombre o ubicación si el código es ilegible
              </p>
            </div>

            @if (yaEscaneado()) {
              <div class="mb-4 flex items-start gap-3 bg-warning-bg border border-warning-border
                          rounded-lg px-4 py-3 animate-fade-in">
                <svg class="w-5 h-5 text-warning-DEFAULT shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/>
                </svg>
                <div>
                  <p class="text-sm font-semibold text-warning-DEFAULT">Bien ya escaneado en esta sesión</p>
                  <p class="text-xs text-warning-DEFAULT mt-0.5">
                    <span class="font-mono font-bold">{{ yaEscaneado() }}</span>
                    ya fue registrado anteriormente. No se registró de nuevo.
                  </p>
                </div>
              </div>
            }

            <div class="mb-4">
              <label class="block text-xs font-semibold text-guinda-600 uppercase tracking-wider mb-1.5">
                Ubicación actual
                <span class="text-guinda-300 normal-case font-normal">(opcional)</span>
              </label>
              <input type="text" [(ngModel)]="ubicacionEscaneada"
                     placeholder="Ej. Piso 2 - Bodega A"
                     class="input-gov text-sm"
                     [disabled]="sesion()?.estado === 'pausada'"/>
            </div>

            <div>
              <label class="block text-xs font-semibold text-guinda-600 uppercase tracking-wider mb-1.5">
                Observaciones
                <span class="text-guinda-300 normal-case font-normal">(opcional)</span>
              </label>
              <input type="text" [(ngModel)]="observaciones"
                     placeholder="Ej. Pantalla rota, falta cable, precintado..."
                     class="input-gov text-sm"
                     [disabled]="sesion()?.estado === 'pausada'"/>
            </div>

            @if (ultimoResultado()) {
              <div class="mt-5 rounded-xl border p-4 animate-slide-up"
                   [class]="cardResultado(ultimoResultado()!.resultado)">
                <div class="flex items-start gap-3">
                  <div class="shrink-0 mt-0.5 w-9 h-9 rounded-full flex items-center justify-center"
                       [class]="iconBg(ultimoResultado()!.resultado)">
                    @if (ultimoResultado()!.resultado === 'coincide') {
                      <svg class="w-4 h-4 text-success-DEFAULT" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4.5 12.75l6 6 9-13.5"/>
                      </svg>
                    } @else if (ultimoResultado()!.resultado === 'encontrado') {
                      <svg class="w-4 h-4 text-warning-DEFAULT" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/>
                      </svg>
                    } @else {
                      <svg class="w-4 h-4 text-danger-DEFAULT" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    }
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1 flex-wrap">
                      <span class="font-mono font-bold text-sm" [class]="textoResultado(ultimoResultado()!.resultado)">
                        {{ ultimoResultado()!.numero_inv_leido }}
                      </span>
                      <span class="text-xs px-2 py-0.5 rounded-full font-semibold border"
                            [class]="chipResultado(ultimoResultado()!.resultado)">
                        {{ labelResultado(ultimoResultado()!.resultado) }}
                      </span>
                    </div>
                    @if (ultimoResultado()!.descripcion) {
                      <p class="text-sm text-guinda-700 font-medium">{{ ultimoResultado()!.descripcion }}</p>
                    }
                    <!-- Marca, Modelo y No. Serie -->
                    @if (ultimoResultado()!.marca || ultimoResultado()!.modelo || ultimoResultado()!.numero_serie) {
                      <div class="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                        @if (ultimoResultado()!.marca) {
                          <span class="text-xs text-guinda-500">
                            <span class="text-guinda-300">Marca:</span> {{ ultimoResultado()!.marca }}
                          </span>
                        }
                        @if (ultimoResultado()!.modelo) {
                          <span class="text-xs text-guinda-500">
                            <span class="text-guinda-300">Modelo:</span> {{ ultimoResultado()!.modelo }}
                          </span>
                        }
                        @if (ultimoResultado()!.numero_serie) {
                          <span class="text-xs text-guinda-500 font-mono">
                            <span class="text-guinda-300">Serie:</span> {{ ultimoResultado()!.numero_serie }}
                          </span>
                        }
                      </div>
                    }
                    @if (ultimoResultado()!.resguardo) {
                      <p class="text-xs text-guinda-400 mt-0.5">
                        <span class="text-guinda-300">Resguardo:</span> {{ ultimoResultado()!.resguardo }}
                      </p>
                    }
                    <p class="text-xs text-guinda-400 mt-0.5">{{ ultimoResultado()!.mensaje }}</p>
                    @if (ultimoResultado()!.resultado === 'encontrado' && ultimoResultado()!.ubicacion_esperada) {
                      <div class="mt-1.5 text-xs">
                        <span class="text-guinda-400">Esperado en: </span>
                        <span class="font-mono font-semibold text-warning-DEFAULT">{{ ultimoResultado()!.ubicacion_esperada }}</span>
                      </div>
                    }
                  </div>
                </div>
              </div>
            }
          </div>
        </div>

        <div class="lg:col-span-2">
          <div class="card h-full flex flex-col">
            <div class="flex items-center justify-between mb-4 pb-3 border-b border-crema-border">
              <h3 class="font-semibold text-guinda-700 text-sm">Últimos escaneos</h3>
              <span class="text-xs font-mono bg-guinda-50 text-guinda-500 border border-guinda-100
                           px-2 py-0.5 rounded-full">
                {{ historial().length }}
              </span>
            </div>

            <div class="flex-1 overflow-y-auto space-y-2 max-h-[calc(100vh-280px)]">
              @if (historial().length === 0) {
                <div class="text-center py-10 text-guinda-300 text-sm">Sin escaneos aún</div>
              }
              @for (e of historial(); track e.id) {
                <div class="flex items-center gap-3 p-3 rounded-lg bg-crema border border-crema-border
                            animate-fade-in hover:border-guinda-200 transition-colors">
                  <div class="w-2 h-2 rounded-full shrink-0" [class]="dotResultado(e.resultado)"></div>
                  <div class="flex-1 min-w-0">
                    <div class="font-mono text-xs text-guinda-700 truncate font-semibold">{{ e.numero_inv_leido }}</div>
                    @if (e.descripcion) {
                      <div class="text-xs text-guinda-500 truncate">{{ e.descripcion }}</div>
                    }
                    @if (e.marca || e.modelo) {
                      <div class="text-xs text-guinda-400 truncate">
                        {{ e.marca }}{{ e.marca && e.modelo ? ' · ' : '' }}{{ e.modelo }}
                      </div>
                    }
                    @if (e.observaciones) {
                      <div class="text-xs text-guinda-300 truncate italic">{{ e.observaciones }}</div>
                    }
                  </div>
                  <div class="text-xs text-guinda-300 font-mono shrink-0">
                    {{ e.escaneado_at | date:'HH:mm:ss' }}
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      </div>

      @if (mostrarConfirmCierre()) {
        <div class="fixed inset-0 bg-guinda-950/60 backdrop-blur-sm z-50
                    flex items-center justify-center p-4">
          <div class="card w-full max-w-sm animate-slide-up shadow-modal">
            <div class="h-1 bg-gradient-to-r from-guinda-700 via-dorado to-guinda-700 -mx-6 -mt-6 mb-5"></div>
            <div class="w-12 h-12 rounded-full bg-danger-bg border border-danger-border
                        flex items-center justify-center mb-4">
              <svg class="w-5 h-5 text-danger-DEFAULT" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73
                     0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898
                     0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
              </svg>
            </div>
            <h3 class="font-display text-lg text-guinda-800 font-semibold mb-2">¿Cerrar esta sesión?</h3>
            <p class="text-sm text-guinda-500 mb-1">
              Esta acción es <span class="text-danger-DEFAULT font-semibold">irreversible</span>.
              Una vez cerrada no se pueden agregar más escaneos.
            </p>
            <p class="text-sm text-guinda-400 mb-5">
              Se generará el Acta de Verificación en PDF con hash de integridad.
            </p>
            <div class="flex gap-3">
              <button (click)="mostrarConfirmCierre.set(false)" class="btn-ghost flex-1">Cancelar</button>
              <button (click)="cerrarSesion()" [disabled]="cerrando()"
                      class="btn-danger flex-1 flex items-center justify-center gap-2">
                @if (cerrando()) {
                  <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                }
                Sí, cerrar sesión
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class EscaneoComponent implements OnInit, OnDestroy {
  @ViewChild('inputCodigo') inputRef!: ElementRef<HTMLInputElement>;

  sesionId = '';
  sesion               = signal<ResumenSesion | null>(null);
  historial            = signal<any[]>([]);
  ultimoResultado      = signal<EscaneoResponse | null>(null);
  escaneando           = signal(false);
  flashClass           = signal('');
  mostrarConfirmCierre = signal(false);
  cerrando             = signal(false);
  yaEscaneado          = signal('');
  cambiandoEstado      = signal(false);

  codigoLeido        = '';
  ubicacionEscaneada = '';
  observaciones      = '';

  private refreshInterval: any;

  constructor(
    private route: ActivatedRoute,
    public  router: Router,
    private api: ApiService,
    private auth: AuthService,
    private pdf: PdfService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.sesionId = this.route.snapshot.paramMap.get('id')!;
    this.cargarSesion();
    this.cargarHistorial();
    this.refreshInterval = setInterval(() => this.cargarSesion(), 10_000);
  }

  ngOnDestroy() { clearInterval(this.refreshInterval); }

  cargarSesion() {
    this.api.obtenerSesion(this.sesionId).subscribe(s => { this.sesion.set(s); this.cdr.detectChanges(); });
  }

  cargarHistorial() {
    this.api.listarEscaneos(this.sesionId).subscribe(data => { this.historial.set(data); this.cdr.detectChanges(); });
  }

  onCodigoSeleccionado(codigo: string) {
    this.codigoLeido = codigo;
    this.yaEscaneado.set('');
    setTimeout(() => this.inputRef?.nativeElement.focus(), 100);
    this.cdr.detectChanges();
  }

  pausarSesion() {
    this.cambiandoEstado.set(true);
    this.api.pausarSesion(this.sesionId).subscribe({
      next: () => { this.cambiandoEstado.set(false); this.cargarSesion(); },
      error: () => this.cambiandoEstado.set(false),
    });
  }

  reanudarSesion() {
    this.cambiandoEstado.set(true);
    this.api.reanudarSesion(this.sesionId).subscribe({
      next: () => { this.cambiandoEstado.set(false); this.cargarSesion(); },
      error: () => this.cambiandoEstado.set(false),
    });
  }

  escanear() {
    const codigo = this.codigoLeido.trim();
    if (!codigo || this.escaneando() || this.sesion()?.estado === 'pausada') return;

    this.yaEscaneado.set('');

    const duplicado = this.historial().find(
      e => e.numero_inv_leido === codigo && e.resultado !== 'no_en_catalogo'
    );
    if (duplicado) {
      this.yaEscaneado.set(codigo);
      this.ultimoResultado.set(null);
      this.codigoLeido = '';
      setTimeout(() => this.yaEscaneado.set(''), 10000);
      setTimeout(() => this.inputRef?.nativeElement.focus(), 50);
      this.cdr.detectChanges();
      return;
    }

    this.escaneando.set(true);

    this.api.registrarEscaneo({
      sesion_id: this.sesionId,
      numero_inv_leido: codigo,
      ubicacion_escaneada: this.ubicacionEscaneada,
      observaciones: this.observaciones,
    }).subscribe({
      next: res => {
        this.escaneando.set(false);
        if (res.ok && res.data) {
          this.ultimoResultado.set(res.data);
          this.aplicarFlash(res.data.resultado);
          this.historial.update(h => [res.data!, ...h].slice(0, 100));
          this.cargarSesion();
        }
        this.codigoLeido = '';
        this.observaciones = '';
        setTimeout(() => this.inputRef?.nativeElement.focus(), 50);
        this.cdr.detectChanges();
      },
      error: () => { this.escaneando.set(false); this.codigoLeido = ''; this.cdr.detectChanges(); },
    });
  }

  aplicarFlash(r: ResultadoEscaneo) {
    const map: Record<ResultadoEscaneo, string> = {
      coincide: 'result-flash-success', encontrado: 'result-flash-warning', no_en_catalogo: 'result-flash-danger',
    };
    this.flashClass.set(map[r]);
    setTimeout(() => this.flashClass.set(''), 600);
  }

  cerrarSesion() {
    this.cerrando.set(true);
    this.api.cerrarSesion(this.sesionId).subscribe({
      next: res => {
        this.cerrando.set(false);
        if (res.ok) {
          this.api.obtenerSesion(this.sesionId).subscribe(sesion => {
            this.api.faltantes(this.sesionId).subscribe(faltantes => {
              this.api.listarEscaneos(this.sesionId).subscribe(escaneos => {
                const hash = (res.data as any)?.hash_cierre ?? 'N/A';
                this.pdf.generarActa(sesion, faltantes, escaneos as any, hash);
                this.router.navigate(['/sesion', this.sesionId]);
              });
            });
          });
        }
      },
      error: () => this.cerrando.set(false),
    });
  }

  puedeGestionar() { return this.auth.hasRole('supervisor', 'admin'); }

  cardResultado(r: ResultadoEscaneo) {
    return { coincide: 'bg-success-bg border-success-border', encontrado: 'bg-warning-bg border-warning-border', no_en_catalogo: 'bg-danger-bg border-danger-border' }[r];
  }
  iconBg(r: ResultadoEscaneo) {
    return { coincide: 'bg-success-bg', encontrado: 'bg-warning-bg', no_en_catalogo: 'bg-danger-bg' }[r];
  }
  textoResultado(r: ResultadoEscaneo) {
    return { coincide: 'text-success-DEFAULT', encontrado: 'text-warning-DEFAULT', no_en_catalogo: 'text-danger-DEFAULT' }[r];
  }
  chipResultado(r: ResultadoEscaneo) {
    return { coincide: 'bg-success-bg border-success-border text-success-DEFAULT', encontrado: 'bg-warning-bg border-warning-border text-warning-DEFAULT', no_en_catalogo: 'bg-danger-bg border-danger-border text-danger-DEFAULT' }[r];
  }
  labelResultado(r: ResultadoEscaneo) {
    return { coincide: 'Verificado', encontrado: 'Ubicación diferente', no_en_catalogo: 'No en catálogo' }[r];
  }
  dotResultado(r: string) {
    return { coincide: 'bg-success-DEFAULT', encontrado: 'bg-warning-DEFAULT', no_en_catalogo: 'bg-danger-DEFAULT' }[r] ?? '';
  }
}
