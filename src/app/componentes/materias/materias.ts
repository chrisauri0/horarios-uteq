
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface Materia {
  id: string;
  nombre: string;
  grado?: number;
  carrera?: string;
  horas_semana: number;
  data?: object;
  salones?:object
}

@Component({
  selector: 'app-materias',
  imports: [CommonModule, FormsModule],
  templateUrl: './materias.html',
  styleUrl: './materias.scss'
})
export class Materias {
  materias: Materia[] = [];
  nuevaMateria: Materia = { id: '', nombre: '', grado: 1, carrera: '', horas_semana: 1, data: {}, salones: {} };
  editandoId: string | null = null;
  salones: object[] = [];
  carreras: object[] = [];

  ngOnInit() {
    this.cargarMaterias();
    this.cargarCarreras();
    this.cargarSalones();
    console.log('Salones materias:', this.materias);
  }

  async cargarSalones() {
    try {
      const res = await fetch('https://horarios-backend-58w8.onrender.com/salones');
      if (!res.ok) throw new Error('Error al obtener salones');
      const data = await res.json();
      this.salones = Array.isArray(data) ? data.map((s: any) => s.nombre) : [];
    } catch (err) {
      alert('No se pudo cargar la lista de salones: ' + err);
    }
  }

  async cargarCarreras() {
    try {
      const res = await fetch('https://horarios-backend-58w8.onrender.com/carreras');
      if (!res.ok) throw new Error('Error al obtener carreras');
      const data = await res.json();
      this.carreras = Array.isArray(data) ? data.map((c: any) => c.nombre) : [];
    } catch (err) {
      alert('No se pudo cargar la lista de carreras: ' + err);
    }
  }

  async cargarMaterias() {
    const localKey = 'materias-caches';
    const localHashKey = 'materias-cache-hash';
    // Intenta cargar desde localStorage
    const cache = localStorage.getItem(localKey);
    const cacheHash = localStorage.getItem(localHashKey);
    let materiasLocal: Materia[] = [];
    if (cache) {
      try {
        materiasLocal = JSON.parse(cache);
        this.materias = materiasLocal;
        console.log('Cargado desde cache localStorage');
      } catch {}
    }

    try {
      
      const resList = await fetch('https://horarios-backend-58w8.onrender.com/materias');
      if (!resList.ok) throw new Error('Error al obtener materias');
      const data = await resList.json();
      this.materias = Array.isArray(data) ? data.map((m: any) => ({
        id: m.id,
        nombre: m.nombre,
        grado: m.grado,
        carrera: m.carrera,
        horas_semana: m.horas_semana,
        data: m.data || {},
        salones: m.salones || {}
      })) : [];
      localStorage.setItem(localKey, JSON.stringify(this.materias));
    } catch (err) {
      alert('No se pudo cargar la lista de materias: ' + err);
    }
  }

  async agregarMateria() {
    if (!this.nuevaMateria.nombre.trim()) return;
    const body = {
      nombre: this.nuevaMateria.nombre,
      grado: this.nuevaMateria.grado || 1,
      carrera: this.nuevaMateria.carrera || '',
      horas_semana: this.nuevaMateria.horas_semana || 1,
      data: this.nuevaMateria.data || {},
      salones: this.nuevaMateria.salones || {}
    };
    try {
      const res = await fetch('https://horarios-backend-58w8.onrender.com/materias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error('Error al crear la materia');
      const data = await res.json();
      this.materias.push({
        id: data.id || Date.now().toString(),
        nombre: data.nombre,
        grado: data.grado,
        carrera: data.carrera,
        horas_semana: data.horas_semana,
    
        salones: data.salones || {}
      });
      this.nuevaMateria = { id: '', nombre: '', grado: 1, carrera: '', horas_semana: 1, data: {}, salones: {} };
    } catch (err) {
      alert('No se pudo crear la materia: ' + err);
    }
  }

  async guardarEdicion() {
    if (!this.nuevaMateria.nombre.trim() || !this.editandoId) return;
    const body: any = {
      nombre: this.nuevaMateria.nombre,
      grado: this.nuevaMateria.grado || 1,
      carrera: this.nuevaMateria.carrera || '',
      data: this.nuevaMateria.data || {},
      horas_semana: this.nuevaMateria.horas_semana || 1,
      salones: this.nuevaMateria.salones || {}
    };
    try {
      const res = await fetch(`https://horarios-backend-58w8.onrender.com/materias/${this.editandoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error('Error al editar la materia');
      const data = await res.json();
      this.materias = this.materias.map(m => m.id === this.editandoId ? {
        id: this.editandoId!,
        nombre: body.nombre,
        grado: body.grado,
        carrera: body.carrera,
        horas_semana: body.horas_semana,
        data: body.data
      } : m);
      this.nuevaMateria = { id: '', nombre: '', grado: 1, carrera: '', horas_semana: 1, data: {} };
      this.editandoId = null;
    } catch (err) {
      alert('No se pudo editar la materia: ' + err);
    }
  }

  async eliminarMateria(id: string) {
    try {
      const res = await fetch(`https://horarios-backend-58w8.onrender.com/materias/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Error al eliminar la materia');
      this.materias = this.materias.filter(m => m.id !== id);
    } catch (err) {
      alert('No se pudo eliminar la materia: ' + err);
    }
  }

  editarMateria(materia: Materia) {
    this.editandoId = materia.id;
    this.nuevaMateria = { ...materia };
  }

  cancelarEdicion() {
    this.nuevaMateria = { id: '', nombre: '', grado: 1, carrera: '', horas_semana: 1, data: {} };
    this.editandoId = null;
  }
}