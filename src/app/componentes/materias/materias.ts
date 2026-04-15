
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

export interface Materia {
  id: string;
  nombre: string;
  grado?: number;
  carrera?: string;
  horas_semana: number;
  data?: object;
  salones?: string[]
}

@Component({
  selector: 'app-materias',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './materias.html',
  styleUrl: './materias.scss'
})
export class Materias {
  materias: Materia[] = [];
  nuevaMateria: Materia = { id: '', nombre: '', grado: NaN, carrera: '', horas_semana: NaN, data: {}, salones: [], };
  editandoId: string | null = null;
  salones: string[] = [];
  carreras: string[] = []
  modalAbierto = false;
  filtros = {
    nombre: '',
    carrera: '',
    grado: '',
    salon: ''
  };

  get materiasFiltradas(): Materia[] {
    const nombre = this.filtros.nombre.trim().toLowerCase();
    const carrera = this.filtros.carrera;
    const grado = this.filtros.grado;
    const salon = this.filtros.salon;

    return this.materias.filter((materia) => {
      const nombreMateria = (materia.nombre || '').toLowerCase();
      const carreraMateria = String(materia.carrera || '');
      const gradoMateria = String(materia.grado ?? '');
      const salonesMateria = this.normalizarSalones(materia.salones);

      const coincideNombre = !nombre || nombreMateria.includes(nombre);
      const coincideCarrera = !carrera || carreraMateria === carrera;
      const coincideGrado = !grado || gradoMateria === grado;
      const coincideSalon = !salon || salonesMateria.some((s) => s.toLowerCase() === salon.toLowerCase());

      return coincideNombre && coincideCarrera && coincideGrado && coincideSalon;
    });
  }

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
      } catch { }
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
        salones: this.normalizarSalones(m.salones)
      })) : [];
      localStorage.setItem(localKey, JSON.stringify(this.materias));
    } catch (err) {
      alert('No se pudo cargar la lista de materias: ' + err);
    }
  }

  async agregarMateria() {
    if (!this.nuevaMateria.nombre.trim()) return;
    if (!this.validarSalonesSeleccionados()) return;
    const body = {
      nombre: this.nuevaMateria.nombre,
      grado: this.nuevaMateria.grado || 1,
      carrera: this.nuevaMateria.carrera || '',
      horas_semana: this.nuevaMateria.horas_semana || 1,
      data: this.nuevaMateria.data || {},
      salones: this.normalizarSalones(this.nuevaMateria.salones)
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
        salones: this.normalizarSalones(data.salones)
      });
      this.nuevaMateria = { id: '', nombre: '', grado: 1, carrera: '', horas_semana: 1, data: {}, salones: [] };
      this.modalAbierto = false;
    } catch (err) {
      alert('No se pudo crear la materia: ' + err);
    }
  }

  async guardarEdicion() {
    if (!this.nuevaMateria.nombre.trim() || !this.editandoId) return;
    if (!this.validarSalonesSeleccionados()) return;
    const body: any = {
      nombre: this.nuevaMateria.nombre,
      grado: this.nuevaMateria.grado || 1,
      carrera: this.nuevaMateria.carrera || '',
      data: this.nuevaMateria.data || {},
      horas_semana: this.nuevaMateria.horas_semana || 1,
      salones: this.normalizarSalones(this.nuevaMateria.salones)
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
        data: body.data,
        salones: this.normalizarSalones(body.salones)
      } : m);
      this.nuevaMateria = { id: '', nombre: '', grado: 1, carrera: '', horas_semana: 1, data: {}, salones: [] };
      this.editandoId = null;
      this.modalAbierto = false;
    } catch (err) {
      alert('No se pudo editar la materia: ' + err);
    }
  }

  async eliminarMateria(id: string) {

    const confirmacion = confirm('¿Estás seguro de eliminar esta materia?');
    if (!confirmacion) return;

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
    this.nuevaMateria = { ...materia, salones: this.normalizarSalones(materia.salones) };
    this.modalAbierto = true;
  }

  cancelarEdicion() {
    this.nuevaMateria = { id: '', nombre: '', grado: 1, carrera: '', horas_semana: 1, data: {}, salones: [] };
    this.editandoId = null;
  }

  abrirModalNuevaMateria() {
    this.editandoId = null;
    this.nuevaMateria = { id: '', nombre: '', grado: 1, carrera: '', horas_semana: 1, data: {}, salones: [] };
    this.modalAbierto = true;
  }

  cerrarModal() {
    this.cancelarEdicion();
    this.modalAbierto = false;
  }

  limpiarFiltros() {
    this.filtros = {
      nombre: '',
      carrera: '',
      grado: '',
      salon: ''
    };
  }

  formatSalones(salones?: string[]): string {
    const lista = this.normalizarSalones(salones);
    return lista.length > 0 ? lista.join(', ') : '-';
  }

  getSalonesList(salones: unknown): string[] {
    return this.normalizarSalones(salones);
  }

  salonSeleccionado(salon: string): boolean {
    const seleccionados = this.normalizarSalones(this.nuevaMateria.salones);
    return seleccionados.includes(salon);
  }

  toggleSalon(salon: string, checked: boolean): void {
    const seleccionados = this.normalizarSalones(this.nuevaMateria.salones);

    if (checked && !seleccionados.includes(salon)) {
      this.nuevaMateria.salones = [...seleccionados, salon];
      return;
    }

    if (!checked) {
      this.nuevaMateria.salones = seleccionados.filter((s) => s !== salon);
    }
  }

  private validarSalonesSeleccionados(): boolean {
    const seleccionados = this.normalizarSalones(this.nuevaMateria.salones);
    if (seleccionados.length === 0) {
      alert('Selecciona al menos un salon para la materia.');
      return false;
    }

    this.nuevaMateria.salones = seleccionados;
    return true;
  }

  private normalizarSalones(salones: unknown): string[] {
    const limpiar = (lista: string[]) => Array.from(new Set(lista.map((s) => s.trim()).filter((s) => s.length > 0)));

    if (Array.isArray(salones)) {
      return limpiar(salones.map((s) => String(s)));
    }

    if (typeof salones === 'string' && salones.trim()) {
      return [salones.trim()];
    }

    if (salones && typeof salones === 'object') {
      const entries = Object.entries(salones as Record<string, unknown>);
      if (entries.length === 0) return [];

      const valoresString = entries
        .map(([, value]) => value)
        .filter((value) => typeof value === 'string')
        .map((value) => String(value));

      if (valoresString.length > 0) {
        return limpiar(valoresString);
      }

      const clavesBooleanas = entries
        .filter(([, value]) => value === true)
        .map(([key]) => key);

      if (clavesBooleanas.length > 0) {
        return limpiar(clavesBooleanas);
      }

      const claves = entries.map(([key]) => key);
      return limpiar(claves);
    }

    return [];
  }
}