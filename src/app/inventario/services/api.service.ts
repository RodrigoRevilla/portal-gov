import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  ApiResponse, CrearSesionRequest, ResumenSesion,
  EscaneoRequest, EscaneoResponse, EscaneoDetalle,
  Bien, Faltante, Usuario
} from '../models/index';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // ── Sesiones ─────────────────────────────────────────────────

  crearSesion(req: CrearSesionRequest) {
    return this.http.post<ApiResponse<{ id: string }>>(
      `${this.base}/sesiones`, req
    );
  }

  listarSesiones() {
    return this.http.get<ApiResponse<ResumenSesion[]>>(
      `${this.base}/sesiones`
    ).pipe(map(r => r.data ?? []));
  }

  obtenerSesion(id: string) {
    return this.http.get<ApiResponse<ResumenSesion>>(
      `${this.base}/sesiones/${id}`
    ).pipe(map(r => r.data!));
  }

  pausarSesion(id: string) {
    return this.http.patch<ApiResponse<any>>(
      `${this.base}/sesiones/${id}/pausar`, {}
    );
  }

  reanudarSesion(id: string) {
    return this.http.patch<ApiResponse<any>>(
      `${this.base}/sesiones/${id}/reanudar`, {}
    );
  }

  cerrarSesion(id: string) {
    return this.http.post<ApiResponse<{ hash_cierre: string }>>(
      `${this.base}/sesiones/${id}/cerrar`, {}
    );
  }

  faltantes(sesionId: string) {
    return this.http.get<ApiResponse<Faltante[]>>(
      `${this.base}/sesiones/${sesionId}/faltantes`
    ).pipe(map(r => r.data ?? []));
  }

  // ── Escaneos ──────────────────────────────────────────────────

  registrarEscaneo(req: EscaneoRequest) {
    return this.http.post<ApiResponse<EscaneoResponse>>(
      `${this.base}/escaneos`, req
    );
  }

  listarEscaneos(sesionId: string) {
    return this.http.get<ApiResponse<EscaneoDetalle[]>>(
      `${this.base}/escaneos?sesion_id=${sesionId}`
    ).pipe(map(r => r.data ?? []));
  }

  // ── Catálogo ──────────────────────────────────────────────────

  listarCatalogo() {
    return this.http.get<ApiResponse<Bien[]>>(
      `${this.base}/catalogo`
    ).pipe(map(r => r.data ?? []));
  }

  // ── Usuarios ──────────────────────────────────────────────────

  listarUsuarios() {
    return this.http.get<ApiResponse<Usuario[]>>(
      `${this.base}/usuarios`
    ).pipe(map(r => r.data ?? []));
  }

  crearUsuario(req: { nombre_completo: string; usuario: string; password: string; rol: string }) {
    return this.http.post<ApiResponse<{ id: string }>>(
      `${this.base}/usuarios`, req
    );
  }

  toggleUsuario(id: string) {
    return this.http.patch<ApiResponse<{ activo: boolean; mensaje: string }>>(
      `${this.base}/usuarios/${id}/toggle`, {}
    );
  }

  resetPassword(id: string, password: string) {
    return this.http.patch<ApiResponse<{ mensaje: string }>>(
      `${this.base}/usuarios/${id}/password`, { password }
    );
  }

  listarAuditLog() {
    return this.http.get<ApiResponse<any[]>>(
      `${this.base}/audit-log`
    ).pipe(map(r => r.data ?? []));
  }

  importarCatalogo(req: { nombre_archivo: string; hash_archivo: string; bienes: any[] }) {
    return this.http.post<ApiResponse<{ version_id: string; numero_version: number; total_bienes: number }>>(
      `${this.base}/catalogo/importar`, req
    );
  }
}
