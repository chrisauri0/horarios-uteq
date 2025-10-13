import { Routes } from '@angular/router';
import { BienvenidaComponent } from './componentes/bienvenida/bienvenida'; 
import { DashboardComponent } from './componentes/dashboard/dashboard'; 
import { HorariosComponent } from './componentes/horarios/horarios';
import { SalonesComponent } from './componentes/salones/salones';
import { NotFound } from './componentes/not-found/not-found';
import { CrearHorarioComponent } from './componentes/horarios/crear-horario/crear-horario';
import { ProfesoresComponent } from './componentes/profesores/profesores';


export const routes: Routes = [
  { path: '', component: BienvenidaComponent },
  { path: 'dashboard', component: DashboardComponent , title: 'Dashboard'},
  { path: 'salones', component: SalonesComponent , title: 'Salones'},
  { path: 'Profesores', component: ProfesoresComponent , title: 'Profesores'},
  {
    path: 'horarios',
    children: [
      { path: '', redirectTo: 'ver', pathMatch: 'full' },
      { path: 'ver', component: HorariosComponent },
      { path: 'nuevo', component: CrearHorarioComponent },
      { path: ':id', component: HorariosComponent },
      { path: ':id/editar', component: HorariosComponent },
    ],
  },
  { path: '**', component: NotFound , title: 'Página no encontrada' },
];
