import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface Carrera {
  id: string;
  nombre: string;
  grado: number;
  division: string;
}

import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-carreras',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './carreras.html',
  styleUrl: './carreras.scss'
})
export class Carreras {
  carreras: Carrera[] = [];
  nuevaCarrera: Carrera = { id: '', nombre: '', grado: 1, division: '' };
  defaultDivision: string = '';
  editandoId: string | null = null;

  ngOnInit() {
    this.cargarCarreras();
    const usuarioData = localStorage.getItem('userData');
    if (usuarioData) {
      const { metadata: { division, turno } } = JSON.parse(usuarioData);
      this.defaultDivision = division || '';
      this.nuevaCarrera.division = this.defaultDivision;
    } else {
      this.defaultDivision = '';
      this.nuevaCarrera.division = '';
    }
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

  async agregarCarrera() {
    if (!this.nuevaCarrera.nombre.trim() || !this.nuevaCarrera.division.trim()) return;
    const body = {
      nombre: this.nuevaCarrera.nombre,
      grado: this.nuevaCarrera.grado,
      division: this.nuevaCarrera.division
    };
    try {
      const res = await fetch('https://horarios-backend-58w8.onrender.com/carreras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error('Error al crear la carrera');
      const data = await res.json();
      if (data.error) {
        alert(data.error);
        return;
      }
      this.carreras.push({
        id: data.id || Date.now().toString(),
        nombre: data.nombre,
        grado: data.grado,
        division: data.division
      });
      // reset form but preserve default division (from user metadata)
      this.nuevaCarrera = { id: '', nombre: '', grado: 1, division: this.defaultDivision };
    } catch (err) {
      alert('No se pudo crear la carrera: ' + err);
    }
  }

  editarCarrera(carrera: Carrera) {
    this.editandoId = carrera.id;
    this.nuevaCarrera = { ...carrera };
  }

  async guardarEdicion() {
    if (!this.nuevaCarrera.nombre.trim() || !this.nuevaCarrera.division.trim() || !this.editandoId) return;
    const body: any = {
      nombre: this.nuevaCarrera.nombre,
      grado: this.nuevaCarrera.grado,
      division: this.nuevaCarrera.division
    };
    try {
      const res = await fetch(`https://horarios-backend-58w8.onrender.com/carreras/${this.editandoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error('Error al editar la carrera');
      const data = await res.json();
      this.carreras = this.carreras.map(c => c.id === this.editandoId ? {
        id: this.editandoId!,
        nombre: body.nombre,
        grado: body.grado,
        division: body.division
      } : c);
      // reset form and restore default division
      this.nuevaCarrera = { id: '', nombre: '', grado: 1, division: this.defaultDivision };
      this.editandoId = null;
    } catch (err) {
      alert('No se pudo editar la carrera: ' + err);
    }
  }

  cancelarEdicion() {
    this.nuevaCarrera = { id: '', nombre: '', grado: 1, division: this.defaultDivision };
    this.editandoId = null;
  }

  async eliminarCarrera(id: string) {


    const confirmacion = window.confirm('¿Estás seguro de eliminar esta carrera?');
    if (!confirmacion) return;
    try {
      const res = await fetch(`https://horarios-backend-58w8.onrender.com/carreras/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Error al eliminar la carrera');
      this.carreras = this.carreras.filter(c => c.id !== id);
    } catch (err) {
      alert('No se pudo eliminar la carrera: ' + err);
    }
  }
}
