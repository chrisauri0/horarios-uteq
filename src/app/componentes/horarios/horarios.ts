import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import datosPrueba from './datos-prueba.json';

@Component({
  selector: 'app-horarios',
  imports: [CommonModule],
  templateUrl: './horarios.html',
  styleUrls: ['./horarios.scss']
})
export class HorariosComponent {
  datos: any = datosPrueba;
}
