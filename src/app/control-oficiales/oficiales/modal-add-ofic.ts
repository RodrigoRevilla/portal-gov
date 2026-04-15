import { Component, Output, EventEmitter, inject, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface NuevaOficialia {
  numero: string;
  nombre: string;
  region: string;
  sistema: string;
}

const REGIONES = [
  'CAÑADA',
  'COSTA',
  'ISTMO',
  'MIXTECA',
  'PAPALOAPAM',
  'SIERRA NORTE',
  'SIERRA SUR',
  'VALLES CENTRALES',
];

@Component({
  selector: 'app-modal-add-ofic',
  imports: [FormsModule],
  templateUrl: './modal-add-ofic.html',
  styleUrl: './modal-oficial.css'
})
export class ModalAddOficialia {
  @Output() cerrar = new EventEmitter<void>();
  @Output() guardar = new EventEmitter<NuevaOficialia>();

  private cdr = inject(ChangeDetectorRef);

  regiones = REGIONES;

  form: NuevaOficialia = {
    numero: '',
    nombre: '',
    region: '',
    sistema: ''
  };

  doGuardar(): void {
    if (!this.form.nombre.trim()) return;
    this.guardar.emit({ ...this.form, nombre: this.form.nombre.trim().toUpperCase() });
  }

  onOverlayClick(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains('modal-overlay')) {
      this.cerrar.emit();
    }
  }
}