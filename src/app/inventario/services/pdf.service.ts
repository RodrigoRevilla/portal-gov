import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ResumenSesion, Faltante, EscaneoDetalle } from '../models/index';

@Injectable({ providedIn: 'root' })
export class PdfService {

  generarActa(
    sesion: ResumenSesion,
    faltantes: Faltante[],
    escaneos: EscaneoDetalle[],
    hashCierre: string,
  ): void {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
    const ancho = doc.internal.pageSize.getWidth();
    const margen = 20;
    let y = margen;

    const azul      = [15, 40, 80]   as [number, number, number];
    const azulClaro = [37, 99, 235]  as [number, number, number];
    const gris      = [100, 116, 139] as [number, number, number];
    const grisCLaro = [241, 245, 249] as [number, number, number];
    const verde     = [22, 163, 74]  as [number, number, number];
    const rojo      = [220, 38, 38]  as [number, number, number];
    const amarillo  = [217, 119, 6]  as [number, number, number];
    const negro     = [15, 23, 42]   as [number, number, number];

    doc.setFillColor(...azul);
    doc.rect(0, 0, ancho, 28, 'F');

    doc.setFillColor(...azulClaro);
    doc.rect(0, 26, ancho, 2, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('ACTA DE VERIFICACIÓN DE INVENTARIO', ancho / 2, 12, { align: 'center' });

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Sistema de Inventario Gubernamental — Documento oficial', ancho / 2, 20, { align: 'center' });

    y = 38;

    doc.setFillColor(...grisCLaro);
    doc.roundedRect(margen, y, ancho - margen * 2, 38, 3, 3, 'F');

    doc.setTextColor(...negro);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(sesion.nombre_sesion, margen + 5, y + 9);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...gris);

    const fechaInicio = new Date(sesion.iniciada_at).toLocaleString('es-MX', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
    const fechaCierre = new Date().toLocaleString('es-MX', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });

    doc.text(`Iniciada por: ${sesion.iniciado_por}`, margen + 5, y + 18);
    doc.text(`Inicio: ${fechaInicio}`, margen + 5, y + 25);
    doc.text(`Cierre: ${fechaCierre}`, margen + 5, y + 32);
    doc.text(`Estado: CERRADA`, ancho - margen - 5, y + 18, { align: 'right' });
    doc.text(`Versión catálogo: ${sesion.version_catalogo ?? 1}`, ancho - margen - 5, y + 25, { align: 'right' });

    y += 46;

    const tarjetas = [
      { label: 'En catálogo',  valor: sesion.total_en_catalogo,   color: azul },
      { label: 'Escaneados',   valor: sesion.total_escaneados,    color: azulClaro },
      { label: 'Correctos',    valor: sesion.coincidencias,       color: verde },
      { label: 'Movidos',      valor: sesion.ubicacion_diferente, color: amarillo },
      { label: 'Sin registro', valor: sesion.no_en_catalogo,      color: rojo },
      { label: 'Faltantes',    valor: sesion.faltantes,           color: rojo },
    ];

    const tw = (ancho - margen * 2 - 10) / 6;
    tarjetas.forEach((t, i) => {
      const tx = margen + i * (tw + 2);
      doc.setFillColor(...t.color);
      doc.roundedRect(tx, y, tw, 18, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(String(t.valor), tx + tw / 2, y + 10, { align: 'center' });
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'normal');
      doc.text(t.label.toUpperCase(), tx + tw / 2, y + 16, { align: 'center' });
    });

    y += 26;

    const progreso = sesion.total_en_catalogo > 0
      ? Math.round((sesion.total_escaneados / sesion.total_en_catalogo) * 100)
      : 0;

    doc.setFontSize(8);
    doc.setTextColor(...gris);
    doc.setFont('helvetica', 'normal');
    doc.text(`Cobertura de verificación: ${progreso}%`, margen, y + 4);

    doc.setFillColor(226, 232, 240);
    doc.roundedRect(margen, y + 7, ancho - margen * 2, 4, 2, 2, 'F');
    if (progreso > 0) {
      const barraW = ((ancho - margen * 2) * progreso) / 100;
      doc.setFillColor(...azulClaro);
      doc.roundedRect(margen, y + 7, barraW, 4, 2, 2, 'F');
    }

    y += 18;

    if (faltantes.length > 0) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...rojo);
      doc.text(`BIENES FALTANTES (${faltantes.length})`, margen, y);
      y += 4;

