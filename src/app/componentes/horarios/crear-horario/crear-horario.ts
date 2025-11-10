import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';


@Component({
  selector: 'app-crear-horario',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgSelectModule],
  templateUrl: './crear-horario.html',
  styleUrls: ['./crear-horario.scss']
})
export class CrearHorarioComponent implements OnInit {
  constructor(
   
  ) {}

  ngOnInit(): void {

  }

  async cargarProfesores() {
  }

 

 





}
