import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { GruposComponent } from './grupos';
import { environment } from '../../../environments/environment';

describe('Grupos (CRUD de grupos y tutores)', () => {
  const url = `${environment.apiUrl}/grupos`;
  const carrerasUrl = `${environment.apiUrl}/carreras`;
  const tutoresUrl = `${environment.apiUrl}/profesores/tutores`;

  let component: GruposComponent;
  let fixture: ComponentFixture<GruposComponent>;
  let httpMock: HttpTestingController;

  const cargarInicial = () => {
    fixture.detectChanges();
    httpMock.expectOne({ method: 'GET', url }).flush([
      { id: 'g1', nombre: 'IDGS15', grado: 5, carrera: 'IDGS' },
      { id: 'g2', nombre: 'MEC10', grado: 3, carrera: 'Mecatrónica', data: { turno: 'Nocturno' } },
    ]);
    httpMock.expectOne({ method: 'GET', url: carrerasUrl }).flush([
      { id: 'c1', nombre: 'IDGS', grado: 5 },
      { id: 'c2', nombre: 'Mecatrónica', grado: 3 },
    ]);
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GruposComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(GruposComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => httpMock.verify());

  it('GRU-01: al iniciar carga grupos y carreras', () => {
    cargarInicial();

    expect(component).toBeTruthy();
    expect(component.grupos.map((g) => g.nombre)).toEqual(['IDGS15', 'MEC10']);
    expect(component.grupos[0].data).toEqual({}); // sin data se normaliza a {}
    expect(component.carreras.map((c) => c.nombre)).toEqual(['IDGS', 'Mecatrónica']);
  });

  it('GRU-02: no crea un grupo si falta la carrera', () => {
    cargarInicial();
    component.nuevoGrupo = { id: '', nombre: 'IDGS16', grado: 5, carrera: '', data: {} };

    component.agregarGrupo();

    httpMock.expectNone({ method: 'POST', url });
    expect(component.notificacion.mensaje).toBe('Debes completar todos los campos obligatorios.');
  });

  it('GRU-03: crea el grupo con POST y limpia el formulario', () => {
    cargarInicial();
    component.nuevoGrupo = { id: '', nombre: 'IDGS16', grado: 5, carrera: 'IDGS', data: {} };

    component.agregarGrupo();
    const req = httpMock.expectOne({ method: 'POST', url });
    expect(req.request.body).toEqual({ nombre: 'IDGS16', grado: 5, carrera: 'IDGS', data: {} });
    req.flush({ id: 'g3', nombre: 'IDGS16', grado: 5, carrera: 'IDGS' });

    expect(component.grupos.length).toBe(3);
    expect(component.grupos[2]).toEqual({ id: 'g3', nombre: 'IDGS16', grado: 5, carrera: 'IDGS', data: {} });
    expect(component.nuevoGrupo).toEqual({ id: '', nombre: '', grado: 1, carrera: '', data: {} });
    expect(component.notificacion.tipo).toBe('success');
  });

  it('GRU-04: editar y guardar hace PATCH /grupos/:id y reemplaza el grupo', () => {
    cargarInicial();

    component.editarGrupo(component.grupos[1]);
    expect(component.grupoEditando?.id).toBe('g2');
    component.nuevoGrupo.grado = 4;
    component.guardarEdicion();
    const req = httpMock.expectOne({ method: 'PATCH', url: `${url}/g2` });
    expect(req.request.body.grado).toBe(4);
    req.flush({});

    expect(component.grupos[1].grado).toBe(4);
    expect(component.grupoEditando).toBeNull();
  });

  it('GRU-05: guardarEdicion() sin grupo en edición no hace nada', () => {
    cargarInicial();
    component.nuevoGrupo = { id: '', nombre: 'IDGS16', grado: 5, carrera: 'IDGS', data: {} };

    component.guardarEdicion();

    httpMock.expectNone({ method: 'PATCH' });
  });

  it('GRU-06: cancelarEdicion() limpia el modo edición', () => {
    cargarInicial();
    component.editarGrupo(component.grupos[0]);

    component.cancelarEdicion();

    expect(component.grupoEditando).toBeNull();
    expect(component.nuevoGrupo.nombre).toBe('');
  });

  it('GRU-07: getNombreTutor() regresa el nombre completo del tutor o "-"', () => {
    cargarInicial();
    expect(component.getNombreTutor(undefined)).toBe('-');

    component.cargarTutores();
    httpMock.expectOne({ method: 'GET', url: tutoresUrl }).flush([
      { id: 't1', nombre: 'Ana', apellidos: 'Ruiz' },
      { id: 't2', nombre: 'Luis' },
    ]);

    expect(component.getNombreTutor('t1')).toBe('Ana Ruiz');
    expect(component.getNombreTutor('t2')).toBe('Luis');
    expect(component.getNombreTutor('t9')).toBe('-');
    expect(component.tutoresOpciones).toEqual(['Ana Ruiz', 'Luis']);
  });

  it('GRU-08: eliminar con confirmación hace DELETE y quita el grupo', () => {
    cargarInicial();

    component.eliminarGrupo('g1');
    component.confirmarEliminacion();
    httpMock.expectOne({ method: 'DELETE', url: `${url}/g1` }).flush(null);

    expect(component.grupos.map((g) => g.id)).toEqual(['g2']);
    expect(component.notificacion.mensaje).toBe('Grupo eliminado correctamente.');
  });

  it('GRU-09: si falla la carga de grupos se notifica', () => {
    fixture.detectChanges();
    httpMock.expectOne({ method: 'GET', url }).flush('x', { status: 503, statusText: 'Unavailable' });
    httpMock.expectOne(carrerasUrl).flush([]);

    expect(component.notificacion.tipo).toBe('error');
    expect(component.notificacion.mensaje).toContain('No se pudo cargar la lista de grupos');
  });
});
