import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Usuario } from '../../models';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-crema flex flex-col">
      <div class="zapotec-band w-full opacity-90"></div>
      <div class="bg-guinda-700 border-b-4 border-dorado sticky top-0 z-50 shadow-md">
        <div class="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div class="flex items-center gap-4">
            <button (click)="router.navigate(['/dashboard'])"
                    class="text-dorado-light hover:text-white transition-colors">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
              </svg>
            </button>
            <img src="/oaxaca.png" alt="Oaxaca" class="h-9 w-9 object-contain"/>
            <div class="border-l border-dorado/40 pl-4">
              <p class="text-dorado-light text-xs font-medium tracking-widest uppercase">
                Administración
              </p>
              <h1 class="text-white font-display text-base font-semibold leading-tight">
                Gestión de usuarios
              </h1>
            </div>
          </div>
          <button (click)="mostrarModal.set(true)"
                  class="bg-white/10 hover:bg-white/20 border border-white/20
                         text-white text-sm px-4 py-1.5 rounded-lg
                         transition-all duration-150 flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            Nuevo usuario
          </button>
        </div>
      </div>

      <main class="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8">
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div class="stat-card border-l-4 border-l-guinda-700">
            <span class="stat-label">Total usuarios</span>
            <span class="stat-value text-guinda-800">{{ usuarios().length }}</span>
          </div>
          <div class="stat-card border-l-4 border-l-success-DEFAULT">
            <span class="stat-label">Activos</span>
            <span class="stat-value text-success-DEFAULT">{{ contarActivos() }}</span>
          </div>
          <div class="stat-card border-l-4 border-l-danger-DEFAULT">
            <span class="stat-label">Inactivos</span>
            <span class="stat-value text-danger-DEFAULT">{{ usuarios().length - contarActivos() }}</span>
          </div>
          <div class="stat-card border-l-4 border-l-dorado">
            <span class="stat-label">Admins</span>
            <span class="stat-value text-dorado-dark">{{ contarRol('admin') }}</span>
          </div>
        </div>

        @if (cargando()) {
          <div class="flex items-center justify-center py-20">
            <svg class="w-6 h-6 animate-spin text-guinda-500" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          </div>
        } @else {
          <div class="card p-0 overflow-hidden">
            <div class="px-6 py-4 border-b border-crema-border flex items-center justify-between">
              <h2 class="font-semibold text-guinda-700">Usuarios registrados</h2>
              <span class="text-xs font-mono bg-guinda-50 text-guinda-500 border border-guinda-100
                           px-2 py-0.5 rounded-full">
                {{ usuarios().length }}
              </span>
            </div>

            <div class="divide-y divide-crema-border">
              @for (u of usuarios(); track u.id) {
                <div class="px-6 py-4 flex items-center justify-between gap-4 animate-fade-in
                            hover:bg-crema/50 transition-colors">
                  <div class="flex items-center gap-4 min-w-0">
                    <div class="w-10 h-10 rounded-full flex items-center justify-center
                                shrink-0 text-white font-bold text-sm"
                         [class]="avatarColor(u.rol)">
                      {{ u.nombre_completo.charAt(0).toUpperCase() }}
                    </div>
                    <div class="min-w-0">
                      <div class="flex items-center gap-2 flex-wrap">
                        <span class="font-semibold text-guinda-800 text-sm">
                          {{ u.nombre_completo }}
                        </span>
                        @if (!u.activo) {
                          <span class="text-xs px-2 py-0.5 rounded-full bg-danger-bg
                                       border border-danger-border text-danger-DEFAULT font-medium">
                            Inactivo
                          </span>
                        }
                        @if (u.id === usuarioActual()?.id) {
                          <span class="text-xs px-2 py-0.5 rounded-full bg-dorado/20
                                       border border-dorado/40 text-dorado-dark font-medium">
                            Tú
                          </span>
                        }
                      </div>
                      <div class="flex items-center gap-3 mt-0.5">
                        <span class="font-mono text-xs text-guinda-400">{{ u.usuario }}</span>
                        <span class="text-guinda-200">·</span>
                        <span class="text-xs px-2 py-0.5 rounded font-mono font-medium uppercase"
                              [class]="rolChip(u.rol)">
                          {{ u.rol }}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div class="flex items-center gap-2 shrink-0">
                    <button (click)="abrirResetPassword(u)"
                            class="text-xs text-guinda-400 hover:text-guinda-700 border
                                   border-crema-border hover:border-guinda-300 px-3 py-1.5
                                   rounded-lg transition-all duration-150 flex items-center gap-1.5">
                      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097
                             -1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818
                             c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1
                             .43-1.563A6 6 0 1121.75 8.25z"/>
                      </svg>
                      Contraseña
                    </button>

                    @if (u.id !== usuarioActual()?.id) {
                      <button (click)="toggleUsuario(u)"
                              [disabled]="toggling() === u.id"
                              class="text-xs px-3 py-1.5 rounded-lg border transition-all duration-150
                                     flex items-center gap-1.5 disabled:opacity-50"
                              [class]="u.activo
                                ? 'text-danger-DEFAULT border-danger-border hover:bg-danger-bg'
                                : 'text-success-DEFAULT border-success-border hover:bg-success-bg'">
                        @if (toggling() === u.id) {
                          <svg class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                          </svg>
                        } @else {
                          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            @if (u.activo) {
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0
                                   015.636 5.636m12.728 12.728L5.636 5.636"/>
                            } @else {
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            }
                          </svg>
                        }
                        {{ u.activo ? 'Desactivar' : 'Activar' }}
                      </button>
                    }
                  </div>
                </div>
              }

              @if (usuarios().length === 0) {
                <div class="px-6 py-16 text-center">
                  <p class="text-guinda-400 text-sm">No hay usuarios registrados</p>
                </div>
              }
            </div>
          </div>
        }
      </main>

      <footer class="bg-guinda-900 py-3 mt-8">
        <div class="zapotec-band w-full opacity-60 mb-3"></div>
        <p class="text-center text-guinda-400 text-xs pb-1">
          © {{ year }} Gobierno del Estado de Oaxaca · Sistema de Verificación de Inventario
        </p>
      </footer>

      @if (mostrarModal()) {
        <div class="fixed inset-0 bg-guinda-950/60 backdrop-blur-sm z-50
                    flex items-center justify-center p-4"
             (click)="cerrarModal()">
          <div class="card w-full max-w-md animate-slide-up shadow-modal"
               (click)="$event.stopPropagation()">
            <div class="h-1 bg-gradient-to-r from-guinda-700 via-dorado to-guinda-700 -mx-6 -mt-6 mb-6"></div>
            <h3 class="font-display text-xl text-guinda-800 font-semibold mb-5">Nuevo usuario</h3>

            <div class="space-y-4">
              <div>
                <label class="block text-xs font-semibold text-guinda-600 uppercase tracking-wider mb-1.5">
                  Nombre completo *
                </label>
                <input type="text" [(ngModel)]="nuevoUsuario.nombre_completo"
                       placeholder="Ej. Juan García López" class="input-gov"/>
              </div>
              <div>
                <label class="block text-xs font-semibold text-guinda-600 uppercase tracking-wider mb-1.5">
                  Usuario *
                </label>
                <input type="text" [(ngModel)]="nuevoUsuario.usuario"
                       placeholder="juan.garcia" class="input-gov font-mono"/>
              </div>
              <div>
                <label class="block text-xs font-semibold text-guinda-600 uppercase tracking-wider mb-1.5">
                  Contraseña *
                </label>
                <div class="relative">
                  <input [type]="mostrarPwd() ? 'text' : 'password'"
                         [(ngModel)]="nuevoUsuario.password"
                         placeholder="Mínimo 6 caracteres" class="input-gov pr-11"/>
                  <button type="button" (click)="mostrarPwd.set(!mostrarPwd())"
                          class="absolute right-3 top-1/2 -translate-y-1/2
                                 text-guinda-300 hover:text-guinda-600 transition-colors"
                          tabindex="-1">
                    @if (mostrarPwd()) {
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"
                          d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5
                             12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0
                             0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0
                             01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894
                             7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243
                             -4.243m4.242 4.242L9.88 9.88"/>
                      </svg>
                    } @else {
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"
                          d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12
                             4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0
                             .639C20.577 16.49 16.64 19.5 12 19.5c-4.638
                             0-8.573-3.007-9.963-7.178z"/>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                      </svg>
                    }
                  </button>
                </div>
              </div>
              <div>
                <label class="block text-xs font-semibold text-guinda-600 uppercase tracking-wider mb-1.5">
                  Rol *
                </label>
                <select [(ngModel)]="nuevoUsuario.rol" class="input-gov">
                  <option value="">Selecciona un rol...</option>
                  <option value="escaner">Escáner — Operador con lector de códigos</option>
                  <option value="supervisor">Supervisor — Gestiona y cierra sesiones</option>
                  <option value="auditor">Auditor — Solo lectura</option>
                  <option value="admin">Admin — Acceso completo</option>
                </select>
              </div>
            </div>

            @if (errorModal()) {
              <div class="mt-4 flex items-center gap-2 bg-danger-bg border border-danger-border
                          rounded-lg px-4 py-3 animate-fade-in">
                <span class="text-sm text-danger-DEFAULT">{{ errorModal() }}</span>
              </div>
            }

            <div class="flex gap-3 mt-6">
              <button (click)="cerrarModal()" class="btn-ghost flex-1">Cancelar</button>
              <button (click)="crearUsuario()"
                      [disabled]="!formValido() || creando()"
                      class="btn-primary flex-1 flex items-center justify-center gap-2">
                @if (creando()) {
                  <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                }
                Crear usuario
              </button>
            </div>
          </div>
        </div>
      }

      @if (usuarioReset()) {
        <div class="fixed inset-0 bg-guinda-950/60 backdrop-blur-sm z-50
                    flex items-center justify-center p-4"
             (click)="cerrarReset()">
          <div class="card w-full max-w-sm animate-slide-up shadow-modal"
               (click)="$event.stopPropagation()">
            <div class="h-1 bg-gradient-to-r from-guinda-700 via-dorado to-guinda-700 -mx-6 -mt-6 mb-5"></div>
            <h3 class="font-display text-lg text-guinda-800 font-semibold mb-1">
              Restablecer contraseña
            </h3>
            <p class="text-sm text-guinda-400 mb-5">
              Usuario: <span class="font-mono font-semibold text-guinda-600">{{ usuarioReset()!.usuario }}</span>
            </p>

            <div>
              <label class="block text-xs font-semibold text-guinda-600 uppercase tracking-wider mb-1.5">
                Nueva contraseña *
              </label>
              <div class="relative">
                <input [type]="mostrarPwdReset() ? 'text' : 'password'"
                       [(ngModel)]="nuevaPassword"
                       placeholder="Mínimo 6 caracteres" class="input-gov pr-11"/>
                <button type="button" (click)="mostrarPwdReset.set(!mostrarPwdReset())"
                        class="absolute right-3 top-1/2 -translate-y-1/2
                               text-guinda-300 hover:text-guinda-600 transition-colors"
                        tabindex="-1">
                  @if (mostrarPwdReset()) {
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"
                        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5
                           12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0
                           0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0
                           01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894
                           7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243
                           -4.243m4.242 4.242L9.88 9.88"/>
                    </svg>
                  } @else {
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"
                        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12
                           4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0
                           .639C20.577 16.49 16.64 19.5 12 19.5c-4.638
                           0-8.573-3.007-9.963-7.178z"/>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                  }
                </button>
              </div>
            </div>

            @if (errorReset()) {
              <div class="mt-3 flex items-center gap-2 bg-danger-bg border border-danger-border
                          rounded-lg px-4 py-3 animate-fade-in">
                <span class="text-sm text-danger-DEFAULT">{{ errorReset() }}</span>
              </div>
            }

            @if (exitoReset()) {
              <div class="mt-3 flex items-center gap-2 bg-success-bg border border-success-border
                          rounded-lg px-4 py-3 animate-fade-in">
                <svg class="w-4 h-4 text-success-DEFAULT shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4.5 12.75l6 6 9-13.5"/>
                </svg>
                <span class="text-sm text-success-DEFAULT font-medium">Contraseña actualizada</span>
              </div>
            }

            <div class="flex gap-3 mt-5">
              <button (click)="cerrarReset()" class="btn-ghost flex-1">Cancelar</button>
              <button (click)="guardarPassword()"
                      [disabled]="nuevaPassword.length < 6 || reseteando()"
                      class="btn-primary flex-1 flex items-center justify-center gap-2">
                @if (reseteando()) {
                  <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                }
                Guardar
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class UsuariosComponent implements OnInit {
  usuarios    = signal<Usuario[]>([]);
  cargando    = signal(true);
  toggling    = signal('');
  mostrarModal = signal(false);
  creando     = signal(false);
  errorModal  = signal('');
  mostrarPwd  = signal(false);

  usuarioReset   = signal<Usuario | null>(null);
  nuevaPassword  = '';
  reseteando     = signal(false);
  errorReset     = signal('');
  exitoReset     = signal(false);
  mostrarPwdReset = signal(false);

  year = new Date().getFullYear();

  nuevoUsuario = { nombre_completo: '', usuario: '', password: '', rol: '' };

  constructor(
    private api: ApiService,
    private auth: AuthService,
    public  router: Router,
  ) {}

  get usuarioActual() { return this.auth.usuario; }

  ngOnInit() { this.cargar(); }

  cargar() {
    this.cargando.set(true);
    this.api.listarUsuarios().subscribe({
      next: data => { this.usuarios.set(data); this.cargando.set(false); },
      error: ()  => this.cargando.set(false),
    });
  }

  toggleUsuario(u: Usuario) {
    this.toggling.set(u.id!.toString());
    this.api.toggleUsuario(u.id!.toString()).subscribe({
      next: res => {
        this.toggling.set('');
        if (res.ok && res.data) {
          this.usuarios.update(list =>
            list.map(x => x.id === u.id ? { ...x, activo: res.data!.activo } : x)
          );
        }
      },
      error: () => this.toggling.set(''),
    });
  }

  crearUsuario() {
    if (!this.formValido() || this.creando()) return;
    this.errorModal.set('');
    this.creando.set(true);

    this.api.crearUsuario(this.nuevoUsuario).subscribe({
      next: res => {
        this.creando.set(false);
        if (res.ok) { this.cerrarModal(); this.cargar(); }
        else this.errorModal.set(res.error?.message ?? 'Error al crear usuario');
      },
      error: () => { this.creando.set(false); this.errorModal.set('Error al crear usuario'); },
    });
  }

  abrirResetPassword(u: Usuario) {
    this.usuarioReset.set(u);
    this.nuevaPassword = '';
    this.errorReset.set('');
    this.exitoReset.set(false);
    this.mostrarPwdReset.set(false);
  }

  guardarPassword() {
    if (this.nuevaPassword.length < 6 || this.reseteando()) return;
    this.errorReset.set('');
    this.reseteando.set(true);

    this.api.resetPassword(this.usuarioReset()!.id!.toString(), this.nuevaPassword).subscribe({
      next: res => {
        this.reseteando.set(false);
        if (res.ok) {
          this.exitoReset.set(true);
          setTimeout(() => this.cerrarReset(), 1500);
        } else {
          this.errorReset.set(res.error?.message ?? 'Error al actualizar contraseña');
        }
      },
      error: () => { this.reseteando.set(false); this.errorReset.set('Error al actualizar contraseña'); },
    });
  }

  cerrarModal() {
    this.mostrarModal.set(false);
    this.errorModal.set('');
    this.mostrarPwd.set(false);
    this.nuevoUsuario = { nombre_completo: '', usuario: '', password: '', rol: '' };
  }

  cerrarReset() {
    this.usuarioReset.set(null);
    this.nuevaPassword = '';
    this.errorReset.set('');
    this.exitoReset.set(false);
  }

  formValido() {
    return this.nuevoUsuario.nombre_completo.trim() &&
           this.nuevoUsuario.usuario.trim() &&
           this.nuevoUsuario.password.length >= 6 &&
           this.nuevoUsuario.rol;
  }

  contarActivos() { return this.usuarios().filter(u => u.activo).length; }
  contarRol(rol: string) { return this.usuarios().filter(u => u.rol === rol).length; }

  avatarColor(rol: string) {
    return { admin: 'bg-guinda-700', supervisor: 'bg-success-DEFAULT', escaner: 'bg-blue-500', auditor: 'bg-purple-500' }[rol] ?? 'bg-guinda-400';
  }

  rolChip(rol: string) {
    return {
      admin:      'bg-guinda-50 text-guinda-700 border border-guinda-200',
      supervisor: 'bg-success-bg text-success-DEFAULT border border-success-border',
      escaner:    'bg-blue-50 text-blue-700 border border-blue-200',
      auditor:    'bg-purple-50 text-purple-700 border border-purple-200',
    }[rol] ?? '';
  }
}
