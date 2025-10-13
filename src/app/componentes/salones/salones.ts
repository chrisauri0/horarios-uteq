import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
export interface salonesData {
  id: number;
  nombre: string;
edificio: string;

}

@Component({
  selector: 'app-salones',
  imports: [CommonModule, FormsModule],
  templateUrl: './salones.html',
  styleUrls: ['./salones.scss']
})
export class SalonesComponent {
  usuarioNombre: string = '';
  usuarioCarrera: string = '';
  sidebarCollapsed = false;

  salones: salonesData[] = [];
  nuevoSalon: salonesData = { id: 0, nombre: '', edificio: '' };
  editandoId: number|null = null;

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

  agregarSalon() {
    if (!this.nuevoSalon.nombre.trim() || !this.nuevoSalon.edificio.trim()) return;
    this.nuevoSalon.id = Date.now();
    this.salones.push({ ...this.nuevoSalon });
    this.nuevoSalon = { id: 0, nombre: '', edificio: '' };
  }

  eliminarSalon(id: number) {
    this.salones = this.salones.filter(s => s.id !== id);
  }

  editarSalon(salon: salonesData) {
    this.editandoId = salon.id;
    this.nuevoSalon = { ...salon };
  }

  guardarEdicion() {
    if (!this.nuevoSalon.nombre.trim() || !this.nuevoSalon.edificio.trim()) return;
    this.salones = this.salones.map(s => s.id === this.editandoId ? { ...this.nuevoSalon } : s);
    this.nuevoSalon = { id: 0, nombre: '', edificio: '' };
    this.editandoId = null;
  }

  cancelarEdicion() {
    this.nuevoSalon = { id: 0, nombre: '', edificio: '' };
    this.editandoId = null;
  }
}

