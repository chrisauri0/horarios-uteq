import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HorariosComponent } from "../horarios/horarios";



@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, HorariosComponent, ],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class DashboardComponent {
  usuarioNombre: string = '';
  usuarioCarrera: string = '';
  sidebarCollapsed = false;

  ngOnInit() {
    const usuarioData = localStorage.getItem('usuarioData');
    if (usuarioData) {
      const { nombre, carrera } = JSON.parse(usuarioData);
      this.usuarioNombre = nombre;
      this.usuarioCarrera = carrera;
    } else {
      this.usuarioNombre = 'Director de la división de Tecnologías de la Información';
      this.usuarioCarrera = 'N/A';
    }
  }
}