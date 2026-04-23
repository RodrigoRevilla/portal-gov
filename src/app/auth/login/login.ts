import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  email = '';
  password = '';
  errorMsg = '';
  cargando = false;
  verPassword = false;

  login() {
    if (!this.email || !this.password) {
      this.errorMsg = 'Ingresa tu correo y contraseña.';
      this.cdr.detectChanges();
      return;
    }

    this.cargando = true;
    this.errorMsg = '';
    this.cdr.detectChanges();

    this.authService.login(this.email, this.password).subscribe({
      next: res => {
        if (res.ok) {
          this.router.navigate(['/home']);
        } else {
          this.errorMsg = res.error?.message ?? 'Credenciales incorrectas.';
          this.cargando = false;
          this.cdr.detectChanges();
        }
      },
      error: () => {
        this.errorMsg = 'No se pudo conectar con el servidor.';
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }
}