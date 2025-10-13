import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { HorarioFormService, HorarioData, DiaData, ClaseData } from '../services/crear-horario.service';

@Component({
  selector: 'app-crear-horario',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgSelectModule],
  templateUrl: './crear-horario.html',
  styleUrls: ['./crear-horario.scss']
})
export class CrearHorarioComponent implements OnInit {
  horarioForm!: FormGroup;

  // inyectamos el servicio como privado (encapsulado)
  constructor(
    private fb: FormBuilder,
    private horarioService: HorarioFormService
  ) {}

  ngOnInit(): void {
    // inicializamos el formulario con 1 día y 1 clase como ejemplo
    this.horarioForm = this.horarioService.buildHorario({
      nombre: 'Horario Semestral',
      ciclo: '2025-1',
      dias: [
        {
          dia: 'Lun',
          clases: [
            {
              horaInicio: '08:00',
              horaFin: '09:30',
              profesorNombre: 'Ana',
              materiaNombre: 'Matemáticas',
              salonNombre: 'A1'
            },
            {
              horaInicio: '10:00',
              horaFin: '11:30',
              profesorNombre: 'Luis',
              materiaNombre: 'Programación',
              salonNombre: 'B2'
            }
          ]
        }
      ]
    });

    // ejemplo: añadir otro día vacío si quieres
    // this.horarioService.addDia(this.horarioForm);
  }

  // ---------------- Helpers públicos para la plantilla ----------------

  // devuelve el FormArray de días del formulario padre
  get diasArray(): FormArray {
    return this.horarioService.getDiasArray(this.horarioForm);
  }

  // devuelve el FormArray de clases para un FormGroup día (por índice)
  getClasesArrayAt(diaIndex: number): FormArray {
    const diaGroup = this.diasArray.at(diaIndex) as FormGroup;
    return this.horarioService.getClasesArray(diaGroup);
  }

  // añadir / remover día (usa el servicio)
  addDia() {
    this.horarioService.addDia(this.horarioForm);
  }

  removeDia(index: number) {
    this.horarioService.removeDia(this.horarioForm, index);
  }

  // añadir / remover clase dentro de un día (delegamos al servicio)
  addClaseToDia(diaIndex: number, c?: Partial<ClaseData>) {
    const diaGroup = this.diasArray.at(diaIndex) as FormGroup;
    this.horarioService.addClase(diaGroup, c);
  }

  removeClaseFromDia(diaIndex: number, claseIndex: number) {
    const diaGroup = this.diasArray.at(diaIndex) as FormGroup;
    this.horarioService.removeClase(diaGroup, claseIndex);
  }

  // obtener el valor tipado para enviar o ver
  getHorarioValue(): HorarioData {
    return this.horarioService.getHorarioValue(this.horarioForm);
  }

  // utilidad rápida para chequear conflictos en un día
  findConflictsInDia(diaIndex: number): number[] {
    const diaGroup = this.diasArray.at(diaIndex) as FormGroup;
    return this.horarioService.findConflictsInDia(diaGroup);
  }
  verConsola() {
    console.log(this.getHorarioValue());
  }
}
