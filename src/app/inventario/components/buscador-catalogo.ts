import { Component, signal, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { Bien } from '../models'

@Component({
  selector: 'app-buscador-catalogo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <button (click)="abrir()"
            type="button"
            title="Buscar en catálogo"
            class="px-3 py-2.5 bg-crema border border-crema-border rounded-lg
                   text-guinda-500 hover:text-guinda-700 hover:border-guinda-300
                   hover:bg-guinda-50 transition-all duration-150">
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987
             8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0
             016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018
             18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"/>
      </svg>
    </button>

    @if (abierto()) {
      <div class="fixed inset-0 bg-guinda-950/60 backdrop-blur-sm z-50
                  flex items-center justify-center p-4"
           (click)="cerrar()">
        <div class="bg-white rounded-2xl shadow-modal w-full max-w-2xl
                    max-h-[85vh] flex flex-col animate-slide-up overflow-hidden"
             (click)="$event.stopPropagation()">

          <div class="h-1.5 bg-gradient-to-r from-guinda-700 via-dorado to-guinda-700 shrink-0"></div>
          <div class="px-6 py-4 border-b border-crema-border shrink-0">
            <div class="flex items-center justify-between mb-3">
              <h3 class="font-display text-lg text-guinda-800 font-semibold">
                Buscar en catálogo
              </h3>
              <button (click)="cerrar()"
                      class="text-guinda-300 hover:text-guinda-600 transition-colors">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <div class="relative">
              <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-guinda-300"
                   fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0016.803 15.803z"/>
              </svg>
              <input
                #searchInput
                type="text"
                [(ngModel)]="query"
                (ngModelChange)="filtrar()"
                placeholder="Buscar por número, descripción o ubicación..."
                class="input-gov pl-10 text-sm"
                autocomplete="off"
              />
              @if (query) {
                <button (click)="query = ''; filtrar()"
                        class="absolute right-3 top-1/2 -translate-y-1/2
                               text-guinda-300 hover:text-guinda-600">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              }
            </div>

            <div class="flex gap-2 mt-3 flex-wrap">
              <button (click)="filtroClasif = ''; filtrar()"
                      class="text-xs px-3 py-1 rounded-full border transition-all duration-150"
                      [class]="filtroClasif === ''
                        ? 'bg-guinda-700 text-white border-guinda-700'
                        : 'bg-white text-guinda-500 border-crema-border hover:border-guinda-300'">
                Todos ({{ bienes().length }})
              </button>
              @for (c of clasificaciones(); track c) {
                <button (click)="filtroClasif = c; filtrar()"
                        class="text-xs px-3 py-1 rounded-full border transition-all duration-150"
                        [class]="filtroClasif === c
                          ? 'bg-guinda-700 text-white border-guinda-700'
                          : 'bg-white text-guinda-500 border-crema-border hover:border-guinda-300'">
                  {{ c }}
                </button>
              }
            </div>
          </div>

          <div class="flex-1 overflow-y-auto">
            @if (cargando()) {
              <div class="flex items-center justify-center py-12">
                <svg class="w-5 h-5 animate-spin text-guinda-400" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              </div>
            } @else if (resultados().length === 0) {
              <div class="text-center py-12">
                <p class="text-guinda-400 text-sm">No se encontraron bienes</p>
                @if (query) {
                  <p class="text-guinda-300 text-xs mt-1">Intenta con otro término de búsqueda</p>
                }
              </div>
            } @else {
              <div class="divide-y divide-crema-border">
                @for (b of resultados(); track b.id) {
                  <button (click)="seleccionar(b)"
                          class="w-full px-6 py-3.5 text-left hover:bg-guinda-50
                                 transition-colors flex items-center gap-4 group">
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 mb-0.5">
                        <span class="inv-number text-sm">{{ b.numero_inventario }}</span>
                        <span class="text-xs px-2 py-0.5 rounded bg-crema border border-crema-border
                                     text-guinda-400 font-medium shrink-0">
                          {{ b.clasificacion }}
                        </span>
                      </div>
                      <p class="text-sm text-guinda-700 truncate">{{ b.descripcion }}</p>
                      @if (b.ubicacion_esperada) {
                        <p class="text-xs text-guinda-400 mt-0.5 flex items-center gap-1">
                          <svg class="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/>
                          </svg>
                          {{ b.ubicacion_esperada }}
                        </p>
                      }
                    </div>
                    <svg class="w-4 h-4 text-guinda-200 group-hover:text-guinda-500
                                 transition-colors shrink-0"
                         fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/>
                    </svg>
                  </button>
                }
              </div>
            }
          </div>

          <div class="px-6 py-3 border-t border-crema-border bg-crema/50 shrink-0">
            <p class="text-xs text-guinda-400">
              Mostrando <span class="font-semibold text-guinda-600">{{ resultados().length }}</span>
              de <span class="font-semibold text-guinda-600">{{ bienes().length }}</span> bienes en catálogo
            </p>
          </div>
        </div>
      </div>
    }
  `,
})
export class BuscadorCatalogoComponent implements OnInit {
  @Output() codigoSeleccionado = new EventEmitter<string>();

  abierto        = signal(false);
  cargando       = signal(false);
  bienes         = signal<Bien[]>([]);
  resultados     = signal<Bien[]>([]);
  clasificaciones = signal<string[]>([]);

  query        = '';
  filtroClasif = '';

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.cargarCatalogo();
  }

  cargarCatalogo() {
    this.cargando.set(true);
    this.api.listarCatalogo().subscribe({
      next: data => {
        this.bienes.set(data);
        this.resultados.set(data);
        const clasifs = [...new Set(data.map(b => b.clasificacion).filter(Boolean))].sort();
        this.clasificaciones.set(clasifs);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  abrir() {
    this.abierto.set(true);
    this.query = '';
    this.filtroClasif = '';
    this.resultados.set(this.bienes());
  }

  cerrar() {
    this.abierto.set(false);
  }

  filtrar() {
    const q = this.query.toLowerCase().trim();
    let lista = this.bienes();

    if (this.filtroClasif) {
      lista = lista.filter(b => b.clasificacion === this.filtroClasif);
    }

    if (q) {
      lista = lista.filter(b =>
        b.numero_inventario.toLowerCase().includes(q) ||
        b.descripcion.toLowerCase().includes(q) ||
        (b.ubicacion_esperada ?? '').toLowerCase().includes(q)
      );
    }

    this.resultados.set(lista);
  }

  seleccionar(b: Bien) {
    this.codigoSeleccionado.emit(b.numero_inventario);
    this.cerrar();
  }
}
