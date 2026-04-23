import { Component, Input, Output, EventEmitter, OnChanges, inject, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Oficial, Oficialía } from '../models';

const PERFILES = ['OFICIALES', 'USUARIO LOCAL', 'ADMINISTRADOR'];

@Component({
  selector: 'app-modal-oficial',
  imports: [FormsModule],
  templateUrl: './modal-oficial.html',
  styleUrl: './modal-oficial.css'
})
export class ModalOficial implements OnChanges {
  @Input() oficial: Oficial | null = null;
  @Input() oficialias: Oficialía[] = [];
  @Input() guardando = false;
  @Output() cerrar = new EventEmitter<void>();
  @Output() guardarOficial = new EventEmitter<Partial<Oficial>>();

  private cdr = inject(ChangeDetectorRef);

  perfiles = PERFILES;
  sistemas = ['SID', 'SIRCO'];
  editando = false;
  form: Partial<Oficial> = this.formVacio();

  ngOnChanges(): void {
    if (this.oficial) {
      this.editando = true;
      this.form = {
        ...this.oficial,
        sid: !!this.oficial.sid,
        internet: !!this.oficial.internet,
        starlink: !!this.oficial.starlink,
        activo: !!this.oficial.activo,
      };
    } else {
      this.editando = false;
      this.form = this.formVacio();
      if (this.oficialias.length) {
        this.form['ofic'] = this.oficialias[0].id;
        this.form['region'] = this.oficialias[0].region;
      }
    }
    this.cdr.detectChanges();
  }

  formVacio(): Partial<Oficial> {
    return {
      nombres: '', ap1: '', ap2: '', username: '', tel: '',
      email: '', perfil: 'OFICIALES', municipio: '',
      ofic: 0, region: '', sistema: '',
      sid: false, internet: false, starlink: false, activo: true, obs: ''
    };
  }

  onOficialiaChange(nombre: string): void {
    const of = this.oficialias.find(o => o.nombre === nombre);
    if (of) {
      this.form['ofic'] = of.id;
      this.form['region'] = of.region;
    }
    this.cdr.detectChanges();
  }

  guardar(): void {
    if (!this.form['nombres']?.trim() || !this.form['ap1']?.trim()) return;
    this.guardarOficial.emit({
      ...this.form,
      username: (this.form['username'] ?? '').toUpperCase(),
      municipio: (this.form['municipio'] ?? '').toUpperCase(),
    });
  }

  onOverlayClick(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains('modal-overlay')) {
      this.cerrar.emit();
    }
  }
}