import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { errorInterceptor } from './error.interceptor';

describe('Interceptor de errores (errorInterceptor)', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    localStorage.clear();
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    router.navigate.and.resolveTo(true);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        { provide: Router, useValue: router },
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('ERR-01: ante un 401 borra el token, redirige a /login y propaga el error', () => {
    localStorage.setItem('token', 'expirado');
    let errorRecibido: HttpErrorResponse | undefined;

    http.get('/api/materias').subscribe({
      error: (e: HttpErrorResponse) => (errorRecibido = e),
    });
    httpMock.expectOne('/api/materias').flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(localStorage.getItem('token')).toBeNull();
    expect(router.navigate).toHaveBeenCalledOnceWith(['/login']);
    expect(errorRecibido?.status).toBe(401);
  });

  it('ERR-02: ante un 500 NO cierra sesión ni redirige, pero sí propaga el error', () => {
    localStorage.setItem('token', 'vigente');
    let errorRecibido: HttpErrorResponse | undefined;

    http.get('/api/materias').subscribe({
      error: (e: HttpErrorResponse) => (errorRecibido = e),
    });
    httpMock.expectOne('/api/materias').flush('boom', { status: 500, statusText: 'Server Error' });

    expect(localStorage.getItem('token')).toBe('vigente');
    expect(router.navigate).not.toHaveBeenCalled();
    expect(errorRecibido?.status).toBe(500);
  });

  it('ERR-03: deja pasar las respuestas exitosas sin tocarlas', () => {
    let respuesta: unknown;

    http.get('/api/grupos').subscribe((r) => (respuesta = r));
    httpMock.expectOne('/api/grupos').flush([{ id: '1', nombre: 'IDGS15' }]);

    expect(respuesta).toEqual([{ id: '1', nombre: 'IDGS15' }]);
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
