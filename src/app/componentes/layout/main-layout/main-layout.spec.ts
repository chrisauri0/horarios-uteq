import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MainLayoutComponent } from './main-layout';

describe('MainLayout (contenedor con navbar)', () => {
  let component: MainLayoutComponent;
  let fixture: ComponentFixture<MainLayoutComponent>;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [MainLayoutComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(MainLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('LAY-01: se crea el componente', () => {
    expect(component).toBeTruthy();
  });

  it('LAY-02: incluye la barra de navegación y el router-outlet', () => {
    const el: HTMLElement = fixture.nativeElement;

    expect(el.querySelector('app-navbar')).not.toBeNull();
    expect(el.querySelector('main router-outlet')).not.toBeNull();
  });
});
