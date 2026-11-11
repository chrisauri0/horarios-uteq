import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { App } from './app';

describe('App (componente raíz / layout principal)', () => {
  let fixture: ComponentFixture<App>;
  let component: App;
  let router: Router;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([
          { path: 'login', children: [] },
          { path: 'dashboard', children: [] },
        ]),
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(App);
    component = fixture.componentInstance;
  });

  afterEach(() => localStorage.clear());

  it('APP-01: se crea la aplicación', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('APP-02: sin sesión guardada muestra el nombre y carrera por defecto', () => {
    component.ngOnInit();

    expect(component.usuarioNombre).toBe('Director de la división de Tecnologías de la Información');
    expect(component.usuarioCarrera).toBe('N/A');
  });

  it('APP-03: lee nombre y carrera del usuario guardado en localStorage', () => {
    localStorage.setItem('userData', JSON.stringify({ nombre: 'Ana Ruiz', carrera: 'IDGS' }));

    component.ngOnInit();

    expect(component.usuarioNombre).toBe('Ana Ruiz');
    expect(component.usuarioCarrera).toBe('IDGS');
  });

  it('APP-04: si userData está corrupto usa "Usuario" sin romper la app', () => {
    localStorage.setItem('userData', '{esto no es json');

    component.ngOnInit();

    expect(component.usuarioNombre).toBe('Usuario');
    expect(component.usuarioCarrera).toBe('N/A');
  });

  it('APP-05: marca esLogin=true en /login y false en otras rutas', async () => {
    await router.navigateByUrl('/login');
    expect(component.esLogin).toBeTrue();

    await router.navigateByUrl('/dashboard');
    expect(component.esLogin).toBeFalse();
  });

  it('APP-06: en escritorio el botón de menú colapsa/expande el sidebar', () => {
    spyOn(component as any, 'esMobile').and.returnValue(false);

    component.toggleSidebar();
    expect(component.sidebarColapsado).toBeTrue();
    expect(component.sidebarAbiertoMobile).toBeFalse();

    component.toggleSidebar();
    expect(component.sidebarColapsado).toBeFalse();
  });

  it('APP-07: en móvil el botón de menú abre el sidebar como overlay y se cierra al tocar fuera', () => {
    spyOn(component as any, 'esMobile').and.returnValue(true);

    component.toggleSidebar();
    expect(component.sidebarAbiertoMobile).toBeTrue();
    expect(component.sidebarColapsado).toBeFalse();

    component.cerrarSidebarMobile();
    expect(component.sidebarAbiertoMobile).toBeFalse();
  });

  it('APP-08: al pasar a escritorio (resize) se cierra el overlay móvil', () => {
    component.sidebarAbiertoMobile = true;
    spyOn(component as any, 'esMobile').and.returnValue(false);

    component.onResize();

    expect(component.sidebarAbiertoMobile).toBeFalse();
  });

  it('APP-09: cerrar sesión confirmada borra userData y manda a /login', () => {
    localStorage.setItem('userData', JSON.stringify({ nombre: 'Ana' }));
    spyOn(window, 'confirm').and.returnValue(true);
    const navigateSpy = spyOn(router, 'navigate').and.resolveTo(true);

    component.cerrarSesion();

    expect(localStorage.getItem('userData')).toBeNull();
    expect(navigateSpy).toHaveBeenCalledOnceWith(['/login']);
  });

  it('APP-10: si el usuario cancela, la sesión se conserva', () => {
    localStorage.setItem('userData', JSON.stringify({ nombre: 'Ana' }));
    spyOn(window, 'confirm').and.returnValue(false);
    const navigateSpy = spyOn(router, 'navigate');

    component.cerrarSesion();

    expect(localStorage.getItem('userData')).not.toBeNull();
    expect(navigateSpy).not.toHaveBeenCalled();
  });
});
