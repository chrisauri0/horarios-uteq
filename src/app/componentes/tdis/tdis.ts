import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TdisService } from './tdis.service';
import {
  SolicitudesValidacionService,
  SolicitudValidacion,
} from './solicitudes-validacion.service';

export interface TdiPrograma {
  id?: string;
  eje: string;
  nombre: string;
  personaEncargada: string;
  puesto: string;
  telefono: string;
  extension: string;
  correo: string;
  tipo: 'externa' | 'interna' | string;
  horasRequeridas: number;
  nivelDeImpacto: string;
  tdisPorGanar: number; // 👈 corregido (antes: tdisporGanar)
  activo?: boolean;
  competencias: string;
  evidencias: string;
  observaciones: string; // 👈 corregido (antes: obeservaciones)
  // 👇 nuevos campos del catálogo
  cupoMaximo?: number | null;
  fecha?: string | null;
  lugar?: string | null;
  emoji?: string | null;
}

@Component({
  selector: 'app-tdis',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './tdis.html',
  styleUrl: './tdis.scss'
})
export class Tdis implements OnInit {
  private readonly nivelesImpacto = [
    { value: '1', label: '1 - Sensibilizador Conoce' },
    { value: '2', label: '2 - Formador Participa' },
    { value: '3', label: '3 - Aplicador Hace' },
    { value: '4', label: '4 - Implementador Lidera' }
  ];

  readonly alumnosRegistrados = [
    { matricula: '2023001', nombre: 'Juan Pérez', carrera: 'Ingeniería en Sistemas', totalPuntosTdi: 10, identidadPersonal: 5, entornoSocial: 3, entornoFisico: 2, trascendencia: 0 }
  ];

  // ── Solicitudes de validación: ahora sí conectadas al backend ──────────
  solicitudesValidacion: SolicitudValidacion[] = [];
  cargandoSolicitudes = false;

  solicitudActual: SolicitudValidacion | null = null;

  // ── Formulario de aprobación (campos que el admin debe llenar) ─────────
  aprobacionForm: {
    nivelDeImpacto: string;
    tdisPorGanar: number;
    cupoMaximo: number;
    fecha: string; // yyyy-mm-dd, formato de <input type="date">
    lugar: string;
    emoji: string;
    observacionesAdmin: string;
  } = this.crearAprobacionVacia();

  tdis: TdiPrograma[] = [];
  cargando = false;
  busqueda = '';
  modalAbierto = false;
  modalSolicitudesAbierto = false;
  modalAlumnosAbierto = false;
  totalAlumnos = 1;

  editandoEje: string | null = null;
  editandoId: string | null = null;

  nuevoTdi: TdiPrograma = this.crearTdiVacio();
  modalSolicitudIndividualAbierto = false;

  notificacion: { visible: boolean; mensaje: string; tipo: 'info' | 'error' | 'success' } = {
    visible: false,
    mensaje: '',
    tipo: 'info'
  };

  confirmacion: { visible: boolean; mensaje: string; tdiPendiente: TdiPrograma | null } = {
    visible: false,
    mensaje: '',
    tdiPendiente: null
  };

  get totalTdi(): number {
    return this.tdis.length;
  }

  get totalTdisPorGanar(): number {
    return this.tdis.reduce((total, tdi) => total + Number(tdi.tdisPorGanar || 0), 0);
  }

  get solicitudesPendientes(): SolicitudValidacion[] {
    return this.solicitudesValidacion.filter((s) => s.estado === 'Pendiente');
  }

  get tdisFiltrados(): TdiPrograma[] {
    const query = this.busqueda.trim().toLowerCase();
    if (!query) {
      return this.tdis;
    }

    return this.tdis.filter((tdi) => {
      const texto = [
        tdi.eje,
        tdi.nombre,
        tdi.personaEncargada,
        tdi.puesto,
        tdi.telefono,
        tdi.extension,
        tdi.correo,
        tdi.tipo,
        tdi.nivelDeImpacto,
        tdi.competencias,
        tdi.evidencias,
        tdi.observaciones
      ].join(' ').toLowerCase();

      return texto.includes(query);
    });
  }

  get etiquetaNivelImpacto(): { [key: string]: string } {
    return this.nivelesImpacto.reduce((acumulado, nivel) => {
      acumulado[nivel.value] = nivel.label;
      return acumulado;
    }, {} as { [key: string]: string });
  }

  constructor(
    private tdisService: TdisService,
    private solicitudesService: SolicitudesValidacionService,
  ) {}

  ngOnInit() {
    this.cargarTdis();
    this.cargarSolicitudes();
  }

  private mostrarNotificacion(mensaje: string, tipo: 'info' | 'error' | 'success' = 'info') {
    this.notificacion = { visible: true, mensaje, tipo };
  }

  cerrarNotificacion() {
    this.notificacion.visible = false;
  }

