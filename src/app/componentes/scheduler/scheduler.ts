
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VerHorarios } from './ver-horarios/ver-horarios';
import { RouterModule } from '@angular/router';


@Component({
  selector: 'app-scheduler',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './scheduler.html',
  styleUrls: ['./scheduler.scss']
})
export class SchedulerComponent {
  private readonly apiBaseUrl = 'https://horarios-backend-58w8.onrender.com';
  private readonly apiBaseUrlLocal = 'http://localhost:3000';

  loading = false;
  message = '';
  isSuccess = false;
  usuarioNombre: string = '';
  usuarioCarrera: string = '';
  usuarioDivision: string = '';
  usuarioTurno: string = '';
  groupedSchedules: Array<{ nombregrupo: string; data: any[] }> = [];
  diasSemana: string[] = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie'];
  horas: string[] = ['17', '18', '19', '20', '21'];
  vistaHorarios: 'grupo' | 'profesor' = 'grupo';
  profesoresConHorarios: Array<{ nombre: string, clases: any[] }> = [];
  gruposPreview: Array<{ id: string; nombre: string; division: string; selected: boolean; grado: number | string }> = [];
  profesoresPreview: Array<{ id: string; nombre: string; materias: string[]; disponibilidad: Array<string | Record<string, unknown>>; selected: boolean }> = [];
  salonesPreview: Array<{ id: string; nombre: string; division: string; selected: boolean }> = [];
  materiasPreview: Array<{ id: string; nombre: string; carrera: string; grado: number | string; horas_semana: number; salones: string[]; selected: boolean }> = [];

  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('token') || localStorage.getItem('access_token') || '';
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  getClase(data: any[], dia: string, hora: string): any {
    // Busca la clase cuyo campo start coincide con el día y la hora
    return data.find(clase => {
      if (typeof clase.start === 'string') {
        return clase.start.startsWith(dia) && clase.start.substring(3, 5) === hora;
      }
      return false;
    }) || null;
  }


  getClaseProfesor(clases: any[], dia: string, hora: string): any {
    return clases.find(clase => {
      if (typeof clase.start === 'string') {
        return clase.start.startsWith(dia) && clase.start.substring(3, 5) === hora;
      }
      return false;
    }) || null;
  }

  ngOnInit() {
    const usuarioData = localStorage.getItem('userData');
    if (usuarioData) {
      const { full_name, metadata: { division, turno } } = JSON.parse(usuarioData);
      this.usuarioNombre = full_name || 'Usuario';
      this.usuarioCarrera = `${division || ''} - ${turno || ''}`;
      this.usuarioDivision = division || '';
      this.usuarioTurno = turno || '';

    } else {
      this.usuarioNombre = 'Usuario';
      this.usuarioCarrera = '';
      this.usuarioDivision = '';
      this.usuarioTurno = '';
    }
    this.cargarDatosPreview();
    this.cargarHorariosCreados();
  }

  async cargarDatosPreview() {
    try {
      const [gruposRes, profesoresRes, salonesRes, materiasRes] = await Promise.all([
        fetch(`${this.apiBaseUrlLocal}/grupos`, { headers: this.getAuthHeaders() }),
        fetch(`${this.apiBaseUrlLocal}/profesores`, { headers: this.getAuthHeaders() }),
        fetch(`${this.apiBaseUrlLocal}/salones`, { headers: this.getAuthHeaders() }),
        fetch(`${this.apiBaseUrlLocal}/materias`, { headers: this.getAuthHeaders() })
      ]);

      if (!gruposRes.ok || !profesoresRes.ok || !salonesRes.ok || !materiasRes.ok) {
        throw new Error('No se pudieron cargar todos los datos de previsualizacion');
      }

      const [gruposData, profesoresData, salonesData, materiasData] = await Promise.all([
        gruposRes.json(),
        profesoresRes.json(),
        salonesRes.json(),
        materiasRes.json()
      ]);

      this.gruposPreview = this.normalizeGrupos(gruposData);
      this.profesoresPreview = this.normalizeProfesores(profesoresData);
      this.salonesPreview = this.normalizeSalones(salonesData);
      this.materiasPreview = this.normalizeMaterias(materiasData);
      console.log(materiasData); 
    } catch (error) {
      this.message = '⚠️ No se pudo cargar el preview completo. Revisa tu conexion e intenta de nuevo.';
      this.isSuccess = false;
      console.error('Error al cargar preview de datos:', error);
    }
  }

