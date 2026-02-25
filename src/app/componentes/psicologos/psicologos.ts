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
  private API_LOCAL = 'http://localhost:3000/psicologos';


  // interfaz para representar un psicólogo

  psicologos: PsicologoData[] = [];
  editandoId: string | null = null;
  b = 1;
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



// Logica para cargar psicólogos al iniciar el componente


  ngOnInit() {
    this.cargarPsicologos();  
  }

  private lastPsicologosJson: string = '';




  // Funciones para manejar bloques de disponibilidad

  async agregarBloque() {
    this.bloques.push({
      dias: [],
      hora_inicio: '',
      hora_fin: ''
    });
  }
  async eliminarBloque(index: number) {
      this.bloques.splice(index, 1);
  }
  async toggleDia(bloqueIndex: number, dia: string) {
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
     this.psicologos = (Array.isArray(data) ? data : []).map(p => {

        let disponibilidadNormalizada = [];

        if (Array.isArray(p.disponibilidad)) {
          disponibilidadNormalizada = p.disponibilidad;
        } 
        else if (p.disponibilidad && typeof p.disponibilidad === 'object') {
          disponibilidadNormalizada = [p.disponibilidad]; // 👈 lo convertimos en array
        }

        return {
          ...p,
          disponibilidad: disponibilidadNormalizada
        };
      });
      console.log('Psicólogos cargados:', this.psicologos);
      this.lastPsicologosJson = newJson;
      localStorage.setItem('psicologosCache', newJson);
    } catch (err) {
      alert('No se pudo cargar la lista de psicólogos: ' + err);
    }
  }

  diaSeleccionadoEnOtroBloque(dia: string, bloqueActual: number): boolean {
  return this.bloques.some((bloque, idx) =>
    idx !== bloqueActual && bloque.dias.includes(dia)
  );
  }

  async crearPsicologo() {

    
    try {

      if (this.bloques.length === 0) {
      alert('Debes agregar al menos un bloque');
      return;
    }

    
    const bloquesValidos = this.bloques.filter(
      b => b.dias.length > 0 && b.hora_inicio && b.hora_fin
    );

    if (bloquesValidos.length === 0) {
      alert('Todos los bloques están vacíos o incompletos');
      return;
    }

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
      this.bloques = [
        {
          dias: [] as string[],
          hora_inicio: '',
          hora_fin: ''
        }
      ];
      
    } catch (err) {
      alert('Error al crear psicólogo: ' + err);
    }
  }

async editarPsicologo(psicologo: PsicologoData) {
  this.editandoId = psicologo.psicologo_id || null;

  this.nuevoPsicologo = {
    nombre: psicologo.nombre,
    apellidos: psicologo.apellidos,
    email: psicologo.email,
    disponibilidad: psicologo.disponibilidad,
    area_id: psicologo.area_id
  };

  this.bloques = Array.isArray(psicologo.disponibilidad)
    ? psicologo.disponibilidad.map(b => ({
        dias: b.dias || [],
        hora_inicio: b.hora_inicio || '',
        hora_fin: b.hora_fin || ''
      }))
    : [];
}
  




  async guardarEdicion() {}

  async cancelarEdicion() {
    this.editandoId = null;
    this.nuevoPsicologo = {
      nombre: '',
      apellidos: '',
      email: '',
      disponibilidad: this.bloques,
      area_id:1
    };
    this.bloques = [
      {
        dias: [] as string[],
        hora_inicio: '',
        hora_fin: ''
      }
    ];
  }


  async eliminarPsicologo(id: string) {}



}
