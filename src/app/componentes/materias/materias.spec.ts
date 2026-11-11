import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { Materia, Materias } from './materias';
import { environment } from '../../../environments/environment';

describe('Materias (CRUD, filtros y salones)', () => {
  const url = `${environment.apiUrl}/materias`;
  const salonesUrl = `${environment.apiUrl}/salones`;
  const carrerasUrl = `${environment.apiUrl}/carreras`;

  let component: Materias;
  let fixture: ComponentFixture<Materias>;
  let httpMock: HttpTestingController;

  const materiasBackend = [
    { id: 'm1', nombre: 'Cálculo Diferencial', grado: 1, carrera: 'IDGS', horas_semana: 5, salones: ['Aula 1', ' Aula 1 ', 'Lab A'] },
    { id: 'm2', nombre: 'Inglés I', grado: 1, carrera: 'Mecatrónica', horas_semana: 3, salones: { a: 'Aula 2' } },
    { id: 'm3', nombre: 'Cálculo Integral', grado: 2, carrera: 'IDGS', horas_semana: 5, salones: 'Lab A' },
  ];

  const cargarInicial = () => {
    fixture.detectChanges();
    httpMock.expectOne({ method: 'GET', url }).flush(materiasBackend);
    httpMock.expectOne({ method: 'GET', url: carrerasUrl }).flush([{ nombre: 'IDGS' }, { nombre: 'Mecatrónica' }]);
    httpMock.expectOne({ method: 'GET', url: salonesUrl }).flush([{ nombre: 'Aula 1' }, { nombre: 'Aula 2' }, { nombre: 'Lab A' }]);
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Materias],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Materias);
    component = fixture.componentInstance;
  });

  afterEach(() => httpMock.verify());

  it('MAT-01: al iniciar pide materias, carreras y salones', () => {
    cargarInicial();

    expect(component).toBeTruthy();
    expect(component.carreras).toEqual(['IDGS', 'Mecatrónica']);
    expect(component.salones).toEqual(['Aula 1', 'Aula 2', 'Lab A']);
    expect(component.materias.length).toBe(3);
  });

  it('MAT-02: normaliza los salones que vienen del backend (arreglo, objeto o texto)', () => {
    cargarInicial();

    expect(component.materias[0].salones).toEqual(['Aula 1', 'Lab A']);
    expect(component.materias[1].salones).toEqual(['Aula 2']);
    expect(component.materias[2].salones).toEqual(['Lab A']);
  });

  it('MAT-03: getSalonesList() acepta todos los formatos de salones', () => {
    expect(component.getSalonesList([' A1 ', 'A1', '', 'B2'])).toEqual(['A1', 'B2']);
    expect(component.getSalonesList('  Lab 1 ')).toEqual(['Lab 1']);
    expect(component.getSalonesList({ x: 'A1', y: 'B2', z: 3 })).toEqual(['A1', 'B2']);
    expect(component.getSalonesList({ A1: true, B2: false })).toEqual(['A1']);
    expect(component.getSalonesList({ X: 1, Y: 2 })).toEqual(['X', 'Y']);
    expect(component.getSalonesList({})).toEqual([]);
    expect(component.getSalonesList(null)).toEqual([]);
    expect(component.getSalonesList(42)).toEqual([]);
  });

  it('MAT-04: formatSalones() une con coma o muestra "-" si no hay', () => {
    expect(component.formatSalones(['Aula 1', 'Lab A'])).toBe('Aula 1, Lab A');
    expect(component.formatSalones([])).toBe('-');
    expect(component.formatSalones(undefined)).toBe('-');
  });

  it('MAT-05: filtra por nombre (sin importar mayúsculas), carrera, grado y salón', () => {
    cargarInicial();
    const ids = () => component.materiasFiltradas.map((m) => m.id);

    component.filtros.nombre = 'CÁLCULO';
    expect(ids()).toEqual(['m1', 'm3']);

    component.filtros.grado = '2';
    expect(ids()).toEqual(['m3']);

    component.limpiarFiltros();
    component.filtros.carrera = 'Mecatrónica';
    expect(ids()).toEqual(['m2']);

    component.limpiarFiltros();
    component.filtros.salon = 'lab a';
    expect(ids()).toEqual(['m1', 'm3']);
  });

  it('MAT-06: limpiarFiltros() regresa a la lista completa', () => {
    cargarInicial();
    component.filtros = { nombre: 'zzz', carrera: 'X', grado: '9', salon: 'Y' };
    expect(component.materiasFiltradas.length).toBe(0);

    component.limpiarFiltros();

    expect(component.materiasFiltradas.length).toBe(3);
  });

  it('MAT-07: toggleSalon() agrega y quita salones de la materia en edición sin duplicar', () => {
    component.abrirModalNuevaMateria();

    component.toggleSalon('Aula 1', true);
    component.toggleSalon('Aula 1', true);
    component.toggleSalon('Lab A', true);
    expect(component.nuevaMateria.salones).toEqual(['Aula 1', 'Lab A']);
    expect(component.salonSeleccionado('Lab A')).toBeTrue();

    component.toggleSalon('Aula 1', false);
    expect(component.nuevaMateria.salones).toEqual(['Lab A']);
    expect(component.salonSeleccionado('Aula 1')).toBeFalse();
  });

  it('MAT-08: no crea una materia sin nombre', () => {
    cargarInicial();
    component.abrirModalNuevaMateria();

    component.agregarMateria();

    httpMock.expectNone({ method: 'POST', url });
    expect(component.notificacion.mensaje).toBe('El nombre de la materia es obligatorio.');
  });

  it('MAT-09: no crea una materia sin al menos un salón', () => {
    cargarInicial();
    component.abrirModalNuevaMateria();
    component.nuevaMateria.nombre = 'Física';

    component.agregarMateria();

    httpMock.expectNone({ method: 'POST', url });
    expect(component.notificacion.mensaje).toBe('Selecciona al menos un salón para la materia.');
  });

  it('MAT-10: crea la materia con POST y la agrega a la lista', () => {
    cargarInicial();
    component.abrirModalNuevaMateria();
    component.nuevaMateria = {
      id: '', nombre: 'Física', grado: 2, carrera: 'IDGS', horas_semana: 4, data: {}, salones: ['Lab A', 'Lab A '],
    };

    component.agregarMateria();
    const req = httpMock.expectOne({ method: 'POST', url });
    expect(req.request.body).toEqual({
      nombre: 'Física', grado: 2, carrera: 'IDGS', horas_semana: 4, data: {}, salones: ['Lab A'],
    });
    req.flush({ id: 'm4', nombre: 'Física', grado: 2, carrera: 'IDGS', horas_semana: 4, salones: ['Lab A'] });

    expect(component.materias.length).toBe(4);
    expect(component.materias[3].id).toBe('m4');
    expect(component.modalAbierto).toBeFalse();
    expect(component.notificacion.tipo).toBe('success');
  });

  it('MAT-11: si grado u horas vienen vacíos manda 1 por defecto', () => {
    cargarInicial();
    component.nuevaMateria = {
      id: '', nombre: 'Ética', grado: NaN, carrera: '', horas_semana: NaN, data: {}, salones: ['Aula 2'],
    };

    component.agregarMateria();
    const req = httpMock.expectOne({ method: 'POST', url });
    expect(req.request.body.grado).toBe(1);
    expect(req.request.body.horas_semana).toBe(1);
    req.flush({ id: 'm5', nombre: 'Ética', grado: 1, horas_semana: 1, salones: ['Aula 2'] });
  });

  it('MAT-12: editar y guardar hace PATCH /materias/:id y actualiza la materia', () => {
    cargarInicial();
    const materia: Materia = component.materias[1];

    component.editarMateria(materia);
    expect(component.editandoId).toBe('m2');
    component.nuevaMateria.horas_semana = 6;
    component.guardarEdicion();
    const req = httpMock.expectOne({ method: 'PATCH', url: `${url}/m2` });
    expect(req.request.body.horas_semana).toBe(6);
    expect(req.request.body.salones).toEqual(['Aula 2']);
    req.flush({});

    expect(component.materias[1].horas_semana).toBe(6);
    expect(component.editandoId).toBeNull();
  });

  it('MAT-13: eliminar con confirmación hace DELETE y quita la materia', () => {
    cargarInicial();

    component.eliminarMateria('m3');
    component.confirmarEliminacion();
    httpMock.expectOne({ method: 'DELETE', url: `${url}/m3` }).flush(null);

    expect(component.materias.map((m) => m.id)).toEqual(['m1', 'm2']);
  });

  it('MAT-14: si falla la carga de materias se notifica el error', () => {
    fixture.detectChanges();
    httpMock.expectOne({ method: 'GET', url }).flush('x', { status: 500, statusText: 'Server Error' });
    httpMock.expectOne(carrerasUrl).flush([]);
    httpMock.expectOne(salonesUrl).flush([]);

    expect(component.notificacion.tipo).toBe('error');
    expect(component.notificacion.mensaje).toContain('No se pudo cargar la lista de materias');
  });
});
