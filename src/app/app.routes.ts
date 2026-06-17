import { Routes } from '@angular/router';
import { BienvenidaComponent } from './componentes/bienvenida/bienvenida'; 
import { DashboardComponent } from './componentes/dashboard/dashboard'; 
import { HorariosComponent } from './componentes/horarios/horarios';
import { SalonesComponent } from './componentes/salones/salones';
import { NotFound } from './componentes/not-found/not-found';
import { CrearHorarioComponent } from './componentes/horarios/crear-horario/crear-horario';
import { ProfesoresComponent } from './componentes/profesores/profesores';
import { Materias } from './componentes/materias/materias';
import { GruposComponent } from './componentes/grupos/grupos';
import { SchedulerComponent } from './componentes/scheduler/scheduler';
import { VerHorarios } from './componentes/scheduler/ver-horarios/ver-horarios';
import { Carreras } from './componentes/carreras/carreras';
import { Psicologos } from './componentes/psicologos/psicologos';
import { LandingPage } from './pages/landing-page/landing-page';


export const routes: Routes = [
  {  path: '', component: LandingPage, title: 'Página de Inicio' },
  {  path: 'login', component: BienvenidaComponent, title: 'Iniciar Sesión' },
  { path: 'dashboard', component: DashboardComponent , title: 'Dashboard'},
  { path: 'salones', component: SalonesComponent , title: 'Salones'},
  { path: 'profesores', component: ProfesoresComponent , title: 'Profesores'},
  { path: 'materias', component: Materias , title: 'Materias'},
  { path: 'grupos', component: GruposComponent , title: 'Grupos'},
  { path: 'carreras', component: Carreras , title: 'Carreras'},
  {path: 'psicologos', component: Psicologos , title: 'Psicólogos'},
  {
    path: 'horarios',
    children: [
      { path: '', redirectTo: 'ver', pathMatch: 'full' },
      { path: 'ver', component: VerHorarios , title: 'Ver Horarios'},
      { path: 'nuevo', component: SchedulerComponent },
      { path: ':id', component: HorariosComponent },
      { path: ':id/editar', component: HorariosComponent },
    ],
  },
  { path: '**', component: NotFound , title: 'Página no encontrada' },
];
