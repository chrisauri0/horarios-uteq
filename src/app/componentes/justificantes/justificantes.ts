import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Justificante, EstadoJustificante } from './models/justificantes.model';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-justificantes-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './justificantes.html',
  styleUrl: './justificantes.scss'
})
export class Justificantes {
  private apiUrl = `${environment.apiUrl}/justificantes`;

  justificantes = signal<Justificante[]>([]);

  filtroEstado = signal<EstadoJustificante | 'todos'>('todos');
  filtroAlumno = signal<string>('');

  justificanteSeleccionado = signal<Justificante | null>(null);
  comentarioTemp = '';

  notificacion: { visible: boolean; mensaje: string; tipo: 'info' | 'error' | 'success' } = {
    visible: false,
    mensaje: '',
    tipo: 'info'
  };

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.cargarJustificantes();
  }

  private mostrarNotificacion(mensaje: string, tipo: 'info' | 'error' | 'success' = 'info') {
    this.notificacion = { visible: true, mensaje, tipo };
  }

  cerrarNotificacion() {
    this.notificacion.visible = false;
  }

  cargarJustificantes() {
    this.http.get<Justificante[]>(`${this.apiUrl}/admin`).subscribe({
      next: (data) => {
        this.justificantes.set(Array.isArray(data) ? data : []);
      },
      error: (err) => {
        this.mostrarNotificacion('No se pudo cargar la lista de justificantes: ' + err.message, 'error');
      }
    });
  }

  justificantesFiltrados = computed(() => {
    const estado = this.filtroEstado();
    const alumno = this.filtroAlumno().trim().toLowerCase();

    return this.justificantes().filter(j => {
      const coincideEstado = estado === 'todos' || j.estado === estado;
      const nombre = (j.usuario?.full_name ?? '').toLowerCase();
      const email = (j.usuario?.email ?? '').toLowerCase();
      const coincideAlumno =
        alumno === '' ||
        nombre.includes(alumno) ||
        email.includes(alumno);
      return coincideEstado && coincideAlumno;
    });
  });

  totalPendientes = computed(() => this.justificantes().filter(j => j.estado === 'pendiente').length);
  totalAprobados = computed(() => this.justificantes().filter(j => j.estado === 'aceptado').length);
  totalRechazados = computed(() => this.justificantes().filter(j => j.estado === 'rechazado').length);

  abrirDetalle(justificante: Justificante) {
    this.justificanteSeleccionado.set(justificante);
    this.comentarioTemp = justificante.comentarioAdmin ?? '';
  }

  cerrarDetalle() {
    this.justificanteSeleccionado.set(null);
    this.comentarioTemp = '';
  }

  aprobar(justificante: Justificante) {
    this.cambiarEstado(justificante.id, 'aceptado');
  }

  rechazar(justificante: Justificante) {
    this.cambiarEstado(justificante.id, 'rechazado');
  }

  private cambiarEstado(id: string, nuevoEstado: EstadoJustificante) {
    const body = {
      estado: nuevoEstado,
      comentarioAdmin: this.comentarioTemp || undefined,
    };

    this.http.patch<Justificante>(`${this.apiUrl}/admin/${id}/estado`, body).subscribe({
      next: (actualizado) => {
        this.justificantes.update(lista =>
          lista.map(j => j.id === id ? { ...j, ...actualizado } : j)
        );

        const actual = this.justificanteSeleccionado();
        if (actual && actual.id === id) {
          this.justificanteSeleccionado.set({ ...actual, ...actualizado });
        }

        this.mostrarNotificacion(
          nuevoEstado === 'aceptado' ? 'Justificante aprobado.' : 'Justificante rechazado.',
          'success'
        );
      },
      error: (err) => {
        this.mostrarNotificacion('No se pudo actualizar el justificante: ' + err.message, 'error');
      }
    });
  }

  claseEstado(estado: EstadoJustificante): string {
    return {
      pendiente: 'badge badge--pendiente',
      aceptado: 'badge badge--aprobado',
      rechazado: 'badge badge--rechazado'
    }[estado];
  }

  textoEstado(estado: EstadoJustificante): string {
    return {
      pendiente: 'Pendiente',
      aceptado: 'Aprobado',
      rechazado: 'Rechazado'
    }[estado];
  }
}