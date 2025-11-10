import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VerHorarios } from './ver-horarios/ver-horarios';

@Component({
  selector: 'app-scheduler',
  imports: [CommonModule, ],
  templateUrl: './scheduler.html',
  styleUrls: ['./scheduler.scss']
})
export class SchedulerComponent {
  loading = false;
  message = '';
  isSuccess = false;

  generateSchedule() {
    this.loading = true;
    this.message = '';
    this.isSuccess = false;

    fetch('http://localhost:3000/scheduler/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    })
      .then(async res => {
        if (!res.ok) throw new Error('Error al generar los horarios');
        const response = await res.json();
        this.loading = false;
        this.isSuccess = true;
        this.message = '✅ Horarios generados correctamente.';
        console.log('Respuesta del backend:', response);
      })
      .catch(error => {
        this.loading = false;
        this.isSuccess = false;
        this.message = '❌ Ocurrió un error al generar los horarios.';
        console.error('Error:', error);
      });
  }


  
}
