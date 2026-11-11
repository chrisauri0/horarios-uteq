import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VerHorarios } from './ver-horarios';
import { SchedulerService } from '../services/scheduler.service';

describe('VerHorarios (consulta de horarios por grupo)', () => {
  let component: VerHorarios;
  let fixture: ComponentFixture<VerHorarios>;
  let service: jasmine.SpyObj<SchedulerService>;

  const horariosMock = [
    {
      nombregrupo: 'IDGS15',
      data: [
        { start: 'Lun17', subj: 'Cálculo', prof: 'Ana Ruiz', room: 'A1' },
        { start: 'Mar18', subj: 'Inglés', prof: 'Luis Pérez', room: 'B2' },
        { start: 'Sab17', subj: 'Fuera de rango', prof: 'X', room: 'X' },
      ],
    },
    { nombregrupo: 'IDGS16', data: [] },
  ];

  const iniciar = async (respuesta: unknown = horariosMock) => {
    service.getHorarios.and.resolveTo(structuredClone(respuesta) as any[]);
    await component.ngOnInit();
    fixture.detectChanges();
  };

  beforeEach(async () => {
    spyOn(console, 'log');
    service = jasmine.createSpyObj<SchedulerService>('SchedulerService', ['getHorarios', 'clearCache']);
    service.getHorarios.and.resolveTo([]);

    await TestBed.configureTestingModule({
      imports: [VerHorarios],
      providers: [{ provide: SchedulerService, useValue: service }],
    }).compileComponents();

    fixture = TestBed.createComponent(VerHorarios);
    component = fixture.componentInstance;
  });

  it('VER-01: se crea el componente', async () => {
    await iniciar();
    expect(component).toBeTruthy();
  });

  it('VER-02: carga los grupos y selecciona el primero', async () => {
    await iniciar();

    expect(component.grupos).toEqual(['IDGS15', 'IDGS16']);
    expect(component.selectedGroup).toBe('IDGS15');
  });

  it('VER-03: acepta también la respuesta con formato { schedules: [...] }', async () => {
    await iniciar({ schedules: horariosMock });

    expect(component.grupos).toEqual(['IDGS15', 'IDGS16']);
  });

  it('VER-04: si no hay horarios no selecciona grupo', async () => {
    await iniciar([]);

    expect(component.grupos).toEqual([]);
    expect(component.selectedGroup).toBe('');
    expect(component.getHorariosPorGrupo()).toEqual([]);
  });

  it('VER-05: getHorariosPorGrupo() regresa solo las clases del grupo seleccionado', async () => {
    await iniciar();

    expect(component.getHorariosPorGrupo().length).toBe(3);
    component.selectedGroup = 'IDGS16';
    expect(component.getHorariosPorGrupo()).toEqual([]);
    component.selectedGroup = 'NO-EXISTE';
    expect(component.getHorariosPorGrupo()).toEqual([]);
  });

  it('VER-06: getHorarioGrid() acomoda cada clase en su día y hora', async () => {
    await iniciar();

    const grid = component.getHorarioGrid();

    expect(Object.keys(grid)).toEqual(['17', '18', '19', '20', '21']);
    expect(grid['17']['Lun'].subj).toBe('Cálculo');
    expect(grid['18']['Mar'].subj).toBe('Inglés');
    expect(grid['19']['Mie']).toBeNull();
    // Sábado no está en la semana mostrada, se ignora
    expect(grid['17']['Sab']).toBeUndefined();
  });

  it('VER-07: pinta la tabla con las materias del grupo seleccionado', async () => {
    await iniciar();
    const el: HTMLElement = fixture.nativeElement;

    const materias = Array.from(el.querySelectorAll('.horarios-table .materia')).map((m) => m.textContent?.trim());
    expect(materias).toEqual(['Cálculo', 'Inglés']);
    expect(el.querySelectorAll('select.select-group option').length).toBe(2);
  });

  it('VER-08: si el grupo no tiene clases muestra "No hay horarios disponibles."', async () => {
    await iniciar([{ nombregrupo: 'IDGS16', data: [] }]);
    const el: HTMLElement = fixture.nativeElement;

    expect(el.querySelector('table')).toBeNull();
    expect(el.querySelector('.no-data')?.textContent).toContain('No hay horarios disponibles.');
  });
});
