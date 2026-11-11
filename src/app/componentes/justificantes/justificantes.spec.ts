import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Justificantes } from './justificantes';
import { Justificante } from './models/justificantes.model';
import { environment } from '../../../environments/environment';

describe('Justificantes (revisión de justificantes de faltas)', () => {
  const url = `${environment.apiUrl}/justificantes`;
  let component: Justificantes;
  let fixture: ComponentFixture<Justificantes>;
  let httpMock: HttpTestingController;
  let el: HTMLElement;

  const base = {
    motivo: 'Cita médica',
    fecha: '2026-11-03T00:00:00.000Z',
    driveUrl: 'https://drive.google.com/x',
    comentarioAdmin: null,
    createdAt: '2026-11-03T10:00:00.000Z',
    updatedAt: '2026-11-03T10:00:00.000Z',
  };

  const justificantesMock: Justificante[] = [
    { ...base, id: 'j1', usuarioId: 'u1', estado: 'pendiente', usuario: { id: 'u1', full_name: 'Ana López', email: 'ana@alumnos.uteq.edu.mx' } },
    { ...base, id: 'j2', usuarioId: 'u2', estado: 'aceptado', comentarioAdmin: 'Ok', usuario: { id: 'u2', full_name: 'Luis Torres', email: 'luis@alumnos.uteq.edu.mx' } },
    { ...base, id: 'j3', usuarioId: 'u3', estado: 'rechazado', usuario: { id: 'u3', full_name: null, email: 'sin.nombre@alumnos.uteq.edu.mx' } },
  ];

  const cargarInicial = (data: object = justificantesMock) => {
    fixture.detectChanges();
    httpMock.expectOne({ method: 'GET', url: `${url}/admin` }).flush(structuredClone(data));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Justificantes],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Justificantes);
    component = fixture.componentInstance;
    el = fixture.nativeElement;
  });

  afterEach(() => httpMock.verify());

  it('JUS-01: al iniciar consulta GET /justificantes/admin', () => {
    cargarInicial();

    expect(component).toBeTruthy();
    expect(component.justificantes().length).toBe(3);
  });

  it('JUS-02: los contadores muestran pendientes, aprobados y rechazados', () => {
    cargarInicial();

    expect(component.totalPendientes()).toBe(1);
    expect(component.totalAprobados()).toBe(1);
    expect(component.totalRechazados()).toBe(1);
    const numeros = Array.from(el.querySelectorAll('.resumen-numero')).map((n) => n.textContent?.trim());
    expect(numeros).toEqual(['1', '1', '1']);
  });

  it('JUS-03: filtra por estado', () => {
    cargarInicial();

    component.filtroEstado.set('pendiente');
    expect(component.justificantesFiltrados().map((j) => j.id)).toEqual(['j1']);

    component.filtroEstado.set('rechazado');
    expect(component.justificantesFiltrados().map((j) => j.id)).toEqual(['j3']);

    component.filtroEstado.set('todos');
    expect(component.justificantesFiltrados().length).toBe(3);
  });

  it('JUS-04: busca alumno por nombre o correo (aunque no tenga nombre)', () => {
    cargarInicial();

    component.filtroAlumno.set('  LÓPEZ ');
    expect(component.justificantesFiltrados().map((j) => j.id)).toEqual(['j1']);

    component.filtroAlumno.set('sin.nombre');
    expect(component.justificantesFiltrados().map((j) => j.id)).toEqual(['j3']);
  });

  it('JUS-05: combina filtro de estado y de alumno', () => {
    cargarInicial();

    component.filtroEstado.set('aceptado');
    component.filtroAlumno.set('ana');

    expect(component.justificantesFiltrados()).toEqual([]);
  });

  it('JUS-06: pinta una fila por justificante y botones Aprobar/Rechazar solo en pendientes', () => {
    cargarInicial();

    expect(el.querySelectorAll('table.tabla tbody tr').length).toBe(3);
    expect(el.querySelectorAll('.btn--aprobar').length).toBe(1);
    expect(el.querySelectorAll('.btn--rechazar').length).toBe(1);
    expect(el.textContent).toContain('Sin nombre');
  });

  it('JUS-07: sin resultados muestra el mensaje de "No se encontraron justificantes"', () => {
    cargarInicial([]);

    expect(el.querySelector('table.tabla')).toBeNull();
    expect(el.querySelector('.sin-resultados')?.textContent).toContain('No se encontraron justificantes');
  });

  it('JUS-08: abrir detalle carga el comentario existente y cerrar lo limpia', () => {
    cargarInicial();
    const j2 = component.justificantes()[1];

    component.abrirDetalle(j2);
    expect(component.justificanteSeleccionado()).toBe(j2);
    expect(component.comentarioTemp).toBe('Ok');

    component.cerrarDetalle();
    expect(component.justificanteSeleccionado()).toBeNull();
    expect(component.comentarioTemp).toBe('');
  });

  it('JUS-09: aprobar hace PATCH /justificantes/admin/:id/estado con el comentario y actualiza la lista', () => {
    cargarInicial();
    const j1 = component.justificantes()[0];
    component.abrirDetalle(j1);
    component.comentarioTemp = 'Documento válido';

    component.aprobar(j1);
    const req = httpMock.expectOne({ method: 'PATCH', url: `${url}/admin/j1/estado` });
    expect(req.request.body).toEqual({ estado: 'aceptado', comentarioAdmin: 'Documento válido' });
    req.flush({ ...j1, estado: 'aceptado', comentarioAdmin: 'Documento válido' });

    expect(component.justificantes()[0].estado).toBe('aceptado');
    expect(component.justificanteSeleccionado()?.estado).toBe('aceptado');
    expect(component.totalPendientes()).toBe(0);
    expect(component.notificacion).toEqual({ visible: true, mensaje: 'Justificante aprobado.', tipo: 'success' });
  });

  it('JUS-10: rechazar sin comentario no manda comentarioAdmin', () => {
    cargarInicial();
    const j1 = component.justificantes()[0];

    component.rechazar(j1);
    const req = httpMock.expectOne({ method: 'PATCH', url: `${url}/admin/j1/estado` });
    expect(req.request.body.estado).toBe('rechazado');
    expect(req.request.body.comentarioAdmin).toBeUndefined();
    req.flush({ ...j1, estado: 'rechazado' });

    expect(component.totalRechazados()).toBe(2);
    expect(component.notificacion.mensaje).toBe('Justificante rechazado.');
  });

  it('JUS-11: si falla el cambio de estado se avisa y no cambia la lista', () => {
    cargarInicial();
    const j1 = component.justificantes()[0];

    component.aprobar(j1);
    httpMock.expectOne(`${url}/admin/j1/estado`).flush('x', { status: 500, statusText: 'Server Error' });

    expect(component.justificantes()[0].estado).toBe('pendiente');
    expect(component.notificacion.tipo).toBe('error');
  });

  it('JUS-12: claseEstado() y textoEstado() traducen cada estado', () => {
    expect(component.claseEstado('pendiente')).toBe('badge badge--pendiente');
    expect(component.claseEstado('aceptado')).toBe('badge badge--aprobado');
    expect(component.claseEstado('rechazado')).toBe('badge badge--rechazado');
    expect(component.textoEstado('pendiente')).toBe('Pendiente');
    expect(component.textoEstado('aceptado')).toBe('Aprobado');
    expect(component.textoEstado('rechazado')).toBe('Rechazado');
  });

  it('JUS-13: si falla la carga se notifica el error', () => {
    fixture.detectChanges();
    httpMock.expectOne(`${url}/admin`).flush('x', { status: 500, statusText: 'Server Error' });

    expect(component.justificantes()).toEqual([]);
    expect(component.notificacion.mensaje).toContain('No se pudo cargar la lista de justificantes');
  });
});
