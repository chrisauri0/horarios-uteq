import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { TdiPrograma, Tdis } from './tdis';
import { TdisService } from './tdis.service';

describe('TDIs (Tokens del Desarrollo Integral)', () => {
  let component: Tdis;
  let fixture: ComponentFixture<Tdis>;
  let service: jasmine.SpyObj<TdisService>;

  const crearTdi = (cambios: Partial<TdiPrograma> = {}): TdiPrograma => ({
    id: 't1',
    eje: '1',
    nombre: 'Voluntariado en refugio',
    personaEncargada: 'José Martínez',
    puesto: 'Coordinador',
    telefono: '4421234567',
    extension: '',
    correo: 'jose@uteq.edu.mx',
    tipo: 'externa',
    horasRequeridas: 20,
    nivelDeImpacto: '1',
    tdisporGanar: 2,
    activo: true,
    competencias: 'Empatía',
    evidencias: 'Fotos',
    obeservaciones: '',
    ...cambios,
  });

  const tdisMock: TdiPrograma[] = [
    crearTdi(),
    crearTdi({ id: 't2', eje: '2', nombre: 'Taller de robótica', personaEncargada: 'Marta Díaz', correo: 'marta@uteq.edu.mx', tipo: 'interna', tdisporGanar: 3, nivelDeImpacto: '3' }),
  ];

  beforeEach(async () => {
    service = jasmine.createSpyObj<TdisService>('TdisService', ['getAll', 'create', 'update', 'delete']);
    service.getAll.and.returnValue(of(structuredClone(tdisMock)));

    await TestBed.configureTestingModule({
      imports: [Tdis],
      providers: [{ provide: TdisService, useValue: service }, provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Tdis);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('TDI-01: al iniciar carga los TDIs y quita el estado de carga', () => {
    expect(component).toBeTruthy();
    expect(service.getAll).toHaveBeenCalledTimes(1);
    expect(component.tdis.length).toBe(2);
    expect(component.cargando).toBeFalse();
  });

  it('TDI-02: si falla la carga muestra error y quita el estado de carga', () => {
    service.getAll.and.returnValue(throwError(() => new Error('timeout')));

    component.ngOnInit();

    expect(component.cargando).toBeFalse();
    expect(component.notificacion.tipo).toBe('error');
    expect(component.notificacion.mensaje).toBe('No se pudieron cargar los TDIs: timeout');
  });

  it('TDI-03: calcula el total de TDIs y la suma de tokens por ganar', () => {
    expect(component.totalTdi).toBe(2);
    expect(component.totalTdisPorGanar).toBe(5);
  });

  it('TDI-04: el buscador filtra por cualquier campo sin importar mayúsculas', () => {
    component.busqueda = 'ROBÓTICA';
    expect(component.tdisFiltrados.map((t) => t.id)).toEqual(['t2']);

    component.busqueda = 'jose@uteq';
    expect(component.tdisFiltrados.map((t) => t.id)).toEqual(['t1']);

    component.busqueda = '';
    expect(component.tdisFiltrados.length).toBe(2);
  });

  it('TDI-05: muestra la etiqueta del nivel de impacto', () => {
    expect(component.etiquetaNivelImpacto['1']).toBe('1 - Sensibilizador Conoce');
    expect(component.etiquetaNivelImpacto['4']).toBe('4 - Implementador Lidera');
  });

  it('TDI-06: pinta las filas en la tabla', () => {
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(texto).toContain('Voluntariado en refugio');
    expect(texto).toContain('Taller de robótica');
    expect(texto).toContain('3 - Aplicador Hace');
  });

  it('TDI-07: no guarda si faltan eje, nombre, persona encargada o correo', () => {
    component.abrirModalNuevoTdi();
    component.nuevoTdi.nombre = 'Sin eje';

    component.agregarTdi();

    expect(service.create).not.toHaveBeenCalled();
    expect(component.notificacion.mensaje).toContain('Completa los campos obligatorios');
  });

  it('TDI-08: agregar limpia espacios, convierte números y recarga la lista', () => {
    service.create.and.returnValue(of(crearTdi()));
    component.abrirModalNuevoTdi();
    component.nuevoTdi = {
      ...component.nuevoTdi,
      eje: ' 3 ', nombre: '  Reforestación ', personaEncargada: ' Luis ', correo: ' luis@uteq.edu.mx ',
      horasRequeridas: '15' as unknown as number, tdisporGanar: 'abc' as unknown as number,
    };

    component.agregarTdi();

    const enviado = service.create.calls.mostRecent().args[0];
    expect(enviado.eje).toBe('3');
    expect(enviado.nombre).toBe('Reforestación');
    expect(enviado.correo).toBe('luis@uteq.edu.mx');
    expect(enviado.horasRequeridas).toBe(15);
    expect(enviado.tdisporGanar).toBe(0);
    expect(enviado.activo).toBeTrue();
    expect(service.getAll).toHaveBeenCalledTimes(2);
    expect(component.modalAbierto).toBeFalse();
    expect(component.notificacion.mensaje).toBe('TDI agregado correctamente.');
  });

  it('TDI-09: si el eje ya existe (409) muestra el mensaje específico', () => {
    service.create.and.returnValue(throwError(() => ({ status: 409, message: 'Conflict' })));
    component.nuevoTdi = crearTdi({ id: undefined });

    component.agregarTdi();

    expect(component.notificacion.mensaje).toBe('Ya existe un registro con ese eje.');
  });

  it('TDI-10: editar abre el modal y guardar llama a update(id, tdi)', () => {
    service.update.and.returnValue(of(crearTdi()));

    component.editarTdi(component.tdis[1]);
    expect(component.modalAbierto).toBeTrue();
    expect(component.editandoEje).toBe('2');
    component.nuevoTdi.horasRequeridas = 40;
    component.guardarEdicion();

    expect(service.update).toHaveBeenCalledTimes(1);
    const [id, dto] = service.update.calls.mostRecent().args;
    expect(id).toBe('t2');
    expect(dto.horasRequeridas).toBe(40);
    expect(component.notificacion.mensaje).toBe('Cambios guardados correctamente.');
  });

  it('TDI-11: guardarEdicion() sin modo edición no llama al servicio', () => {
    component.guardarEdicion();
    expect(service.update).not.toHaveBeenCalled();
  });

  it('TDI-12: eliminar pide confirmación y solo borra al confirmar', () => {
    service.delete.and.returnValue(of(void 0));

    component.eliminarTdi(component.tdis[0]);
    expect(component.confirmacion.visible).toBeTrue();
    expect(component.confirmacion.mensaje).toContain('Voluntariado en refugio');
    expect(service.delete).not.toHaveBeenCalled();

    component.confirmarEliminacion();
    expect(service.delete).toHaveBeenCalledOnceWith('t1');
    expect(component.notificacion.mensaje).toBe('TDI eliminado correctamente.');
  });

  it('TDI-13: un TDI sin id no se puede eliminar', () => {
    component.eliminarTdi(crearTdi({ id: undefined }));
    expect(component.confirmacion.visible).toBeFalse();
  });

  it('TDI-14: verSolicitud() abre la solicitud existente o avisa si no existe', () => {
    component.verSolicitud(1);
    expect(component.solicitudActual?.matricula).toBe('2023002');
    expect(component.modalSolicitudIndividualAbierto).toBeTrue();

    component.cerrarModalSolicitud();
    expect(component.solicitudActual).toBeNull();

    component.verSolicitud(999);
    expect(component.solicitudActual).toBeNull();
    expect(component.notificacion.mensaje).toBe('Solicitud no encontrada.');
  });

  it('TDI-15: cerrar el modal regresa el formulario a valores vacíos', () => {
    component.editarTdi(component.tdis[0]);

    component.cerrarModal();

    expect(component.modalAbierto).toBeFalse();
    expect(component.editandoEje).toBeNull();
    expect(component.nuevoTdi.nombre).toBe('');
    expect(component.nuevoTdi.tipo).toBe('interna');
  });
});
