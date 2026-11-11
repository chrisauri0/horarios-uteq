import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SchedulerComponent } from './scheduler';

/** Respuesta simulada de fetch para una URL y método. */
type Ruta = { metodo: string; termina: string; status: number; body: unknown } | { metodo: string; termina: string; falla: true };

describe('Scheduler (generador de horarios)', () => {
  const API = 'https://horarios-backend-58w8.onrender.com';
  const PY = 'https://ortools-horarios.onrender.com';

  let component: SchedulerComponent;
  let fixture: ComponentFixture<SchedulerComponent>;
  let fetchSpy: jasmine.Spy<typeof fetch>;
  let rutas: Ruta[];

  // ── Datos de ejemplo del backend ──────────────────────────────────────
  const grupos = [
    { id: 'g2', nombre: 'IDGS16', division: 'DTI', grado: 5 },
    { id: 'g1', nombre: 'IDGS15', division: 'dti', grado: 5 },
    { id: 'g3', nombre: 'MEC10', division: 'Industrial', grado: 3 },
  ];
  const profesores = [
    {
      profesor_id: 'p2', nombre: 'Luis', apellidos: 'Pérez', materias: [' Inglés I ', ''],
      metadata: { disponibilidad: ['{"dias":["Lunes"],"hora_inicio":"17:00","hora_fin":"21:00"}', 'texto libre', '  ', 5] },
    },
    { id: 'p1', nombre: 'Ana', apellidos: 'Ruiz', materias: ['Cálculo'], disponibilidad: [{ dias: ['Martes'] }] },
  ];
  const salones = [{ id: 's1', nombre: 'Lab A', division: 'DTI' }, { id: 's2', nombre: 'Aula 1' }];
  const materias = [
    { id: 'm2', nombre: 'Inglés I', grado: 5, horas_semana: 3, salones: { a: 'Aula 1' } },
    { id: 'm1', nombre: 'Cálculo', grado: 5, horas_semana: 5, salones: ['Lab A', ' '] },
  ];
  const horariosGuardados = {
    schedules: [
      {
        nombregrupo: 'IDGS15',
        data: [
          { start: 'Lun17', subj: 'Cálculo', prof: 'Ana Ruiz', room: 'Lab A' },
          { dia: 'Martes', hora: '18:00', materia: 'Inglés I', profesor: 'Luis Pérez', salon: 'Aula 1' },
        ],
      },
      { groupName: 'IDGS16', data: [{ start: 'Mie19', subj: 'Cálculo', prof: 'Ana Ruiz', room: 'Lab A' }] },
    ],
  };
  const horarioGenerado = [{ group: 'IDGS15', subj: 'Cálculo', start: 'Lun17', room: 'Lab A', prof: 'Ana Ruiz' }];

  // ── Helpers ──────────────────────────────────────────────────────────
  const responder = (metodo: string, termina: string, status: number, body: unknown) => {
    rutas = rutas.filter((r) => !(r.metodo === metodo && r.termina === termina));
    rutas.unshift({ metodo, termina, status, body });
  };

  const fallarRed = (metodo: string, termina: string) => {
    rutas = rutas.filter((r) => !(r.metodo === metodo && r.termina === termina));
    rutas.unshift({ metodo, termina, falla: true });
  };

  const fakeFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = String(input);
    const metodo = (init?.method ?? 'GET').toUpperCase();
    const ruta = rutas.find((r) => r.metodo === metodo && url.endsWith(r.termina));
    if (!ruta) return new Response('not found', { status: 404 });
    if ('falla' in ruta) throw new TypeError('Failed to fetch');
    return new Response(JSON.stringify(ruta.body), { status: ruta.status, headers: { 'Content-Type': 'application/json' } });
  };

  /** Busca la llamada a fetch hecha a una URL (por terminación) y regresa su init. */
  const llamadaA = (termina: string): RequestInit | undefined =>
    fetchSpy.calls.all().find((c) => String(c.args[0]).endsWith(termina))?.args[1];

  beforeEach(async () => {
    localStorage.clear();
    spyOn(console, 'error');
    spyOn(console, 'log');

    rutas = [
      { metodo: 'GET', termina: '/grupos', status: 200, body: grupos },
      { metodo: 'GET', termina: '/profesores', status: 200, body: profesores },
      { metodo: 'GET', termina: '/salones', status: 200, body: salones },
      { metodo: 'GET', termina: '/materias', status: 200, body: materias },
      { metodo: 'GET', termina: '/scheduler', status: 200, body: horariosGuardados },
      { metodo: 'GET', termina: '/health', status: 200, body: { status: 'ok' } },
      { metodo: 'POST', termina: '/generar-horario', status: 200, body: { horario: horarioGenerado, nivel: 'ok', mensaje: 'Horario generado sin conflictos.' } },
      { metodo: 'POST', termina: '/scheduler/guardar', status: 201, body: { ok: true } },
    ];
    fetchSpy = spyOn(window, 'fetch').and.callFake(fakeFetch);

    await TestBed.configureTestingModule({
      imports: [SchedulerComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(SchedulerComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    component.cerrarToast();
    localStorage.clear();
  });

  // ── Creación e inicio ─────────────────────────────────────────────────
  it('SCH-01: se crea el componente y muestra el título', () => {
    fixture.detectChanges();

    expect(component).toBeTruthy();
    const titulo = (fixture.nativeElement as HTMLElement).querySelector('h2.titulo-scheduler');
    expect(titulo?.textContent).toContain('Generador de Horarios');
  });

  it('SCH-02: al iniciar pide el preview, los horarios creados y despierta el servidor de Python', () => {
    fixture.detectChanges();

    const urls = fetchSpy.calls.all().map((c) => String(c.args[0]));
    expect(urls).toContain(`${API}/grupos`);
    expect(urls).toContain(`${API}/profesores`);
    expect(urls).toContain(`${API}/salones`);
    expect(urls).toContain(`${API}/materias`);
    expect(urls).toContain(`${API}/scheduler`);
    expect(urls).toContain(`${PY}/health`);
  });

  it('SCH-03: lee división y turno del usuario guardado', () => {
    localStorage.setItem('userData', JSON.stringify({ full_name: 'Ana Ruiz', metadata: { division: 'DTI', turno: 'Nocturno' } }));

    component.ngOnInit();

    expect(component.usuarioNombre).toBe('Ana Ruiz');
    expect(component.usuarioDivision).toBe('DTI');
    expect(component.usuarioCarrera).toBe('DTI - Nocturno');
  });

  it('SCH-04: manda el token en las peticiones al backend', () => {
    localStorage.setItem('token', 'jwt-abc');

    fixture.detectChanges();

    const headers = llamadaA('/grupos')?.headers as Record<string, string>;
    expect(headers['Authorization']).toBe('Bearer jwt-abc');
  });

  // ── Preview de datos ──────────────────────────────────────────────────
  it('SCH-05: el preview filtra grupos y salones por la división del usuario y los ordena', async () => {
    component.usuarioDivision = 'DTI';

    await component.cargarDatosPreview();

    expect(component.gruposPreview.map((g) => g.nombre)).toEqual(['IDGS15', 'IDGS16']);
    expect(component.gruposPreview.every((g) => g.selected)).toBeTrue();
    // un salón sin división se considera compartido
    expect(component.salonesPreview.map((s) => s.nombre)).toEqual(['Aula 1', 'Lab A']);
  });

  it('SCH-06: sin división en sesión muestra todos los grupos', async () => {
    await component.cargarDatosPreview();

    expect(component.gruposPreview.map((g) => g.nombre)).toEqual(['IDGS15', 'IDGS16', 'MEC10']);
  });

  it('SCH-07: normaliza profesores (nombre completo, materias y disponibilidad en JSON o texto)', async () => {
    await component.cargarDatosPreview();

    const [ana, luis] = component.profesoresPreview;
    expect(ana.nombre).toBe('Ana Ruiz');
    expect(ana.id).toBe('p1');
    expect(ana.disponibilidad).toEqual([{ dias: ['Martes'] }]);
    expect(luis.id).toBe('p2');
    expect(luis.materias).toEqual(['Inglés I']);
    expect(luis.disponibilidad).toEqual([
      { dias: ['Lunes'], hora_inicio: '17:00', hora_fin: '21:00' },
      'texto libre',
    ]);
  });

  it('SCH-08: normaliza los salones de cada materia', async () => {
    await component.cargarDatosPreview();

    expect(component.materiasPreview.map((m) => [m.nombre, m.salones])).toEqual([
      ['Cálculo', ['Lab A']],
      ['Inglés I', ['Aula 1']],
    ]);
  });

  it('SCH-09: si falla algún catálogo avisa cuáles no se pudieron cargar', async () => {
    responder('GET', '/materias', 500, { message: 'error' });
    responder('GET', '/salones', 401, {});

    await component.cargarDatosPreview();

    expect(component.mostrarToast).toBeTrue();
    expect(component.toastTipo).toBe('error');
    expect(component.message).toBe('No se pudieron cargar: salones, materias. Revisa tu sesión o conexión.');
  });

  it('SCH-10: los contadores y "seleccionar todo" funcionan por catálogo', async () => {
    await component.cargarDatosPreview();
    expect(component.totalGruposSeleccionados).toBe(3);

    component.seleccionarTodo('grupos', false);
    expect(component.totalGruposSeleccionados).toBe(0);
    expect(component.totalProfesoresSeleccionados).toBe(2);

    component.seleccionarTodo('materias', false);
    component.seleccionarTodo('salones', false);
    component.seleccionarTodo('profesores', false);
    expect(component.totalMateriasSeleccionadas + component.totalSalonesSeleccionados + component.totalProfesoresSeleccionados).toBe(0);
  });

  // ── Horarios creados ──────────────────────────────────────────────────
  it('SCH-11: agrupa los horarios guardados por grupo y por profesor', async () => {
    await component.cargarHorariosCreados();

    expect(component.groupedSchedules.map((g) => g.nombregrupo)).toEqual(['IDGS15', 'IDGS16']);
    const porProfesor = Object.fromEntries(component.profesoresConHorarios.map((p) => [p.nombre, p.clases.length]));
    expect(porProfesor).toEqual({ 'Ana Ruiz': 2, 'Luis Pérez': 1 });
  });

  it('SCH-12: normaliza clases con formato {dia, hora, materia...} al formato de la tabla', async () => {
    await component.cargarHorariosCreados();

    const clase = component.groupedSchedules[0].data[1];
    expect(clase.start).toBe('Mar18:00');
    expect(clase.subj).toBe('Inglés I');
    expect(clase.prof).toBe('Luis Pérez');
    expect(clase.room).toBe('Aula 1');
    expect(component.getClase(component.groupedSchedules[0].data, 'Mar', '18')).toBe(clase);
    expect(component.getClase(component.groupedSchedules[0].data, 'Vie', '21')).toBeNull();
  });

  it('SCH-13: una clase sin datos recibe valores por defecto', () => {
    const clase = (component as any).normalizarClase({ dia: 'miércoles', hora: '9:00' });

    expect(clase.start).toBe('Mie09:00');
    expect(clase.subj).toBe('Sin materia');
    expect(clase.prof).toBe('Sin profesor');
    expect(clase.room).toBe('Sin salón');
    expect(clase.group).toBe('');
  });

  it('SCH-14: si el backend responde 401 al cargar horarios avisa que la sesión expiró', async () => {
    responder('GET', '/scheduler', 401, { message: 'Unauthorized' });

    await component.cargarHorariosCreados();

    expect(component.toastTipo).toBe('error');
    expect(component.message).toBe('No se pudo cargar la lista de horarios creados.');
    expect(component.toastDetalles).toEqual(['Tu sesión expiró o no tienes permiso. Vuelve a iniciar sesión.']);
  });

  it('SCH-15: getClaseColorClass() asigna siempre el mismo color a la misma materia', () => {
    const tonos = ['clase-tone-1', 'clase-tone-2', 'clase-tone-3', 'clase-tone-4', 'clase-tone-5', 'clase-tone-6', 'clase-tone-7', 'clase-tone-8'];

    expect(component.getClaseColorClass('')).toBe('clase-tone-1');
    expect(component.getClaseColorClass(null)).toBe('clase-tone-1');
    expect(component.getClaseColorClass('Cálculo')).toBe(component.getClaseColorClass('  cálculo '));
    expect(tonos).toContain(component.getClaseColorClass('Programación Web'));
  });

  // ── Generar horario ──────────────────────────────────────────────────
  it('SCH-16: no genera si no hay nada seleccionado y dice qué falta', async () => {
    await component.generateSchedule();

    expect(component.message).toBe('Selecciona al menos 1 grupo, 1 profesor, 1 materia, 1 salón para generar.');
    expect(llamadaA('/generar-horario')).toBeUndefined();
  });

  it('SCH-17: genera en Python, guarda en Nest y cambia a la vista de horarios', async () => {
    localStorage.setItem('token', 'jwt-abc');
    await component.cargarDatosPreview();
    component.gruposPreview[2].selected = false; // MEC10 no se manda

    await component.generateSchedule();

    const payload = JSON.parse(String(llamadaA('/generar-horario')?.body));
    expect(payload.rango_horario).toEqual({ hora_inicio: 17, hora_fin: 22 });
    expect(payload.grupos).toEqual([{ nombre: 'IDGS15', grado: 5 }, { nombre: 'IDGS16', grado: 5 }]);
    expect(payload.salones).toEqual(['Aula 1', 'Lab A']);
    expect(payload.materias[0]).toEqual({ nombre: 'Cálculo', grado: 5, salones: ['Lab A'], horas: 5 });

    const guardar = llamadaA('/scheduler/guardar');
    expect(JSON.parse(String(guardar?.body))).toEqual({ horario: horarioGenerado });
    expect((guardar?.headers as Record<string, string>)['Authorization']).toBe('Bearer jwt-abc');

    expect(component.modoActual).toBe('ver');
    expect(component.loading).toBeFalse();
    expect(component.toastTipo).toBe('success');
    expect(component.message).toBe('✅ Horario generado sin conflictos.');
  });

  it('SCH-18: si el generador deja materias fuera, guarda y muestra advertencia con el detalle', async () => {
    responder('POST', '/generar-horario', 200, {
      horario: horarioGenerado,
      materias_fuera: [{ grupo: 'IDGS16', materia: 'Inglés I', horas_faltantes: 2, motivo: 'grupo_saturado' }],
      advertencias: [{ mensaje: 'Luis Pérez quedó con 1 hora libre' }],
    });
    await component.cargarDatosPreview();

    await component.generateSchedule();

    expect(component.toastTipo).toBe('warning');
    expect(component.message).toBe('⚠️ Horario guardado con observaciones.');
    expect(component.toastDetalles).toEqual([
      'IDGS16 · Inglés I: faltan 2 h (el grupo tiene demasiadas horas)',
      'Luis Pérez quedó con 1 hora libre',
    ]);

    fixture.detectChanges();
    const toast = (fixture.nativeElement as HTMLElement).querySelector('.toast-scheduler');
    expect(toast?.classList.contains('warning')).toBeTrue();
    expect(toast?.querySelectorAll('.toast-detalles li').length).toBe(2);
  });

  it('SCH-19: si el generador responde error muestra el mensaje y la referencia del job', async () => {
    responder('POST', '/generar-horario', 422, { detail: [{ msg: 'grupos vacío' }], job_id: 'job-42' });
    await component.cargarDatosPreview();

    await component.generateSchedule();

    expect(component.toastTipo).toBe('error');
    expect(component.message).toBe('grupos vacío (ref: job-42)');
    expect(llamadaA('/scheduler/guardar')).toBeUndefined();
    expect(component.modoActual).toBe('generar');
    expect(component.loading).toBeFalse();
  });

  it('SCH-20: si el generador responde sin clases no intenta guardar', async () => {
    responder('POST', '/generar-horario', 200, { horario: [] });
    await component.cargarDatosPreview();

    await component.generateSchedule();

    expect(component.message).toBe('El generador respondió sin ninguna clase. Revisa los datos seleccionados.');
    expect(llamadaA('/scheduler/guardar')).toBeUndefined();
  });

  it('SCH-21: si se genera pero no se puede guardar lo indica claramente', async () => {
    responder('POST', '/scheduler/guardar', 500, { error: 'Base de datos no disponible' });
    await component.cargarDatosPreview();

    await component.generateSchedule();

    expect(component.toastTipo).toBe('error');
    expect(component.message).toBe('El horario se generó pero no se pudo guardar: Base de datos no disponible');
  });

  it('SCH-22: sin conexión con el generador muestra mensaje de red', async () => {
    fallarRed('POST', '/generar-horario');
    await component.cargarDatosPreview();

    await component.generateSchedule();

    expect(component.message).toBe('No se pudo conectar con el generador de horarios. Revisa tu conexión o intenta en unos segundos.');
    expect(component.loading).toBeFalse();
  });

  // ── Utilidades de UI ─────────────────────────────────────────────────
  it('SCH-23: la paginación de grupos y profesores respeta los límites', async () => {
    await component.cargarHorariosCreados();

    expect(component.totalPaginasGrupos).toBe(2);
    component.irAPaginaGrupo(1);
    expect(component.gruposEnPaginaActual[0].nombregrupo).toBe('IDGS16');
    component.irAPaginaGrupo(5);
    expect(component.paginaActualGrupos).toBe(1);
    component.irAPaginaGrupo(-1);
    expect(component.paginaActualGrupos).toBe(1);

    component.irAPaginaProfesor(1);
    expect(component.profesoresEnPaginaActual[0].nombre).toBe('Luis Pérez');
    expect(component.generarRangoNumeros(3)).toEqual([0, 1, 2]);
  });

  it('SCH-24: los detalles largos del toast se resumen a 6 elementos', () => {
    const resumirLista = (items: string[]): string[] => (component as any).resumirLista(items);

    expect(resumirLista(['a', 'b', 'a', ''])).toEqual(['a', 'b']);
    expect(resumirLista(['1', '2', '3', '4', '5', '6', '7', '8'])).toEqual(['1', '2', '3', '4', '5', '6', '…y 2 más']);
  });

  it('SCH-25: cambiarModo() y cerrarToast() actualizan la vista', () => {
    component.cambiarModo('ver');
    expect(component.modoActual).toBe('ver');

    component.mostrarToastExitoso('Listo');
    expect(component.mostrarToast).toBeTrue();
    expect(component.isSuccess).toBeTrue();
    component.cerrarToast();
    expect(component.mostrarToast).toBeFalse();
  });
});
