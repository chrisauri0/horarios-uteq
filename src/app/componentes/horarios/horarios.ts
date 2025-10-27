import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import resultado from './resultado.json';
import { OrderByStartPipe } from './orderPipe';

@Component({
  selector: 'app-horarios',
  imports: [CommonModule, OrderByStartPipe],
  templateUrl: './horarios.html',
  styleUrls: ['./horarios.scss']
})
export class HorariosComponent {
  resultado: any[] = resultado;
  grupos: { [key: string]: any[] } = {};

  constructor() {
    for (const item of this.resultado) {
      if (!this.grupos[item.group]) {
        this.grupos[item.group] = [];
      }
      this.grupos[item.group].push(item);
    }
  }

  formatStart(start: string): string {
    // Ejemplo: "Lun17" => "Lunes 17:00"
    const dias: { [key: string]: string } = {
      Lun: 'Lunes',
      Mar: 'Martes',
      Mie: 'Miércoles',
      Jue: 'Jueves',
      Vie: 'Viernes',
      Sab: 'Sábado'
    };
    const match = start.match(/^([A-Za-z]+)(\d{1,2})$/);
    if (match) {
      const dia = dias[match[1]] || match[1];
      const hora = match[2].padStart(2, '0') + ':00';
      return `${dia} ${hora}`;
    }
    return start;
  }

  diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
horas = [ '17:00', '18:00', '19:00', '20:00', '21:00' ];

getClase(clases: any[], dia: string, hora: string) {
  // Busca la clase que corresponde al día y hora
  return clases.find(c => this.formatStart(c.start).startsWith(dia) && this.formatStart(c.start).includes(hora));
}
}