  private cargarTdis() {
    this.cargando = true;
    this.tdisService.getAll().subscribe({
      next: (data) => { this.tdis = data; this.cargando = false; },
      error: (err) => {
        this.cargando = false;
        this.mostrarNotificacion('No se pudieron cargar los TDIs: ' + err.message, 'error');
      },
    });
  }

  private cargarSolicitudes() {
    this.cargandoSolicitudes = true;
    this.solicitudesService.getAllAdmin().subscribe({
      next: (data) => {
        this.solicitudesValidacion = data;
        this.cargandoSolicitudes = false;
      },
      error: (err) => {
        this.cargandoSolicitudes = false;
        this.mostrarNotificacion('No se pudieron cargar las solicitudes: ' + err.message, 'error');
      },
    });
  }

  agregarTdi() {
    const tdi = this.normalizarTdi(this.nuevoTdi);

    if (!tdi.eje || !tdi.nombre || !tdi.personaEncargada || !tdi.correo) {
      this.mostrarNotificacion('Completa los campos obligatorios: eje, nombre, persona encargada y correo.', 'error');
      return;
    }

    this.tdisService.create(tdi).subscribe({
      next: () => {
        this.cargarTdis();
        this.cerrarModal();
        this.mostrarNotificacion('TDI agregado correctamente.', 'success');
      },
      error: (err) => {
        if (err.status === 409) {
          this.mostrarNotificacion('Ya existe un registro con ese eje.', 'error');
        } else {
          this.mostrarNotificacion('Error al guardar el TDI: ' + err.message, 'error');
        }
      },
    });
  }

  guardarEdicion() {
    if (!this.editandoId) return;

    const tdi = this.normalizarTdi(this.nuevoTdi);
    if (!tdi.eje || !tdi.nombre || !tdi.personaEncargada || !tdi.correo) {
      this.mostrarNotificacion('Completa los campos obligatorios: eje, nombre, persona encargada y correo.', 'error');
      return;
    }

    this.tdisService.update(this.editandoId, tdi).subscribe({
      next: () => {
        this.cargarTdis();
        this.cerrarModal();
        this.mostrarNotificacion('Cambios guardados correctamente.', 'success');
      },
      error: (err) => this.mostrarNotificacion('Error al actualizar el TDI: ' + err.message, 'error'),
    });
  }

  eliminarTdi(tdi: TdiPrograma) {
    if (!tdi.id) return;
    this.confirmacion = {
      visible: true,
      mensaje: `¿Deseas eliminar el TDI "${tdi.nombre}"?`,
      tdiPendiente: tdi
    };
  }

  confirmarEliminacion() {
    const tdi = this.confirmacion.tdiPendiente;
    this.confirmacion = { visible: false, mensaje: '', tdiPendiente: null };
    if (!tdi || !tdi.id) return;

    this.tdisService.delete(tdi.id).subscribe({
      next: () => {
        this.cargarTdis();
        this.mostrarNotificacion('TDI eliminado correctamente.', 'success');
      },
      error: (err) => this.mostrarNotificacion('Error al eliminar el TDI: ' + err.message, 'error'),
    });
  }

  cancelarEliminacion() {
    this.confirmacion = { visible: false, mensaje: '', tdiPendiente: null };
  }

  verAlumnosRegistrados() {
    this.modalAlumnosAbierto = true;
  }

  cerrarModalAlumnos() {
    this.modalAlumnosAbierto = false;
  }

  private normalizarTdi(tdi: TdiPrograma): TdiPrograma {
    return {
      ...tdi,
      eje: tdi.eje.trim(),
      nombre: tdi.nombre.trim(),
      personaEncargada: tdi.personaEncargada.trim(),
      puesto: tdi.puesto.trim(),
      telefono: tdi.telefono.trim(),
      extension: tdi.extension.trim(),
      correo: tdi.correo.trim(),
      tipo: tdi.tipo.trim(),
      horasRequeridas: Number(tdi.horasRequeridas) || 0,
      nivelDeImpacto: String(tdi.nivelDeImpacto),
      tdisPorGanar: Number(tdi.tdisPorGanar) || 0,
      activo: tdi.activo ?? true,
      competencias: tdi.competencias.trim(),
      evidencias: tdi.evidencias.trim(),
      observaciones: tdi.observaciones.trim(),
      cupoMaximo: tdi.cupoMaximo ? Number(tdi.cupoMaximo) : undefined,
      fecha: tdi.fecha || undefined,
      lugar: tdi.lugar?.trim() || undefined,
      emoji: tdi.emoji?.trim() || undefined,
    };
  }

  // ── Solicitudes de validación ────────────────────────────────────────────

