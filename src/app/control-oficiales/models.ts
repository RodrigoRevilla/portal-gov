export interface Oficial {
  id: number;
  nombres: string;
  ap1: string;
  ap2: string;
  username: string;
  tel: string;
  email: string;
  perfil: string;
  municipio: string;
  ofic: number;
  region: string;
  sistema: string;
  sid: boolean;
  internet: boolean;
  starlink: boolean;
  activo: boolean;
  pendiente: boolean;
  obs: string;
  created_at?: string;
}

export interface Oficialía {
  id: number;
  numero: string;
  nombre: string;
  region: string;
  sistema: string;
  listo_sid: boolean;
}

export interface Stats {
  total: number;
  sid: number;
  internet: number;
  starlink: number;
  oficialias: number;
  pendientes: number;
}

export type FilterType = 'todos' | 'sid' | 'internet' | 'starlink' | 'pendientes';

export interface ApiResponse<T> {
  ok: boolean;
  message?: string;
  data?: T;
}