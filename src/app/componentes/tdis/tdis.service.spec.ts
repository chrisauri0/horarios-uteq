import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TdisService } from './tdis.service';
import { TdiPrograma } from './tdis';
import { environment } from '../../../environments/environment';

describe('Servicio de TDIs (TdisService)', () => {
  const url = `${environment.apiUrl}/tdis`;
  let service: TdisService;
  let httpMock: HttpTestingController;

  const tdi: TdiPrograma = {
    id: 't1',
    eje: '1',
    nombre: 'Voluntariado',
    personaEncargada: 'José Martínez',
    puesto: 'Coordinador',
    telefono: '4421234567',
    extension: '',
    correo: 'jose@uteq.edu.mx',
    tipo: 'interna',
    horasRequeridas: 20,
    nivelDeImpacto: '1',
    tdisporGanar: 2,
    activo: true,
    competencias: 'Trabajo en equipo',
    evidencias: 'Fotos',
    obeservaciones: '',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TdisService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('TDS-01: getAll() hace GET a /tdis y regresa la lista', () => {
    let lista: TdiPrograma[] = [];
    service.getAll().subscribe((r) => (lista = r));

    const req = httpMock.expectOne(url);
    expect(req.request.method).toBe('GET');
    req.flush([tdi]);

    expect(lista).toEqual([tdi]);
  });

  it('TDS-02: create() hace POST a /tdis con el DTO en el body', () => {
    service.create(tdi).subscribe();

    const req = httpMock.expectOne(url);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(tdi);
    req.flush(tdi);
  });

  it('TDS-03: update() hace PATCH a /tdis/:id', () => {
    service.update('t1', tdi).subscribe();

    const req = httpMock.expectOne(`${url}/t1`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(tdi);
    req.flush(tdi);
  });

  it('TDS-04: delete() hace DELETE a /tdis/:id', () => {
    service.delete('t1').subscribe();

    const req = httpMock.expectOne(`${url}/t1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
