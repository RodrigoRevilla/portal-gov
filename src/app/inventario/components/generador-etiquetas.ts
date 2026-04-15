import { Component, signal, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import JsBarcode from 'jsbarcode';

interface BienEtiqueta {
  id: number;
  numero_inventario: string;
  descripcion: string;
}

@Component({
  selector: 'app-generador-etiquetas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <button (click)="abrir()" class="btn-ghost flex items-center gap-2 text-sm">
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125
             1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75
             9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0
             1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125
             1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125
             1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504
             1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z"/>
      </svg>
      Generar etiquetas
    </button>

    @if (abierto()) {
      <div class="fixed inset-0 bg-guinda-950/60 backdrop-blur-sm z-50
                  flex items-center justify-center p-4"
           (click)="cerrar()">
        <div class="bg-white rounded-2xl shadow-modal w-full max-w-3xl
                    max-h-[90vh] flex flex-col animate-slide-up overflow-hidden"
             (click)="$event.stopPropagation()">

          <div class="h-1.5 bg-gradient-to-r from-guinda-700 via-dorado to-guinda-700 shrink-0"></div>
          <div class="px-6 py-4 border-b border-crema-border flex items-center justify-between shrink-0">
            <div>
              <h3 class="font-display text-xl text-guinda-800 font-semibold">
                Generador de etiquetas
              </h3>
              <p class="text-guinda-400 text-xs mt-0.5">
                Agrega los bienes y genera sus códigos de barras para imprimir
              </p>
            </div>
            <button (click)="cerrar()"
                    class="text-guinda-300 hover:text-guinda-600 transition-colors">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <div class="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            <div>
              <div class="flex items-center justify-between mb-3">
                <h4 class="text-sm font-semibold text-guinda-700">Bienes a etiquetar</h4>
                <span class="text-xs font-mono bg-guinda-50 text-guinda-500 border
                             border-guinda-100 px-2 py-0.5 rounded-full">
                  {{ bienes().length }} bien{{ bienes().length !== 1 ? 'es' : '' }}
                </span>
              </div>

              <div class="space-y-2">
                @for (bien of bienes(); track bien.id) {
                  <div class="flex items-center gap-2 animate-fade-in">
                    <span class="text-xs font-mono text-guinda-300 w-6 text-right shrink-0">
                      {{ $index + 1 }}.
                    </span>
                    <input
                      type="text"
                      [(ngModel)]="bien.numero_inventario"
                      placeholder="INV-2024-001"
                      class="input-gov font-mono text-sm w-44 shrink-0"
                    />
                    <input
                      type="text"
                      [(ngModel)]="bien.descripcion"
                      placeholder="Descripción del bien (opcional)"
                      class="input-gov text-sm flex-1"
                    />
                    <button (click)="eliminarBien(bien.id)"
                            [disabled]="bienes().length === 1"
                            class="text-guinda-200 hover:text-danger-DEFAULT transition-colors
                                   shrink-0 disabled:opacity-30 disabled:cursor-not-allowed">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107
                             1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244
                             2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456
                             0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114
                             1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18
                             -.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037
                             -2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/>
                      </svg>
                    </button>
                  </div>
                }
              </div>

              <div class="flex gap-2 mt-4">
                <button (click)="agregarBien()"
                        class="btn-ghost text-sm flex items-center gap-1.5 px-3 py-2">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                  </svg>
                  Agregar bien
                </button>
                <button (click)="generarTodos()"
                        [disabled]="!tieneValidos()"
                        class="btn-primary text-sm flex items-center gap-1.5 px-4 py-2
                               disabled:opacity-40 disabled:cursor-not-allowed">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504
                         1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125
                         0 013.75 9.375v-4.5z"/>
                  </svg>
                  Generar códigos
                </button>
              </div>
            </div>

            @if (mostrarPrevia()) {
              <div class="border-t border-crema-border pt-5">
                <div class="flex items-center justify-between mb-4">
                  <h4 class="text-sm font-semibold text-guinda-700">
                    Vista previa — {{ etiquetasValidas().length }} etiqueta{{ etiquetasValidas().length !== 1 ? 's' : '' }}
                  </h4>
                  <button (click)="imprimir()"
                          class="btn-primary text-sm flex items-center gap-2 px-4 py-2">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415
                           0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096
                           m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12
                           1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318
                           0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015
                           -1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25
                           2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041
                           48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5
                           0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621
                           0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5z"/>
                    </svg>
                    Imprimir etiquetas
                  </button>
                </div>

                <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  @for (e of etiquetasValidas(); track e.id) {
                    <div class="border-2 border-guinda-100 rounded-lg p-3 bg-white text-center">
                      <p class="text-xs text-guinda-400 truncate mb-2 h-4">
                        {{ e.descripcion || '' }}
                      </p>
                      <svg [id]="'barcode-prev-' + e.id" class="w-full max-h-16"></svg>
                      <p class="text-xs font-mono font-bold text-guinda-700 mt-2">
                        {{ e.numero_inventario }}
                      </p>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    }
  `,
})
export class GeneradorEtiquetasComponent {
  abierto       = signal(false);
  mostrarPrevia = signal(false);
  bienes        = signal<BienEtiqueta[]>([{ id: 1, numero_inventario: '', descripcion: '' }]);

  private nextId = 2;

  constructor(private cdr: ChangeDetectorRef, private zone: NgZone) {}

  abrir() {
    this.abierto.set(true);
    this.mostrarPrevia.set(false);
  }

  cerrar() {
    this.abierto.set(false);
    this.mostrarPrevia.set(false);
    this.bienes.set([{ id: 1, numero_inventario: '', descripcion: '' }]);
    this.nextId = 2;
  }

  agregarBien() {
    this.bienes.update(b => [...b, { id: this.nextId++, numero_inventario: '', descripcion: '' }]);
  }

  eliminarBien(id: number) {
    if (this.bienes().length === 1) return;
    this.bienes.update(b => b.filter(x => x.id !== id));
    if (this.mostrarPrevia()) {
      this.cdr.detectChanges();
      setTimeout(() => this.renderizarCodigos(), 150);
    }
  }

  etiquetasValidas() {
    return this.bienes().filter(b => b.numero_inventario.trim().length > 0);
  }

  tieneValidos() {
    return this.etiquetasValidas().length > 0;
  }

  generarTodos() {
    if (!this.tieneValidos()) return;
    this.mostrarPrevia.set(true);
    this.cdr.detectChanges();
    setTimeout(() => {
      this.zone.runOutsideAngular(() => {
        setTimeout(() => this.renderizarCodigos(), 50);
      });
    }, 50);
  }

  private renderizarCodigos() {
    const validos = this.etiquetasValidas();
    validos.forEach(e => {
      const codigo = e.numero_inventario.trim();
      if (!codigo) return;

      const svgEl = document.getElementById('barcode-prev-' + e.id);
      if (svgEl) {
        try {
          JsBarcode(svgEl, codigo, {
            format: 'CODE128',
            width: 1.8,
            height: 55,
            displayValue: false,
            margin: 6,
            background: '#ffffff',
            lineColor: '#4A0E22',
          });
        } catch (err) {
          console.warn('Código inválido:', codigo, err);
        }
      }
    });
  }

  imprimir() {
    const validos = this.etiquetasValidas();
    if (!validos.length) return;
    const etiquetasHTML = validos.map(e => {
      const svgTemp = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      try {
        JsBarcode(svgTemp, e.numero_inventario.trim(), {
          format: 'CODE128',
          width: 2,
          height: 70,
          displayValue: false,
          margin: 8,
          background: '#ffffff',
          lineColor: '#000000',
        });
      } catch { return ''; }

      const svgString = svgTemp.outerHTML;
      return `
        <div class="etiqueta">
          <p class="desc">${e.descripcion || ''}</p>
          ${svgString}
          <p class="num">${e.numero_inventario}</p>
        </div>
      `;
    }).filter(Boolean).join('');

    const ventana = window.open('', '_blank', 'width=800,height=600');
    if (!ventana) return;

    ventana.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Etiquetas de inventario</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: sans-serif; background: white; }

          .grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 6mm;
            padding: 10mm;
          }

          .etiqueta {
            border: 1px solid #ccc;
            border-radius: 4mm;
            padding: 4mm 4mm 3mm;
            text-align: center;
            page-break-inside: avoid;
            background: white;
          }

          .desc {
            font-size: 8pt;
            color: #6B1530;
            margin-bottom: 2mm;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            min-height: 12pt;
          }

          .etiqueta svg {
            width: 100%;
            max-width: 65mm;
            display: block;
            margin: 0 auto;
          }

          .num {
            font-size: 9pt;
            font-weight: bold;
            font-family: monospace;
            color: #2D0614;
            margin-top: 2mm;
          }

          @media print {
            @page { margin: 8mm; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="grid">${etiquetasHTML}</div>
        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); }, 300);
          };
        </script>
      </body>
      </html>
    `);
    ventana.document.close();
  }
}
