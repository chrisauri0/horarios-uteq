import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { PsicologoData, Psicologos } from './psicologos';
import { environment } from '../../../environments/environment';

describe('Psicólogos (CRUD y disponibilidad)', () => {
  const url = `${environment.apiUrl}/psicologos`;
  let component: Psicologos;
  let fixture: ComponentFixture<Psicologos>;
  let httpMock: HttpTestingController;

  const psicologosMock: PsicologoData[] = [
    {
      psicologo_id: 'ps1', nombre: 'Laura', apellidos: 'Méndez', email: 'laura@uteq.edu.mx',
      disponibilidad: [{ dias: ['Lunes'], hora_inicio: '09:00', hora_fin: '13:00' }],
    },
    {
      psicologo_id: 'ps2', nombre: 'Jorge', apellidos: 'Salas', email: 'jorge@uteq.edu.mx',
      disponibilidad: [],
    },
  ];

  const cargarInicial = () => {
    fixture.detectChanges();
    httpMock.expectOne({ method: 'GET', url }).flush(structuredClone(psicologosMock));
    fixture.detectChanges();
  };

  const llenarDatos = () => {
    component.nuevoPsicologo.nombre = 'Sofía';
    component.nuevoPsicologo.apellidos = 'Navarro';
    component.nuevoPsicologo.email = 'sofia@uteq.edu.mx';
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Psicologos],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Psicologos);
    component = fixture.componentInstance;
  });

  afterEach(() => httpMock.verify());

  it('PSI-01: al iniciar carga la lista de psicólogos', () => {
    cargarInicial();

    expect(component).toBeTruthy();
    expect(component.psicologos.map((p) => p.psicologo_id)).toEqual(['ps1', 'ps2']);
  });

  it('PSI-02: toggleDia() marca y desmarca días del bloque', () => {
    component.toggleDia(0, 'Martes');
    component.toggleDia(0, 'Jueves');
    expect(component.bloques[0].dias).toEqual(['Martes', 'Jueves']);

    component.toggleDia(0, 'Martes');
    expect(component.bloques[0].dias).toEqual(['Jueves']);
  });

  it('PSI-03: no crea si faltan nombre, apellidos o email', () => {
    cargarInicial();
    component.nuevoPsicologo.nombre = 'Sofía';

    component.crearPsicologo();

    httpMock.expectNone({ method: 'POST', url });
    expect(component.notificacion.mensaje).toBe('Completa nombre, apellidos y email antes de guardar.');
  });

  it('PSI-04: no crea si no hay al menos un bloque de disponibilidad completo', () => {
    cargarInicial();
    llenarDatos();
    component.toggleDia(0, 'Lunes'); // sin horas: bloque incompleto

    component.crearPsicologo();

    httpMock.expectNone({ method: 'POST', url });
    expect(component.notificacion.mensaje).toBe('Agrega al menos un bloque de disponibilidad completo.');
  });

  it('PSI-05: crea el psicólogo con POST enviando solo bloques completos', () => {
    cargarInicial();
    llenarDatos();
    component.toggleDia(0, 'Lunes');
    component.bloques[0].hora_inicio = '10:00';
    component.bloques[0].hora_fin = '14:00';
    component.agregarBloque(); // vacío, se ignora

    component.crearPsicologo();
    const req = httpMock.expectOne({ method: 'POST', url });
    expect(req.request.body).toEqual({
      nombre: 'Sofía',
      apellidos: 'Navarro',
      email: 'sofia@uteq.edu.mx',
      disponibilidad: [{ dias: ['Lunes'], hora_inicio: '10:00', hora_fin: '14:00' }],
    });
    req.flush({ psicologo_id: 'ps3', ...req.request.body });

    expect(component.psicologos.length).toBe(3);
    expect(component.nuevoPsicologo.nombre).toBe('');
    expect(component.bloques).toEqual([{ dias: [], hora_inicio: '', hora_fin: '' }]);
    expect(component.notificacion.tipo).toBe('success');
  });

  it('PSI-06: si el backend responde { error } no se agrega', () => {
    cargarInicial();
    llenarDatos();
    component.toggleDia(0, 'Lunes');
    component.bloques[0].hora_inicio = '10:00';
    component.bloques[0].hora_fin = '14:00';

    component.crearPsicologo();
    httpMock.expectOne({ method: 'POST', url }).flush({ error: 'Correo duplicado' });

    expect(component.psicologos.length).toBe(2);
    expect(component.notificacion).toEqual({ visible: true, mensaje: 'Correo duplicado', tipo: 'error' });
  });

  it('PSI-07: editar copia los bloques y guardar hace PATCH /psicologos/:id', () => {
    cargarInicial();

    component.editarPsicologo(component.psicologos[0]);
    expect(component.editandoId).toBe('ps1');
    expect(component.bloques).toEqual([{ dias: ['Lunes'], hora_inicio: '09:00', hora_fin: '13:00' }]);

    component.toggleDia(0, 'Miércoles');
    component.guardarEdicion();
    const req = httpMock.expectOne({ method: 'PATCH', url: `${url}/ps1` });
    expect(req.request.body.disponibilidad).toEqual([{ dias: ['Lunes', 'Miércoles'], hora_inicio: '09:00', hora_fin: '13:00' }]);
    req.flush({});

    expect(component.psicologos[0].disponibilidad[0].dias).toEqual(['Lunes', 'Miércoles']);
    expect(component.editandoId).toBeNull();
  });

  it('PSI-08: un psicólogo sin disponibilidad se edita con un bloque vacío', () => {
    cargarInicial();

    component.editarPsicologo(component.psicologos[1]);

    expect(component.bloques).toEqual([{ dias: [], hora_inicio: '', hora_fin: '' }]);
  });

  it('PSI-09: eliminar con confirmación hace DELETE y lo quita de la lista', () => {
    cargarInicial();

    component.eliminarPsicologo('ps2');
    component.confirmarEliminacion();
    httpMock.expectOne({ method: 'DELETE', url: `${url}/ps2` }).flush(null);

    expect(component.psicologos.map((p) => p.psicologo_id)).toEqual(['ps1']);
  });
});
