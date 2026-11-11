import { ComponentFixture, TestBed, discardPeriodicTasks, fakeAsync, flush, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { BienvenidaComponent } from './bienvenida';
import { environment } from '../../../environments/environment';

describe('Bienvenida (inicio de sesión)', () => {
  const loginUrl = `${environment.apiUrl}/users/login-admin`;
  let component: BienvenidaComponent;
  let fixture: ComponentFixture<BienvenidaComponent>;
  let httpMock: HttpTestingController;
  let router: Router;
  let navigateSpy: jasmine.Spy;
  let alertSpy: jasmine.Spy;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [BienvenidaComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    navigateSpy = spyOn(router, 'navigate').and.resolveTo(true);
    alertSpy = spyOn(window, 'alert');
    spyOn(console, 'error');

    fixture = TestBed.createComponent(BienvenidaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('LOG-01: se crea el componente con el formulario vacío', () => {
    expect(component).toBeTruthy();
    expect(component.email).toBe('');
    expect(component.contrasena).toBe('');
    expect(component.cargando).toBeFalse();
  });

  it('LOG-02: muestra los campos de correo y contraseña y el botón "Iniciar Sesión"', () => {
    const el: HTMLElement = fixture.nativeElement;

    expect(el.querySelector('input#usuario')).not.toBeNull();
    expect(el.querySelector('input#contrasena')).not.toBeNull();
    expect(el.querySelector('button.btn-login')?.textContent).toContain('Iniciar Sesión');
  });

  it('LOG-03: el botón del ojito alterna la contraseña entre oculta y visible', () => {
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input#contrasena');
    expect(input.type).toBe('password');

    component.togglePassword();
    fixture.detectChanges();
    expect(input.type).toBe('text');

    component.togglePassword();
    fixture.detectChanges();
    expect(input.type).toBe('password');
  });

  it('LOG-04: login correcto guarda token y usuario y redirige al dashboard', fakeAsync(() => {
    component.email = 'admin@uteq.edu.mx';
    component.contrasena = 'secreta';

    component.iniciarSesion();
    expect(component.cargando).toBeTrue();

    const req = httpMock.expectOne(loginUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'admin@uteq.edu.mx', password: 'secreta' });
    req.flush({ access_token: 'jwt-123', user: { full_name: 'Admin DTI' } });

    // El modal de carga se mantiene mínimo 1.5 s
    tick(1499);
    expect(navigateSpy).not.toHaveBeenCalled();
    tick(1);

    expect(localStorage.getItem('token')).toBe('jwt-123');
    expect(JSON.parse(localStorage.getItem('userData') ?? '{}')).toEqual({ full_name: 'Admin DTI' });
    expect(navigateSpy).toHaveBeenCalledOnceWith(['/dashboard']);
    flush();
    discardPeriodicTasks();
  }));

  it('LOG-05: credenciales incorrectas muestran el error y no guardan sesión', fakeAsync(() => {
    component.iniciarSesion();
    httpMock.expectOne(loginUrl).flush({ error: 'Credenciales inválidas' });
    tick(1500);

    expect(alertSpy).toHaveBeenCalledOnceWith('Credenciales inválidas');
    expect(component.cargando).toBeFalse();
    expect(localStorage.getItem('token')).toBeNull();
    expect(navigateSpy).not.toHaveBeenCalled();
    flush();
    discardPeriodicTasks();
  }));

  it('LOG-06: error del servidor muestra "Error al conectar con el servidor"', fakeAsync(() => {
    component.iniciarSesion();
    httpMock.expectOne(loginUrl).flush('caído', { status: 500, statusText: 'Server Error' });
    tick(1500);

    expect(alertSpy).toHaveBeenCalledOnceWith('Error al conectar con el servidor');
    expect(component.cargando).toBeFalse();
    flush();
    discardPeriodicTasks();
  }));

  it('LOG-07: si el servidor tarda más de 4 s cambia el mensaje de carga', fakeAsync(() => {
    component.iniciarSesion();
    const req = httpMock.expectOne(loginUrl);
    expect(component.mensajeCarga).toBe('Conectando con el servidor...');

    tick(4000);
    expect(component.mensajeCarga).toContain('puede tardar unos segundos en despertar');

    req.flush({ access_token: 'jwt', user: {} });
    flush();
    discardPeriodicTasks();
  }));

  it('LOG-08: después de 30 s sin respuesta muestra el aviso de timeout y luego lo limpia', fakeAsync(() => {
    component.iniciarSesion();
    const req = httpMock.expectOne(loginUrl);

    tick(30000);
    expect(req.cancelled).toBeTrue();
    expect(component.cargando).toBeFalse();
    expect(component.huboTimeout).toBeTrue();
    expect(alertSpy).not.toHaveBeenCalled();

    tick(4000);
    expect(component.huboTimeout).toBeFalse();
    flush();
    discardPeriodicTasks();
  }));

  it('LOG-09: evita el doble envío mientras está cargando', () => {
    component.cargando = true;

    component.iniciarSesion();

    httpMock.expectNone(loginUrl);
  });

  it('LOG-10: mientras carga muestra el modal y deshabilita el botón', () => {
    component.cargando = true;
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;

    expect(el.querySelector('.loading-overlay')).not.toBeNull();
    expect((el.querySelector('button.btn-login') as HTMLButtonElement).disabled).toBeTrue();
    expect(el.querySelector('button.btn-login')?.textContent).toContain('Iniciando...');
  });
});
