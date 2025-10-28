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
  materias: string[];
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

  constructor() {
    this.cargarProfesores();
  }

  private lastProfesoresJson: string = '';

  async cargarProfesores() {
    // Intentar cargar desde localStorage primero
    const cache = localStorage.getItem('profesoresCache');
    if (cache) {
      try {
        const cacheData = JSON.parse(cache);
        this.profesores = Array.isArray(cacheData) ? cacheData : [];
        this.lastProfesoresJson = cache;
      } catch {}
    }

    try {
      const res = await fetch('/api/profesores');
      if (!res.ok) throw new Error('Error al obtener profesores');
      const data = await res.json();
      const newJson = JSON.stringify(data);
      if (newJson === this.lastProfesoresJson) {
        // No hay cambios, no actualiza la lista
        return;
      }
      this.profesores = Array.isArray(data) ? data : [];
      this.lastProfesoresJson = newJson;
      localStorage.setItem('profesoresCache', newJson);
    } catch (err) {
      alert('No se pudo cargar la lista de profesores: ' + err);
    }
  }

  async agregarProfesor() {
    if (!this.nuevoProfesor.nombre.trim() || !this.nuevoProfesor.correo.trim()) return;

    // Separar nombre y apellidos
    const nombreCompleto = this.nuevoProfesor.nombre.trim().split(' ');
    const nombre = nombreCompleto[0];
    const apellidos = nombreCompleto.slice(1).join(' ');

    // Construir el body para el endpoint
    const body = {
      nombre,
      apellidos,
      email: this.nuevoProfesor.correo,
      can_be_tutor: !!this.nuevoProfesor.tutorGrupo,
      materias: this.nuevoProfesor.materias,
      metadata: {
        tutorGrupo: this.nuevoProfesor.tutorGrupo || null
      }
    };

    // Verificar si ya existe un profesor con los mismos datos
    const existe = this.profesores.some(p =>
      p.nombre === this.nuevoProfesor.nombre &&
      p.correo === this.nuevoProfesor.correo &&
      (p.tutorGrupo || '') === (this.nuevoProfesor.tutorGrupo || '') &&
      JSON.stringify(p.materias) === JSON.stringify(this.nuevoProfesor.materias)
    );
    if (existe) {
      alert('No hay cambios en los datos del profesor. No se enviará la petición.');
      return;
    }

    try {
      const res = await fetch('http://localhost:3000/profesores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error('Error al crear el profesor');
      const data = await res.json();
      this.profesores.push({ ...this.nuevoProfesor });
      this.nuevoProfesor = { id: 0, nombre: '', correo: '', materias: [] };
    } catch (err) {
      alert('No se pudo crear el profesor: ' + err);
    }
  }

  async guardarEdicion() {
    if (!this.nuevoProfesor.nombre.trim() || !this.nuevoProfesor.correo.trim()) return;
    if (!this.editandoId) return;

    // Separar nombre y apellidos
    const nombreCompleto = this.nuevoProfesor.nombre.trim().split(' ');
    const nombre = nombreCompleto[0];
    const apellidos = nombreCompleto.slice(1).join(' ');

    const body: any = {
      nombre,
      apellidos,
      email: this.nuevoProfesor.correo,
      can_be_tutor: !!this.nuevoProfesor.tutorGrupo,
      materias: this.nuevoProfesor.materias,
      metadata: {
        tutorGrupo: this.nuevoProfesor.tutorGrupo || null
      }
    };

    try {
      const res = await fetch(`/api/profesores/${this.editandoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error('Error al actualizar el profesor');
      const data = await res.json();
      this.profesores = this.profesores.map(p => p.id === this.editandoId ? { ...this.nuevoProfesor } : p);
      this.nuevoProfesor = { id: 0, nombre: '', correo: '', materias: [] };
      this.editandoId = null;
    } catch (err) {
      alert('No se pudo actualizar el profesor: ' + err);
    }
  }

  async eliminarProfesor(id: number) {
    try {
      const res = await fetch(`/api/profesores/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Error al eliminar el profesor');
      this.profesores = this.profesores.filter(p => p.id !== id);
    } catch (err) {
      alert('No se pudo eliminar el profesor: ' + err);
    }
  }

  editarProfesor(profesor: ProfesorData) {
    this.editandoId = profesor.id;
    this.nuevoProfesor = { ...profesor };
  }

  cancelarEdicion() {
    this.nuevoProfesor = { id: 0, nombre: '', correo: '', materias: [] };
    this.editandoId = null;
  }
}