  verSolicitud(id: string) {
    this.solicitudActual = this.solicitudesValidacion.find((s) => s.id === id) || null;
    if (this.solicitudActual) {
      this.aprobacionForm = this.crearAprobacionVacia();
      // Prellenamos con datos razonables tomados de la solicitud, el admin ajusta
      this.aprobacionForm.nivelDeImpacto = this.solicitudActual.nivel_de_impacto || '1';
      this.aprobacionForm.tdisPorGanar = this.solicitudActual.tdis_por_ganar || 0;
      this.modalSolicitudIndividualAbierto = true;
    } else {
      this.mostrarNotificacion('Solicitud no encontrada.', 'error');
    }
  }

  aprobarSolicitud(solicitud: SolicitudValidacion | null) {
    if (!solicitud) return;

    if (
      !this.aprobacionForm.nivelDeImpacto ||
      !this.aprobacionForm.tdisPorGanar ||
      !this.aprobacionForm.cupoMaximo ||
      !this.aprobacionForm.lugar.trim()
    ) {
      this.mostrarNotificacion(
        'Para aprobar, completa: nivel de impacto, TDIs por ganar, cupo máximo y lugar.',
        'error',
      );
      return;
    }

    this.solicitudesService
      .aprobar(solicitud.id, {
        estado: 'Aprobada',
        observacionesAdmin: this.aprobacionForm.observacionesAdmin || undefined,
        nivelDeImpacto: this.aprobacionForm.nivelDeImpacto,
        tdisPorGanar: Number(this.aprobacionForm.tdisPorGanar),
        cupoMaximo: Number(this.aprobacionForm.cupoMaximo),
        fecha: this.aprobacionForm.fecha
          ? new Date(this.aprobacionForm.fecha).toISOString()
          : undefined,
        lugar: this.aprobacionForm.lugar.trim(),
        emoji: this.aprobacionForm.emoji.trim() || undefined,
      })
      .subscribe({
        next: () => {
          this.mostrarNotificacion('Solicitud aprobada. Ya aparece en el catálogo.', 'success');
          this.cargarSolicitudes();
          this.cargarTdis();
          this.cerrarModalSolicitud();
        },
        error: (err) => {
          const msg = err?.error?.message;
          this.mostrarNotificacion(
            'Error al aprobar: ' + (Array.isArray(msg) ? msg.join(', ') : err.message),
            'error',
          );
        },
      });
  }

  rechazarSolicitud(solicitud: SolicitudValidacion | null) {
    if (!solicitud) return;

    this.solicitudesService
      .rechazar(solicitud.id, {
        estado: 'Rechazada',
        observacionesAdmin: this.aprobacionForm.observacionesAdmin || undefined,
      })
      .subscribe({
        next: () => {
          this.mostrarNotificacion('Solicitud rechazada.', 'success');
          this.cargarSolicitudes();
          this.cerrarModalSolicitud();
        },
        error: (err) => {
          this.mostrarNotificacion('Error al rechazar: ' + err.message, 'error');
        },
      });
  }

  abrirModalSolicitudesValidacion() {
    this.modalSolicitudesAbierto = true;
  }
  cerrarModalSolicitudes() {
    this.modalSolicitudesAbierto = false;
  }

  cerrarModalSolicitud() {
    this.modalSolicitudIndividualAbierto = false;
    this.solicitudActual = null;
    this.aprobacionForm = this.crearAprobacionVacia();
  }

  private crearAprobacionVacia() {
    return {
      nivelDeImpacto: '1',
      tdisPorGanar: 0,
      cupoMaximo: 20,
      fecha: '',
      lugar: '',
      emoji: '',
      observacionesAdmin: '',
    };
  }

  verEstadisticas(tdi: TdiPrograma) {
    // Pendiente: implementar vista de estadísticas
  }

  cerrarModal() {
    this.modalAbierto = false;
    this.editandoEje = null;
    this.editandoId = null;
    this.nuevoTdi = this.crearTdiVacio();
  }

  editarTdi(tdi: TdiPrograma) {
    this.editandoEje = tdi.eje;
    this.editandoId = tdi.id ?? null;
    this.nuevoTdi = { ...tdi };
    this.modalAbierto = true;
  }

  private crearTdiVacio(): TdiPrograma {
    return {
      eje: '',
      nombre: '',
      personaEncargada: '',
      puesto: '',
      telefono: '',
      extension: '',
      correo: '',
      tipo: 'interna',
      horasRequeridas: 0,
      nivelDeImpacto: '1',
      tdisPorGanar: 0,
      activo: true,
      competencias: '',
      evidencias: '',
      observaciones: '',
      cupoMaximo: undefined,
      fecha: undefined,
      lugar: undefined,
      emoji: undefined,
    };
  }

  abrirModalNuevoTdi() {
    this.editandoEje = null;
    this.editandoId = null;
    this.nuevoTdi = this.crearTdiVacio();
    this.modalAbierto = true;
  }
}