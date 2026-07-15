import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TdisService } from './tdis.service';

export interface TdiPrograma {
  id?: string; // ⬅️ nuevo, viene del backend
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
  tdisporGanar: number;
  activo?: boolean;
  competencias: string;
  evidencias: string;
  obeservaciones: string;
}

@Component({
  selector: 'app-tdis',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './tdis.html',
  styleUrl: './tdis.scss'
})
export class Tdis implements OnInit {
  private readonly storageKey = 'tdi-programas-cache';
  private readonly ejes =[
    { value: '1', label: 'Eje Identidad Personal' },
    { value: '2', label: 'Eje Entorno Social' },
    { value: '3', label: 'Eje Entorno Físico' },
    { value: '4', label: 'Eje Trascendia' }
  ];
  private readonly nivelesImpacto = [
    { value: '1', label: '1 - Sensibilizador Conoce' },
    { value: '2', label: '2 - Formador Participa' },
    { value: '3', label: '3 - Aplicador Hace' },
    { value: '4', label: '4 - Implementador Lidera' }
  ];

   readonly alumnosRegistrados = [
    { matricula: '2023001', nombre: 'Juan Pérez', carrera: 'Ingeniería en Sistemas', totalPuntosTdi: 10, identidadPersonal: 5, entornoSocial: 3, entornoFisico: 2, trascendencia: 0 }
  ];

  readonly solicitudesValidacion = [
    {id: 1, matricula:'2023002', nombreSolicitud: 'Voluntariado en refugio de animales', correoAlumno: 'maria.lopez@correo.com',
       eje:'Identidad Personal',
  personaEncargada: 'José Martínez',
  puesto: 'Encargado de Voluntariado',
  telefono: '412345678',
  extension: '',
  correo: 'jose.martinez@correo.com',
  tipo: 'externa',
  horasRequeridas: 20,
  nivelDeImpacto: 'sensibilizador',
  tdisporGanar: 0,
  competencias: 'Apoyo en cuidado de animales, limpieza',
  evidencias: ' Fotos del voluntariado, carta de recomendación',
  obeservaciones: ' Actividad realizada durante vacaciones de verano',
   estado: 'Pendiente' },
  ]

  solicitudActual: any = null;

  tdis: TdiPrograma[] = [];
  cargando = false; // ⬅️ FIX 1: propiedad faltante
  busqueda = '';
  modalAbierto = false;
  modalSolicitudesAbierto = false;
  modalAlumnosAbierto = false;
  totalAlumnos = 1;

  editandoEje: string | null = null;

  nuevoTdi: TdiPrograma = this.crearTdiVacio();
  modalSolicitudIndividualAbierto = false;

  get totalTdi(): number {
    return this.tdis.length;
  }

  get totalTdisPorGanar(): number {
    return this.tdis.reduce((total, tdi) => total + Number(tdi.tdisporGanar || 0), 0);
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
        tdi.obeservaciones
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

  constructor(private tdisService: TdisService) {}

  ngOnInit() {
    this.cargarTdis();
  }

  private cargarTdis() {
    this.cargando = true;
    this.tdisService.getAll().subscribe({
      next: (data) => { this.tdis = data; this.cargando = false; },
      error: (err) => {
        console.error('Error cargando TDIs:', err);
        this.cargando = false;
        alert('No se pudieron cargar los TDIs.');
      },
    });
  }

  agregarTdi() {
    const tdi = this.normalizarTdi(this.nuevoTdi);

    if (!tdi.eje || !tdi.nombre || !tdi.personaEncargada || !tdi.correo) {
      alert('Completa los campos obligatorios: eje, nombre, persona encargada y correo.');
      return;
    }

    this.tdisService.create(tdi).subscribe({
      next: () => {
        this.cargarTdis();
        this.cerrarModal();
      },
      error: (err) => {
        if (err.status === 409) {
          alert('Ya existe un registro con ese eje.');
        } else {
          alert('Error al guardar el TDI.');
        }
      },
    });
  }

  guardarEdicion() {
    if (!this.editandoEje) return;

    const tdi = this.normalizarTdi(this.nuevoTdi);
    if (!tdi.eje || !tdi.nombre || !tdi.personaEncargada || !tdi.correo) {
      alert('Completa los campos obligatorios: eje, nombre, persona encargada y correo.');
      return;
    }

    if (!tdi.id) return; // seguridad

    this.tdisService.update(tdi.id, tdi).subscribe({
      next: () => {
        this.cargarTdis();
        this.cerrarModal();
      },
      error: () => alert('Error al actualizar el TDI.'),
    });
  }

  eliminarTdi(tdi: TdiPrograma) {
    const confirmacion = confirm('¿Deseas eliminar este TDI?');
    if (!confirmacion || !tdi.id) return;

    this.tdisService.delete(tdi.id).subscribe({
      next: () => this.cargarTdis(),
      error: () => alert('Error al eliminar el TDI.'),
    });
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
      tdisporGanar: Number(tdi.tdisporGanar) || 0,
      activo: tdi.activo ?? true,
      competencias: tdi.competencias.trim(),
      evidencias: tdi.evidencias.trim(),
      obeservaciones: tdi.obeservaciones.trim()
    };
  }

  verSolicitud(id : number) {
    this.solicitudActual = this.solicitudesValidacion.find(solicitud => solicitud.id === id) || null;
    if (this.solicitudActual) {
      this.modalSolicitudesAbierto = true;
    } else {
      alert('Solicitud no encontrada');
    }

    this.abrirModalSolicitud()
  }

  aprobarSolicitud(solicitud: any) {
    // Lógica para aprobar la solicitud
  }
  
  rechazarSolicitud(solicitud: any) {
    // Lógica para rechazar la solicitud
  }

  abrirModalSolicitudesValidacion() {
    this.modalSolicitudesAbierto = true;
  }
  cerrarModalSolicitudes() {
    this.modalSolicitudesAbierto = false;
  }

  abrirModalSolicitud() {
    this.modalSolicitudIndividualAbierto = true;
  }
  cerrarModalSolicitud() {
    this.modalSolicitudIndividualAbierto = false;
    this.solicitudActual = null;
  }

  verEstadisticas(tdi: TdiPrograma) {
    // Lógica para ver estadísticas
  }

  cerrarModal() {
    this.modalAbierto = false;
    this.editandoEje = null;
    this.nuevoTdi = this.crearTdiVacio();
  }

  editarTdi(tdi: TdiPrograma) {
    this.editandoEje = tdi.eje;
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
      tdisporGanar: 0,
      activo: true,
      competencias: '',
      evidencias: '',
      obeservaciones: ''
    };
  }

  abrirModalNuevoTdi() {
    this.editandoEje = null;
    this.nuevoTdi = this.crearTdiVacio();
    this.modalAbierto = true;
  }
}