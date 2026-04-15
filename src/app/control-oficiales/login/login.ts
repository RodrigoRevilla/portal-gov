import { Component, ChangeDetectorRef, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { OficialesService } from '../services/oficiales.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  private svc = inject(OficialesService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  usuario = '';
  password = '';
  loading = false;
  error = '';
  showPassword = false;

  doLogin(): void {
    if (!this.usuario.trim() || !this.password.trim()) return;
    this.loading = true;
    this.error = '';
    this.cdr.detectChanges();

    this.svc.login(this.usuario, this.password).subscribe({
      next: res => {
        if (res.ok && res.data) {
          sessionStorage.setItem('token', res.data.token);
          sessionStorage.setItem('usuario', res.data.usuario);
          this.router.navigate(['/dashboard']);
        }
      },
      error: err => {
        this.error = err?.error?.message ?? 'Error de conexión con el servidor.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }
}