  private normalizeGrupos(raw: unknown): Array<{ id: string; nombre: string; division: string; selected: boolean; grado: number | string }> {
    if (!Array.isArray(raw)) return [];

    const divisionUsuario = this.usuarioDivision.toLowerCase();
    return raw
      .map((item: any, index: number) => ({
        id: item?.id ?? `g-${index}`,
        nombre: item?.nombre ?? `Grupo ${index + 1}`,
        division: item?.division ?? '',
        grado: item?.grado ?? ''
      }))
      .filter((grupo) => !divisionUsuario || !grupo.division || grupo.division.toLowerCase() === divisionUsuario)
      .sort((a, b) => a.nombre.localeCompare(b.nombre))
      .map((grupo) => ({ ...grupo, selected: true }));
  }

  private normalizeDisponibilidad(rawDisponibilidad: unknown): Array<string | Record<string, unknown>> {
    if (!Array.isArray(rawDisponibilidad)) return [];

    return rawDisponibilidad
      .map((bloque) => {
        if (bloque && typeof bloque === 'object') {
          return bloque as Record<string, unknown>;
        }

        if (typeof bloque === 'string') {
          const trimmed = bloque.trim();
          if (!trimmed) return null;

          try {
            const parsed = JSON.parse(trimmed);
            if (parsed && typeof parsed === 'object') {
              return parsed as Record<string, unknown>;
            }
          } catch {
            // Si no es JSON valido, se conserva como string.
          }

          return trimmed;
        }

        return null;
      })
      .filter((bloque): bloque is string | Record<string, unknown> => bloque !== null);
  }

  private normalizeProfesores(raw: unknown): Array<{ id: string; nombre: string; materias: string[]; disponibilidad: Array<string | Record<string, unknown>>; selected: boolean }> {
    if (!Array.isArray(raw)) return [];

    return raw
      .map((item: any, index: number) => ({
        id: item?.profesor_id ?? item?.id ?? `p-${index}`,
        nombre: `${item?.nombre ?? ''} ${item?.apellidos ?? ''}`.trim() || `Profesor ${index + 1}`,
        materias: Array.isArray(item?.materias) ? item.materias.map((m: unknown) => String(m).trim()).filter(Boolean) : [],
        disponibilidad: this.normalizeDisponibilidad(item?.metadata?.disponibilidad ?? item?.disponibilidad)

      }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre))
      .map((profesor) => ({ ...profesor, selected: true }));
  }

  private normalizeSalones(raw: unknown): Array<{ id: string; nombre: string; division: string; selected: boolean }> {
    if (!Array.isArray(raw)) return [];

    const divisionUsuario = this.usuarioDivision.toLowerCase();
    return raw
      .map((item: any, index: number) => ({
        id: item?.id ?? `s-${index}`,
        nombre: item?.nombre ?? `Salon ${index + 1}`,
        division: item?.division ?? ''
      }))
      .filter((salon) => !divisionUsuario || !salon.division || salon.division.toLowerCase() === divisionUsuario)
      .sort((a, b) => a.nombre.localeCompare(b.nombre))
      .map((salon) => ({ ...salon, selected: true }));
  }

  private extractSalones(rawSalones: unknown): string[] {
    if (Array.isArray(rawSalones)) {
      return rawSalones.map((salon) => String(salon).trim()).filter(Boolean);
    }

    if (rawSalones && typeof rawSalones === 'object') {
      return Object.values(rawSalones as Record<string, unknown>)
        .map((salon) => String(salon).trim())
        .filter(Boolean);
    }

    if (typeof rawSalones === 'string' && rawSalones.trim()) {
      return [rawSalones.trim()];
    }

    return [];
  }

  private normalizeMaterias(raw: unknown): Array<{ id: string; nombre: string; carrera: string; grado: number | string; horas_semana: number; salones: string[]; selected: boolean }> {
    if (!Array.isArray(raw)) return [];

    return raw
      .map((item: any, index: number) => ({
        id: item?.id ?? `m-${index}`,
        nombre: item?.nombre ?? `Materia ${index + 1}`,
        carrera: item?.carrera ?? '',
        grado: item?.grado ?? '',
        horas_semana: item?.horas_semana ?? 0,
        salones: this.extractSalones(item?.salones)
      }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre))
      .map((materia) => ({ ...materia, selected: true }));
  }

