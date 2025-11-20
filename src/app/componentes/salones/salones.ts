import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
export interface salonesData {
  id: string;
  nombre: string;
  division: string;
}

@Component({
  selector: 'app-salones',
  imports: [CommonModule, FormsModule],
  templateUrl: './salones.html',
  styleUrls: ['./salones.scss']
})
export class SalonesComponent {
  usuarioNombre: string = '';
  usuarioCarrera: string = '';
  sidebarCollapsed = false;

  salones: salonesData[] = [];
  nuevoSalon: salonesData = { id: '', nombre: '', division: '' };
  editandoId: string | null = null;

  ngOnInit() {
    const usuarioData = localStorage.getItem('userData');
    if (usuarioData) {
      const { full_name,metadata: { division , turno } } = JSON.parse(usuarioData);
      this.usuarioNombre = full_name || 'Usuario';
      this.usuarioCarrera = `${division || ''} - ${turno || ''}`;
      
    } else {
      this.usuarioNombre = 'Usuario';
      this.usuarioCarrera = '';
    }
    this.cargarSalones();
  }

  async cargarSalones() {
    // Intentar cargar desde localStorage primero
    const cache = localStorage.getItem('salonesCache');
    if (cache) {
      try {
        const cacheData = JSON.parse(cache);
        this.salones = Array.isArray(cacheData) ? cacheData : [];
      } catch {}
    }

    try {
      const res = await fetch('http://localhost:3000/salones');
      if (!res.ok) throw new Error('Error al obtener salones');
      const data = await res.json();
      // La nueva API devuelve { id, nombre, data } donde data puede tener edificio
      const salonesList = Array.isArray(data) ? data.map((s, idx) => ({
        id: s.id || idx,
        nombre: s.nombre,
        division: s.division
      })) : [];
      // Solo actualiza si hay cambios
      if (JSON.stringify(salonesList) !== localStorage.getItem('salonesCache')) {
        this.salones = salonesList;
        localStorage.setItem('salonesCache', JSON.stringify(salonesList));
      }
    } catch (err) {
      alert('No se pudo cargar la lista de salones: ' + err);
    }
  }

  async agregarSalon() {
    if (!this.nuevoSalon.nombre.trim()) return;
    const body = {
      nombre: this.nuevoSalon.nombre,
      division: this.nuevoSalon.division
    };
    try {
      const res = await fetch('http://localhost:3000/salones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error('Error al crear el salón');
      const data = await res.json();

      if (data.error) {
        alert(data.error);
        return;
      }
      this.salones.push({
        id: data.id || Date.now(),
        nombre: data.nombre,
        division: data.division
      });
      this.nuevoSalon = { id: '', nombre: '' , division: '' };
    } catch (err) {
      alert('No se pudo crear el salón: ' + err);
    }
  }

  async eliminarSalon(id: string) {
    try {
      const res = await fetch(`http://localhost:3000/salones/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Error al eliminar el salón');
      this.salones = this.salones.filter(s => s.id !== id);
    } catch (err) {
      alert('No se pudo eliminar el salón: ' + err);
    }
  }

  editarSalon(salon: salonesData) {
    this.editandoId = salon.id;
    this.nuevoSalon = { ...salon };
  }

  async guardarEdicion() {
    if (!this.nuevoSalon.nombre.trim()) return;
    if (!this.editandoId) return;
    const body: any = {
      nombre: this.nuevoSalon.nombre
    };
    try {
      const res = await fetch(`http://localhost:3000/salones/${this.editandoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error('Error al editar el salón');
      const data = await res.json();
      this.salones = this.salones.map(s => s.id === this.editandoId ? {
        id: this.editandoId!,
        nombre: body.nombre,
        division: this.nuevoSalon.division
      } : s);
      this.nuevoSalon = { id: '', nombre: '' , division: '' };
      this.editandoId = null;
    } catch (err) {
      alert('No se pudo editar el salón: ' + err);
    }
  }

  cancelarEdicion() {
    this.nuevoSalon = { id: '', nombre: '' , division: '' };
    this.editandoId = null;
  }
}

