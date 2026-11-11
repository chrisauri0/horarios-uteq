import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { SalonesComponent, salonesData } from './salones';
import { environment } from '../../../environments/environment';

describe('Salones (CRUD, búsqueda y paginación)', () => {
  const url = `${environment.apiUrl}/salones`;
  let component: SalonesComponent;
  let fixture: ComponentFixture<SalonesComponent>;
  let httpMock: HttpTestingController;

  const salonesMock: salonesData[] = [
    { id: 's1', nombre: 'Aula 12 Edificio K' },
    { id: 's2', nombre: 'Laboratorio de Redes' },
    { id: 's3', nombre: 'Aula 3 Edificio F' },
  ];

  /** Genera n salones: "Salón 1", "Salón 2", ... */
  const generarSalones = (n: number): salonesData[] =>
    Array.from({ length: n }, (_, i) => ({ id: `s${i + 1}`, nombre: `Salón ${i + 1}` }));

  const cargarInicial = (data: object = salonesMock) => {
    fixture.detectChanges();
    httpMock.expectOne({ method: 'GET', url }).flush(data);
    fixture.detectChanges();
  };

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [SalonesComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(SalonesComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('SAL-01: se crea el componente y toma el nombre del usuario en sesión', () => {
    localStorage.setItem('userData', JSON.stringify({ full_name: 'Ana Ruiz' }));
    cargarInicial();

    expect(component).toBeTruthy();
    expect(component.usuarioNombre).toBe('Ana Ruiz');
  });

  it('SAL-02: sin sesión usa "Usuario" como nombre', () => {
    cargarInicial();
    expect(component.usuarioNombre).toBe('Usuario');
  });

  it('SAL-03: carga los salones y los muestra en la tabla', () => {
    cargarInicial();

    const nombres = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('td.td-nombre'))
      .map((td) => td.textContent?.trim());
    expect(component.salones).toEqual(salonesMock);
    expect(nombres).toEqual(['Aula 12 Edificio K', 'Laboratorio de Redes', 'Aula 3 Edificio F']);
  });

  it('SAL-04: no permite guardar un salón sin nombre', () => {
    cargarInicial();
    component.nuevoSalon.nombre = '  ';

    component.agregarSalon();

    httpMock.expectNone({ method: 'POST', url });
    expect(component.notificacion).toEqual({ visible: true, mensaje: 'Completa el nombre antes de guardar.', tipo: 'error' });
  });

  it('SAL-05: agrega un salón con POST y cierra el modal', () => {
    cargarInicial();
    component.abrirModalNuevoSalon();
    component.nuevoSalon.nombre = 'Aula 7';

    component.agregarSalon();
    const req = httpMock.expectOne({ method: 'POST', url });
    expect(req.request.body).toEqual({ nombre: 'Aula 7' });
    req.flush({ id: 's9', nombre: 'Aula 7' });

    expect(component.salones.at(-1)).toEqual({ id: 's9', nombre: 'Aula 7' });
    expect(component.modalAbierto).toBeFalse();
    expect(component.notificacion.tipo).toBe('success');
  });

  it('SAL-06: editar y guardar hace PATCH /salones/:id y actualiza la fila', () => {
    cargarInicial();

    component.editarSalon(component.salones[0]);
    component.nuevoSalon.nombre = 'Aula 12 Edificio K (remodelada)';
    component.guardarEdicion();
    httpMock.expectOne({ method: 'PATCH', url: `${url}/s1` }).flush({});

    expect(component.salones[0].nombre).toBe('Aula 12 Edificio K (remodelada)');
    expect(component.editandoId).toBeNull();
  });

  it('SAL-07: eliminar solo hace DELETE después de confirmar', () => {
    cargarInicial();

    component.eliminarSalon('s2');
    httpMock.expectNone({ method: 'DELETE' });
    component.confirmarEliminacion();
    httpMock.expectOne({ method: 'DELETE', url: `${url}/s2` }).flush(null);

    expect(component.salones.map((s) => s.id)).toEqual(['s1', 's3']);
  });

  it('SAL-08: si falla el DELETE el salón se conserva y se avisa', () => {
    cargarInicial();

    component.eliminarSalon('s2');
    component.confirmarEliminacion();
    httpMock.expectOne({ method: 'DELETE', url: `${url}/s2` }).flush('no', { status: 409, statusText: 'Conflict' });

    expect(component.salones.length).toBe(3);
    expect(component.notificacion.tipo).toBe('error');
    expect(component.notificacion.mensaje).toContain('No se pudo eliminar el salón');
  });

  it('SAL-09: la búsqueda filtra sin importar mayúsculas y regresa a la página 1', () => {
    cargarInicial();
    component.paginaActual = 2;

    component.onBusqueda('AULA');

    expect(component.paginaActual).toBe(1);
    expect(component.salonesFiltrados.map((s) => s.id)).toEqual(['s1', 's3']);
  });

  it('SAL-10: la búsqueda sin resultados muestra el mensaje correspondiente', () => {
    cargarInicial();

    component.onBusqueda('auditorio');
    fixture.detectChanges();

    const vacio = (fixture.nativeElement as HTMLElement).querySelector('.empty-state');
    expect(vacio?.textContent).toContain('No se encontraron salones con "auditorio"');
  });

  it('SAL-11: pagina de 10 en 10 (25 salones = 3 páginas)', () => {
    cargarInicial(generarSalones(25));

    expect(component.totalPaginas).toBe(3);
    expect(component.paginas).toEqual([1, 2, 3]);
    expect(component.salonesPaginados.length).toBe(10);

    component.cambiarPagina(3);
    expect(component.salonesPaginados.map((s) => s.nombre)).toEqual(['Salón 21', 'Salón 22', 'Salón 23', 'Salón 24', 'Salón 25']);
  });

  it('SAL-12: no permite ir a páginas fuera de rango', () => {
    cargarInicial(generarSalones(25));

    component.cambiarPagina(0);
    expect(component.paginaActual).toBe(1);
    component.cambiarPagina(4);
    expect(component.paginaActual).toBe(1);
  });

  it('SAL-13: la paginación solo aparece cuando hay más de una página', () => {
    cargarInicial();
    expect((fixture.nativeElement as HTMLElement).querySelector('.pagination')).toBeNull();

    component.salones = generarSalones(11);
    fixture.detectChanges();
    const botones = (fixture.nativeElement as HTMLElement).querySelectorAll('.pagination .btn-pag');
    // « 1 2 »
    expect(botones.length).toBe(4);
  });
});
