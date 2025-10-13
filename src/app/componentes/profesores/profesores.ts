import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
// ...

export interface ProfesorData {
  id: number;
  nombre: string;
  correo: string;
  tutorGrupo?: string;
  materias?: string[];
}

@Component({
  selector: 'app-profesores',
  standalone: true,
  imports: [CommonModule, FormsModule, NgSelectModule],
  templateUrl: './profesores.html',
  styleUrls: ['./profesores.scss']
})
export class ProfesoresComponent {
  profesores: ProfesorData[] = [];
 grupos: string[] = ['Grupo 1', 'Grupo 2', 'Grupo 3'];
materias: string[] = ['Matemáticas', 'Programación', 'Bases de Datos', 'Redes'];

nuevoProfesor: ProfesorData = {
  id: 0,
  nombre: '',
  correo: '',
  tutorGrupo: '',
  materias: []
};
  editandoId: number | null = null;

  
  

  agregarProfesor() {
    if (!this.nuevoProfesor.nombre.trim() || !this.nuevoProfesor.correo.trim()) return;
    this.nuevoProfesor.id = Date.now();
    this.profesores.push({ ...this.nuevoProfesor });
    this.nuevoProfesor = { id: 0, nombre: '', correo: '' };
  }

  eliminarProfesor(id: number) {
    this.profesores = this.profesores.filter(p => p.id !== id);
  }

  editarProfesor(profesor: ProfesorData) {
    this.editandoId = profesor.id;
    this.nuevoProfesor = { ...profesor };
  }

  guardarEdicion() {
    if (!this.nuevoProfesor.nombre.trim() || !this.nuevoProfesor.correo.trim()) return;
    this.profesores = this.profesores.map(p => p.id === this.editandoId ? { ...this.nuevoProfesor } : p);
    this.nuevoProfesor = { id: 0, nombre: '', correo: '' };
    this.editandoId = null;
  }

  cancelarEdicion() {
    this.nuevoProfesor = { id: 0, nombre: '', correo: '' };
    this.editandoId = null;
  }
}
