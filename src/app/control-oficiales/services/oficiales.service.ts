import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Oficial, Oficialía, Stats, ApiResponse, FilterType } from '../models';

const API = 'http://localhost:9090/api/co';

@Injectable({ providedIn: 'root' })
export class OficialesService {

  constructor(private http: HttpClient) {}

  private get headers(): HttpHeaders {
    const token = sessionStorage.getItem('token') ?? '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  login(usuario: string, password: string): Observable<ApiResponse<{ token: string; usuario: string }>> {
    return this.http.post<ApiResponse<{ token: string; usuario: string }>>(
      `${API}/login`, { usuario, password }
    );
  }

  getStats(): Observable<Stats> {
    return this.http.get<ApiResponse<Stats>>(`${API}/stats`, { headers: this.headers })
      .pipe(map(r => r.data!));
  }

  getOficialias(): Observable<Oficialía[]> {
    return this.http.get<ApiResponse<Oficialía[]>>(`${API}/oficialias`, { headers: this.headers })
      .pipe(map(r => r.data ?? []));
  }

  createOficialia(o: Partial<Oficialía>): Observable<Oficialía> {
    return this.http.post<ApiResponse<Oficialía>>(`${API}/oficialias`, o, { headers: this.headers })
      .pipe(map(r => r.data!));
  }

  updateOficialia(o: Oficialía): Observable<Oficialía> {
    return this.http.put<ApiResponse<Oficialía>>(`${API}/oficialias`, o, { headers: this.headers })
      .pipe(map(r => r.data!));
  }

  getOficiales(
    filter: FilterType = 'todos',
    search = '',
    ofic = '',
    region = '',
    sistema = ''
  ): Observable<Oficial[]> {
    let params = new HttpParams();
    if (filter !== 'todos') params = params.set('filter', filter);
    if (search)  params = params.set('search', search);
    if (ofic)    params = params.set('oficialía', ofic);
    if (region)  params = params.set('region', region);
    if (sistema) params = params.set('sistema', sistema);

    return this.http.get<ApiResponse<Oficial[]>>(`${API}/oficiales`, { headers: this.headers, params })
      .pipe(map(r => r.data ?? []));
  }

  createOficial(o: Partial<Oficial>): Observable<Oficial> {
    return this.http.post<ApiResponse<Oficial>>(`${API}/oficiales`, o, { headers: this.headers })
      .pipe(map(r => r.data!));
  }

  updateOficial(id: number, o: Partial<Oficial>): Observable<Oficial> {
    return this.http.put<ApiResponse<Oficial>>(`${API}/oficiales/${id}`, o, { headers: this.headers })
      .pipe(map(r => r.data!));
  }

  deleteOficial(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${API}/oficiales/${id}`, { headers: this.headers })
      .pipe(map(() => void 0));
  }
}