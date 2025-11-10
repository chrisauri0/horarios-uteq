import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { Router, RouterLink, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, RouterLink],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('horarios-uteq');

  usuarioNombre: string = '';
  usuarioCarrera: string = '';
  sidebarCollapsed = false;
  esLogin = false; // 👈 nueva propiedad para ocultar el layout

  constructor(private router: Router) {
    // 👇 Detecta si estás en la ruta /login
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.esLogin = event.url.includes('/login');
      });
  }

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
