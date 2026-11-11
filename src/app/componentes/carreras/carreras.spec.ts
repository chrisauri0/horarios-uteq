import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { Carrera, Carreras } from './carreras';
import { environment } from '../../../environments/environment';

describe('Carreras (CRUD de carreras)', () => {
  const url = `${environment.apiUrl}/carreras`;
  let component: Carreras;
  let fixture: ComponentFixture<Carreras>;
  let httpMock: HttpTestingController;

  const carrerasMock: Carrera[] = [
    { id: '1', nombre: 'Ingeniería en Software' },
    { id: '2', nombre: 'Mecatrónica' },
  ];

  /** Responde la petición GET inicial que hace ngOnInit. */
  const cargarInicial = (data: object = carrerasMock) => {
    fixture.detectChanges();
    httpMock.expectOne({ method: 'GET', url }).flush(data);
    fixture.detectChanges();
  };

  const filas = (): HTMLElement[] =>
    Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('td.td-nombre'));

  beforeEach(async () => {
    spyOn(console, 'log');
    await TestBed.configureTestingModule({
      imports: [Carreras],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Carreras);
    component = fixture.componentInstance;
  });

  afterEach(() => httpMock.verify());

  it('CAR-01: se crea el componente y pide la lista al iniciar', () => {
    cargarInicial([]);
    expect(component).toBeTruthy();
  });

  it('CAR-02: carga las carreras, se queda solo con id y nombre y las pinta en la tabla', () => {
    cargarInicial([{ id: '1', nombre: 'Ingeniería en Software', extra: 'x' }, { id: '2', nombre: 'Mecatrónica' }]);

    expect(component.carreras).toEqual(carrerasMock);
    expect(filas().map((td) => td.textContent?.trim())).toEqual(['Ingeniería en Software', 'Mecatrónica']);
  });

  it('CAR-03: si no hay carreras muestra el mensaje de tabla vacía', () => {
    cargarInicial([]);

    const vacio = (fixture.nativeElement as HTMLElement).querySelector('.empty-state');
    expect(vacio?.textContent).toContain('No hay carreras registradas');
  });

  it('CAR-04: si el backend falla al cargar se muestra notificación de error', () => {
    fixture.detectChanges();
    httpMock.expectOne(url).flush('error', { status: 500, statusText: 'Server Error' });

    expect(component.carreras).toEqual([]);
    expect(component.notificacion.visible).toBeTrue();
    expect(component.notificacion.tipo).toBe('error');
    expect(component.notificacion.mensaje).toContain('No se pudo cargar la lista de carreras');
  });

  it('CAR-05: no envía nada si el nombre está vacío o con puros espacios', () => {
    cargarInicial();
    component.nuevaCarrera.nombre = '   ';

    component.agregarCarrera();

    httpMock.expectNone({ method: 'POST', url });
  });

  it('CAR-06: agrega una carrera con POST, la añade a la lista y cierra el modal', () => {
    cargarInicial();
    component.abrirModalNuevaCarrera();
    component.nuevaCarrera.nombre = 'Biotecnología';

    component.agregarCarrera();
    const req = httpMock.expectOne({ method: 'POST', url });
    expect(req.request.body).toEqual({ nombre: 'Biotecnología' });
    req.flush({ id: '3', nombre: 'Biotecnología' });

    expect(component.carreras.length).toBe(3);
    expect(component.carreras[2]).toEqual({ id: '3', nombre: 'Biotecnología' });
    expect(component.modalAbierto).toBeFalse();
    expect(component.nuevaCarrera).toEqual({ id: '', nombre: '' });
    expect(component.notificacion).toEqual({ visible: true, mensaje: 'Carrera agregada correctamente.', tipo: 'success' });
  });

  it('CAR-07: si el backend responde { error } no agrega la carrera', () => {
    cargarInicial();
    component.nuevaCarrera.nombre = 'Mecatrónica';

    component.agregarCarrera();
    httpMock.expectOne({ method: 'POST', url }).flush({ error: 'La carrera ya existe' });

    expect(component.carreras.length).toBe(2);
    expect(component.notificacion.tipo).toBe('error');
    expect(component.notificacion.mensaje).toBe('La carrera ya existe');
  });

  it('CAR-08: editar abre el modal con una copia y guardar hace PATCH /carreras/:id', () => {
    cargarInicial();

    component.editarCarrera(component.carreras[1]);
    expect(component.modalAbierto).toBeTrue();
    expect(component.editandoId).toBe('2');
    expect(component.nuevaCarrera).not.toBe(component.carreras[1]);

    component.nuevaCarrera.nombre = 'Mecatrónica Industrial';
    component.guardarEdicion();
    const req = httpMock.expectOne({ method: 'PATCH', url: `${url}/2` });
    expect(req.request.body).toEqual({ nombre: 'Mecatrónica Industrial' });
    req.flush({});

    expect(component.carreras[1]).toEqual({ id: '2', nombre: 'Mecatrónica Industrial' });
    expect(component.editandoId).toBeNull();
    expect(component.modalAbierto).toBeFalse();
  });

  it('CAR-09: eliminar pide confirmación y solo borra (DELETE) al confirmar', () => {
    cargarInicial();

    component.eliminarCarrera('1');
    expect(component.confirmacion.visible).toBeTrue();
    httpMock.expectNone({ method: 'DELETE' });

    component.confirmarEliminacion();
    httpMock.expectOne({ method: 'DELETE', url: `${url}/1` }).flush(null);

    expect(component.carreras.map((c) => c.id)).toEqual(['2']);
    expect(component.confirmacion.visible).toBeFalse();
    expect(component.notificacion.mensaje).toBe('Carrera eliminada correctamente.');
  });

  it('CAR-10: cancelar la eliminación no borra nada', () => {
    cargarInicial();

    component.eliminarCarrera('1');
    component.cancelarEliminacion();
    component.confirmarEliminacion(); // ya no hay id pendiente

    httpMock.expectNone({ method: 'DELETE' });
    expect(component.carreras.length).toBe(2);
  });

  it('CAR-11: el modal de confirmación aparece en pantalla con el mensaje', () => {
    cargarInicial();

    component.eliminarCarrera('2');
    fixture.detectChanges();

    const modal = (fixture.nativeElement as HTMLElement).querySelector('.notificacion-modal');
    expect(modal?.textContent).toContain('¿Estás seguro de eliminar esta carrera?');
  });

  it('CAR-12: cerrar el modal limpia el formulario y el modo edición', () => {
    cargarInicial();
    component.editarCarrera(component.carreras[0]);

    component.cerrarModal();

    expect(component.modalAbierto).toBeFalse();
    expect(component.editandoId).toBeNull();
    expect(component.nuevaCarrera).toEqual({ id: '', nombre: '' });
  });
});
