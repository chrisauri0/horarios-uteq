import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ProfesorData, ProfesoresComponent } from './profesores';
import { environment } from '../../../environments/environment';

describe('Profesores (CRUD y disponibilidad por bloques)', () => {
  const url = `${environment.apiUrl}/profesores`;
  const materiasUrl = `${environment.apiUrl}/materias`;

  let component: ProfesoresComponent;
  let fixture: ComponentFixture<ProfesoresComponent>;
  let httpMock: HttpTestingController;

  const profesoresMock: ProfesorData[] = [
    {
      profesor_id: 'p1', nombre: 'Ana', apellidos: 'Ruiz López', email: 'ana.ruiz@uteq.edu.mx',
      materias: ['Cálculo Diferencial'],
      disponibilidad: [{ dias: ['Lunes', 'Martes'], hora_inicio: '17:00', hora_fin: '21:00' }],
      metadata: { disponibilidad: [{ dias: ['Lunes', 'Martes'], hora_inicio: '17:00', hora_fin: '21:00' }] },
    },
    {
      profesor_id: 'p2', nombre: 'Luis', apellidos: 'Pérez', email: 'luis.perez@uteq.edu.mx',
      materias: ['Inglés I'], disponibilidad: [], metadata: {},
    },
  ];

  const cargarInicial = (profesores: object = profesoresMock) => {
    fixture.detectChanges();
    httpMock.expectOne({ method: 'GET', url }).flush(structuredClone(profesores));
    httpMock.expectOne({ method: 'GET', url: materiasUrl }).flush([
      { id: 'm1', nombre: 'Cálculo Diferencial', grado: 1, horas_semana: 5 },
      { id: 'm2', nombre: 'Inglés I', grado: 1, horas_semana: 3 },
    ]);
  };

  const llenarFormulario = () => {
    component.abrirModalNuevoProfesor();
    component.nuevoProfesor.nombre = '  María ';
    component.nuevoProfesor.apellidos = ' Gómez ';
    component.nuevoProfesor.email = 'maria@uteq.edu.mx';
    component.nuevoProfesor.materias = ['Inglés I'];
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfesoresComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ProfesoresComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => httpMock.verify());

  it('PRO-01: al iniciar carga profesores y las materias para el selector', () => {
    cargarInicial();

    expect(component).toBeTruthy();
    expect(component.profesores.length).toBe(2);
    expect(component.materiasOpciones).toEqual(['Cálculo Diferencial', 'Inglés I']);
  });

  it('PRO-02: el buscador encuentra por nombre, apellidos, correo o materia', () => {
    cargarInicial();
    const ids = () => component.profesoresFiltrados.map((p) => p.profesor_id);

    component.busquedaProfesor = 'ruiz';
    expect(ids()).toEqual(['p1']);
    component.busquedaProfesor = 'LUIS.PEREZ@';
    expect(ids()).toEqual(['p2']);
    component.busquedaProfesor = 'inglés';
    expect(ids()).toEqual(['p2']);
    component.busquedaProfesor = '   ';
    expect(ids()).toEqual(['p1', 'p2']);
  });

  it('PRO-03: toggleDia() marca y desmarca días de un bloque', () => {
    component.toggleDia(0, 'Lunes');
    component.toggleDia(0, 'Miercoles');
    expect(component.bloques[0].dias).toEqual(['Lunes', 'Miercoles']);

    component.toggleDia(0, 'Lunes');
    expect(component.bloques[0].dias).toEqual(['Miercoles']);
  });

  it('PRO-04: un día ya usado en otro bloque queda bloqueado', () => {
    component.toggleDia(0, 'Lunes');
    component.agregarBloque();

    expect(component.esDiaBloqueado(1, 'Lunes')).toBeTrue();
    component.toggleDia(1, 'Lunes');
    expect(component.bloques[1].dias).toEqual([]);
    expect(component.esDiaBloqueado(1, 'Martes')).toBeFalse();
  });

  it('PRO-05: eliminarBloque() quita el bloque, y si es el último lo deja vacío', () => {
    component.toggleDia(0, 'Lunes');
    component.agregarBloque();
    component.toggleDia(1, 'Viernes');

    component.eliminarBloque(0);
    expect(component.bloques.length).toBe(1);
    expect(component.bloques[0].dias).toEqual(['Viernes']);

    component.eliminarBloque(0);
    expect(component.bloques).toEqual([{ dias: [], hora_inicio: '', hora_fin: '' }]);
  });

  it('PRO-06: no crea un profesor si faltan nombre, apellidos o email', () => {
    cargarInicial();
    component.abrirModalNuevoProfesor();
    component.nuevoProfesor.nombre = 'María';

    component.agregarProfesor();

    httpMock.expectNone({ method: 'POST', url });
    expect(component.notificacion.mensaje).toBe('Completa nombre, apellidos y email antes de guardar.');
  });

  it('PRO-07: crea el profesor enviando solo los bloques de disponibilidad completos', () => {
    cargarInicial();
    llenarFormulario();
    component.toggleDia(0, 'Lunes');
    component.bloques[0].hora_inicio = '17:00';
    component.bloques[0].hora_fin = '20:00';
    component.agregarBloque(); // bloque incompleto: debe ignorarse
    component.toggleDia(1, 'Martes');

    component.agregarProfesor();
    const req = httpMock.expectOne({ method: 'POST', url });
    const bloqueValido = { dias: ['Lunes'], hora_inicio: '17:00', hora_fin: '20:00' };
    expect(req.request.body).toEqual({
      nombre: 'María',
      apellidos: 'Gómez',
      email: 'maria@uteq.edu.mx',
      can_be_tutor: false,
      materias: ['Inglés I'],
      disponibilidad: [bloqueValido],
      metadata: { disponibilidad: [bloqueValido] },
    });
    req.flush({ profesor_id: 'p3' });

    expect(component.profesores.length).toBe(3);
    expect(component.profesores[2].profesor_id).toBe('p3');
    expect(component.modalAbierto).toBeFalse();
    expect(component.bloques).toEqual([{ dias: [], hora_inicio: '', hora_fin: '' }]);
    expect(component.notificacion.tipo).toBe('success');
  });

  it('PRO-08: muestra el mensaje real del backend cuando falla la creación', () => {
    cargarInicial();
    llenarFormulario();

    component.agregarProfesor();
    httpMock.expectOne({ method: 'POST', url }).flush(
      { message: ['email must be an email', 'nombre is too short'] },
      { status: 400, statusText: 'Bad Request' },
    );

    expect(component.notificacion.mensaje)
      .toBe('No se pudo crear el profesor: email must be an email, nombre is too short');
  });

  it('PRO-09: traduce errores de conexión y de sesión a mensajes entendibles', () => {
    const mensajeError = (err: unknown): string => (component as any).mensajeError(err);

    expect(mensajeError({ status: 0 })).toBe('No se pudo conectar con el servidor.');
    expect(mensajeError({ status: 401 })).toContain('Tu sesión expiró');
    expect(mensajeError({ status: 403 })).toContain('no tienes permiso');
    expect(mensajeError({ status: 409, error: { message: 'El correo ya existe' } })).toBe('El correo ya existe');
    expect(mensajeError({ status: 500, error: { error: 'Falla interna' } })).toBe('Falla interna');
    expect(mensajeError({ status: 500, message: 'Http failure' })).toBe('Http failure');
    expect(mensajeError({})).toBe('Error desconocido');
  });

  it('PRO-10: editar carga los bloques guardados en metadata.disponibilidad', () => {
    cargarInicial();

    component.editarProfesor(component.profesores[0]);

    expect(component.editandoId).toBe('p1');
    expect(component.modalAbierto).toBeTrue();
    expect(component.bloques).toEqual([{ dias: ['Lunes', 'Martes'], hora_inicio: '17:00', hora_fin: '21:00' }]);
    // los bloques son copia: editar no modifica el profesor original
    component.bloques[0].dias.push('Viernes');
    expect(component.profesores[0].metadata.disponibilidad[0].dias).toEqual(['Lunes', 'Martes']);
  });

  it('PRO-11: guardar edición hace PATCH /profesores/:id, actualiza y recarga la lista', () => {
    cargarInicial();
    component.editarProfesor(component.profesores[1]);
    component.nuevoProfesor.email = 'luis.nuevo@uteq.edu.mx';

    component.guardarEdicion();
    const req = httpMock.expectOne({ method: 'PATCH', url: `${url}/p2` });
    expect(req.request.body.email).toBe('luis.nuevo@uteq.edu.mx');
    req.flush({ ok: true });

    expect(component.profesores[1].email).toBe('luis.nuevo@uteq.edu.mx');
    expect(component.editandoId).toBeNull();
    // después de guardar vuelve a pedir la lista
    httpMock.expectOne({ method: 'GET', url }).flush(structuredClone(profesoresMock));
    expect(component.notificacion.mensaje).toBe('Cambios guardados correctamente.');
  });

  it('PRO-12: si el PATCH responde 200 con { error } no se toma como éxito', () => {
    cargarInicial();
    component.editarProfesor(component.profesores[1]);

    component.guardarEdicion();
    httpMock.expectOne({ method: 'PATCH', url: `${url}/p2` }).flush({ error: 'Email duplicado' });

    expect(component.notificacion).toEqual({ visible: true, mensaje: 'Email duplicado', tipo: 'error' });
    expect(component.editandoId).toBe('p2');
  });

  it('PRO-13: guardar edición sin profesor identificado no manda nada', () => {
    cargarInicial();
    component.nuevoProfesor = structuredClone(profesoresMock[0]);
    component.editandoId = null;

    component.guardarEdicion();

    httpMock.expectNone({ method: 'PATCH' });
    expect(component.notificacion.mensaje).toContain('No se pudo identificar al profesor');
  });

  it('PRO-14: eliminar con confirmación hace DELETE y lo quita de la lista', () => {
    cargarInicial();

    component.eliminarProfesor('p1');
    expect(component.confirmacion.visible).toBeTrue();
    component.confirmarEliminacion();
    httpMock.expectOne({ method: 'DELETE', url: `${url}/p1` }).flush(null);

    expect(component.profesores.map((p) => p.profesor_id)).toEqual(['p2']);
  });
});
