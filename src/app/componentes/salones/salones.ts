import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface salonesData {
  id: string;
  nombre: string;
}

@Component({
  selector: 'app-salones',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './salones.html',
  styleUrls: ['./salones.scss']
})
export class SalonesComponent {
  private apiUrl = `${environment.apiUrl}/salones`;

  usuarioNombre: string = '';

  salones: salonesData[] = [];
  nuevoSalon: salonesData = { id: '', nombre: '' };
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

  ngOnInit() {
    const usuarioData = localStorage.getItem('userData');
    if (usuarioData) {
      const { full_name } = JSON.parse(usuarioData);
      this.usuarioNombre = full_name || 'Usuario';
    } else {
      this.usuarioNombre = 'Usuario';
    }
    this.cargarSalones();
  }

  private mostrarNotificacion(mensaje: string, tipo: 'info' | 'error' | 'success' = 'info') {
    this.notificacion = { visible: true, mensaje, tipo };
  }

  cerrarNotificacion() {
    this.notificacion.visible = false;
  }

  cargarSalones() {
    this.http.get<any[]>(this.apiUrl).subscribe({
      next: (data) => {
        this.salones = Array.isArray(data) ? data.map((s, idx) => ({
          id: s.id || idx,
          nombre: s.nombre
        })) : [];
      },
      error: (err) => {
        this.mostrarNotificacion('No se pudo cargar la lista de salones: ' + err.message, 'error');
      }
    });
  }

  agregarSalon() {
    if (!this.nuevoSalon.nombre.trim()) {
      this.mostrarNotificacion('Completa el nombre antes de guardar.', 'error');
      return;
    }

    const body = {
      nombre: this.nuevoSalon.nombre
    };

    this.http.post<any>(this.apiUrl, body).subscribe({
      next: (data) => {
        if (data.error) {
          this.mostrarNotificacion(data.error, 'error');
          return;
        }
        this.salones.push({
          id: data.id || Date.now().toString(),
          nombre: data.nombre
        });
        this.nuevoSalon = { id: '', nombre: '' };
        this.modalAbierto = false;
        this.mostrarNotificacion('Salón agregado correctamente.', 'success');
      },
      error: (err) => {
        this.mostrarNotificacion('No se pudo crear el salón: ' + err.message, 'error');
      }
    });
  }

  eliminarSalon(id: string) {
    this.confirmacion = {
      visible: true,
      mensaje: '¿Estás seguro de que deseas eliminar este salón?',
      idPendiente: id
    };
  }

  confirmarEliminacion() {
    const id = this.confirmacion.idPendiente;
    this.confirmacion = { visible: false, mensaje: '', idPendiente: null };
    if (!id) return;

    this.http.delete(`${this.apiUrl}/${id}`).subscribe({
      next: () => {
        this.salones = this.salones.filter(s => s.id !== id);
        this.mostrarNotificacion('Salón eliminado correctamente.', 'success');
      },
      error: (err) => {
        this.mostrarNotificacion('No se pudo eliminar el salón: ' + err.message, 'error');
      }
    });
  }

  cancelarEliminacion() {
    this.confirmacion = { visible: false, mensaje: '', idPendiente: null };
  }

  editarSalon(salon: salonesData) {
    this.editandoId = salon.id;
    this.nuevoSalon = { ...salon };
    this.modalAbierto = true;
  }

  guardarEdicion() {
    if (!this.nuevoSalon.nombre.trim() || !this.editandoId) {
      this.mostrarNotificacion('Completa el nombre antes de guardar.', 'error');
      return;
    }

    const body = {
      nombre: this.nuevoSalon.nombre
    };

    this.http.patch<any>(`${this.apiUrl}/${this.editandoId}`, body).subscribe({
      next: () => {
        this.salones = this.salones.map(s => s.id === this.editandoId ? {
          id: this.editandoId!,
          nombre: body.nombre
        } : s);
        this.nuevoSalon = { id: '', nombre: '' };
        this.editandoId = null;
        this.modalAbierto = false;
        this.mostrarNotificacion('Cambios guardados correctamente.', 'success');
      },
      error: (err) => {
        this.mostrarNotificacion('No se pudo editar el salón: ' + err.message, 'error');
      }
    });
  }

  cancelarEdicion() {
    this.nuevoSalon = { id: '', nombre: '' };
    this.editandoId = null;
  }

  abrirModalNuevoSalon() {
    this.editandoId = null;
    this.nuevoSalon = { id: '', nombre: '' };
    this.modalAbierto = true;
  }

  cerrarModal() {
    this.cancelarEdicion();
    this.modalAbierto = false;
  }

  // --- Paginación ---
  paginaActual: number = 1;
  elementosPorPagina: number = 10;

  get salonesPaginados(): salonesData[] {
    const inicio = (this.paginaActual - 1) * this.elementosPorPagina;
    return this.salonesFiltrados.slice(inicio, inicio + this.elementosPorPagina);
  }

  get totalPaginas(): number {
    return Math.ceil(this.salonesFiltrados.length / this.elementosPorPagina);
  }

  get paginas(): number[] {
    return Array.from({ length: this.totalPaginas }, (_, i) => i + 1);
  }

  cambiarPagina(pagina: number) {
    if (pagina < 1 || pagina > this.totalPaginas) return;
    this.paginaActual = pagina;
  }

  onBusqueda(valor: string) {
    this.textoBusqueda = valor;
    this.paginaActual = 1;
  }

  // --- Búsqueda ---
  textoBusqueda: string = '';

  get salonesFiltrados(): salonesData[] {
    const texto = this.textoBusqueda.trim().toLowerCase();
    if (!texto) return this.salones;
    return this.salones.filter(s =>
      s.nombre.toLowerCase().includes(texto)
    );
  }
}