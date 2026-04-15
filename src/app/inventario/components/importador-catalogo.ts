import { Component, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import { ApiService } from '../services/api.service';

interface MapeoColumnas {
  numero_inventario:  string;
  numero_serie:       string;
  descripcion:        string;
  marca:              string;
  modelo:             string;
  ubicacion_esperada: string;
  resguardo:          string;
  clasificacion:      string;
}

interface BienImport {
  numero_inventario:  string;
  numero_serie:       string;
  descripcion:        string;
  marca:              string;
  modelo:             string;
  ubicacion_esperada: string;
  resguardo:          string;
  clasificacion:      string;
  fila:               number;
}

interface GrupoDuplicado {
  numero_inventario: string;
  opciones:          BienImport[];
  seleccionado:      number;
}

@Component({
  selector: 'app-importador-catalogo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<button (click)="abrir()"
        class="btn-ghost flex items-center gap-1.5 text-sm">
  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
      d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/>
  </svg>
  Importar catálogo
</button>

@if (abierto()) {
  <div class="fixed inset-0 bg-guinda-950/60 backdrop-blur-sm z-50
              flex items-center justify-center p-4"
       (click)="cerrar()">
    <div class="bg-white rounded-2xl shadow-modal w-full max-w-4xl
                max-h-[90vh] flex flex-col animate-slide-up overflow-hidden"
         (click)="$event.stopPropagation()">

      <div class="h-1.5 bg-gradient-to-r from-guinda-700 via-dorado to-guinda-700 shrink-0"></div>
      <div class="px-6 py-4 border-b border-crema-border flex items-center justify-between shrink-0">
        <div>
          <h3 class="font-display text-xl text-guinda-800 font-semibold">Importar catálogo de bienes</h3>
          <p class="text-guinda-400 text-xs mt-0.5">Sube cualquier Excel — mapea las columnas y el sistema hace el resto</p>
        </div>
        <button (click)="cerrar()" class="text-guinda-300 hover:text-guinda-600 transition-colors">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <!-- Pasos -->
      <div class="px-6 pt-4 pb-0 shrink-0">
        <div class="flex items-center gap-2 mb-5">
          @for (p of pasos; track p.n) {
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
                   [class]="paso() >= p.n ? 'bg-guinda-700 text-white' : 'bg-crema-dark text-guinda-400'">
                @if (paso() > p.n) {
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M4.5 12.75l6 6 9-13.5"/>
                  </svg>
                } @else { {{ p.n }} }
              </div>
              <span class="text-xs hidden sm:block"
                    [class]="paso() >= p.n ? 'text-guinda-700 font-medium' : 'text-guinda-300'">
                {{ p.label }}
              </span>
              @if (p.n < pasos.length) {
                <div class="w-8 h-px mx-1" [class]="paso() > p.n ? 'bg-guinda-500' : 'bg-crema-border'"></div>
              }
            </div>
          }
        </div>
      </div>

      <div class="flex-1 overflow-y-auto px-6 pb-6 space-y-5">

        <!-- PASO 1 -->
        @if (paso() === 1) {
          <div class="border-2 border-dashed border-crema-border rounded-xl p-10 text-center
                      hover:border-guinda-300 hover:bg-guinda-50 transition-all duration-200 cursor-pointer"
               (click)="inputArchivo.click()"
               (dragover)="$event.preventDefault()"
               (drop)="onDrop($event)">
            <input #inputArchivo type="file" accept=".xlsx,.xls,.csv" class="hidden"
                   (change)="onArchivoSeleccionado($event)"/>
            @if (!archivo()) {
              <svg class="w-14 h-14 text-guinda-200 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                  d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375
                     0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125
                     1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/>
              </svg>
              <p class="text-guinda-600 font-semibold text-lg mb-1">Arrastra tu Excel aquí</p>
              <p class="text-guinda-400 text-sm mb-3">o haz clic para seleccionar</p>
              <span class="text-xs bg-crema border border-crema-border text-guinda-400 px-3 py-1 rounded-full">.xlsx · .xls · .csv</span>
            } @else {
              <svg class="w-12 h-12 text-success-DEFAULT mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <p class="text-guinda-800 font-semibold text-lg">{{ archivo()!.name }}</p>
              <p class="text-guinda-400 text-sm mt-1 mb-3">
                <span class="font-mono font-bold text-guinda-600">{{ filasPrevia().length }}</span> filas ·
                <span class="font-mono font-bold text-guinda-600">{{ columnasExcel().length }}</span> columnas
              </p>
              <button (click)="$event.stopPropagation(); resetArchivo()"
                      class="text-xs text-guinda-400 hover:text-danger-DEFAULT underline transition-colors">
                Cambiar archivo
              </button>
            }
          </div>
          @if (errorArchivo()) {
            <div class="flex items-center gap-2 bg-danger-bg border border-danger-border rounded-lg px-4 py-3">
              <span class="text-sm text-danger-DEFAULT">{{ errorArchivo() }}</span>
            </div>
          }
          @if (archivo() && filasPrevia().length > 0) {
            <div class="flex justify-end">
              <button (click)="paso.set(2)" class="btn-primary flex items-center gap-2">
                Continuar
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/>
                </svg>
              </button>
            </div>
          }
        }

        <!-- PASO 2 -->
        @if (paso() === 2) {
          <div>
            <p class="text-xs font-semibold text-guinda-500 uppercase tracking-wider mb-2">Vista previa (primeras 4 filas)</p>
            <div class="overflow-x-auto rounded-lg border border-crema-border">
              <table class="text-xs w-full">
                <thead class="bg-guinda-50">
                  <tr>
                    @for (col of columnasExcel(); track col) {
                      <th class="px-3 py-2 text-left font-semibold text-guinda-600 border-b border-crema-border whitespace-nowrap">{{ col }}</th>
                    }
                  </tr>
                </thead>
                <tbody>
                  @for (fila of filasPrevia().slice(0, 4); track $index) {
                    <tr class="border-b border-crema-border last:border-0 hover:bg-crema/50">
                      @for (col of columnasExcel(); track col) {
                        <td class="px-3 py-2 text-guinda-500 whitespace-nowrap max-w-36 truncate">{{ fila[col] ?? '—' }}</td>
                      }
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
          <div>
            <p class="text-xs font-semibold text-guinda-500 uppercase tracking-wider mb-3">¿Qué columna corresponde a cada campo?</p>
            <div class="grid sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold text-guinda-600 uppercase tracking-wider mb-1.5">Número de inventario *</label>
                <select [(ngModel)]="mapeo.numero_inventario" class="input-gov text-sm">
                  <option value="">— Selecciona columna —</option>
                  @for (col of columnasExcel(); track col) { <option [value]="col">{{ col }}</option> }
                </select>
                @if (mapeo.numero_inventario && filasPrevia()[0]) {
                  <p class="text-xs text-guinda-400 mt-1 font-mono">Ej: {{ filasPrevia()[0][mapeo.numero_inventario] }}</p>
                }
              </div>
              <div>
                <label class="block text-xs font-semibold text-guinda-600 uppercase tracking-wider mb-1.5">Descripción *</label>
                <select [(ngModel)]="mapeo.descripcion" class="input-gov text-sm">
                  <option value="">— Selecciona columna —</option>
                  @for (col of columnasExcel(); track col) { <option [value]="col">{{ col }}</option> }
                </select>
                @if (mapeo.descripcion && filasPrevia()[0]) {
                  <p class="text-xs text-guinda-400 mt-1 font-mono truncate">Ej: {{ filasPrevia()[0][mapeo.descripcion] }}</p>
                }
              </div>
              <div>
                <label class="block text-xs font-semibold text-guinda-600 uppercase tracking-wider mb-1.5">Número de serie <span class="text-guinda-300 normal-case font-normal">(opcional)</span></label>
                <select [(ngModel)]="mapeo.numero_serie" class="input-gov text-sm">
                  <option value="">— No mapear —</option>
                  @for (col of columnasExcel(); track col) { <option [value]="col">{{ col }}</option> }
                </select>
              </div>
              <div>
                <label class="block text-xs font-semibold text-guinda-600 uppercase tracking-wider mb-1.5">Marca <span class="text-guinda-300 normal-case font-normal">(opcional)</span></label>
                <select [(ngModel)]="mapeo.marca" class="input-gov text-sm">
                  <option value="">— No mapear —</option>
                  @for (col of columnasExcel(); track col) { <option [value]="col">{{ col }}</option> }
                </select>
              </div>
              <div>
                <label class="block text-xs font-semibold text-guinda-600 uppercase tracking-wider mb-1.5">Modelo <span class="text-guinda-300 normal-case font-normal">(opcional)</span></label>
                <select [(ngModel)]="mapeo.modelo" class="input-gov text-sm">
                  <option value="">— No mapear —</option>
                  @for (col of columnasExcel(); track col) { <option [value]="col">{{ col }}</option> }
                </select>
              </div>
              <div>
                <label class="block text-xs font-semibold text-guinda-600 uppercase tracking-wider mb-1.5">Ubicación esperada <span class="text-guinda-300 normal-case font-normal">(opcional)</span></label>
                <select [(ngModel)]="mapeo.ubicacion_esperada" class="input-gov text-sm">
                  <option value="">— No mapear —</option>
                  @for (col of columnasExcel(); track col) { <option [value]="col">{{ col }}</option> }
                </select>
              </div>
              <div>
                <label class="block text-xs font-semibold text-guinda-600 uppercase tracking-wider mb-1.5">Resguardo <span class="text-guinda-300 normal-case font-normal">(opcional)</span></label>
                <select [(ngModel)]="mapeo.resguardo" class="input-gov text-sm">
                  <option value="">— No mapear —</option>
                  @for (col of columnasExcel(); track col) { <option [value]="col">{{ col }}</option> }
                </select>
              </div>
              <div>
                <label class="block text-xs font-semibold text-guinda-600 uppercase tracking-wider mb-1.5">Clasificación <span class="text-guinda-300 normal-case font-normal">(opcional)</span></label>
                <select [(ngModel)]="mapeo.clasificacion" class="input-gov text-sm">
                  <option value="">— No mapear —</option>
                  @for (col of columnasExcel(); track col) { <option [value]="col">{{ col }}</option> }
                </select>
              </div>
            </div>
          </div>
          <div class="flex gap-3">
            <button (click)="paso.set(1)" class="btn-ghost">Atrás</button>
            <button (click)="previsualizarImportacion()"
                    [disabled]="!mapeo.numero_inventario || !mapeo.descripcion"
                    class="btn-primary flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
              Previsualizar
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/>
              </svg>
            </button>
          </div>
        }

        <!-- PASO 3: Duplicados -->
        @if (paso() === 3) {
          <div class="flex items-center justify-between">
            <div class="flex items-start gap-3 bg-warning-bg border border-warning-border
                        rounded-lg px-4 py-3 flex-1">
              <svg class="w-5 h-5 text-warning-DEFAULT shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/>
              </svg>
              <div>
                <p class="text-sm font-semibold text-warning-DEFAULT">
                  {{ duplicados().length }} número{{ duplicados().length !== 1 ? 's' : '' }} de inventario duplicado{{ duplicados().length !== 1 ? 's' : '' }}
                </p>
                <p class="text-xs text-warning-DEFAULT mt-0.5">Selecciona cuál registro conservar para cada número duplicado.</p>
              </div>
            </div>
            <button (click)="imprimirDuplicados()"
                    class="ml-3 btn-ghost flex items-center gap-1.5 text-sm shrink-0">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0
                     0010.56 0m-10.56 0L6.75 19.5m.6-5.671a42.17 42.17 0 015.1-.487m5.46.487L17.25
                     19.5M3.75 4.875c0-.621.504-1.125 1.125-1.125h14.25c.621 0 1.125.504 1.125
                     1.125v9.75c0 .621-.504 1.125-1.125 1.125h-14.25A1.125 1.125 0 013.75
                     14.625v-9.75z"/>
              </svg>
              Imprimir lista
            </button>
          </div>

          <div class="space-y-4 max-h-96 overflow-y-auto">
            @for (grupo of duplicados(); track grupo.numero_inventario) {
              <div class="border border-warning-border rounded-xl overflow-hidden">
                <div class="bg-warning-bg px-4 py-2 flex items-center gap-2">
                  <span class="text-xs font-mono font-bold text-warning-DEFAULT">{{ grupo.numero_inventario }}</span>
                  <span class="text-xs text-warning-DEFAULT">— elige cuál conservar:</span>
                </div>
                <div class="divide-y divide-crema-border">
                  @for (opcion of grupo.opciones; track $index) {
                    <label class="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-crema/50 transition-colors"
                           [class.bg-success-bg]="grupo.seleccionado === $index">
                      <input type="radio"
                             [name]="'dup_' + grupo.numero_inventario"
                             [checked]="grupo.seleccionado === $index"
                             (change)="grupo.seleccionado = $index"
                             class="mt-1 accent-guinda-700"/>
                      <div class="flex-1 min-w-0">
                        <div class="text-xs font-semibold text-guinda-700">Fila {{ opcion.fila }} — {{ opcion.descripcion }}</div>
                        <div class="flex flex-wrap gap-x-3 mt-0.5">
                          @if (opcion.marca) { <span class="text-xs text-guinda-400">Marca: {{ opcion.marca }}</span> }
                          @if (opcion.modelo) { <span class="text-xs text-guinda-400">Modelo: {{ opcion.modelo }}</span> }
                          @if (opcion.numero_serie) { <span class="text-xs text-guinda-400 font-mono">Serie: {{ opcion.numero_serie }}</span> }
                          @if (opcion.resguardo) { <span class="text-xs text-guinda-400">Resguardo: {{ opcion.resguardo }}</span> }
                          @if (opcion.ubicacion_esperada) { <span class="text-xs text-guinda-400">Ubic: {{ opcion.ubicacion_esperada }}</span> }
                        </div>
                      </div>
                    </label>
                  }
                </div>
              </div>
            }
          </div>

          <div class="flex gap-3">
            <button (click)="paso.set(2)" class="btn-ghost">Atrás</button>
            <button (click)="confirmarDuplicados()" class="btn-primary flex items-center gap-2">
              Continuar con selección
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/>
              </svg>
            </button>
          </div>
        }

        <!-- PASO 4: Confirmar -->
        @if (paso() === 4) {
          <div class="grid grid-cols-3 gap-4">
            <div class="stat-card border-t-2 border-t-success-DEFAULT text-center">
              <span class="stat-label">Bienes válidos</span>
              <span class="stat-value text-success-DEFAULT">{{ bienesValidos().length }}</span>
            </div>
            <div class="stat-card border-t-2 border-t-danger-DEFAULT text-center">
              <span class="stat-label">Con errores</span>
              <span class="stat-value text-danger-DEFAULT">{{ bienesConError().length }}</span>
            </div>
            <div class="stat-card border-t-2 border-t-guinda-300 text-center">
              <span class="stat-label">Total filas</span>
              <span class="stat-value text-guinda-600">{{ filasPrevia().length }}</span>
            </div>
          </div>

          @if (bienesConError().length > 0) {
            <div class="bg-danger-bg border border-danger-border rounded-lg p-4">
              <p class="text-sm font-semibold text-danger-DEFAULT mb-2">Filas omitidas:</p>
              <div class="space-y-1 max-h-28 overflow-y-auto">
                @for (e of bienesConError().slice(0, 10); track $index) {
                  <p class="text-xs font-mono text-danger-DEFAULT">Fila {{ e.fila }}: {{ e.error }}</p>
                }
              </div>
            </div>
          }

          <div class="overflow-x-auto rounded-lg border border-crema-border">
            <table class="text-xs w-full">
              <thead class="bg-guinda-50">
                <tr>
                  <th class="px-3 py-2 text-left font-semibold text-guinda-600 border-b border-crema-border">No. Inventario</th>
                  <th class="px-3 py-2 text-left font-semibold text-guinda-600 border-b border-crema-border">Descripción</th>
                  <th class="px-3 py-2 text-left font-semibold text-guinda-600 border-b border-crema-border">Marca</th>
                  <th class="px-3 py-2 text-left font-semibold text-guinda-600 border-b border-crema-border">Resguardo</th>
                </tr>
              </thead>
              <tbody>
                @for (b of bienesValidos().slice(0, 5); track $index) {
                  <tr class="border-b border-crema-border last:border-0">
                    <td class="px-3 py-2 font-mono font-semibold text-guinda-700">{{ b.numero_inventario }}</td>
                    <td class="px-3 py-2 text-guinda-500 truncate max-w-48">{{ b.descripcion }}</td>
                    <td class="px-3 py-2 text-guinda-400">{{ b.marca || '—' }}</td>
                    <td class="px-3 py-2 text-guinda-400">{{ b.resguardo || '—' }}</td>
                  </tr>
                }
              </tbody>
            </table>
            @if (bienesValidos().length > 5) {
              <p class="text-xs text-guinda-400 text-center py-2 border-t border-crema-border">
                ... y {{ bienesValidos().length - 5 }} bienes más
              </p>
            }
          </div>

          @if (errorImport()) {
            <div class="flex items-center gap-2 bg-danger-bg border border-danger-border rounded-lg px-4 py-3">
              <span class="text-sm text-danger-DEFAULT">{{ errorImport() }}</span>
            </div>
          }
          @if (exitoImport()) {
            <div class="flex items-center gap-3 bg-success-bg border border-success-border rounded-lg px-4 py-3">
              <svg class="w-5 h-5 text-success-DEFAULT shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4.5 12.75l6 6 9-13.5"/>
              </svg>
              <span class="text-sm text-success-DEFAULT font-semibold">{{ exitoImport() }}</span>
            </div>
          }

          <div class="flex gap-3">
            <button (click)="paso.set(duplicados().length > 0 ? 3 : 2)"
                    class="btn-ghost" [disabled]="importando()">Atrás</button>
            <button (click)="descargarExcelLimpio()"
                    [disabled]="importando()"
                    class="btn-ghost flex items-center gap-1.5 disabled:opacity-40">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/>
              </svg>
              Descargar limpio
            </button>
            <button (click)="importar()"
                    [disabled]="bienesValidos().length === 0 || importando() || !!exitoImport()"
                    class="btn-primary flex-1 flex items-center justify-center gap-2
                           disabled:opacity-40 disabled:cursor-not-allowed">
              @if (importando()) {
                <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Importando {{ bienesValidos().length }} bienes...
              } @else if (exitoImport()) {
                Importado correctamente
              } @else {
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/>
                </svg>
                Importar {{ bienesValidos().length }} bienes
              }
            </button>
          </div>
        }

      </div>
    </div>
  </div>
}
  `,
})
export class ImportadorCatalogoComponent {
  abierto       = signal(false);
  paso          = signal(1);
  archivo       = signal<File | null>(null);
  columnasExcel = signal<string[]>([]);
  filasPrevia   = signal<any[]>([]);
  errorArchivo  = signal('');
  errorImport   = signal('');
  exitoImport   = signal('');
  importando    = signal(false);
  bienesValidos  = signal<BienImport[]>([]);
  bienesConError = signal<any[]>([]);
  duplicados     = signal<GrupoDuplicado[]>([]);

  pasos = [
    { n: 1, label: 'Subir archivo' },
    { n: 2, label: 'Mapear columnas' },
    { n: 3, label: 'Duplicados' },
    { n: 4, label: 'Confirmar' },
  ];

  mapeo: MapeoColumnas = {
    numero_inventario: '', numero_serie: '', descripcion: '',
    marca: '', modelo: '', ubicacion_esperada: '', resguardo: '', clasificacion: '',
  };

  private bienesUnicos:  BienImport[]     = [];
  private archivoBuffer: ArrayBuffer | null = null;

  private readonly SIN_NUMERO = [
    'sin sicipo',
    'sin inventariado',
    'no inventariado',
  ];

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  abrir()  { this.abierto.set(true);  this.reset(); }
  cerrar() { this.abierto.set(false); this.reset(); }

  reset() {
    this.paso.set(1);
    this.archivo.set(null);
    this.columnasExcel.set([]);
    this.filasPrevia.set([]);
    this.errorArchivo.set('');
    this.errorImport.set('');
    this.exitoImport.set('');
    this.bienesValidos.set([]);
    this.bienesConError.set([]);
    this.duplicados.set([]);
    this.bienesUnicos  = [];
    this.archivoBuffer = null;
    this.mapeo = { numero_inventario: '', numero_serie: '', descripcion: '',
                   marca: '', modelo: '', ubicacion_esperada: '', resguardo: '', clasificacion: '' };
  }

  resetArchivo() {
    this.archivo.set(null);
    this.columnasExcel.set([]);
    this.filasPrevia.set([]);
    this.errorArchivo.set('');
    this.archivoBuffer = null;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (file) this.procesarArchivo(file);
  }

  onArchivoSeleccionado(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.procesarArchivo(file);
  }

  procesarArchivo(file: File) {
    this.errorArchivo.set('');
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext ?? '')) {
      this.errorArchivo.set('Solo se aceptan archivos .xlsx, .xls o .csv');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target!.result as ArrayBuffer;
        this.archivoBuffer = buffer;
        const data  = new Uint8Array(buffer);
        const wb    = XLSX.read(data, { type: 'array' });
        const ws    = wb.Sheets[wb.SheetNames[0]];
        const filas = XLSX.utils.sheet_to_json(ws, { defval: '' }) as any[];
        if (filas.length === 0) { this.errorArchivo.set('El archivo no tiene datos'); return; }
        const columnas = Object.keys(filas[0]);
        this.archivo.set(file);
        this.columnasExcel.set(columnas);
        this.filasPrevia.set(filas);
        this.autoDetectarColumnas(columnas);
        this.cdr.detectChanges();
      } catch {
        this.errorArchivo.set('No se pudo leer el archivo.');
      }
    };
    reader.readAsArrayBuffer(file);
  }

  autoDetectarColumnas(cols: string[]) {
    const lower = cols.map(c => String(c).toLowerCase());
    const find  = (kw: string[]) => cols.find((_, i) => kw.some(k => lower[i].includes(k))) ?? '';
    this.mapeo.numero_inventario  = find(['inventario', 'numero inv', 'no. inv', 'codigo', 'código', 'clave']);
    this.mapeo.numero_serie       = find(['serie', 'serial', 'no. serie']);
    this.mapeo.descripcion        = find(['descripcion', 'descripción', 'bien', 'articulo', 'nombre']);
    this.mapeo.marca              = find(['marca']);
    this.mapeo.modelo             = find(['modelo']);
    this.mapeo.ubicacion_esperada = find(['ubicacion', 'ubicación', 'lugar', 'area', 'área']);
    this.mapeo.resguardo          = find(['resguardo', 'responsable', 'custodio']);
    this.mapeo.clasificacion      = find(['clasificacion', 'clasificación', 'tipo', 'categoria']);
  }

  col(fila: any, campo: string): string {
    return campo ? String(fila[campo] ?? '').trim() : '';
  }

  esSinNumero(num: string): boolean {
    return this.SIN_NUMERO.includes(num.toLowerCase().trim());
  }

  previsualizarImportacion() {
    const errores: any[]            = [];
    const unicos:  BienImport[]     = [];
    const grupos:  GrupoDuplicado[] = [];
    const mapa = new Map<string, BienImport[]>();

    this.filasPrevia().forEach((fila, i) => {
      const num  = this.col(fila, this.mapeo.numero_inventario);
      const desc = this.col(fila, this.mapeo.descripcion);
      if (!num) { return; }
      if (this.esSinNumero(num)) { return; } // ignorar sin número real
      if (!desc) { errores.push({ fila: i + 2, error: `Descripción vacía (${num})` }); return; }

      const bien: BienImport = {
        numero_inventario:  num,
        numero_serie:       this.col(fila, this.mapeo.numero_serie),
        descripcion:        desc,
        marca:              this.col(fila, this.mapeo.marca),
        modelo:             this.col(fila, this.mapeo.modelo),
        ubicacion_esperada: this.col(fila, this.mapeo.ubicacion_esperada),
        resguardo:          this.col(fila, this.mapeo.resguardo),
        clasificacion:      this.col(fila, this.mapeo.clasificacion),
        fila:               i + 2,
      };

      const key = num.toUpperCase();
      if (!mapa.has(key)) mapa.set(key, []);
      mapa.get(key)!.push(bien);
    });

    mapa.forEach((items) => {
      if (items.length === 1) {
        unicos.push(items[0]);
      } else {
        grupos.push({ numero_inventario: items[0].numero_inventario, opciones: items, seleccionado: 0 });
      }
    });

    this.bienesUnicos = unicos;
    this.bienesConError.set(errores);
    this.duplicados.set(grupos);

    if (grupos.length === 0) {
      this.bienesValidos.set(unicos);
      this.paso.set(4);
    } else {
      this.paso.set(3);
    }
    this.cdr.detectChanges();
  }

  confirmarDuplicados() {
    const seleccionados = this.duplicados().map(g => g.opciones[g.seleccionado]);
    this.bienesValidos.set([...this.bienesUnicos, ...seleccionados]);
    this.paso.set(4);
    this.cdr.detectChanges();
  }

  imprimirDuplicados() {
    const totalRegistros = this.duplicados().reduce((a, g) => a + g.opciones.length, 0);
    const filas = this.duplicados().map((g, idx) => {
      const opciones = g.opciones.map(o => `
        <tr style="background:${idx % 2 === 0 ? '#fff' : '#fafafa'}">
          <td style="${TD}font-family:monospace">${g.numero_inventario}</td>
          <td style="${TD}">Fila ${o.fila}</td>
          <td style="${TD}">${o.descripcion}</td>
          <td style="${TD}">${o.marca || '—'}</td>
          <td style="${TD}">${o.modelo || '—'}</td>
          <td style="${TD}font-family:monospace">${o.numero_serie || '—'}</td>
          <td style="${TD}">${o.resguardo || '—'}</td>
          <td style="${TD}">${o.ubicacion_esperada || '—'}</td>
        </tr>
      `).join('');
      return opciones;
    }).join('');

    const TH = 'border:1px solid #ccc;padding:7px 10px;background:#8B1538;color:#fff;text-align:left;font-size:12px;';
    const ventana = window.open('', '_blank');
    ventana!.document.write(`
      <!DOCTYPE html>
      <html><head>
        <meta charset="UTF-8"/>
        <title>Bienes duplicados — ${new Date().toLocaleDateString('es-MX')}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #333; }
          h2 { color: #8B1538; margin-bottom: 4px; }
          p.sub { color: #666; font-size: 13px; margin-bottom: 16px; }
          table { border-collapse: collapse; width: 100%; font-size: 12px; }
          @media print {
            body { padding: 10px; }
            button { display: none; }
          }
        </style>
      </head><body>
        <h2>Bienes con número de inventario duplicado</h2>
        <p class="sub">
          Generado: ${new Date().toLocaleString('es-MX')} &nbsp;·&nbsp;
          ${this.duplicados().length} números duplicados &nbsp;·&nbsp;
          ${totalRegistros} registros en total
        </p>
        <button onclick="window.print()"
                style="margin-bottom:16px;padding:8px 16px;background:#8B1538;color:#fff;
                       border:none;border-radius:6px;cursor:pointer;font-size:13px;">
          🖨 Imprimir
        </button>
        <table>
          <thead>
            <tr>
              <th style="${TH}">No. Inventario</th>
              <th style="${TH}">Fila</th>
              <th style="${TH}">Descripción</th>
              <th style="${TH}">Marca</th>
              <th style="${TH}">Modelo</th>
              <th style="${TH}">No. Serie</th>
              <th style="${TH}">Resguardo</th>
              <th style="${TH}">Ubicación</th>
            </tr>
          </thead>
          <tbody>${filas}</tbody>
        </table>
      </body></html>
    `);
    ventana!.document.close();
  }

  descargarExcelLimpio() {
    if (!this.archivoBuffer) return;
    const numerosValidos = new Set(
      this.bienesValidos().map(b => b.numero_inventario.toUpperCase())
    );
    const wb    = XLSX.read(new Uint8Array(this.archivoBuffer), { type: 'array' });
    const ws    = wb.Sheets[wb.SheetNames[0]];
    const filas = XLSX.utils.sheet_to_json(ws, { defval: '', header: 1 }) as any[][];
    const header = filas[0] as any[];
    const colIdx = header.findIndex((h: any) => String(h).toLowerCase().includes('inventario'));
    const filasLimpias = [
      header,
      ...filas.slice(1).filter(fila => {
        const num = String(fila[colIdx] ?? '').trim().toUpperCase();
        return numerosValidos.has(num);
      }),
    ];
    const wsLimpio = XLSX.utils.aoa_to_sheet(filasLimpias);
    const wbLimpio = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wbLimpio, wsLimpio, wb.SheetNames[0]);
    XLSX.writeFile(wbLimpio, `catalogo_limpio_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  importar() {
    if (this.bienesValidos().length === 0 || this.importando()) return;
    this.errorImport.set('');
    this.importando.set(true);
    const hash = btoa(this.archivo()!.name + Date.now()).slice(0, 32);
    this.api.importarCatalogo({
      nombre_archivo: this.archivo()!.name,
      hash_archivo:   hash,
      bienes:         this.bienesValidos(),
    }).subscribe({
      next: res => {
        this.importando.set(false);
        if (res.ok && res.data) {
          this.exitoImport.set(`✓ ${res.data.total_bienes} bienes importados correctamente (versión ${res.data.numero_version})`);
        } else {
          this.errorImport.set(res.error?.message ?? 'Error al importar');
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.importando.set(false);
        this.errorImport.set('Error al conectar con el servidor');
        this.cdr.detectChanges();
      },
    });
  }
}

const TD = 'border:1px solid #ddd;padding:6px 10px;';
