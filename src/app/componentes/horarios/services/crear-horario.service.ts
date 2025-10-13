import { Injectable } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormControl,
  FormArray,
  Validators,
} from '@angular/forms';

// --- (reusar los tipos anteriores) ---
type DayShort = 'Lun'|'Mar'|'Mie'|'Jue'|'Vie'|'Sab'|'Dom';
export interface ClaseData { horaInicio: string; horaFin: string; profesorNombre: string; materiaNombre: string; salonNombre: string; }
export interface DiaData { dia: DayShort; clases: ClaseData[]; }
export interface HorarioData { nombre: string; ciclo?: string; dias: DiaData[]; }

@Injectable({ providedIn: 'root' })
export class HorarioFormService {
  // patrón para 'HH:mm' (24h)
  private horaPattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

  constructor(private fb: FormBuilder) {}

  // -------- FormGroups tipados (Angular 14+ permite tipos más estrictos, aquí usamos la forma práctica) --------

  // FormGroup que representa una clase (ClaseData)
  createClaseGroup(c?: Partial<ClaseData>): FormGroup {
    return this.fb.group({
      horaInicio: [c?.horaInicio ?? '', [Validators.required, Validators.pattern(this.horaPattern)]],
      horaFin:    [c?.horaFin    ?? '', [Validators.required, Validators.pattern(this.horaPattern)]],
      profesorNombre: [c?.profesorNombre ?? '', Validators.required],
      materiaNombre:  [c?.materiaNombre ?? '', Validators.required],
      salonNombre:    [c?.salonNombre ?? '', Validators.required],
    });
  }

  // FormGroup que representa un día (DiaData) y contiene un FormArray de clases
  createDiaGroup(d?: Partial<DiaData>): FormGroup {
    const clasesArr = this.fb.array<FormGroup>(
      (d?.clases ?? []).map(cl => this.createClaseGroup(cl))
    );

    return this.fb.group({
      dia: [d?.dia ?? 'Lun', Validators.required],
      clases: clasesArr
    });
  }

  // FormGroup padre que representa todo el horario
  createHorarioGroup(h?: Partial<HorarioData>): FormGroup {
    const diasArr = this.fb.array<FormGroup>(
      (h?.dias ?? []).map(d => this.createDiaGroup(d))
    );

    return this.fb.group({
      nombre: [h?.nombre ?? '', Validators.required],
      ciclo:  [h?.ciclo ?? ''],
      dias: diasArr
    });
  }

  // ------------------ Helpers para acceder a arrays y manipularlos ------------------

  // getters utilitarios (reciben el FormGroup padre o un DayGroup)
  getDiasArray(horarioGroup: FormGroup): FormArray {
    return horarioGroup.get('dias') as FormArray;
  }

  getClasesArray(diaGroup: FormGroup): FormArray {
    return diaGroup.get('clases') as FormArray;
  }

  // añadir / eliminar días
  addDia(horarioGroup: FormGroup, d?: Partial<DiaData>) {
    this.getDiasArray(horarioGroup).push(this.createDiaGroup(d));
  }

  removeDia(horarioGroup: FormGroup, index: number) {
    this.getDiasArray(horarioGroup).removeAt(index);
  }

  // añadir / eliminar clases dentro de un día
  addClase(diaGroup: FormGroup, c?: Partial<ClaseData>) {
    this.getClasesArray(diaGroup).push(this.createClaseGroup(c));
  }

  removeClase(diaGroup: FormGroup, index: number) {
    this.getClasesArray(diaGroup).removeAt(index);
  }

  // ejemplo: inicializar formulario vacío o desde datos
  buildHorario(h?: Partial<HorarioData>): FormGroup {
    return this.createHorarioGroup(h);
  }

  // obtener el valor tipado (usando getRawValue para incluir disabled controls si fuera el caso)
  getHorarioValue(horarioGroup: FormGroup): HorarioData {
    return horarioGroup.getRawValue() as HorarioData;
  }

  // ----------------------- utilidad: validar solapamientos simples -----------------------
  // valida que dentro de un mismo día no haya clases que se solapen
  // devuelve array de índices de clases que tienen conflicto (puedes usarlo para marcar errores)
  findConflictsInDia(diaGroup: FormGroup): number[] {
    const clases = this.getClasesArray(diaGroup).controls.map(ctrl => ctrl.value as ClaseData);
    const toMinutes = (h: string) => {
      const [hh, mm] = h.split(':').map(Number);
      return hh*60 + mm;
    };
    const conflicts: number[] = [];

    for (let i = 0; i < clases.length; i++) {
      const aStart = toMinutes(clases[i].horaInicio);
      const aEnd   = toMinutes(clases[i].horaFin);
      for (let j = 0; j < clases.length; j++) {
        if (i === j) continue;
        const bStart = toMinutes(clases[j].horaInicio);
        const bEnd   = toMinutes(clases[j].horaFin);
        // solapan si aStart < bEnd && bStart < aEnd
        if (aStart < bEnd && bStart < aEnd) {
          conflicts.push(i);
          break;
        }
      }
    }
    return Array.from(new Set(conflicts));
  }
}
