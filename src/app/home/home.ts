import { Component, inject, ChangeDetectorRef, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService, Usuario } from '../core/auth';

interface SistemaCard {
  id: string;
  nombre: string;
  descripcion: string;
  tag: string;
  icono: string;
  ruta: string;
  requiereSistema: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class HomeComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  usuario: Usuario | null = null;
  horaActual = '';
  fechaDia = '';
  fechaMes = '';

  todosSistemas: SistemaCard[] = [
    {
      id: 'inventario',
      nombre: 'Inv·Gov',
      descripcion: 'Verificación y control de inventario institucional. Gestión de bienes, custodios y reportes en Excel.',
      tag: 'Inventario',
      icono: '📦',
      ruta: '/inventario',
      requiereSistema: 'inventario'
    },
    {
      id: 'registro-civil',
      nombre: 'Registro Civil',
      descripcion: 'Gestión de oficiales y oficialías del estado. Control de actas, oficiales activos y estadísticas.',
      tag: 'Registro Civil',
      icono: '📋',
      ruta: '/registro-civil',
      requiereSistema: 'registro-civil'
    }
  ];

  get sistemasDisponibles(): SistemaCard[] {
    return this.todosSistemas.filter(s =>
      this.authService.tieneSistema(s.requiereSistema)
    );
  }

  ngOnInit() {
    this.usuario = this.authService.getUsuario();
    this.setFecha();
    this.actualizarHora();
    setInterval(() => this.actualizarHora(), 30000);
    this.cdr.detectChanges();
  }

  irA(ruta: string) {
    this.router.navigate([ruta]);
  }

  private setFecha() {
    const meses = ['enero','febrero','marzo','abril','mayo','junio',
                   'julio','agosto','septiembre','octubre','noviembre','diciembre'];
    const dias = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
    const now = new Date();
    this.fechaDia = `${dias[now.getDay()]} ${now.getDate()}`;
    this.fechaMes = `${meses[now.getMonth()]} ${now.getFullYear()}`;
  }

  private actualizarHora() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    this.horaActual = `${h}:${m}`;
    this.cdr.detectChanges();
  }
}