  seleccionarTodo(tipo: 'grupos' | 'profesores' | 'salones' | 'materias', selected: boolean) {
    const list = this.getSelectionList(tipo);
    list.forEach((item) => {
      item.selected = selected;
    });
  }

  private getSelectionList(tipo: 'grupos' | 'profesores' | 'salones' | 'materias') {
    if (tipo === 'grupos') return this.gruposPreview;
    if (tipo === 'profesores') return this.profesoresPreview;
    if (tipo === 'materias') return this.materiasPreview;
    return this.salonesPreview;
  }

  get totalGruposSeleccionados(): number {
    return this.gruposPreview.filter((grupo) => grupo.selected).length;
  }

  get totalProfesoresSeleccionados(): number {
    return this.profesoresPreview.filter((profesor) => profesor.selected).length;
  }

  get totalSalonesSeleccionados(): number {
    return this.salonesPreview.filter((salon) => salon.selected).length;
  }

  get totalMateriasSeleccionadas(): number {
    return this.materiasPreview.filter((materia) => materia.selected).length;
  }

  async cargarHorariosCreados() {
    try {
      const res = await fetch(`${this.apiBaseUrlLocal}/scheduler/allschedules`, {
        headers: this.getAuthHeaders()
      });
      if (!res.ok) throw new Error('Error al obtener horarios creados');
      const data = await res.json();
      console.log('Horarios creados:', data);
      // El backend puede devolver { schedules: [...] } o directamente un array
      const schedulesArray = Array.isArray(data) ? data : (data?.schedules ?? []);
      if (Array.isArray(schedulesArray)) {
        this.groupedSchedules = schedulesArray.map((s: any) => ({
          nombregrupo: s.nombregrupo ?? s.groupName ?? 'Sin nombre',
          data: Array.isArray(s.data) ? s.data : []
        }));
        // Generar lista de profesores con sus clases
        const clasesTodas: any[] = schedulesArray.flatMap((g: any) => Array.isArray(g.data) ? g.data : []);
        const profesoresMap: { [nombre: string]: any[] } = {};
        for (const clase of clasesTodas) {
          if (clase.prof) {
            if (!profesoresMap[clase.prof]) profesoresMap[clase.prof] = [];
            profesoresMap[clase.prof].push(clase);
          }
        }
        this.profesoresConHorarios = Object.entries(profesoresMap).map(([nombre, clases]) => ({ nombre, clases }));
      } else {
        this.groupedSchedules = [];
        this.profesoresConHorarios = [];
      }


    } catch (err) {
      alert('No se pudo cargar la lista de horarios creados: ' + err);
    }
  }

  generateSchedule() {
    const gruposSeleccionados = this.gruposPreview
      .filter((grupo) => grupo.selected)
      .map((grupo) => ({ nombre: grupo.nombre, grado: grupo.grado }));
    const profesoresSeleccionados = this.profesoresPreview
      .filter((profesor) => profesor.selected)
      .map((profesor) => ({ nombre: profesor.nombre, materias: profesor.materias, disponibilidad: profesor.disponibilidad }));
    const salonesSeleccionados = this.salonesPreview.filter((salon) => salon.selected).map((salon) => salon.nombre);
    const materiasSeleccionadas = this.materiasPreview
      .filter((materia) => materia.selected)
      .map((materia) => ({ nombre: materia.nombre, grado: materia.grado, salones: materia.salones, horas: materia.horas_semana }));

    if (!gruposSeleccionados.length || !profesoresSeleccionados.length || !salonesSeleccionados.length || !materiasSeleccionadas.length) {
      this.isSuccess = false;
      this.message = '⚠️ Debes seleccionar al menos 1 grupo, 1 profesor, 1 materia y 1 salon para generar.';
      return;
    }

    this.loading = true;
    this.message = '';
    this.isSuccess = false;

    const payload = {
      grupos: gruposSeleccionados,
      profesores: profesoresSeleccionados,
      salones: salonesSeleccionados,
      materias: materiasSeleccionadas,
    
    };


    console.log('Payload para generación:', payload);
    
    fetch(`http://localhost:8000/generar-horario`, {
      method: 'POST', 
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)

    })

