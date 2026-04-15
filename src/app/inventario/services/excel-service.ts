import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import { Faltante, EscaneoDetalle, ResumenSesion } from '../models/index';

@Injectable({ providedIn: 'root' })
export class ExcelService {

  exportarFaltantes(sesion: ResumenSesion, faltantes: Faltante[]): void {
    const wb = XLSX.utils.book_new();

    const resumen = [
      ['ACTA DE VERIFICACIÓN DE INVENTARIO'],
      [],
      ['Sesión:', sesion.nombre_sesion],
      ['Iniciada por:', sesion.iniciado_por],
      ['Fecha:', new Date(sesion.iniciada_at).toLocaleString('es-MX')],
      ['Estado:', sesion.estado.toUpperCase()],
      [],
      ['RESUMEN DE RESULTADOS'],
      ['Total en catálogo:', sesion.total_en_catalogo],
      ['Escaneados:', sesion.total_escaneados],
      ['Correctos:', sesion.coincidencias],
      ['Ubicación diferente:', sesion.ubicacion_diferente],
      ['Sin registro:', sesion.no_en_catalogo],
      ['Faltantes:', sesion.faltantes],
      ['Cobertura:', `${sesion.total_en_catalogo > 0 ? Math.round((sesion.total_escaneados / sesion.total_en_catalogo) * 100) : 0}%`],
    ];

    const wsResumen = XLSX.utils.aoa_to_sheet(resumen);
    wsResumen['!cols'] = [{ wch: 22 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');

    if (faltantes.length > 0) {
      const encabezados = [
        'No. Inventario', 'No. Serie', 'Descripción',
        'Marca', 'Modelo', 'Clasificación',
        'Ubicación Esperada', 'Resguardo',
      ];
      const filas = faltantes.map(f => [
        f.numero_inventario,
        f.numero_serie       || '',
        f.descripcion,
        f.marca              || '',
        f.modelo             || '',
        f.clasificacion      || '',
        f.ubicacion_esperada || '',
        f.resguardo          || '',
      ]);

      const wsFaltantes = XLSX.utils.aoa_to_sheet([encabezados, ...filas]);
      wsFaltantes['!cols'] = [
        { wch: 20 }, { wch: 22 }, { wch: 40 },
        { wch: 16 }, { wch: 20 }, { wch: 22 },
        { wch: 30 }, { wch: 25 },
      ];
      XLSX.utils.book_append_sheet(wb, wsFaltantes, 'Faltantes');
    }

    const nombre = `faltantes_${sesion.nombre_sesion.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    wb.SheetNames = wb.SheetNames.reverse();
    XLSX.writeFile(wb, nombre);
  }

  exportarEscaneos(sesion: ResumenSesion, escaneos: EscaneoDetalle[]): void {
    const wb = XLSX.utils.book_new();

    const etiqueta: Record<string, string> = {
      coincide:       'Verificado',
      encontrado:     'Ubicación diferente',
      no_en_catalogo: 'No en catálogo',
    };

    const encabezados = [
      'No. Inventario', 'No. Serie', 'Descripción',
      'Marca', 'Modelo', 'Resultado',
      'Ubicación Esperada', 'Ubicación Escaneada',
      'Resguardo', 'Observaciones',
      'Escaneado por', 'Hora',
    ];

    const filas = escaneos.map(e => [
      e.numero_inv_leido,
      e.numero_serie        || '',
      e.descripcion         || '',
      e.marca               || '',
      e.modelo              || '',
      etiqueta[e.resultado] || e.resultado,
      e.ubicacion_esperada  || '',
      e.ubicacion_escaneada || '',
      e.resguardo           || '',
      e.observaciones       || '',
      e.escaneado_por       || '',
      new Date(e.escaneado_at).toLocaleString('es-MX'),
    ]);

    const ws = XLSX.utils.aoa_to_sheet([encabezados, ...filas]);
    ws['!cols'] = [
      { wch: 20 }, { wch: 22 }, { wch: 40 },
      { wch: 16 }, { wch: 20 }, { wch: 22 },
      { wch: 28 }, { wch: 28 }, { wch: 25 },
      { wch: 30 }, { wch: 25 }, { wch: 22 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Escaneos');

    const nombre = `escaneos_${sesion.nombre_sesion.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, nombre);
  }

  exportarCompleto(sesion: ResumenSesion, escaneos: EscaneoDetalle[], faltantes: Faltante[]): void {
    const wb = XLSX.utils.book_new();

    const etiqueta: Record<string, string> = {
      coincide:       'Verificado',
      encontrado:     'Ubicación diferente',
      no_en_catalogo: 'No en catálogo',
    };

    const resumen = [
      ['ACTA DE VERIFICACIÓN DE INVENTARIO'],
      [],
      ['Sesión:', sesion.nombre_sesion],
      ['Iniciada por:', sesion.iniciado_por],
      ['Fecha inicio:', new Date(sesion.iniciada_at).toLocaleString('es-MX')],
      ['Fecha cierre:', sesion.cerrada_at ? new Date(sesion.cerrada_at).toLocaleString('es-MX') : '—'],
      ['Estado:', sesion.estado.toUpperCase()],
      [],
      ['RESULTADOS'],
      ['Total en catálogo:', sesion.total_en_catalogo],
      ['Escaneados:', sesion.total_escaneados],
      ['Correctos:', sesion.coincidencias],
      ['Ubicación diferente:', sesion.ubicacion_diferente],
      ['Sin registro:', sesion.no_en_catalogo],
      ['Faltantes:', sesion.faltantes],
      ['Cobertura:', `${sesion.total_en_catalogo > 0 ? Math.round((sesion.total_escaneados / sesion.total_en_catalogo) * 100) : 0}%`],
    ];
    const wsResumen = XLSX.utils.aoa_to_sheet(resumen);
    wsResumen['!cols'] = [{ wch: 22 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');

    const encontrados = escaneos.filter(e => e.resultado === 'coincide' || e.resultado === 'encontrado');
    if (encontrados.length > 0) {
      const encFound = [
        'No. Inventario', 'No. Serie', 'Descripción', 'Marca', 'Modelo',
        'Resultado', 'Ubicación Esperada', 'Ubicación Escaneada', 'Resguardo', 'Hora'
      ];
      const filasFound = encontrados.map(e => [
        e.numero_inv_leido,
        e.numero_serie        || '',
        e.descripcion         || '',
        e.marca               || '',
        e.modelo              || '',
        etiqueta[e.resultado] || e.resultado,
        e.ubicacion_esperada  || '',
        e.ubicacion_escaneada || '',
        e.resguardo           || '',
        new Date(e.escaneado_at).toLocaleString('es-MX'),
      ]);
      const wsFound = XLSX.utils.aoa_to_sheet([encFound, ...filasFound]);
      wsFound['!cols'] = [
        { wch: 20 }, { wch: 22 }, { wch: 40 }, { wch: 16 }, { wch: 20 },
        { wch: 22 }, { wch: 28 }, { wch: 28 }, { wch: 25 }, { wch: 22 }
      ];
      XLSX.utils.book_append_sheet(wb, wsFound, 'Encontrados');
    }

    if (faltantes.length > 0) {
      const encFalt = [
        'No. Inventario', 'No. Serie', 'Descripción',
        'Marca', 'Modelo', 'Clasificación', 'Ubicación Esperada', 'Resguardo'
      ];
      const filasFalt = faltantes.map(f => [
        f.numero_inventario,
        f.numero_serie       || '',
        f.descripcion,
        f.marca              || '',
        f.modelo             || '',
        f.clasificacion      || '',
        f.ubicacion_esperada || '',
        f.resguardo          || '',
      ]);
      const wsFalt = XLSX.utils.aoa_to_sheet([encFalt, ...filasFalt]);
      wsFalt['!cols'] = [
        { wch: 20 }, { wch: 22 }, { wch: 40 }, { wch: 16 },
        { wch: 20 }, { wch: 22 }, { wch: 30 }, { wch: 25 }
      ];
      XLSX.utils.book_append_sheet(wb, wsFalt, 'Faltantes');
    }

    const nombre = `reporte_completo_${sesion.nombre_sesion.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, nombre);
  }
}