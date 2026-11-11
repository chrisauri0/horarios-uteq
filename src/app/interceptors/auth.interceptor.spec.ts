import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpHeaders, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { authInterceptor } from './auth.interceptor';

describe('Interceptor de autenticación (authInterceptor)', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('AUT-01: agrega el header Authorization "Bearer <token>" cuando hay token guardado', () => {
    localStorage.setItem('token', 'abc123');

    http.get('/api/carreras').subscribe();

    const req = httpMock.expectOne('/api/carreras');
    expect(req.request.headers.get('Authorization')).toBe('Bearer abc123');
    req.flush([]);
  });

  it('AUT-02: no agrega Authorization cuando no hay token', () => {
    http.get('/api/carreras').subscribe();

    const req = httpMock.expectOne('/api/carreras');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush([]);
  });

  it('AUT-03: conserva los headers que ya traía la petición', () => {
    localStorage.setItem('token', 'xyz');

    http.post('/api/salones', { nombre: 'A1' }, {
      headers: new HttpHeaders({ 'X-Origen': 'pruebas' }),
    }).subscribe();

    const req = httpMock.expectOne('/api/salones');
    expect(req.request.headers.get('X-Origen')).toBe('pruebas');
    expect(req.request.headers.get('Authorization')).toBe('Bearer xyz');
    expect(req.request.body).toEqual({ nombre: 'A1' });
    req.flush({});
  });
});
