import { Component, Output, EventEmitter, inject, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';

const API = 'http://localhost:8095/api';

@Component({
  selector: 'app-modal-password',
  imports: [FormsModule],
  templateUrl: './modal-password.html'
})
export class ModalPassword {
  @Output() cerrar = new EventEmitter<void>();

  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  actual = '';
  nueva = '';
  confirmar = '';
  showActual = false;
  showNueva = false;
  showConfirmar = false;
  guardando = false;
  error = '';
  exito = '';

  get headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${sessionStorage.getItem('token') ?? ''}` });
  }

  guardar(): void {
    this.error = '';
    this.exito = '';

    if (!this.actual || !this.nueva || !this.confirmar) {
      this.error = 'Todos los campos son obligatorios.';
      this.cdr.detectChanges();
      return;
    }
    if (this.nueva !== this.confirmar) {
      this.error = 'La nueva contraseña no coincide.';
      this.cdr.detectChanges();
      return;
    }
    if (this.nueva.length < 6) {
      this.error = 'La contraseña debe tener al menos 6 caracteres.';
      this.cdr.detectChanges();
      return;
    }

    this.guardando = true;
    this.cdr.detectChanges();

    this.http.put(`${API}/password`, {
      actual: this.actual,
      nueva: this.nueva
    }, { headers: this.headers }).subscribe({
      next: () => {
        this.exito = 'Contraseña actualizada correctamente.';
        this.guardando = false;
        this.actual = '';
        this.nueva = '';
        this.confirmar = '';
        this.cdr.detectChanges();
        setTimeout(() => this.cerrar.emit(), 1500);
      },
      error: (err: any) => {
        this.error = err?.error?.message ?? 'Error al actualizar la contraseña.';
        this.guardando = false;
        this.cdr.detectChanges();
      }
    });
  }

  onOverlayClick(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains('modal-overlay')) {
      this.cerrar.emit();
    }
  }
}