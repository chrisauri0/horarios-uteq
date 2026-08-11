import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface Materia {
  id: string;
  nombre: string;
  grado?: number;
  carrera?: string;
  horas_semana: number;
  data?: object;
  salones?: string[];
}

@Component({
  selector: 'app-materias',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './materias.html',
  styleUrl: './materias.scss'
})
export class Materias {
  private apiUrl = `${environment.apiUrl}/materias`;
  private salonesUrl = `${environment.apiUrl}/salones`;
  private carrerasUrl = `${environment.apiUrl}/carreras`;

  materias: Materia[] = [];
  nuevaMateria: Materia = { id: '', nombre: '', grado: NaN, carrera: '', horas_semana: NaN, data: {}, salones: [] };
  editandoId: string | null = null;
  salones: string[] = [];
  carreras: string[] = [];
  modalAbierto = false;

  filtros = {
    nombre: '',
    carrera: '',
    grado: '',
    salon: ''
  };

  notificacion: { visible: boolean; mensaje: string; tipo: 'info' | 'error' | 'success' } = {
    visible: false,
    mensaje: '',
    tipo: 'info'
  };

  confirmacion: { visible: boolean; mensaje: string; idPendiente: string | null } = {
    visible: false,
    mensaje: '',
    idPendiente: null
  };

  constructor(private http: HttpClient) {}

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
  }

  private mostrarNotificacion(mensaje: string, tipo: 'info' | 'error' | 'success' = 'info') {
    this.notificacion = { visible: true, mensaje, tipo };
  }

  cerrarNotificacion() {
    this.notificacion.visible = false;
  }

  cargarSalones() {
    this.http.get<any[]>(this.salonesUrl).subscribe({
      next: (data) => {
        this.salones = Array.isArray(data) ? data.map((s: any) => s.nombre) : [];
      },
      error: (err) => {
        this.mostrarNotificacion('No se pudo cargar la lista de salones: ' + err.message, 'error');
      }
    });
  }

  cargarCarreras() {
    this.http.get<any[]>(this.carrerasUrl).subscribe({
      next: (data) => {
        this.carreras = Array.isArray(data) ? data.map((c: any) => c.nombre) : [];
      },
      error: (err) => {
        this.mostrarNotificacion('No se pudo cargar la lista de carreras: ' + err.message, 'error');
      }
    });
  }

  cargarMaterias() {
    this.http.get<any[]>(this.apiUrl).subscribe({
      next: (data) => {
        this.materias = Array.isArray(data) ? data.map((m: any) => ({
          id: m.id,
          nombre: m.nombre,
          grado: m.grado,
          carrera: m.carrera,
          horas_semana: m.horas_semana,
          data: m.data || {},
          salones: this.normalizarSalones(m.salones)
        })) : [];
      },
      error: (err) => {
        this.mostrarNotificacion('No se pudo cargar la lista de materias: ' + err.message, 'error');
      }
    });
  }

  agregarMateria() {
    if (!this.nuevaMateria.nombre.trim()) {
      this.mostrarNotificacion('El nombre de la materia es obligatorio.', 'error');
      return;
    }
    if (!this.validarSalonesSeleccionados()) return;

    const body = {
      nombre: this.nuevaMateria.nombre,
      grado: this.nuevaMateria.grado || 1,
      carrera: this.nuevaMateria.carrera || '',
      horas_semana: this.nuevaMateria.horas_semana || 1,
      data: this.nuevaMateria.data || {},
      salones: this.normalizarSalones(this.nuevaMateria.salones)
    };

    this.http.post<any>(this.apiUrl, body).subscribe({
      next: (data) => {
        if (data.error) {
          this.mostrarNotificacion(data.error, 'error');
          return;
        }
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
        this.mostrarNotificacion('Materia agregada correctamente.', 'success');
      },
      error: (err) => {
        this.mostrarNotificacion('No se pudo crear la materia: ' + err.message, 'error');
      }
    });
  }

  guardarEdicion() {
    if (!this.nuevaMateria.nombre.trim() || !this.editandoId) {
      this.mostrarNotificacion('El nombre de la materia es obligatorio.', 'error');
      return;
    }
    if (!this.validarSalonesSeleccionados()) return;

    const body: any = {
      nombre: this.nuevaMateria.nombre,
      grado: this.nuevaMateria.grado || 1,
      carrera: this.nuevaMateria.carrera || '',
      data: this.nuevaMateria.data || {},
      horas_semana: this.nuevaMateria.horas_semana || 1,
      salones: this.normalizarSalones(this.nuevaMateria.salones)
    };

    this.http.patch<any>(`${this.apiUrl}/${this.editandoId}`, body).subscribe({
      next: () => {
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
        this.mostrarNotificacion('Cambios guardados correctamente.', 'success');
      },
      error: (err) => {
        this.mostrarNotificacion('No se pudo editar la materia: ' + err.message, 'error');
      }
    });
  }

  eliminarMateria(id: string) {
    this.confirmacion = {
      visible: true,
      mensaje: '¿Estás seguro de eliminar esta materia?',
      idPendiente: id
    };
  }

  confirmarEliminacion() {
    const id = this.confirmacion.idPendiente;
    this.confirmacion = { visible: false, mensaje: '', idPendiente: null };
    if (!id) return;

    this.http.delete(`${this.apiUrl}/${id}`).subscribe({
      next: () => {
        this.materias = this.materias.filter(m => m.id !== id);
        this.mostrarNotificacion('Materia eliminada correctamente.', 'success');
      },
      error: (err) => {
        this.mostrarNotificacion('No se pudo eliminar la materia: ' + err.message, 'error');
      }
    });
  }

  cancelarEliminacion() {
    this.confirmacion = { visible: false, mensaje: '', idPendiente: null };
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
      this.mostrarNotificacion('Selecciona al menos un salón para la materia.', 'error');
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