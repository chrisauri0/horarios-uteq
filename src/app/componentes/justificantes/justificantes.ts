import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Justificante, EstadoJustificante } from './models/justificantes.model';

@Component({
  selector: 'app-justificantes-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './justificantes.html',
  styleUrl: './justificantes.scss'
})
export class Justificantes {

  // ----- DATA HARDCODEADA -----
  justificantes = signal<Justificante[]>([
    {
      id: 1,
      alumno: {
        nombre: 'María Fernanda López',
        matricula: 'A001234',
        grupo: '3°A',
        avatarUrl: 'https://i.pravatar.cc/100?img=47'
      },
      fechaFalta: '2026-06-10',
      fechaEnvio: '2026-06-11',
      motivo: 'Cita médica',
      descripcion: 'Asistí a consulta con el dentista por una urgencia, adjunto comprobante de la clínica.',
      archivoAdjunto: { nombre: 'comprobante_dental.pdf', tipo: 'pdf', url: '#' },
      estado: 'pendiente',
      materia: 'Matemáticas III'
    },
    {
      id: 2,
      alumno: {
        nombre: 'Jorge Andrés Pérez',
        matricula: 'A001987',
        grupo: '5°B',
        avatarUrl: 'https://i.pravatar.cc/100?img=12'
      },
      fechaFalta: '2026-06-09',
      fechaEnvio: '2026-06-09',
      motivo: 'Enfermedad',
      descripcion: 'Presenté fiebre y gripe, mi madre me llevó al médico general.',
      archivoAdjunto: { nombre: 'receta_medica.jpg', tipo: 'imagen', url: 'https://placehold.co/600x400?text=Receta+Medica' },
      estado: 'aprobado',
      materia: 'Química',
      comentarioAdmin: 'Justificante válido, se acepta.'
    },
    {
      id: 3,
      alumno: {
        nombre: 'Ana Sofía Ramírez',
        matricula: 'A002001',
        grupo: '3°A',
        avatarUrl: 'https://i.pravatar.cc/100?img=32'
      },
      fechaFalta: '2026-06-08',
      fechaEnvio: '2026-06-12',
      motivo: 'Trámite familiar',
      descripcion: 'Tuve que acompañar a mi mamá a un trámite del INE, no tengo comprobante oficial.',
      archivoAdjunto: { nombre: 'nota_padre.jpg', tipo: 'imagen', url: 'https://placehold.co/600x400?text=Nota+Firmada' },
      estado: 'rechazado',
      materia: 'Historia',
      comentarioAdmin: 'No se adjuntó comprobante oficial del trámite.'
    },
    {
      id: 4,
      alumno: {
        nombre: 'Diego Hernández Cruz',
        matricula: 'A001555',
        grupo: '4°C',
        avatarUrl: 'https://i.pravatar.cc/100?img=15'
      },
      fechaFalta: '2026-06-13',
      fechaEnvio: '2026-06-14',
      motivo: 'Cita médica',
      descripcion: 'Revisión de rutina con oftalmólogo.',
      archivoAdjunto: { nombre: 'comprobante_oftalmologo.pdf', tipo: 'pdf', url: '#' },
      estado: 'pendiente',
      materia: 'Física'
    },
    {
      id: 5,
      alumno: {
        nombre: 'Camila Torres Gil',
        matricula: 'A001876',
        grupo: '5°B',
        avatarUrl: 'https://i.pravatar.cc/100?img=44'
      },
      fechaFalta: '2026-06-07',
      fechaEnvio: '2026-06-08',
      motivo: 'Enfermedad',
      descripcion: 'Migraña intensa, reposo recomendado por el médico.',
      archivoAdjunto: { nombre: 'incapacidad.pdf', tipo: 'pdf', url: '#' },
      estado: 'pendiente',
      materia: 'Inglés'
    }
  ]);

  // ----- ESTADO DE FILTROS -----
  filtroEstado = signal<EstadoJustificante | 'todos'>('todos');
  filtroAlumno = signal<string>('');

  // ----- ESTADO DEL MODAL DE DETALLE -----
  justificanteSeleccionado = signal<Justificante | null>(null);
  comentarioTemp = '';

  // ----- LISTA FILTRADA (computed) -----
  justificantesFiltrados = computed(() => {
    const estado = this.filtroEstado();
    const alumno = this.filtroAlumno().trim().toLowerCase();

    return this.justificantes().filter(j => {
      const coincideEstado = estado === 'todos' || j.estado === estado;
      const coincideAlumno =
        alumno === '' ||
        j.alumno.nombre.toLowerCase().includes(alumno) ||
        j.alumno.matricula.toLowerCase().includes(alumno);
      return coincideEstado && coincideAlumno;
    });
  });

  // ----- CONTADORES PARA LAS TARJETAS RESUMEN -----
  totalPendientes = computed(() => this.justificantes().filter(j => j.estado === 'pendiente').length);
  totalAprobados = computed(() => this.justificantes().filter(j => j.estado === 'aprobado').length);
  totalRechazados = computed(() => this.justificantes().filter(j => j.estado === 'rechazado').length);

  // ----- ACCIONES -----
  abrirDetalle(justificante: Justificante) {
    this.justificanteSeleccionado.set(justificante);
    this.comentarioTemp = justificante.comentarioAdmin ?? '';
  }

  cerrarDetalle() {
    this.justificanteSeleccionado.set(null);
    this.comentarioTemp = '';
  }

  aprobar(justificante: Justificante) {
    this.cambiarEstado(justificante.id, 'aprobado');
  }

  rechazar(justificante: Justificante) {
    this.cambiarEstado(justificante.id, 'rechazado');
  }

  private cambiarEstado(id: number, nuevoEstado: EstadoJustificante) {
    this.justificantes.update(lista =>
      lista.map(j =>
        j.id === id
          ? { ...j, estado: nuevoEstado, comentarioAdmin: this.comentarioTemp || j.comentarioAdmin }
          : j
      )
    );

    // si el modal estaba abierto con este justificante, lo actualizamos también
    const actual = this.justificanteSeleccionado();
    if (actual && actual.id === id) {
      this.justificanteSeleccionado.set({ ...actual, estado: nuevoEstado, comentarioAdmin: this.comentarioTemp || actual.comentarioAdmin });
    }
  }

  // ----- HELPERS DE UI -----
  claseEstado(estado: EstadoJustificante): string {
    return {
      pendiente: 'badge badge--pendiente',
      aprobado: 'badge badge--aprobado',
      rechazado: 'badge badge--rechazado'
    }[estado];
  }

  textoEstado(estado: EstadoJustificante): string {
    return {
      pendiente: 'Pendiente',
      aprobado: 'Aprobado',
      rechazado: 'Rechazado'
    }[estado];
  }
}