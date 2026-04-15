import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import * as XLSX from 'xlsx';

import { OficialesService } from '../services/oficiales.service';
import { Oficial, Oficialía, Stats, FilterType } from '../models';
import { ModalOficial } from '../oficiales/modal-oficial';
import { ModalCompletar } from '../oficiales/modal-completar';
import { ModalAddOficialia, NuevaOficialia } from '../oficiales/modal-add-ofic';
import { ConfirmDialog } from '../oficiales/confirm-dialog';
import { ModalPassword } from './modal-password';

interface Toast { id: number; msg: string; tipo: 'success' | 'error' | 'info'; }

@Component({
  selector: 'app-dashboard',
  imports: [FormsModule, ModalOficial, ModalCompletar, ModalAddOficialia, ConfirmDialog, ModalPassword],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {

  private svc = inject(OficialesService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  stats: Stats | null = null;
  oficiales: Oficial[] = [];
  oficialias: Oficialía[] = [];
  cargando = false;
  guardando = false;

  filtroActivo: FilterType = 'todos';
  searchText = '';
  oficFiltro = '';
  regionFiltro = '';
  sistemaFiltro = '';

  modalOficialAbierto = false;
  modalPasswordAbierto = false;
  modalCompletarAbierto = false;
  modalOficialiaAbierto = false;
  oficialEditando: Oficial | null = null;
  oficialCompletando: Oficial | null = null;

  confirmAbierto = false;
  nombreEliminando = '';
  idEliminando = 0;

  toasts: Toast[] = [];
  private toastId = 0;
  private searchSubject = new Subject<string>();

  get usuario(): string { return sessionStorage.getItem('usuario') ?? 'admin'; }

  get tituloTabla(): string {
    const map: Record<FilterType, string> = {
      todos: 'Todos los Oficiales',
      sid: 'Oficiales con SID',
      internet: 'Oficiales con Internet',
      starlink: 'Oficiales con Starlink',
      pendientes: 'Registros pendientes',
    };
    return map[this.filtroActivo];
  }

  get regiones(): string[] {
    return [...new Set(this.oficialias.map(o => o.region).filter(Boolean))].sort();
  }

  get sistemas(): string[] {
    return [...new Set(this.oficialias.map(o => o.sistema).filter(Boolean))].sort();
  }

  get hayFiltrosExtra(): boolean {
    return !!this.oficFiltro || !!this.regionFiltro || !!this.sistemaFiltro;
  }

  ngOnInit(): void {
    if (!sessionStorage.getItem('portal_token') && !sessionStorage.getItem('token')) {
      this.router.navigate(['/login']);
      return;
    }
    this.searchSubject.pipe(debounceTime(350), distinctUntilChanged())
      .subscribe(() => this.loadOficiales());
    this.loadStats();
    this.loadOficialias();
    this.loadOficiales();
  }

  loadStats(): void {
    this.svc.getStats().subscribe({
      next: s => { this.stats = s; this.cdr.detectChanges(); },
      error: () => {}
    });
  }

  loadOficialias(): void {
    this.svc.getOficialias().subscribe({
      next: list => { this.oficialias = list; this.cdr.detectChanges(); },
      error: () => {}
    });
  }

  loadOficiales(): void {
    this.cargando = true;
    this.cdr.detectChanges();
    this.svc.getOficiales(this.filtroActivo, this.searchText, this.oficFiltro, this.regionFiltro, this.sistemaFiltro).subscribe({
      next: list => { this.oficiales = list; this.cargando = false; this.cdr.detectChanges(); },
      error: err => { this.showToast(err?.error?.message ?? 'Error al cargar.', 'error'); this.cargando = false; this.cdr.detectChanges(); }
    });
  }

  applyFilter(f: FilterType): void {
    this.filtroActivo = f;
    this.loadStats();
    this.loadOficiales();
  }

  limpiarFiltros(): void {
    this.filtroActivo = 'todos';
    this.searchText = '';
    this.oficFiltro = '';
    this.regionFiltro = '';
    this.sistemaFiltro = '';
    this.loadOficiales();
  }

  onSearch(val: string): void { this.searchSubject.next(val); }

  abrirModal(o: Oficial | null): void {
    this.oficialEditando = o;
    this.modalOficialAbierto = true;
    this.cdr.detectChanges();
  }

  cerrarModal(): void {
    this.modalOficialAbierto = false;
    this.oficialEditando = null;
    this.guardando = false;
    this.cdr.detectChanges();
  }

  guardarOficial(data: Partial<Oficial>): void {
    this.guardando = true;
    this.cdr.detectChanges();
    const esEdicion = !!this.oficialEditando;
    const op = esEdicion
      ? this.svc.updateOficial(this.oficialEditando!.id, data)
      : this.svc.createOficial(data);
    op.subscribe({
      next: () => {
        this.cerrarModal();
        this.showToast(esEdicion ? 'Oficial actualizado.' : 'Oficial registrado.', 'success');
        this.loadStats(); this.loadOficiales();
      },
      error: err => { this.showToast(err?.error?.message ?? 'Error al guardar.', 'error'); this.guardando = false; this.cdr.detectChanges(); }
    });
  }

  abrirCompletar(o: Oficial): void {
    this.oficialCompletando = o;
    this.modalCompletarAbierto = true;
    this.cdr.detectChanges();
  }

  completarOficial(data: Partial<Oficial>): void {
    if (!this.oficialCompletando) return;
    this.guardando = true;
    this.cdr.detectChanges();
    this.svc.updateOficial(this.oficialCompletando.id, data).subscribe({
      next: () => {
        this.modalCompletarAbierto = false;
        this.oficialCompletando = null;
        this.guardando = false;
        this.showToast('Registro completado. Oficial activado.', 'success');
        this.loadStats(); this.loadOficiales();
      },
      error: err => { this.showToast(err?.error?.message ?? 'Error al completar.', 'error'); this.guardando = false; this.cdr.detectChanges(); }
    });
  }

  guardarOficialia(data: NuevaOficialia): void {
    this.svc.createOficialia(data).subscribe({
      next: () => {
        this.modalOficialiaAbierto = false;
        this.showToast('Oficialía registrada.', 'success');
        this.loadOficialias(); this.loadStats();
        this.cdr.detectChanges();
      },
      error: err => { this.showToast(err?.error?.message ?? 'Error al guardar oficialía.', 'error'); }
    });
  }

  pedirConfirmacion(o: Oficial): void {
    this.idEliminando = o.id;
    this.nombreEliminando = `${o.nombres} ${o.ap1} ${o.ap2}`;
    this.confirmAbierto = true;
    this.cdr.detectChanges();
  }

  eliminarOficial(): void {
    this.svc.deleteOficial(this.idEliminando).subscribe({
      next: () => { this.confirmAbierto = false; this.showToast('Oficial eliminado.', 'success'); this.loadStats(); this.loadOficiales(); },
      error: err => { this.showToast(err?.error?.message ?? 'Error al eliminar.', 'error'); this.confirmAbierto = false; this.cdr.detectChanges(); }
    });
  }

  exportExcel(): void {
    if (!this.oficiales.length) { this.showToast('No hay datos para exportar.', 'error'); return; }
    const rows: (string | number)[][] = [
      ['#','Nombre completo','Ap. Paterno','Ap. Materno','Perfil','Municipio',
       'Oficialía','Región','Sistema','Username','Teléfono','Correo',
       'SID','Internet','Starlink','Activo','Pendiente','Observaciones']
    ];
    this.oficiales.forEach((o, i) => rows.push([
      i+1, `${o.nombres} ${o.ap1} ${o.ap2}`, o.ap1, o.ap2,
      o.perfil, o.municipio, o.ofic, o.region, o.sistema,
      o.username??'', o.tel??'', o.email??'',
      o.sid?'SÍ':'NO', o.internet?'SÍ':'NO', o.starlink?'SÍ':'NO',
      o.activo?'SÍ':'NO', o.pendiente?'PENDIENTE':'',
      o.obs??''
    ]));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [5,36,18,18,14,24,38,16,8,20,12,34,6,8,9,6,10,20].map(w=>({wch:w}));
    XLSX.utils.book_append_sheet(wb, ws, 'Oficiales');
    const labels: Record<FilterType,string> = {
      todos:'Todos', sid:'ConSID', internet:'ConInternet',
      starlink:'ConStarlink', pendientes:'Pendientes'
    };
    XLSX.writeFile(wb, `Oficiales_RC_${labels[this.filtroActivo]}_${new Date().toISOString().slice(0,10)}.xlsx`);
    this.showToast(`Excel exportado: ${this.oficiales.length} registro(s).`, 'success');
  }

  logout(): void {
    sessionStorage.clear();
    localStorage.clear();
    this.router.navigate(['/login']);
  }

  showToast(msg: string, tipo: 'success'|'error'|'info' = 'info'): void {
    const id = ++this.toastId;
    this.toasts.push({ id, msg, tipo });
    this.cdr.detectChanges();
    setTimeout(() => { this.toasts = this.toasts.filter(t => t.id !== id); this.cdr.detectChanges(); }, 3200);
  }
}