    // fetch(`${this.apiBaseUrlLocal}/scheduler/generate`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     ...this.getAuthHeaders()
    //   },
    //   body: JSON.stringify(payload)
    // })
    //   .then(async res => {
    //     if (!res.ok) throw new Error('Error al generar los horarios');
    //     const response = await res.json();
    //     this.loading = false;
    //     this.isSuccess = true;
    //     this.message = '✅ Horarios generados correctamente.';
    //     console.log('Respuesta del backend:', response);
    //     this.cargarHorariosCreados();
    //   })
    //   .catch(error => {
    //     this.loading = false;
    //     this.isSuccess = false;
    //     this.message = '❌ Ocurrió un error al generar los horarios.';
    //     console.error('Error:', error);
    //   });
  }




  exportarPDF(group: { nombregrupo: string; data: any[] }) {
    const doc = new jsPDF();

    // Colores institucionales
    const primaryColor = [0, 91, 170] as [number, number, number]; // #005baa
    const secondaryColor = [245, 247, 250] as [number, number, number]; // #f5f7fa

    // Encabezado del documento
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 20, 'F');

    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text(`Horario de Grupo`, 14, 13);

    doc.setFontSize(10);
    doc.text(`Horari - UTEQ`, 180, 13, { align: 'right' });

    // Información del grupo
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Grupo: ${group.nombregrupo}`, 14, 30);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Generado el: ${new Date().toLocaleDateString()}`, 14, 36);

    const head = [['Hora', ...this.diasSemana]];
    const body: any[] = [];

    for (const hora of this.horas) {
      const row: any[] = [hora + ':00'];
      for (const dia of this.diasSemana) {
        const clase = this.getClase(group.data, dia, hora);
        if (clase) {
          row.push([
            clase.subj,
            clase.prof || 'Sin profesor',
            clase.room || 'Sin salón'
          ].filter(Boolean).join('\n'));
        } else {
          row.push('');
        }
      }
      body.push(row);
    }

    autoTable(doc, {
      head,
      body,
      startY: 45,
      theme: 'grid',
      styles: {
        fontSize: 9,
        cellPadding: 3,
        valign: 'middle',
        halign: 'center',
        lineColor: [224, 228, 234],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center',
      },
    });

    // Pie de página
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text('Documento generado automáticamente por el sistema de horarios UTEQ', 105, 290, { align: 'center' });
    }

    doc.save(`horario_${group.nombregrupo}.pdf`);
  }


  // ...mantener el resto del código igual...

  exportarPDFProfesor(prof: { nombre: string, clases: any[] }) {
    const doc = new jsPDF();

    // Colores institucionales
    const primaryColor = [0, 91, 170] as [number, number, number];
    const secondaryColor = [245, 247, 250] as [number, number, number];

    // Encabezado
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 20, 'F');

    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text(`Horario de Profesor`, 14, 13);

    doc.setFontSize(10);
    doc.text(`Horari - UTEQ`, 180, 13, { align: 'right' });

    // Información del profesor
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Profesor: ${prof.nombre}`, 14, 30);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Generado el: ${new Date().toLocaleDateString()}`, 14, 36);

    const head = [['Hora', ...this.diasSemana]];
    const body: any[] = [];

    for (const hora of this.horas) {
      const row: any[] = [hora + ':00'];
      for (const dia of this.diasSemana) {
        const clase = this.getClaseProfesor(prof.clases, dia, hora);
        if (clase) {
          row.push([
            clase.subj,
            `Grupo: ${clase.group || clase.grupo || '-'}`,
            clase.room
          ].filter(Boolean).join('\n'));
        } else {
          row.push('');
        }
      }
      body.push(row);
    }

    autoTable(doc, {
      head,
      body,
      startY: 45,
      theme: 'grid',
      styles: {
        fontSize: 9,
        cellPadding: 3,
        valign: 'middle',
        halign: 'center',
        lineColor: [224, 228, 234],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center',
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 20, fillColor: secondaryColor },
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250],
      },
      didParseCell: (data: any) => {
        if (data.section === 'body' && data.column.index > 0 && data.cell.raw) {
          data.cell.styles.fillColor = [234, 243, 251];
          data.cell.styles.textColor = [0, 91, 170];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    });

    // Pie de página
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text('Documento generado automáticamente por el sistema de horarios UTEQ', 105, 290, { align: 'center' });
    }

    doc.save(`horario_profesor_${prof.nombre}.pdf`);
  }
}







