import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse, LoginRequest, LoginResponse, Usuario } from '../models/index';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'inv_token';
  private readonly USER_KEY  = 'inv_user';

  usuario = signal<Usuario | null>(this.loadUser());

  constructor(private http: HttpClient, private router: Router) {
    const u = this.loadUser();
    if (u) this.usuario.set(u);
  }

  login(req: LoginRequest) {
    return this.http.post<ApiResponse<LoginResponse>>(
      `${environment.apiUrl}/auth/login`, req
    ).pipe(
      tap(res => {
        if (res.ok && res.data) {
          sessionStorage.setItem(this.TOKEN_KEY, res.data.token);
          sessionStorage.setItem(this.USER_KEY, JSON.stringify(res.data.usuario));
          this.usuario.set(res.data.usuario);
        }
      })
    );
  }

  logout() {
    sessionStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.USER_KEY);
    this.usuario.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return sessionStorage.getItem(this.TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  hasRole(...roles: string[]): boolean {
    const u = this.usuario();
    return !!u && roles.includes(u.rol);
  }

  recargarUsuario(): void {
    const u = this.loadUser();
    if (u) this.usuario.set(u);
  }

  private loadUser(): Usuario | null {
    try {
      const raw = sessionStorage.getItem(this.USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}