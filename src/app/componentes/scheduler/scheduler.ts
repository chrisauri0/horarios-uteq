
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
 
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VerHorarios } from './ver-horarios/ver-horarios';


@Component({
  selector: 'app-scheduler',
  imports: [CommonModule, FormsModule],
  templateUrl: './scheduler.html',
  styleUrls: ['./scheduler.scss']
})
export class SchedulerComponent {
  loading = false;
  message = '';
  isSuccess = false;
  usuarioNombre: string = '';
  usuarioCarrera: string = '';
  groupedSchedules: Array<{ nombregrupo: string; data: any[] }> = [];
  diasSemana: string[] = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie'];
  horas: string[] = ['17', '18', '19', '20', '21'];
  vistaHorarios: 'grupo' | 'profesor' = 'grupo';
  profesoresConHorarios: Array<{ nombre: string, clases: any[] }> = [];

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
      const { full_name,metadata: { division , turno } } = JSON.parse(usuarioData);
      this.usuarioNombre = full_name || 'Usuario';
      this.usuarioCarrera = `${division || ''} - ${turno || ''}`;
      
    } else {
      this.usuarioNombre = 'Usuario';
      this.usuarioCarrera = '';
    }
    this.cargarHorariosCreados();
    }

    async cargarHorariosCreados() {
      try {
        const res = await fetch('https://horarios-backend-58w8.onrender.com/scheduler/allschedules');
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
    this.loading = true;
    this.message = '';
    this.isSuccess = false;

    fetch('https://horarios-backend-58w8.onrender.com/scheduler/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    })
      .then(async res => {
        if (!res.ok) throw new Error('Error al generar los horarios');
        const response = await res.json();
        this.loading = false;
        this.isSuccess = true;
        this.message = '✅ Horarios generados correctamente.';
        console.log('Respuesta del backend:', response);
      })
      .catch(error => {
        this.loading = false;
        this.isSuccess = false;
        this.message = '❌ Ocurrió un error al generar los horarios.';
        console.error('Error:', error);
      });
  }


  

  exportarPDF(group: { nombregrupo: string; data: any[] }) {
    const doc = new jsPDF();
    // Título con el nombre del grupo
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text(`Horario del grupo: ${group.nombregrupo}`, 14, 16);
     doc.setFontSize(12);
    doc.text(`Horario generado por el sistema: Horari - UTEQ`, 110, 16);
   
    const head = [['Hora', ...this.diasSemana]];
    const body: any[] = [];

    for (const hora of this.horas) {
      const row: any[] = [hora + ':00'];
      for (const dia of this.diasSemana) {
        const clase = this.getClase(group.data, dia, hora);
        if (clase) {
          // Materia en negrita, profe normal, salón pequeño
          row.push([
            clase.subj ,
            clase.prof || '',
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
      theme: 'grid',
      styles: {
        cellPadding: 2,
        fontSize: 10,
        valign: 'middle',
        halign: 'center',
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: 0.4,
        fillColor: [255, 255, 255],
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        lineColor: [0, 0, 0],
        lineWidth: 0.6,
      },
      alternateRowStyles: {
        fillColor: [255, 255, 255],
      },
      margin: { top: 26 },
    
    });
   
    doc.save(`horario_${group.nombregrupo}.pdf`);
  }

  
  // ...mantener el resto del código igual...

    exportarPDFProfesor(prof: { nombre: string, clases: any[] }) {
      const doc = new jsPDF();
      // Título con el nombre del profesor
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text(`Horario del profesor: ${prof.nombre}`, 14, 16);
          doc.setFontSize(12);
    doc.text(`Horario generado por el sistema: Horari - UTEQ`, 110, 16);
      const head = [['Hora', ...this.diasSemana]];
      const body: any[] = [];
      for (const hora of this.horas) {
        const row: any[] = [hora + ':00'];
        for (const dia of this.diasSemana) {
          const clase = this.getClaseProfesor(prof.clases, dia, hora);
          if (clase) {
            row.push([
              clase.subj ,
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
        theme: 'grid',
        styles: {
          cellPadding: 2,
          fontSize: 10,
          valign: 'middle',
          halign: 'center',
          textColor: [0, 0, 0],
          lineColor: [0, 0, 0],
          lineWidth: 0.4,
          fillColor: [255, 255, 255],
        },
        headStyles: {
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          fontStyle: 'bold',
          lineColor: [0, 0, 0],
          lineWidth: 0.6,
        },
        alternateRowStyles: {
          fillColor: [255, 255, 255],
        },
        margin: { top: 26 },
       
      });
      doc.save(`horario_profesor_${prof.nombre}.pdf`);
    }
}
