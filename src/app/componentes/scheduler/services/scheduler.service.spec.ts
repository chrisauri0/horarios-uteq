import { TestBed } from '@angular/core/testing';
import { SchedulerService } from './scheduler.service';

describe('Servicio de horarios guardados (SchedulerService)', () => {
  const CACHE_KEY = 'horariosCache';
  let service: SchedulerService;

  const horarios = [
    { nombregrupo: 'IDGS15', data: [{ start: 'Lun17', subj: 'Cálculo', prof: 'Ana', room: 'A1' }] },
  ];

  const respuestaJson = (body: unknown, status = 200): Response =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

  beforeEach(() => {
    localStorage.clear();
    spyOn(console, 'log');
    spyOn(console, 'error');
    TestBed.configureTestingModule({});
    service = TestBed.inject(SchedulerService);
  });

  afterEach(() => localStorage.clear());

  it('SSV-01: sin caché consulta /scheduler/allschedules y guarda la respuesta en localStorage', async () => {
    const fetchSpy = spyOn(window, 'fetch').and.resolveTo(respuestaJson(horarios));

    const resultado = await service.getHorarios();

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(String(fetchSpy.calls.mostRecent().args[0])).toContain('/scheduler/allschedules');
    expect(resultado).toEqual(horarios);
    expect(JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null')).toEqual(horarios);
  });

  it('SSV-02: con caché regresa los datos guardados sin llamar al backend', async () => {
    localStorage.setItem(CACHE_KEY, JSON.stringify(horarios));
    const fetchSpy = spyOn(window, 'fetch');

    const resultado = await service.getHorarios();

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(resultado).toEqual(horarios);
  });

  it('SSV-03: si el backend responde con error regresa [] y no guarda caché', async () => {
    spyOn(window, 'fetch').and.resolveTo(respuestaJson({ message: 'error' }, 500));

    const resultado = await service.getHorarios();

    expect(resultado).toEqual([]);
    expect(localStorage.getItem(CACHE_KEY)).toBeNull();
    expect(console.error).toHaveBeenCalled();
  });

  it('SSV-04: si no hay conexión (fetch rechaza) regresa []', async () => {
    spyOn(window, 'fetch').and.rejectWith(new TypeError('Failed to fetch'));

    const resultado = await service.getHorarios();

    expect(resultado).toEqual([]);
  });

  it('SSV-05: clearCache() elimina la caché de horarios', () => {
    localStorage.setItem(CACHE_KEY, '[]');

    service.clearCache();

    expect(localStorage.getItem(CACHE_KEY)).toBeNull();
  });
});
