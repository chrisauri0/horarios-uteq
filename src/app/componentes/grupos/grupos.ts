
import { CommonModule } from '@angular/common';
import { Component, } from '@angular/core';
import { FormsModule, } from '@angular/forms';
import { ProfesorData } from '../profesores/profesores';
import { NgSelectModule } from '@ng-select/ng-select';
import { Carreras } from '../carreras/carreras';
import { RouterModule } from '@angular/router';


export interface Grupo {
  id: string;
  nombre: string;
  division: string;
  grado: number;
  carrera: string;
  data?: object;
}
interface Carrera {
  id: string;
  nombre: string;
  grado: number;
  division: string;
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
  grupos: Grupo[] = [];
  carreras: Carrera[] = [];
  grupoEditando: Grupo | null = null;
  nuevoGrupo: Grupo = { id: '', nombre: '', division: '', grado: 1, carrera: '', data: {} };
  tutores: Tutor[] = [];
  tutoresOpciones: string[] = [];
  ngOnInit() {
    this.cargarGrupos();
    this.cargarCarreras();
  }

  async cargarCarreras() {
    try {
      const res = await fetch('https://horarios-backend-58w8.onrender.com/carreras');
      if (!res.ok) throw new Error('Error al obtener carreras');
      const data = await res.json();
      this.carreras = Array.isArray(data) ? data.map((c: any) => ({
        id: c.id,
        nombre: c.nombre,
        grado: c.grado,
        division: c.division
      })) : [];
    } catch (err) {
      alert('No se pudo cargar la lista de carreras: ' + err);
    }
  }


  getNombreTutor(id?: string): string {
    if (!id) return '-';
    const tutor = this.tutores.find(t => t.id === id);
    return tutor ? tutor.fullName : '-';
  }


  async cargarTutores(): Promise<void> {
    try {
      const res = await fetch('https://horarios-backend-58w8.onrender.com/profesores/tutores');
      if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
      const data = await res.json();

      if (Array.isArray(data)) {
        this.tutores = data.map((t: any) => ({
          id: t.id,
          nombre: t.nombre,
          apellidos: t.apellidos || '',
          fullName: `${t.nombre} ${t.apellidos || ''}`.trim()
        }));

        // Para usar en ng-select como lista de opciones
        this.tutoresOpciones = this.tutores.map(t => t.fullName);
      }

    } catch (error) {
      console.error('Error cargando tutores:', error);
      alert('No se pudo cargar la lista de tutores.');
    }
  }

  async cargarGrupos() {
    try {
      const res = await fetch('https://horarios-backend-58w8.onrender.com/grupos');
      if (!res.ok) throw new Error('Error al obtener grupos');
      const data = await res.json();
      this.grupos = Array.isArray(data)
        ? data.map((g: any) => ({
          id: g.id,
          nombre: g.nombre,
          division: g.division,
          grado: g.grado,
          carrera: g.carrera,
          data: g.data || {}
        }))
        : [];
    } catch (err) {
      alert('No se pudo cargar la lista de grupos: ' + err);
    }
  }

  async cargarGrupoPorId(id: string) {
    try {
      const res = await fetch(`https://horarios-backend-58w8.onrender.com/grupos/${id}`);
      if (!res.ok) throw new Error('Error al obtener grupo');
      return await res.json();
    } catch (err) {
      alert('No se pudo cargar el grupo: ' + err);
      return null;
    }
  }


  // Agregar un nuevo grupo
  async agregarGrupo() {
    if (!this.nuevoGrupo.nombre || !this.nuevoGrupo.division || !this.nuevoGrupo.carrera || !this.nuevoGrupo.grado) {
      alert('Debes completar todos los campos obligatorios.');
      return;
    }
    const body = {
      nombre: this.nuevoGrupo.nombre,
      division: this.nuevoGrupo.division,
      grado: this.nuevoGrupo.grado,
      carrera: this.nuevoGrupo.carrera,
      data: this.nuevoGrupo.data || {}
    };
    try {
      const res = await fetch('https://horarios-backend-58w8.onrender.com/grupos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error('Error al crear el grupo');
      const data = await res.json();
      this.grupos.push({
        id: data.id || crypto.randomUUID(),
        nombre: data.nombre,
        division: data.division,
        grado: data.grado,
        carrera: data.carrera,
        data: data.data || {}
      });
      this.nuevoGrupo = { id: '', nombre: '', division: '', grado: 1, carrera: '', data: {} };
    } catch (err) {
      alert('No se pudo crear el grupo: ' + err);
    }
  }

  // Inicia la edición de un grupo
  editarGrupo(grupo: Grupo): void {
    this.grupoEditando = { ...grupo };
    this.nuevoGrupo = { ...grupo }; // Copia los datos al formulario
  }

  // Guardar los cambios de un grupo editado
  async guardarEdicion() {
    if (!this.nuevoGrupo.nombre || !this.nuevoGrupo.division || !this.nuevoGrupo.carrera || !this.nuevoGrupo.grado) {
      alert('Debes completar todos los campos obligatorios.');
      return;
    }
    if (!this.grupoEditando) return;
    const body = {
      nombre: this.nuevoGrupo.nombre,
      division: this.nuevoGrupo.division,
      grado: this.nuevoGrupo.grado,
      carrera: this.nuevoGrupo.carrera,
      data: this.nuevoGrupo.data || {}
    };
    try {
      const res = await fetch(`https://horarios-backend-58w8.onrender.com/grupos/${this.grupoEditando.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error('Error al editar el grupo');
      const data = await res.json();
      const index = this.grupos.findIndex(g => g.id === this.grupoEditando!.id);
      if (index !== -1) {
        this.grupos[index] = {
          id: this.grupoEditando.id,
          nombre: body.nombre,
          division: body.division,
          grado: body.grado,
          carrera: body.carrera,
          data: body.data
        };
      }
      this.grupoEditando = null;
      this.nuevoGrupo = { id: '', nombre: '', division: '', grado: 1, carrera: '', data: {} };
    } catch (err) {
      alert('No se pudo editar el grupo: ' + err);
    }
  }

  // Cancelar edición
  cancelarEdicion(): void {
    this.grupoEditando = null;
    this.nuevoGrupo = { id: '', nombre: '', division: '', grado: 1, carrera: '', data: {} };
  }

  // Eliminar un grupo
  async eliminarGrupo(id: string) {
    try {
      const res = await fetch(`https://horarios-backend-58w8.onrender.com/grupos/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Error al eliminar el grupo');
      this.grupos = this.grupos.filter(g => g.id !== id);
    } catch (err) {
      alert('No se pudo eliminar el grupo: ' + err);
    }
  }
}
