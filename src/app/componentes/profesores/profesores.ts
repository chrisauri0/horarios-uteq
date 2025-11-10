import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { Materia } from '../materias/materias';
// ...

export interface ProfesorData {
  id: string;
  nombre: string;
  apellidos: string;
  email: string;
  can_be_tutor?: boolean;
  materias?: string[];
  metadata?: object;
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
 materias: Materia[] = [];
 materiasOpciones: string[] = [];
  nuevoProfesor: ProfesorData = {
    id: '',
    nombre: '',
    apellidos: '',
    email: '',
    can_be_tutor: false,
    materias: [],
    metadata: {}
  };
  editandoId: string | null = null;

  ngOnInit() {
    this.cargarProfesores();
    this.cargarMaterias();
  }


  async cargarMaterias() {
    const localKey = 'materias-cache';
    const localHashKey = 'materias-cache-hash';
    // Intenta cargar desde localStorage
    const cache = localStorage.getItem(localKey);
    const cacheHash = localStorage.getItem(localHashKey);
    let materiasLocal: Materia[] = [];
    if (cache) {
      try {
  materiasLocal = JSON.parse(cache);
  this.materias = materiasLocal;
  this.materiasOpciones = materiasLocal.map(m => m.nombre);
  console.log('Cargado desde cache localStorage');
      } catch {}
    }

    // Siempre consulta el backend para obtener el hash actual
    try {
      const res = await fetch('http://localhost:3000/materias/hash');
      if (!res.ok) throw new Error('Error al obtener hash de materias');
      const { hash } = await res.json();
      if (hash === cacheHash && materiasLocal.length > 0) {
        // No hay cambios, no hace falta pedir la lista
        return;
      }
      // Si el hash cambió, pide la lista actualizada
      const resList = await fetch('http://localhost:3000/materias');
      if (!resList.ok) throw new Error('Error al obtener materias');
      const data = await resList.json();
      this.materias = Array.isArray(data) ? data.map((m: any) => ({
        id: m.id,
        nombre: m.nombre,
        grado: m.grado,
        carrera: m.carrera,
        horas_semana: m.horas_semana,
        data: m.data || {}
      })) : [];
      this.materiasOpciones = this.materias.map(m => m.nombre);
      localStorage.setItem(localKey, JSON.stringify(this.materias));
      localStorage.setItem(localHashKey, hash);
    } catch (err) {
      alert('No se pudo cargar la lista de materias: ' + err);
    }
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
      const res = await fetch('http://localhost:3000/profesores');
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
    
    const nombre = this.nuevoProfesor.nombre.trim();
    const apellidos = this.nuevoProfesor.apellidos.trim();

    // Construir el body para el endpoint
    const body = {
      nombre,
      apellidos,
      email: this.nuevoProfesor.email,
      can_be_tutor: !!this.nuevoProfesor.can_be_tutor,
      materias: this.nuevoProfesor.materias,
      metadata: this.nuevoProfesor.metadata
    };

    // Verificar si ya existe un profesor con los mismos datos
    const existe = this.profesores.some(p =>
      p.nombre === this.nuevoProfesor.nombre &&
      p.apellidos === this.nuevoProfesor.apellidos &&
      p.email === this.nuevoProfesor.email &&
      p.can_be_tutor === this.nuevoProfesor.can_be_tutor &&
      JSON.stringify(p.materias) === JSON.stringify(this.nuevoProfesor.materias) &&
      JSON.stringify(p.metadata) === JSON.stringify(this.nuevoProfesor.metadata)
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
      this.nuevoProfesor = { id: '', nombre: '', apellidos: '', email: '', can_be_tutor: false, materias: [], metadata: {} };
    } catch (err) {
      alert('No se pudo crear el profesor: ' + err);
    }
  }

  async guardarEdicion() {
  if (!this.nuevoProfesor.nombre.trim() || !this.nuevoProfesor.email.trim()) return;
    if (!this.editandoId) return;

    // Separar nombre y apellidos
    const nombreCompleto = this.nuevoProfesor.nombre.trim().split(' ');
    const nombre = nombreCompleto[0];
    const apellidos = nombreCompleto.slice(1).join(' ');

    const body: any = {
      nombre,
      apellidos,
      email: this.nuevoProfesor.email,
      can_be_tutor: !!this.nuevoProfesor.can_be_tutor,
      materias: this.nuevoProfesor.materias,
      metadata: this.nuevoProfesor.metadata
    };

    try {
      const res = await fetch(`http://localhost:3000/profesores/${this.editandoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error('Error al actualizar el profesor');
      const data = await res.json();
      this.profesores = this.profesores.map(p => p.id === this.editandoId ? { ...this.nuevoProfesor } : p);
      this.nuevoProfesor = { id: '', nombre: '', apellidos: '', email: '', can_be_tutor: false, materias: [], metadata: {} };
      this.editandoId = null;
    } catch (err) {
      alert('No se pudo actualizar el profesor: ' + err);
    }
  }

  async eliminarProfesor(id: string) {
    try {
      const res = await fetch(`http://localhost:3000/profesores/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Error al eliminar el profesor');
      this.profesores = this.profesores.filter(p => p.id !== id);
    } catch (err) {
      alert('No se pudo eliminar el profesor: ' + err);
      console.log(id);
    }
  }

  editarProfesor(profesor: ProfesorData) {
    this.editandoId = profesor.id;
    this.nuevoProfesor = { ...profesor };
  }

  cancelarEdicion() {
  this.nuevoProfesor = { id: '', nombre: '', apellidos: '', email: '', can_be_tutor: false, materias: [], metadata: {} };
    this.editandoId = null;
  }
}
