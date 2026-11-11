import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HorariosComponent } from './horarios';

describe('Horarios (vista de horario por grupo desde resultado.json)', () => {
  let component: HorariosComponent;
  let fixture: ComponentFixture<HorariosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HorariosComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HorariosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('HOR-01: se crea el componente', () => {
    expect(component).toBeTruthy();
  });

  it('HOR-02: agrupa todas las clases del resultado por grupo', () => {
    const grupos = Object.keys(component.grupos);
    const totalAgrupadas = Object.values(component.grupos).reduce((n, clases) => n + clases.length, 0);

    expect(grupos.length).toBeGreaterThan(0);
    expect(totalAgrupadas).toBe(component.resultado.length);
    for (const grupo of grupos) {
      expect(component.grupos[grupo].every((c) => c.group === grupo)).withContext(grupo).toBeTrue();
    }
  });

  it('HOR-03: formatStart() convierte "Lun17" en "Lunes 17:00"', () => {
    expect(component.formatStart('Lun17')).toBe('Lunes 17:00');
    expect(component.formatStart('Mie9')).toBe('Miércoles 09:00');
    expect(component.formatStart('Sab8')).toBe('Sábado 08:00');
  });

  it('HOR-04: formatStart() deja igual lo que no reconoce', () => {
    expect(component.formatStart('Dom10')).toBe('Dom 10:00');
    expect(component.formatStart('sin hora')).toBe('sin hora');
  });

  it('HOR-05: getClase() encuentra la clase de un día y hora', () => {
    const clases = [
      { start: 'Mar18', subj: 'Cálculo', prof: 'Ana', room: 'A1' },
      { start: 'Jue20', subj: 'Inglés', prof: 'Luis', room: 'B2' },
    ];

    expect(component.getClase(clases, 'Martes', '18:00')?.subj).toBe('Cálculo');
    expect(component.getClase(clases, 'Jueves', '20:00')?.subj).toBe('Inglés');
    expect(component.getClase(clases, 'Lunes', '18:00')).toBeUndefined();
  });

  it('HOR-06: pinta una tabla por grupo con los 5 días de la semana', () => {
    const el: HTMLElement = fixture.nativeElement;
    const titulos = el.querySelectorAll('h2');
    const encabezados = Array.from(el.querySelectorAll('table')[0].querySelectorAll('thead th'))
      .map((th) => th.textContent?.trim());

    expect(titulos.length).toBe(Object.keys(component.grupos).length);
    expect(encabezados).toEqual(['Hora', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']);
  });

  it('HOR-07: cargarSalones() obtiene los salones del backend', async () => {
    spyOn(window, 'fetch').and.resolveTo(new Response(JSON.stringify([
      { id: 's1', nombre_salon: 'Aula 12', division: 'DTI' },
    ]), { status: 200 }));

    await component.cargarSalones();

    expect(component.salones.length).toBe(1);
    expect(component.salones[0].nombre).toBe('Aula 12');
  });

  it('HOR-08: cargarSalones() avisa con alert si falla', async () => {
    spyOn(window, 'fetch').and.resolveTo(new Response('error', { status: 500 }));
    const alertSpy = spyOn(window, 'alert');

    await component.cargarSalones();

    expect(alertSpy).toHaveBeenCalled();
    expect(component.salones).toEqual([]);
  });
});
