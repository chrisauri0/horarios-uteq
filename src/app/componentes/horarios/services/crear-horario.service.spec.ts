import { TestBed } from '@angular/core/testing';
import { FormGroup } from '@angular/forms';
import { HorarioData, HorarioFormService } from './crear-horario.service';

describe('Servicio de formulario de horario (HorarioFormService)', () => {
  let service: HorarioFormService;

  const horarioEjemplo: HorarioData = {
    nombre: 'IDGS15',
    ciclo: '2026-3',
    dias: [
      {
        dia: 'Lun',
        clases: [
          { horaInicio: '17:00', horaFin: '18:00', profesorNombre: 'Ana Ruiz', materiaNombre: 'Cálculo', salonNombre: 'A1' },
        ],
      },
    ],
  };

  const clase = (horaInicio: string, horaFin: string) => ({
    horaInicio,
    horaFin,
    profesorNombre: 'Prof',
    materiaNombre: 'Materia',
    salonNombre: 'Salón',
  });

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HorarioFormService);
  });

  it('HFS-01: buildHorario() sin datos crea un formulario vacío e inválido (nombre requerido)', () => {
    const form = service.buildHorario();

    expect(form.get('nombre')?.value).toBe('');
    expect(form.get('nombre')?.hasError('required')).toBeTrue();
    expect(service.getDiasArray(form).length).toBe(0);
    expect(form.valid).toBeFalse();
  });

  it('HFS-02: buildHorario() con datos arma días y clases anidados y getHorarioValue() los regresa igual', () => {
    const form = service.buildHorario(horarioEjemplo);

    expect(form.valid).toBeTrue();
    expect(service.getDiasArray(form).length).toBe(1);
    expect(service.getHorarioValue(form)).toEqual(horarioEjemplo);
  });

  it('HFS-03: valida el formato de hora HH:mm (24 h)', () => {
    const grupo = service.createClaseGroup();
    const horaInicio = grupo.get('horaInicio')!;

    horaInicio.setValue('');
    expect(horaInicio.hasError('required')).toBeTrue();

    horaInicio.setValue('7:00');
    expect(horaInicio.hasError('pattern')).toBeTrue();

    horaInicio.setValue('24:00');
    expect(horaInicio.hasError('pattern')).toBeTrue();

    horaInicio.setValue('17:60');
    expect(horaInicio.hasError('pattern')).toBeTrue();

    horaInicio.setValue('23:59');
    expect(horaInicio.valid).toBeTrue();
  });

  it('HFS-04: una clase sin profesor, materia o salón es inválida', () => {
    const grupo = service.createClaseGroup({ horaInicio: '17:00', horaFin: '18:00' });

    expect(grupo.get('profesorNombre')?.hasError('required')).toBeTrue();
    expect(grupo.get('materiaNombre')?.hasError('required')).toBeTrue();
    expect(grupo.get('salonNombre')?.hasError('required')).toBeTrue();
    expect(grupo.valid).toBeFalse();
  });

  it('HFS-05: createDiaGroup() usa "Lun" como día por defecto', () => {
    const dia = service.createDiaGroup();

    expect(dia.get('dia')?.value).toBe('Lun');
    expect(service.getClasesArray(dia).length).toBe(0);
  });

  it('HFS-06: addDia() / removeDia() agregan y quitan días', () => {
    const form = service.buildHorario({ nombre: 'IDGS15' });

    service.addDia(form, { dia: 'Mar' });
    service.addDia(form, { dia: 'Mie' });
    expect(service.getDiasArray(form).length).toBe(2);

    service.removeDia(form, 0);
    expect(service.getDiasArray(form).length).toBe(1);
    expect(service.getDiasArray(form).at(0).get('dia')?.value).toBe('Mie');
  });

  it('HFS-07: addClase() / removeClase() agregan y quitan clases de un día', () => {
    const dia = service.createDiaGroup({ dia: 'Jue' });

    service.addClase(dia, clase('17:00', '18:00'));
    service.addClase(dia, clase('18:00', '19:00'));
    expect(service.getClasesArray(dia).length).toBe(2);

    service.removeClase(dia, 1);
    expect(service.getClasesArray(dia).length).toBe(1);
  });

  it('HFS-08: findConflictsInDia() detecta clases que se enciman', () => {
    const dia: FormGroup = service.createDiaGroup({
      dia: 'Lun',
      clases: [clase('17:00', '18:00'), clase('17:30', '18:30'), clase('19:00', '20:00')],
    });

    expect(service.findConflictsInDia(dia)).toEqual([0, 1]);
  });

  it('HFS-09: findConflictsInDia() no marca conflicto en clases consecutivas', () => {
    const dia: FormGroup = service.createDiaGroup({
      dia: 'Lun',
      clases: [clase('17:00', '18:00'), clase('18:00', '19:00'), clase('19:00', '20:00')],
    });

    expect(service.findConflictsInDia(dia)).toEqual([]);
  });
});
