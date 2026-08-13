import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Materia } from '../materias/materias';
import { environment } from '../../../environments/environment';

export interface ProfesorData {
  profesor_id: string;
  nombre: string;
  apellidos: string;
  email: string;
  can_be_tutor?: boolean;
  materias?: string[];
  disponibilidad?: BloqueHorario[];
  metadata?: any;
}

interface BloqueHorario {
  dias: string[];
  hora_inicio: string;
  hora_fin: string;
}

@Component({
  selector: 'app-profesores',
  standalone: true,
  imports: [CommonModule, FormsModule, NgSelectModule, RouterModule],
  templateUrl: './profesores.html',
  styleUrls: ['./profesores.scss']
})
export class ProfesoresComponent {
  private apiUrl = `${environment.apiUrl}/profesores`;
  private materiasUrl = `${environment.apiUrl}/materias`;

  profesores: ProfesorData[] = [];
  materias: Materia[] = [];
  materiasOpciones: string[] = [];
  busquedaProfesor = '';
  dias: string[] = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
  bloques: BloqueHorario[] = [this.crearBloqueVacio()];
  nuevoProfesor: ProfesorData = {
    profesor_id: '',
    nombre: '',
    apellidos: '',
    email: '',
    can_be_tutor: false,
    materias: [],
    disponibilidad: [],
  };
  editandoId: string | null = null;
  modalAbierto = false;

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

  get profesoresFiltrados(): ProfesorData[] {
    const query = this.busquedaProfesor.trim().toLowerCase();
    if (!query) {
      return this.profesores;
    }
    return this.profesores.filter((profesor) => {
      const materias = (profesor.materias || []).join(' ').toLowerCase();
      const texto = `${profesor.nombre} ${profesor.apellidos} ${profesor.email} ${materias}`.toLowerCase();
      return texto.includes(query);
    });
  }

  ngOnInit() {
    this.cargarProfesores();
    this.cargarMaterias();
  }

  private mostrarNotificacion(mensaje: string, tipo: 'info' | 'error' | 'success' = 'info') {
    this.notificacion = { visible: true, mensaje, tipo };
  }

  cerrarNotificacion() {
    this.notificacion.visible = false;
  }

  private crearBloqueVacio(): BloqueHorario {
    return {
      dias: [],
      hora_inicio: '',
      hora_fin: ''
    };
  }

  private resetBloques() {
    this.bloques = [this.crearBloqueVacio()];
  }

  private bloquesValidos(): BloqueHorario[] {
    return this.bloques
      .filter((bloque) => bloque.dias.length > 0 && bloque.hora_inicio && bloque.hora_fin)
      .map((bloque) => ({
        dias: [...bloque.dias],
        hora_inicio: bloque.hora_inicio,
        hora_fin: bloque.hora_fin
      }));
  }

  agregarBloque() {
    this.bloques.push(this.crearBloqueVacio());
  }

  eliminarBloque(index: number) {
    if (this.bloques.length === 1) {
      this.resetBloques();
      return;
    }
    this.bloques.splice(index, 1);
  }

  toggleDia(bloqueIndex: number, dia: string) {
    if (this.esDiaBloqueado(bloqueIndex, dia)) {
      return;
    }
    const dias = this.bloques[bloqueIndex].dias;
    if (dias.includes(dia)) {
      this.bloques[bloqueIndex].dias = dias.filter((d) => d !== dia);
      return;
    }
    dias.push(dia);
  }

  esDiaBloqueado(bloqueIndex: number, dia: string): boolean {
    return this.bloques.some((bloque, index) => index !== bloqueIndex && bloque.dias.includes(dia));
  }

  cargarMaterias() {
    this.http.get<any[]>(this.materiasUrl).subscribe({
      next: (data) => {
        this.materias = Array.isArray(data) ? data.map((m: any) => ({
          id: m.id,
          nombre: m.nombre,
          grado: m.grado,
          carrera: m.carrera,
          horas_semana: m.horas_semana,
          data: m.data || {}
        })) : [];
        this.materiasOpciones = this.materias.map(m => m.nombre);
      },
      error: (err) => {
        this.mostrarNotificacion('No se pudo cargar la lista de materias: ' + err.message, 'error');
      }
    });
  }

  cargarProfesores() {
    this.http.get<any[]>(this.apiUrl).subscribe({
      next: (data) => {
        this.profesores = Array.isArray(data) ? data : [];
      },
      error: (err) => {
        this.mostrarNotificacion('No se pudo cargar la lista de profesores: ' + err.message, 'error');
      }
    });
  }

