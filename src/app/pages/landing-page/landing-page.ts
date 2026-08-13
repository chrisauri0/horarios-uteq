import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-landing-page',
 standalone: true,
  imports: [CommonModule],
    templateUrl: './landing-page.html',
  styleUrl: './landing-page.scss'
})
export class LandingPage {

   features = [
    {
      icon: '◈',
      title: 'Generación Automática',
      desc: 'Crea horarios completos en segundos aplicando restricciones académicas reales.',
    },
    {
      icon: '◉',
      title: 'Sin Conflictos',
      desc: 'Detecta y resuelve colisiones de aulas, docentes y materias de forma inteligente.',
    },
    {
      icon: '◆',
      title: 'Personalizable',
      desc: 'Configura disponibilidades, preferencias y parámetros según tu institución.',
    },
    {
      icon: '◇',
      title: 'Exportable',
      desc: 'Descarga los horarios generados en múltiples formatos para su distribución.',
    },
  ];
 
  steps = [
    { num: '01', label: 'Ingresa datos', detail: 'Docentes, materias y aulas disponibles' },
    { num: '02', label: 'Define restricciones', detail: 'Horarios, cargas y preferencias' },
    { num: '03', label: 'Genera', detail: 'El sistema calcula el horario óptimo' },
    { num: '04', label: 'Exporta', detail: 'Comparte el resultado con tu equipo' },
  ];
 
  currentYear = new Date().getFullYear();

}