      autoTable(doc, {
        startY: y,
        margin: { left: margen, right: margen },
        head: [['No. Inventario', 'Descripción', 'Clasificación', 'Ubicación esperada']],
        body: faltantes.map(f => [
          f.numero_inventario,
          f.descripcion,
          f.clasificacion || '—',
          f.ubicacion_esperada || '—',
        ]),
        headStyles: {
          fillColor: azul,
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: 'bold',
        },
        bodyStyles: {
          fontSize: 7.5,
          textColor: negro,
        },
        alternateRowStyles: {
          fillColor: [254, 242, 242],
        },
        columnStyles: {
          0: { cellWidth: 32, fontStyle: 'bold' },
          1: { cellWidth: 'auto' },
          2: { cellWidth: 30 },
          3: { cellWidth: 40 },
        },
      });

      y = (doc as any).lastAutoTable.finalY + 8;
    }

    if (escaneos.length > 0) {
      if (y > 200) { doc.addPage(); y = margen; }

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...azul);
      doc.text(`REGISTRO DE ESCANEOS (${escaneos.length})`, margen, y);
      y += 4;

      const etiqueta: Record<string, string> = {
        coincide:       'OK',
        encontrado:     'MOVIDO',
        no_en_catalogo: 'AJENO',
      };

      autoTable(doc, {
        startY: y,
        margin: { left: margen, right: margen },
        head: [['No. Inventario', 'Descripción', 'Resultado', 'Ubicación escaneada', 'Hora']],
        body: escaneos.map(e => [
          e.numero_inv_leido,
          e.descripcion || '—',
          etiqueta[e.resultado] || e.resultado,
          e.ubicacion_escaneada || '—',
          new Date(e.escaneado_at).toLocaleTimeString('es-MX'),
        ]),
        headStyles: {
          fillColor: azul,
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: 'bold',
        },
        bodyStyles: {
          fontSize: 7,
          textColor: negro,
        },
        alternateRowStyles: {
          fillColor: grisCLaro,
        },
        columnStyles: {
          0: { cellWidth: 30, fontStyle: 'bold' },
          1: { cellWidth: 'auto' },
          2: { cellWidth: 18, halign: 'center' },
          3: { cellWidth: 38 },
          4: { cellWidth: 20, halign: 'center' },
        },
        didDrawCell: (data: any) => {
          if (data.column.index === 2 && data.section === 'body') {
            const val = data.cell.raw as string;
            if (val === 'OK')     doc.setTextColor(...verde);
            if (val === 'MOVIDO') doc.setTextColor(...amarillo);
            if (val === 'AJENO')  doc.setTextColor(...rojo);
          }
        },
      });

      y = (doc as any).lastAutoTable.finalY + 10;
    }

    const totalPaginas = doc.getNumberOfPages();
    for (let p = 1; p <= totalPaginas; p++) {
      doc.setPage(p);
      const yPie = doc.internal.pageSize.getHeight() - 20;

      doc.setDrawColor(...azulClaro);
      doc.setLineWidth(0.3);
      doc.line(margen, yPie - 2, ancho - margen, yPie - 2);

      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...gris);
      doc.text(
        `Hash de integridad SHA-256: ${hashCierre}`,
        margen, yPie + 3,
      );
      doc.text(
        `Página ${p} de ${totalPaginas}  ·  Documento generado el ${new Date().toLocaleString('es-MX')}`,
        ancho - margen, yPie + 3, { align: 'right' },
      );
    }

    const nombreArchivo = `acta_${sesion.nombre_sesion.replace(/\s+/g, '_')}_${
      new Date().toISOString().slice(0, 10)
    }.pdf`;
    doc.save(nombreArchivo);
  }
}
