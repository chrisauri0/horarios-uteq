import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { Materia } from '../materias/materias';
import { RouterModule } from '@angular/router';

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
    // metadata: {}
  };
  editandoId: string | null = null;
  modalAbierto = false;

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


  async cargarMaterias() {
    const localKey = 'materias-cache';
    const localHashKey = 'materias-cache-hash';
    // Intenta cargar desde localStorage
    const cache = localStorage.getItem(localKey);
    const cacheHash = localStorage.getItem(localHashKey);
    let materiasLocal: Materia[] = [];
    if (cache) {
      try {
        materiasLocal = JSON.parse(cache);
        this.materias = materiasLocal;
        this.materiasOpciones = materiasLocal.map(m => m.nombre);
        console.log('Cargado desde cache localStorage');
      } catch { }
    }

    // Siempre consulta el backend para obtener el hash actual
    try {
      const res = await fetch('https://horarios-backend-58w8.onrender.com/materias/hash');
      if (!res.ok) throw new Error('Error al obtener hash de materias');
      const { hash } = await res.json();
      if (hash === cacheHash && materiasLocal.length > 0) {
        // No hay cambios, no hace falta pedir la lista
        return;
      }
      // Si el hash cambió, pide la lista actualizada
      const resList = await fetch('https://horarios-backend-58w8.onrender.com/materias');
      if (!resList.ok) throw new Error('Error al obtener materias');
      const data = await resList.json();
      this.materias = Array.isArray(data) ? data.map((m: any) => ({
        id: m.id,
        nombre: m.nombre,
        grado: m.grado,
        carrera: m.carrera,
        horas_semana: m.horas_semana,
        data: m.data || {}
      })) : [];
      this.materiasOpciones = this.materias.map(m => m.nombre);
      localStorage.setItem(localKey, JSON.stringify(this.materias));
      localStorage.setItem(localHashKey, hash);
    } catch (err) {
      alert('No se pudo cargar la lista de materias: ' + err);
    }
  }

  private lastProfesoresJson: string = '';

  async cargarProfesores() {


    try {
      const res = await fetch('http://localhost:3000/profesores');
      if (!res.ok) throw new Error('Error al obtener profesores');
      const data = await res.json();
      const newJson = JSON.stringify(data);
      if (newJson === this.lastProfesoresJson) {
        // No hay cambios, no actualiza la lista
        return;
      }
      this.profesores = Array.isArray(data) ? data : [];
      this.lastProfesoresJson = newJson;
      localStorage.setItem('profesoresCache', newJson);
    } catch (err) {
      alert('No se pudo cargar la lista de profesores: ' + err);
    }
  }

  async agregarProfesor() {

    const nombre = this.nuevoProfesor.nombre.trim();
    const apellidos = this.nuevoProfesor.apellidos.trim();

    const metadata = {
      ...(this.nuevoProfesor.metadata || {}),
      disponibilidad: this.bloquesValidos()
    };

    // Construir el body para el endpoint
    const body = {
      nombre,
      apellidos,
      email: this.nuevoProfesor.email,
      can_be_tutor: !!this.nuevoProfesor.can_be_tutor,
      materias: this.nuevoProfesor.materias,
      disponibilidad: this.bloquesValidos(),
      metadata
    };

    // Verificar si ya existe un profesor con los mismos datos
    const existe = this.profesores.some(p =>
      p.nombre === this.nuevoProfesor.nombre &&
      p.apellidos === this.nuevoProfesor.apellidos &&
      p.email === this.nuevoProfesor.email &&
      p.can_be_tutor === this.nuevoProfesor.can_be_tutor &&
      JSON.stringify(p.materias) === JSON.stringify(this.nuevoProfesor.materias) &&
      JSON.stringify(p.metadata) === JSON.stringify(metadata)
    );
    if (existe) {
      alert('No hay cambios en los datos del profesor. No se enviará la petición.');
      return;
    }

    try {
      console.log('Enviando nuevo profesor al backend:', body);
      console.log('Bloques de disponibilidad enviados:', body.disponibilidad);
      // const res = await fetch('https://horarios-backend-58w8.onrender.com/profesores', {
      const res = await fetch('http://localhost:3000/profesores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error('Error al crear el profesor');
      const data = await res.json();
      // Usar el id real devuelto por el backend
      this.profesores.push({ ...this.nuevoProfesor, metadata, profesor_id: data.profesor_id });
      this.nuevoProfesor = { profesor_id: '', nombre: '', apellidos: '', email: '', can_be_tutor: false, materias: [], metadata: {} };
      this.resetBloques();
      this.modalAbierto = false;
    } catch (err) {
      alert('No se pudo crear el profesor: ' + err);
    }
  }

  async guardarEdicion() {
    if (!this.nuevoProfesor.nombre.trim() || !this.nuevoProfesor.email.trim()) return;
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

    try {
      const res = await fetch(`http://localhost:3000/profesores/${this.editandoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error('Error al actualizar el profesor');
      const data = await res.json();
      // Mantener el id al actualizar localmente
      this.profesores = this.profesores.map(p =>
        p.profesor_id === this.editandoId ? { ...p, ...body, profesor_id: p.profesor_id } : p
      );
      this.nuevoProfesor = { profesor_id: '', nombre: '', apellidos: '', email: '', can_be_tutor: false, materias: [], metadata: {},disponibilidad: [] };
      this.resetBloques();
      this.editandoId = null;
      this.modalAbierto = false;
      //recagar la lista de profesores para asegurar consistencia
      this.cargarProfesores();
    } catch (err) {
      alert('No se pudo actualizar el profesor: ' + err);
    }
  }

  async eliminarProfesor(profesor_id: string) {
    const confirmacion = confirm('¿Estás seguro de que deseas eliminar este profesor?');
    if (!confirmacion) return;
    try {
      const res = await fetch(`https://horarios-backend-58w8.onrender.com/profesores/${profesor_id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Error al eliminar el profesor');
      this.profesores = this.profesores.filter(p => p.profesor_id !== profesor_id);
    } catch (err) {
      alert('No se pudo eliminar el profesor: ' + err);
      console.log(profesor_id);
    }
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
