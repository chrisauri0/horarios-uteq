import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface PsicologoData {
  psicologo_id?: string;
  nombre: string;
  apellidos: string;
  email: string;
  disponibilidad: bloques[];
}

export interface bloques {
  dias: string[];
  hora_inicio: string;
  hora_fin: string;
}

@Component({
  selector: 'app-psicologos',
  standalone: true,
  imports: [CommonModule, FormsModule, NgSelectModule, RouterModule],
  templateUrl: './psicologos.html',
  styleUrl: './psicologos.scss'
})
export class Psicologos {
  private apiUrl = `${environment.apiUrl}/psicologos`;

  psicologos: PsicologoData[] = [];
  editandoId: string | null = null;

  dias: string[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  bloques: bloques[] = [this.crearBloqueVacio()];

  nuevoPsicologo: PsicologoData = {
    nombre: '',
    apellidos: '',
    email: '',
    disponibilidad: this.bloques,
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

  ngOnInit() {
    this.cargarPsicologos();
  }

  private mostrarNotificacion(mensaje: string, tipo: 'info' | 'error' | 'success' = 'info') {
    this.notificacion = { visible: true, mensaje, tipo };
  }

  cerrarNotificacion() {
    this.notificacion.visible = false;
  }

  private crearBloqueVacio(): bloques {
    return { dias: [], hora_inicio: '', hora_fin: '' };
  }

  private resetBloques() {
    this.bloques = [this.crearBloqueVacio()];
  }

  agregarBloque() {
    this.bloques.push(this.crearBloqueVacio());
  }

  toggleDia(bloqueIndex: number, dia: string) {
    const dias = this.bloques[bloqueIndex].dias;
    if (dias.includes(dia)) {
      this.bloques[bloqueIndex].dias = dias.filter(d => d !== dia);
    } else {
      this.bloques[bloqueIndex].dias.push(dia);
    }
  }

  cargarPsicologos() {
    this.http.get<PsicologoData[]>(this.apiUrl).subscribe({
      next: (data) => {
        this.psicologos = Array.isArray(data) ? data : [];
      },
      error: (err) => {
        this.mostrarNotificacion('No se pudo cargar la lista de psicólogos: ' + err.message, 'error');
      }
    });
  }

  crearPsicologo() {
    if (!this.nuevoPsicologo.nombre.trim() || !this.nuevoPsicologo.apellidos.trim() || !this.nuevoPsicologo.email.trim()) {
      this.mostrarNotificacion('Completa nombre, apellidos y email antes de guardar.', 'error');
      return;
    }

    const bloquesValidos = this.bloques.filter(
      b => b.dias.length > 0 && b.hora_inicio && b.hora_fin
    );
    if (bloquesValidos.length === 0) {
      this.mostrarNotificacion('Agrega al menos un bloque de disponibilidad completo.', 'error');
      return;
    }

    const payload = {
      nombre: this.nuevoPsicologo.nombre,
      apellidos: this.nuevoPsicologo.apellidos,
      email: this.nuevoPsicologo.email,
      disponibilidad: bloquesValidos
    };

    this.http.post<any>(this.apiUrl, payload).subscribe({
      next: (data) => {
        if (data.error) {
          this.mostrarNotificacion(data.error, 'error');
          return;
        }
        this.psicologos.push(data);
        this.nuevoPsicologo = { nombre: '', apellidos: '', email: '', disponibilidad: [] };
        this.resetBloques();
        this.mostrarNotificacion('Psicólogo agregado correctamente.', 'success');
      },
      error: (err) => {
        this.mostrarNotificacion('No se pudo crear el psicólogo: ' + err.message, 'error');
      }
    });
  }

  editarPsicologo(psicologo: PsicologoData) {
    this.editandoId = psicologo.psicologo_id ?? null;
    this.nuevoPsicologo = { ...psicologo };
    this.bloques = psicologo.disponibilidad.length > 0
      ? psicologo.disponibilidad.map(b => ({ dias: [...b.dias], hora_inicio: b.hora_inicio, hora_fin: b.hora_fin }))
      : [this.crearBloqueVacio()];
  }

  guardarEdicion() {
    if (!this.nuevoPsicologo.nombre.trim() || !this.nuevoPsicologo.email.trim() || !this.editandoId) {
      this.mostrarNotificacion('Completa nombre y email antes de guardar.', 'error');
      return;
    }

    const bloquesValidos = this.bloques.filter(
      b => b.dias.length > 0 && b.hora_inicio && b.hora_fin
    );
    if (bloquesValidos.length === 0) {
      this.mostrarNotificacion('Agrega al menos un bloque de disponibilidad completo.', 'error');
      return;
    }

    const body = {
      nombre: this.nuevoPsicologo.nombre,
      apellidos: this.nuevoPsicologo.apellidos,
      email: this.nuevoPsicologo.email,
      disponibilidad: bloquesValidos
    };

    this.http.patch<any>(`${this.apiUrl}/${this.editandoId}`, body).subscribe({
      next: () => {
        this.psicologos = this.psicologos.map(p =>
          p.psicologo_id === this.editandoId ? { ...p, ...body } : p
        );
        this.cancelarEdicion();
        this.mostrarNotificacion('Cambios guardados correctamente.', 'success');
      },
      error: (err) => {
        this.mostrarNotificacion('No se pudo editar el psicólogo: ' + err.message, 'error');
      }
    });
  }

  cancelarEdicion() {
    this.nuevoPsicologo = { nombre: '', apellidos: '', email: '', disponibilidad: [] };
    this.resetBloques();
    this.editandoId = null;
  }

  eliminarPsicologo(id: string) {
    this.confirmacion = {
      visible: true,
      mensaje: '¿Estás seguro de eliminar este psicólogo?',
      idPendiente: id
    };
  }

  confirmarEliminacion() {
    const id = this.confirmacion.idPendiente;
    this.confirmacion = { visible: false, mensaje: '', idPendiente: null };
    if (!id) return;

    this.http.delete(`${this.apiUrl}/${id}`).subscribe({
      next: () => {
        this.psicologos = this.psicologos.filter(p => p.psicologo_id !== id);
        this.mostrarNotificacion('Psicólogo eliminado correctamente.', 'success');
      },
      error: (err) => {
        this.mostrarNotificacion('No se pudo eliminar el psicólogo: ' + err.message, 'error');
      }
    });
  }

  cancelarEliminacion() {
    this.confirmacion = { visible: false, mensaje: '', idPendiente: null };
  }
}