  agregarProfesor() {
    const nombre = this.nuevoProfesor.nombre.trim();
    const apellidos = this.nuevoProfesor.apellidos.trim();

    if (!nombre || !apellidos || !this.nuevoProfesor.email.trim()) {
      this.mostrarNotificacion('Completa nombre, apellidos y email antes de guardar.', 'error');
      return;
    }

    const metadata = {
      ...(this.nuevoProfesor.metadata || {}),
      disponibilidad: this.bloquesValidos()
    };

    const body = {
      nombre,
      apellidos,
      email: this.nuevoProfesor.email,
      can_be_tutor: !!this.nuevoProfesor.can_be_tutor,
      materias: this.nuevoProfesor.materias,
      disponibilidad: this.bloquesValidos(),
      metadata
    };

    this.http.post<any>(this.apiUrl, body).subscribe({
      next: (data) => {
        if (data.error) {
          this.mostrarNotificacion(data.error, 'error');
          return;
        }
        this.profesores.push({ ...this.nuevoProfesor, metadata, profesor_id: data.profesor_id });
        this.nuevoProfesor = { profesor_id: '', nombre: '', apellidos: '', email: '', can_be_tutor: false, materias: [], metadata: {} };
        this.resetBloques();
        this.modalAbierto = false;
        this.mostrarNotificacion('Profesor agregado correctamente.', 'success');
      },
      error: (err) => {
        this.mostrarNotificacion('No se pudo crear el profesor: ' + err.message, 'error');
      }
    });
  }

  guardarEdicion() {
    if (!this.nuevoProfesor.nombre.trim() || !this.nuevoProfesor.email.trim()) {
      this.mostrarNotificacion('Completa nombre y email antes de guardar.', 'error');
      return;
    }
    if (!this.editandoId) return;

    const disponibilidad = this.bloquesValidos();
    const metadata = {
      ...(this.nuevoProfesor.metadata || {})
    };

    const body: any = {
      nombre: this.nuevoProfesor.nombre.trim(),
      apellidos: this.nuevoProfesor.apellidos.trim(),
      email: this.nuevoProfesor.email,
      can_be_tutor: !!this.nuevoProfesor.can_be_tutor,
      materias: this.nuevoProfesor.materias,
      disponibilidad,
      metadata
    };

    this.http.patch<any>(`${this.apiUrl}/${this.editandoId}`, body).subscribe({
      next: () => {
        this.profesores = this.profesores.map(p =>
          p.profesor_id === this.editandoId ? { ...p, ...body, profesor_id: p.profesor_id } : p
        );
        this.nuevoProfesor = { profesor_id: '', nombre: '', apellidos: '', email: '', can_be_tutor: false, materias: [], metadata: {}, disponibilidad: [] };
        this.resetBloques();
        this.editandoId = null;
        this.modalAbierto = false;
        this.cargarProfesores();
        this.mostrarNotificacion('Cambios guardados correctamente.', 'success');
      },
      error: (err) => {
        this.mostrarNotificacion('No se pudo actualizar el profesor: ' + err.message, 'error');
      }
    });
  }

  eliminarProfesor(profesor_id: string) {
    this.confirmacion = {
      visible: true,
      mensaje: '¿Estás seguro de que deseas eliminar este profesor?',
      idPendiente: profesor_id
    };
  }

  confirmarEliminacion() {
    const id = this.confirmacion.idPendiente;
    this.confirmacion = { visible: false, mensaje: '', idPendiente: null };
    if (!id) return;

    this.http.delete(`${this.apiUrl}/${id}`).subscribe({
      next: () => {
        this.profesores = this.profesores.filter(p => p.profesor_id !== id);
        this.mostrarNotificacion('Profesor eliminado correctamente.', 'success');
      },
      error: (err) => {
        this.mostrarNotificacion('No se pudo eliminar el profesor: ' + err.message, 'error');
      }
    });
  }

  cancelarEliminacion() {
    this.confirmacion = { visible: false, mensaje: '', idPendiente: null };
  }

  editarProfesor(profesor: any) {
    this.editandoId = profesor.profesor_id;
    this.nuevoProfesor = { ...profesor };
    const disponibilidad = (profesor?.metadata?.disponibilidad || profesor?.disponibilidad || []) as BloqueHorario[];
    this.bloques = disponibilidad.length > 0
      ? disponibilidad.map((bloque) => ({
          dias: Array.isArray(bloque.dias) ? [...bloque.dias] : [],
          hora_inicio: bloque.hora_inicio || '',
          hora_fin: bloque.hora_fin || ''
        }))
      : [this.crearBloqueVacio()];
    this.modalAbierto = true;
  }

  cancelarEdicion() {
    this.nuevoProfesor = { profesor_id: '', nombre: '', apellidos: '', email: '', can_be_tutor: false, materias: [], metadata: {} };
    this.resetBloques();
    this.editandoId = null;
  }

  abrirModalNuevoProfesor() {
    this.editandoId = null;
    this.nuevoProfesor = { profesor_id: '', nombre: '', apellidos: '', email: '', can_be_tutor: false, materias: [], metadata: {} };
    this.modalAbierto = true;
  }

  cerrarModal() {
    this.cancelarEdicion();
    this.modalAbierto = false;
  }
}