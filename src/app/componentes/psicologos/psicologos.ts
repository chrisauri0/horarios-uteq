import { Component } from '@angular/core';
import { CommonModule, Time } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { RouterModule } from '@angular/router';

export interface PsicologoData {
  psicologo_id?: string
    nombre: string
    apellidos: string
    email: string
    disponibilidad: bloques[];
    area_id: number   

}
export interface bloques {
  dias: string[]
  hora_inicio: string
  hora_fin: string
}

@Component({
  selector: 'app-psicologos',
  standalone: true,
  imports: [CommonModule, FormsModule, NgSelectModule, RouterModule],

  templateUrl: './psicologos.html',
  styleUrl: './psicologos.scss'
})
export class Psicologos {
  private API_DEPLOY = 'https://horarios-backend-58w8.onrender.com/psicologos';
  private API_LOCAL = 'https://horarios-backend-58w8.onrender.com/psicologos';

  psicologos: PsicologoData[] = [];
  editandoId: string | null = null;
 dias: string[] = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado'
];

bloques = [
  {
    dias: [] as string[],
    hora_inicio: '',
    hora_fin: ''
  }
];
  nuevoPsicologo: PsicologoData = {
    nombre: '',
    apellidos: '',
    email: '',
    disponibilidad: this.bloques,
    area_id: 1
  };

  ngOnInit() {
    this.cargarPsicologos();  
  }

   private lastPsicologosJson: string = '';

  async agregarBloque() {
    this.bloques.push({
      dias: [],
      hora_inicio: '',
      hora_fin: ''
    });
  }

  toggleDia(bloqueIndex: number, dia: string) {
  const dias = this.bloques[bloqueIndex].dias;

  if (dias.includes(dia)) {
    this.bloques[bloqueIndex].dias =
      dias.filter(d => d !== dia);
  } else {
    this.bloques[bloqueIndex].dias.push(dia);
  }
}

  async cargarPsicologos() {
       try {
      const res = await fetch(this.API_LOCAL);
      if (!res.ok) throw new Error('Error al obtener psicólogos');
      const data = await res.json();
      const newJson = JSON.stringify(data);
      if (newJson === this.lastPsicologosJson) {
        // No hay cambios, no actualiza la lista
        return;
      }
      this.psicologos = Array.isArray(data) ? data : [];
      this.lastPsicologosJson = newJson;
      localStorage.setItem('psicologosCache', newJson);
    } catch (err) {
      alert('No se pudo cargar la lista de psicólogos: ' + err);
    }
  }


  async crearPsicologo() {

    
    try {

      if (this.bloques.length === 0) {
      alert('Debes agregar al menos un bloque');
      return;
    }

    // 🔥 2️⃣ Filtrar bloques válidos
    const bloquesValidos = this.bloques.filter(
      b => b.dias.length > 0 && b.hora_inicio && b.hora_fin
    );

    if (bloquesValidos.length === 0) {
      alert('Todos los bloques están vacíos o incompletos');
      return;
    }

    // 🔥 3️⃣ Crear payload limpio
    const payload = {
      ...this.nuevoPsicologo,
      disponibilidad: bloquesValidos
    };


      const res = await fetch(this.API_LOCAL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Error al crear psicólogo');
      const data = await res.json();
      this.psicologos.push(data);
      this.nuevoPsicologo = {
        nombre: '',
        apellidos: '',
        email: '',
        disponibilidad: this.bloques,
        area_id:1
      };
    } catch (err) {
      alert('Error al crear psicólogo: ' + err);
    }
  }

  async editarPsicologo(psicologo: PsicologoData) {
  }
  




  async guardarEdicion() {}

  async cancelarEdicion() {}


  async eliminarPsicologo(id: string) {}
}
