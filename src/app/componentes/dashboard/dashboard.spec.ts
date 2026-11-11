import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { DashboardComponent } from './dashboard';

describe('Dashboard (pantalla de inicio)', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let navigateSpy: jasmine.Spy;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    navigateSpy = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => localStorage.clear());

  it('DAS-01: se crea el componente', () => {
    localStorage.setItem('userData', JSON.stringify({ full_name: 'Ana', nombreOrganizacion: 'DTI' }));
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('DAS-02: saluda al usuario con su nombre y organización', () => {
    localStorage.setItem('userData', JSON.stringify({ full_name: 'Ana Ruiz', nombreOrganizacion: 'División TI' }));

    fixture.detectChanges();

    expect(component.usuarioNombre).toBe('Ana Ruiz');
    expect(component.usuarioOrganizacion).toBe('División TI');
    const h1 = (fixture.nativeElement as HTMLElement).querySelector('h1')?.textContent ?? '';
    expect(h1).toContain('Ana Ruiz');
    expect(h1).toContain('División TI');
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('DAS-03: sin sesión redirige al inicio de sesión', () => {
    fixture.detectChanges();

    expect(navigateSpy).toHaveBeenCalledOnceWith(['/']);
  });

  it('DAS-04: muestra los 6 accesos de "¿Cómo empezar?" con su ruta', () => {
    localStorage.setItem('userData', JSON.stringify({ full_name: 'Ana', nombreOrganizacion: 'DTI' }));
    fixture.detectChanges();

    const esperadas = ['/carreras', '/salones', '/materias', '/profesores', '/grupos', '/horarios/nuevo'];
    const hrefs = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll<HTMLAnchorElement>('a.step-link'))
      .map((a) => a.href);

    expect(hrefs.length).toBe(esperadas.length);
    esperadas.forEach((ruta, i) => expect(hrefs[i].endsWith(ruta)).withContext(ruta).toBeTrue());
  });

  it('DAS-05: toggleSidebar() alterna el estado del sidebar', () => {
    expect(component.sidebarCollapsed).toBeFalse();
    component.toggleSidebar();
    expect(component.sidebarCollapsed).toBeTrue();
  });
});
