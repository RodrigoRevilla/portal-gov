import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: 'super_admin' | 'inventario_admin' | 'registro_civil_admin';
  sistemas: string[];
}

interface LoginResponse {
  ok: boolean;
  data: {
    token: string;
    usuario: any;
  };
  error?: { code: string; message: string };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private readonly API = 'http://localhost:9090/api/v1';
  private readonly TOKEN_KEY = 'portal_token';
  private readonly USER_KEY = 'portal_user';

  login(email: string, password: string) {
    return this.http.post<LoginResponse>(`${this.API}/auth/login`, {
      usuario: email,
      password: password
    }).pipe(
      tap(res => {
        console.log('login response:', res);
        if (res.ok && res.data) {
          const rawUsuario = res.data.usuario;
          console.log('rawUsuario:', rawUsuario);

          const usuarioPortal: Usuario = {
            id: rawUsuario.id ?? 1,
            nombre: rawUsuario.nombre_completo ?? 'Usuario',
            email: rawUsuario.usuario ?? '',
            rol: 'super_admin',
            sistemas: ['inventario', 'control-oficiales']
          };
          sessionStorage.setItem(this.TOKEN_KEY, res.data.token);
          sessionStorage.setItem(this.USER_KEY, JSON.stringify(usuarioPortal));
          sessionStorage.setItem('inv_token', res.data.token);
          sessionStorage.setItem('inv_user', JSON.stringify(rawUsuario));
          console.log('inv_user guardado:', sessionStorage.getItem('inv_user'));
        }
      })
    );
  }

  logout() {
    sessionStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.USER_KEY);
    sessionStorage.removeItem('inv_token');
    sessionStorage.removeItem('inv_user');
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return sessionStorage.getItem(this.TOKEN_KEY);
  }

  getUsuario(): Usuario | null {
    const u = sessionStorage.getItem(this.USER_KEY);
    return u ? JSON.parse(u) : null;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  tieneSistema(sistema: string): boolean {
    const usuario = this.getUsuario();
    if (!usuario) return false;
    if (usuario.rol === 'super_admin') return true;
    return usuario.sistemas.includes(sistema);
  }
}