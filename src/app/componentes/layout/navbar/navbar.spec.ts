import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { Navbar } from './navbar';

describe('Navbar (barra lateral de navegación)', () => {
  let component: Navbar;
  let fixture: ComponentFixture<Navbar>;
  let router: Router;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Navbar],
      providers: [provideRouter([{ path: 'login', children: [] }, { path: 'salones', children: [] }])],
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(Navbar);
    component = fixture.componentInstance;
  });

  afterEach(() => localStorage.clear());

  it('NAV-01: se crea el componente', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('NAV-02: muestra los datos del usuario guardado', () => {
    localStorage.setItem('userData', JSON.stringify({ nombre: 'Luis', carrera: 'Mecatrónica' }));

    component.ngOnInit();

    expect(component.usuarioNombre).toBe('Luis');
    expect(component.usuarioCarrera).toBe('Mecatrónica');
  });

  it('NAV-03: si los campos no son texto usa valores por defecto', () => {
    localStorage.setItem('userData', JSON.stringify({ nombre: 123, carrera: null }));

    component.ngOnInit();

    expect(component.usuarioNombre).toBe('Usuario');
    expect(component.usuarioCarrera).toBe('N/A');
  });

  it('NAV-04: detecta la pantalla de login al navegar', async () => {
    await router.navigateByUrl('/login');
    expect(component.esLogin).toBeTrue();

    await router.navigateByUrl('/salones');
    expect(component.esLogin).toBeFalse();
  });

  it('NAV-05: cerrar sesión confirmada limpia userData y redirige a /login', () => {
    localStorage.setItem('userData', '{}');
    spyOn(window, 'confirm').and.returnValue(true);
    const navigateSpy = spyOn(router, 'navigate').and.resolveTo(true);

    component.cerrarSesion();

    expect(localStorage.getItem('userData')).toBeNull();
    expect(navigateSpy).toHaveBeenCalledOnceWith(['/login']);
  });

  it('NAV-06: alterna el sidebar según el tamaño de pantalla', () => {
    const esMobile = spyOn(component as any, 'esMobile').and.returnValue(false);
    component.toggleSidebar();
    expect(component.sidebarColapsado).toBeTrue();

    esMobile.and.returnValue(true);
    component.toggleSidebar();
    expect(component.sidebarAbiertoMobile).toBeTrue();
  });
});
