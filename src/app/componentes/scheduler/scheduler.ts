import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
 
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VerHorarios } from './ver-horarios/ver-horarios';


@Component({
  selector: 'app-scheduler',
  imports: [CommonModule, ],
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
  getClase(data: any[], dia: string, hora: string): any {
    // Busca la clase cuyo campo start coincide con el día y la hora
    return data.find(clase => {
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
        const res = await fetch('http://localhost:3000/scheduler/allschedules');
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
        } else {
          this.groupedSchedules = [];
        }
      } catch (err) {
        alert('No se pudo cargar la lista de horarios creados: ' + err);
      }
    }

  generateSchedule() {
    this.loading = true;
    this.message = '';
    this.isSuccess = false;

    fetch('http://localhost:3000/scheduler/generate', {
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
    const head = [['Hora', ...this.diasSemana]];
    const body: any[] = [];
    for (const hora of this.horas) {
      const row: any[] = [hora + ':00'];
      for (const dia of this.diasSemana) {
        const clase = this.getClase(group.data, dia, hora);
        if (clase) {
          row.push(`${clase.subj || ''}\n${clase.prof || ''}\n${clase.room || ''}`);
        } else {
          row.push('');
        }
      }
      body.push(row);
    }
    autoTable(doc, {
      head,
      body,
      styles: {
        cellPadding: 2,
        fontSize: 9,
        valign: 'middle',
        halign: 'center',
      },
      headStyles: {
        fillColor: [14, 23, 42],
        textColor: [56, 189, 248],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [30, 41, 59],
      },
      margin: { top: 20 },
    });
    doc.save(`horario_${group.nombregrupo}.pdf`);
  }
}
