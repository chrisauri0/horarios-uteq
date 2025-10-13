import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';

interface Slot {
  etiqueta: string;
  asignatura?: any;
  profesor?: any;
  salon?: any;
}

interface Dia {
  dia_nombre: string;
  slots: Slot[];
}

interface Horario {
  grupo_nombre: string;
  dias: Dia[];
}




@Component({
  selector: 'app-crear-horario',
  standalone: true,
  imports: [CommonModule, FormsModule, NgSelectModule],
  templateUrl: './crear-horario.html',
  styleUrls: ['./crear-horario.scss']
})
export class CrearHorarioComponent {
 dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
  slots = ['08:00', '09:00', '10:00', '11:00']; // ajusta según necesites

  // datos de ejemplo (pueden ser strings o objetos con propiedad nombre)
  materias = [{ nombre: 'Matemáticas' }, { nombre: 'Física' }, { nombre: 'Prog.' }];
  profesores = [{ nombre: 'Ana Pérez' }, { nombre: 'Juan Ruiz' }];
  salones = [{ nombre: 'A101' }, { nombre: 'B203' }];

  horarios: Horario[] = [];

  nuevoHorario: Horario = this.crearHorarioVacio();

  crearHorarioVacio(): Horario {
    const diasObj: Dia[] = this.dias.map(dia => ({
      dia_nombre: dia,
      slots: this.slots.map(etq => ({ etiqueta: etq }))
    }));
    return { grupo_nombre: '', dias: diasObj };
  }

  onSubmit() {
    // validación breve
    if (!this.nuevoHorario.grupo_nombre?.trim()) {
      alert('Ingresa un nombre de grupo.');
      return;
    }
    // clonar para evitar referencias
    this.horarios.push(JSON.parse(JSON.stringify(this.nuevoHorario)));
    this.nuevoHorario = this.crearHorarioVacio();
  }

  previsualizar() {
    // solo para debug o abrir modal
    console.log('Previsualizar', this.nuevoHorario);
    alert('Ver consola para previsualización rápida.');
  }

  resetHorario() {
    if (confirm('¿Deseas resetear el formulario?')) {
      this.nuevoHorario = this.crearHorarioVacio();
    }
  }

  resetDia(dIdx: number) {
    this.nuevoHorario.dias[dIdx].slots.forEach(s => { s.asignatura = undefined; s.profesor = undefined; s.salon = undefined; });
  }

  vaciarSlot(dIdx: number, sIdx: number) {
    const s = this.nuevoHorario.dias[dIdx].slots[sIdx];
    s.asignatura = undefined; s.profesor = undefined; s.salon = undefined;
  }

  editarHorario(index: number) {
    // carga el horario al formulario para editar: elimina de la lista para luego guardar
    const h = this.horarios.splice(index, 1)[0];
    this.nuevoHorario = JSON.parse(JSON.stringify(h));
    // scroll o foco opcional
  }

  eliminarHorario(index: number) {
    if (confirm('Eliminar horario?')) this.horarios.splice(index, 1);
  }

}
