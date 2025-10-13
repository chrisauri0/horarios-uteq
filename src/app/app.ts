import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';


@Component({
  selector: 'app-root',
  imports: [RouterOutlet,CommonModule,RouterLink],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('horarios-uteq');

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
