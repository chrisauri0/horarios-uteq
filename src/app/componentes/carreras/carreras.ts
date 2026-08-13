import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { environment } from '../../../environments/environment';

export interface Carrera {
  id: string;
  nombre: string;
}

@Component({
  selector: 'app-carreras',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './carreras.html',
  styleUrl: './carreras.scss'
})
export class Carreras {

  private apiUrl = `${environment.apiUrl}/carreras`;

  carreras: Carrera[] = [];
  nuevaCarrera: Carrera = { id: '', nombre: '' };
  
  editandoId: string | null = null;
  modalAbierto = false;

  // Estado del modal de notificación (reemplaza alert)
  notificacion: { visible: boolean; mensaje: string; tipo: 'info' | 'error' | 'success' } = {
    visible: false,
    mensaje: '',
    tipo: 'info'
  };

  // Estado del modal de confirmación (reemplaza window.confirm)
  confirmacion: { visible: boolean; mensaje: string; idPendiente: string | null } = {
    visible: false,
    mensaje: '',
    idPendiente: null
  };

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.cargarCarreras();
  }

  private mostrarNotificacion(mensaje: string, tipo: 'info' | 'error' | 'success' = 'info') {
    this.notificacion = { visible: true, mensaje, tipo };
  }

  cerrarNotificacion() {
    this.notificacion.visible = false;
  }

  cargarCarreras() {
    this.http.get<Carrera[]>(this.apiUrl).subscribe({
      next: (data) => {
        this.carreras = Array.isArray(data) ? data.map((c: any) => ({
          id: c.id,
          nombre: c.nombre,
         
        })) : [];

      },
      error: (err) => {
        this.mostrarNotificacion('No se pudo cargar la lista de carreras: ' + err.message, 'error');
      }
    });
  }

  agregarCarrera() {
    if (!this.nuevaCarrera.nombre.trim() ) return;

    console.log('Agregando carrera:', this.nuevaCarrera);

    const body = {
      nombre: this.nuevaCarrera.nombre,
    };

    this.http.post<any>(this.apiUrl, body).subscribe({
      next: (data) => {
        if (data.error) {
          this.mostrarNotificacion(data.error, 'error');
          return;
        }
        this.carreras.push({
          id: data.id || Date.now().toString(),
          nombre: data.nombre,
        });
        this.nuevaCarrera = { id: '', nombre: ''};
        this.modalAbierto = false;
        this.mostrarNotificacion('Carrera agregada correctamente.', 'success');
      },
      error: (err) => {
        this.mostrarNotificacion('No se pudo crear la carrera: ' + err.message, 'error');
      }
    });
  }

  editarCarrera(carrera: Carrera) {
    this.editandoId = carrera.id;
    this.nuevaCarrera = { ...carrera };
    this.modalAbierto = true;
  }

  guardarEdicion() {
    if (!this.nuevaCarrera.nombre.trim()  || !this.editandoId) return;

    const body = {
      nombre: this.nuevaCarrera.nombre,
    };

    this.http.patch<any>(`${this.apiUrl}/${this.editandoId}`, body).subscribe({
      next: () => {
        this.carreras = this.carreras.map(c => c.id === this.editandoId ? {
          id: this.editandoId!,
          nombre: body.nombre,
        } : c);
        this.nuevaCarrera = { id: '', nombre: '' };
        this.editandoId = null;
        this.modalAbierto = false;
        this.mostrarNotificacion('Cambios guardados correctamente.', 'success');
      },
      error: (err) => {
        this.mostrarNotificacion('No se pudo editar la carrera: ' + err.message, 'error');
      }
    });
  }

  cancelarEdicion() {
    this.nuevaCarrera = { id: '', nombre: '',   };
    this.editandoId = null;
  }

  abrirModalNuevaCarrera() {
    this.editandoId = null;
    this.nuevaCarrera = { id: '', nombre: '',   };
    this.modalAbierto = true;
  }

  cerrarModal() {
    this.cancelarEdicion();
    this.modalAbierto = false;
  }

  // Abre el modal de confirmación en vez de window.confirm
  eliminarCarrera(id: string) {
    this.confirmacion = {
      visible: true,
      mensaje: '¿Estás seguro de eliminar esta carrera?',
      idPendiente: id
    };
  }

  confirmarEliminacion() {
    const id = this.confirmacion.idPendiente;
    this.confirmacion = { visible: false, mensaje: '', idPendiente: null };
    if (!id) return;

    this.http.delete(`${this.apiUrl}/${id}`).subscribe({
      next: () => {
        this.carreras = this.carreras.filter(c => c.id !== id);
        this.mostrarNotificacion('Carrera eliminada correctamente.', 'success');
      },
      error: (err) => {
        this.mostrarNotificacion('No se pudo eliminar la carrera: ' + err.message, 'error');
      }
    });
  }

  cancelarEliminacion() {
    this.confirmacion = { visible: false, mensaje: '', idPendiente: null };
  }
}