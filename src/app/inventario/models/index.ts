export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: { code: string; message: string };
}

export interface LoginRequest {
  usuario: string;
  password: string;
}

export interface Usuario {
  id: string;
  dependencia_id: string;
  nombre_completo: string;
  usuario: string;
  rol: 'escaner' | 'supervisor' | 'auditor' | 'admin';
  activo: boolean;
  created_at: string;
}

export interface LoginResponse {
  token: string;
  usuario: Usuario;
}

export interface CrearSesionRequest {
  nombre_sesion: string;
  descripcion: string;
  area_cubierta: string;
}

export interface ResumenSesion {
  sesion_id: string;
  nombre_sesion: string;
  estado: 'abierta' | 'pausada' | 'cerrada';
  iniciada_at: string;
  iniciado_por: string;
  total_en_catalogo: number;
  total_escaneados: number;
  coincidencias: number;
  ubicacion_diferente: number;
  no_en_catalogo: number;
  faltantes: number;
  version_catalogo: number;
  cerrada_at: string | null;
}

export interface EscaneoRequest {
  sesion_id: string;
  numero_inv_leido: string;
  ubicacion_escaneada: string;
  observaciones: string;
}

export type ResultadoEscaneo = 'coincide' | 'encontrado' | 'no_en_catalogo';

export interface EscaneoResponse {
  id: string;
  resultado: ResultadoEscaneo;
  numero_inv_leido: string;
  descripcion: string;
  numero_serie: string;
  marca: string;
  modelo: string;
  resguardo: string;
  ubicacion_esperada: string;
  ubicacion_escaneada: string;
  mensaje: string;
  escaneado_at: string;
}

export interface EscaneoDetalle {
  id: string;
  resultado: ResultadoEscaneo;
  numero_inv_leido: string;
  descripcion: string;
  numero_serie: string;
  marca: string;
  modelo: string;
  resguardo: string;
  ubicacion_esperada: string;
  ubicacion_escaneada: string;
  observaciones: string;
  escaneado_por: string;
  escaneado_at: string;
}

export interface Bien {
  id: string;
  numero_inventario: string;
  numero_serie: string;
  descripcion: string;
  marca: string;
  modelo: string;
  clasificacion: string;
  ubicacion_esperada: string;
  resguardo: string;
  estado: string;
}

export interface Faltante {
  numero_inventario: string;
  numero_serie: string;
  descripcion: string;
  marca: string;
  modelo: string;
  ubicacion_esperada: string;
  resguardo: string;
  clasificacion: string;
}
