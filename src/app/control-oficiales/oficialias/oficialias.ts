import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { OficialesService } from '../services/oficiales.service';
import { Oficialía } from '../models';

interface Toast { id: number; msg: string; tipo: 'success' | 'error' | 'info'; }

const REGIONES = ['CANADA', 'COSTA', 'ISTMO', 'MIXTECA', 'PAPALOAPAM', 'SIERRA NORTE', 'SIERRA SUR', 'VALLES CENTRALES'];

@Component({
  selector: 'app-oficialias',
  imports: [FormsModule, RouterLink],
  templateUrl: './oficialias.html',
  styleUrl: './oficialias.css'
})
export class Oficialias implements OnInit {

  private svc    = inject(OficialesService);
  private router = inject(Router);
  private cdr    = inject(ChangeDetectorRef);

  todas:    Oficialía[] = [];
  filtradas: Oficialía[] = [];
  cargando = false;

  searchText   = '';
  regionFiltro = '';
  sistemaFiltro = '';
  listoFiltro  = '';

  editando: Oficialía | null = null;
  guardando = false;

  toasts: Toast[] = [];
  private toastId = 0;
  private searchSubject = new Subject<string>();

  regiones = REGIONES;

  get usuario(): string { return sessionStorage.getItem('usuario') ?? 'admin'; }
  get listos():   number { return this.todas.filter(o => o.listo_sid).length; }
  get noListos(): number { return this.todas.filter(o => !o.listo_sid).length; }
  get sid():      number { return this.todas.filter(o => o.sistema === 'SID').length; }
  get sirco():    number { return this.todas.filter(o => o.sistema === 'SIRCO').length; }

  ngOnInit(): void {
    if (!sessionStorage.getItem('token')) { this.router.navigate(['/login']); return; }
    this.searchSubject.pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => this.filtrar());
    this.load();
  }

  load(): void {
    this.cargando = true;
    this.cdr.detectChanges();
    this.svc.getOficialias().subscribe({
      next: list => {
        this.todas = list;
        this.filtrar();
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: () => { this.cargando = false; this.cdr.detectChanges(); }
    });
  }

  filtrar(): void {
    let r = [...this.todas];
    if (this.searchText) {
      const s = this.searchText.toLowerCase();
      r = r.filter(o => o.nombre.toLowerCase().includes(s) || o.numero.includes(s));
    }
    if (this.regionFiltro)  r = r.filter(o => o.region === this.regionFiltro);
    if (this.sistemaFiltro) r = r.filter(o => o.sistema === this.sistemaFiltro);
    if (this.listoFiltro === 'listo')    r = r.filter(o => o.listo_sid);
    if (this.listoFiltro === 'no-listo') r = r.filter(o => !o.listo_sid);
    this.filtradas = r;
    this.cdr.detectChanges();
  }

  onSearch(v: string): void { this.searchSubject.next(v); }

  limpiar(): void {
    this.searchText = '';
    this.regionFiltro = '';
    this.sistemaFiltro = '';
    this.listoFiltro = '';
    this.filtrar();
  }

  abrirEditar(o: Oficialía): void {
    this.editando = { ...o };
    this.cdr.detectChanges();
  }

  guardarEdicion(): void {
    if (!this.editando) return;
    this.guardando = true;
    this.cdr.detectChanges();
    this.svc.updateOficialia(this.editando).subscribe({
      next: (updated: any) => {
        const idx = this.todas.findIndex(o => o.id === updated.id);
        if (idx >= 0) this.todas[idx] = updated;
        this.editando = null;
        this.guardando = false;
        this.filtrar();
        this.showToast('Oficialía actualizada.', 'success');
      },
      error: (err: any) => {
        this.showToast(err?.error?.message ?? 'Error al guardar.', 'error');
        this.guardando = false;
        this.cdr.detectChanges();
      }
    });
  }

  onOverlayClick(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains('modal-overlay')) {
      this.editando = null;
      this.cdr.detectChanges();
    }
  }

  showToast(msg: string, tipo: 'success'|'error'|'info' = 'info'): void {
    const id = ++this.toastId;
    this.toasts.push({ id, msg, tipo });
    this.cdr.detectChanges();
    setTimeout(() => { this.toasts = this.toasts.filter(t => t.id !== id); this.cdr.detectChanges(); }, 3200);
  }
}