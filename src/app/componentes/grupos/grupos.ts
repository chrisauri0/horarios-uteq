import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface Grupo {
  id: string;
  nombre: string;
  grado: number;
  carrera: string;
  data?: object;
}

interface Carrera {
  id: string;
  nombre: string;
  grado: number;
}

interface Tutor {
  id: string;
  nombre: string;
  apellidos: string;
  fullName: string;
}

@Component({
  selector: 'app-grupos',
  imports: [CommonModule, FormsModule, NgSelectModule, RouterModule],
  templateUrl: './grupos.html',
  styleUrl: './grupos.scss'
})
export class GruposComponent {
  private apiUrl = `${environment.apiUrl}/grupos`;
  private carrerasUrl = `${environment.apiUrl}/carreras`;
  private tutoresUrl = `${environment.apiUrl}/profesores/tutores`;

  grupos: Grupo[] = [];
  carreras: Carrera[] = [];
  grupoEditando: Grupo | null = null;
  nuevoGrupo: Grupo = { id: '', nombre: '', grado: 1, carrera: '', data: {} };
  tutores: Tutor[] = [];
  tutoresOpciones: string[] = [];

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

  ngOnInit() {
    this.cargarGrupos();
    this.cargarCarreras();
  }

  private mostrarNotificacion(mensaje: string, tipo: 'info' | 'error' | 'success' = 'info') {
    this.notificacion = { visible: true, mensaje, tipo };
  }

  cerrarNotificacion() {
    this.notificacion.visible = false;
  }

  cargarCarreras() {
    this.http.get<any[]>(this.carrerasUrl).subscribe({
      next: (data) => {
        this.carreras = Array.isArray(data) ? data.map((c: any) => ({
          id: c.id,
          nombre: c.nombre,
          grado: c.grado
        })) : [];
      },
      error: (err) => {
        this.mostrarNotificacion('No se pudo cargar la lista de carreras: ' + err.message, 'error');
      }
    });
  }

  getNombreTutor(id?: string): string {
    if (!id) return '-';
    const tutor = this.tutores.find(t => t.id === id);
    return tutor ? tutor.fullName : '-';
  }

  cargarTutores() {
    this.http.get<any[]>(this.tutoresUrl).subscribe({
      next: (data) => {
        if (Array.isArray(data)) {
          this.tutores = data.map((t: any) => ({
            id: t.id,
            nombre: t.nombre,
            apellidos: t.apellidos || '',
            fullName: `${t.nombre} ${t.apellidos || ''}`.trim()
          }));
          this.tutoresOpciones = this.tutores.map(t => t.fullName);
        }
      },
      error: (err) => {
        this.mostrarNotificacion('No se pudo cargar la lista de tutores: ' + err.message, 'error');
      }
    });
  }

  cargarGrupos() {
    this.http.get<any[]>(this.apiUrl).subscribe({
      next: (data) => {
        this.grupos = Array.isArray(data) ? data.map((g: any) => ({
          id: g.id,
          nombre: g.nombre,
          grado: g.grado,
          carrera: g.carrera,
          data: g.data || {}
        })) : [];
      },
      error: (err) => {
        this.mostrarNotificacion('No se pudo cargar la lista de grupos: ' + err.message, 'error');
      }
    });
  }

  agregarGrupo() {
    if (!this.nuevoGrupo.nombre || !this.nuevoGrupo.carrera || !this.nuevoGrupo.grado) {
      this.mostrarNotificacion('Debes completar todos los campos obligatorios.', 'error');
      return;
    }

    const body = {
      nombre: this.nuevoGrupo.nombre,
      grado: this.nuevoGrupo.grado,
      carrera: this.nuevoGrupo.carrera,
      data: this.nuevoGrupo.data || {}
    };

    this.http.post<any>(this.apiUrl, body).subscribe({
      next: (data) => {
        if (data.error) {
          this.mostrarNotificacion(data.error, 'error');
          return;
        }
        this.grupos.push({
          id: data.id,
          nombre: data.nombre,
          grado: data.grado,
          carrera: data.carrera,
          data: data.data || {}
        });
        this.nuevoGrupo = { id: '', nombre: '', grado: 1, carrera: '', data: {} };
        this.mostrarNotificacion('Grupo agregado correctamente.', 'success');
      },
      error: (err) => {
        this.mostrarNotificacion('No se pudo crear el grupo: ' + err.message, 'error');
      }
    });
  }

  editarGrupo(grupo: Grupo): void {
    this.grupoEditando = { ...grupo };
    this.nuevoGrupo = { ...grupo };
  }

  guardarEdicion() {
    if (!this.nuevoGrupo.nombre || !this.nuevoGrupo.carrera || !this.nuevoGrupo.grado) {
      this.mostrarNotificacion('Debes completar todos los campos obligatorios.', 'error');
      return;
    }
    if (!this.grupoEditando) return;

    const body = {
      nombre: this.nuevoGrupo.nombre,
      grado: this.nuevoGrupo.grado,
      carrera: this.nuevoGrupo.carrera,
      data: this.nuevoGrupo.data || {}
    };

    this.http.patch<any>(`${this.apiUrl}/${this.grupoEditando.id}`, body).subscribe({
      next: () => {
        const index = this.grupos.findIndex(g => g.id === this.grupoEditando!.id);
        if (index !== -1) {
          this.grupos[index] = {
            id: this.grupoEditando!.id,
            nombre: body.nombre,
            grado: body.grado,
            carrera: body.carrera,
            data: body.data
          };
        }
        this.grupoEditando = null;
        this.nuevoGrupo = { id: '', nombre: '', grado: 1, carrera: '', data: {} };
        this.mostrarNotificacion('Cambios guardados correctamente.', 'success');
      },
      error: (err) => {
        this.mostrarNotificacion('No se pudo editar el grupo: ' + err.message, 'error');
      }
    });
  }

  cancelarEdicion(): void {
    this.grupoEditando = null;
    this.nuevoGrupo = { id: '', nombre: '', grado: 1, carrera: '', data: {} };
  }

  eliminarGrupo(id: string) {
    this.confirmacion = {
      visible: true,
      mensaje: '¿Estás seguro de eliminar este grupo?',
      idPendiente: id
    };
  }

  confirmarEliminacion() {
    const id = this.confirmacion.idPendiente;
    this.confirmacion = { visible: false, mensaje: '', idPendiente: null };
    if (!id) return;

    this.http.delete(`${this.apiUrl}/${id}`).subscribe({
      next: () => {
        this.grupos = this.grupos.filter(g => g.id !== id);
        this.mostrarNotificacion('Grupo eliminado correctamente.', 'success');
      },
      error: (err) => {
        this.mostrarNotificacion('No se pudo eliminar el grupo: ' + err.message, 'error');
      }
    });
  }

  cancelarEliminacion() {
    this.confirmacion = { visible: false, mensaje: '', idPendiente: null };
  }
}