import { Component, Input, Output, EventEmitter, OnChanges, inject, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Oficial, Oficialía } from '../models';

@Component({
  selector: 'app-modal-completar',
  imports: [FormsModule],
  templateUrl: './modal-completar.html',
  styleUrl: './modal-oficial.css'
})
export class ModalCompletar implements OnChanges {
  @Input() oficial: Oficial | null = null;
  @Input() oficialias: Oficialía[] = [];
  @Input() guardando = false;
  @Output() cerrar = new EventEmitter<void>();
  @Output() completar = new EventEmitter<Partial<Oficial>>();

  private cdr = inject(ChangeDetectorRef);

  form: Partial<Oficial> = {};

  ngOnChanges(): void {
    if (this.oficial) {
      this.form = { ...this.oficial };
    }
    this.cdr.detectChanges();
  }

  onOficialiaChange(nombre: string): void {
    const of = this.oficialias.find(o => o.nombre === nombre);
    if (of) {
      this.form['ofic'] = of.id;
      this.form['region'] = of.region;
    }
    this.cdr.detectChanges();
  }

  doCompletar(): void {
    // Al completar: pendiente=false, activo=true
    this.completar.emit({
      ...this.form,
      pendiente: false,
      activo: true,
      username: (this.form['username'] ?? '').toUpperCase(),
    });
  }

  onOverlayClick(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains('modal-overlay')) {
      this.cerrar.emit();
    }
  }
}