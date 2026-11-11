import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LandingPage } from './landing-page';

describe('LandingPage (página de presentación)', () => {
  let component: LandingPage;
  let fixture: ComponentFixture<LandingPage>;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandingPage],
    }).compileComponents();

    fixture = TestBed.createComponent(LandingPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  it('LP-01: se crea el componente', () => {
    expect(component).toBeTruthy();
  });

  it('LP-02: muestra una tarjeta por cada capacidad del sistema', () => {
    const tarjetas = el.querySelectorAll('.features-grid .feature-card');

    expect(tarjetas.length).toBe(component.features.length);
    expect(tarjetas[0].querySelector('h3')?.textContent).toContain('Generación Automática');
  });

  it('LP-03: muestra los 4 pasos de "¿Cómo funciona?" en orden', () => {
    const numeros = Array.from(el.querySelectorAll('.steps .step-num')).map((n) => n.textContent?.trim());

    expect(numeros).toEqual(['01', '02', '03', '04']);
  });

  it('LP-04: el año actual se calcula dinámicamente', () => {
    expect(component.currentYear).toBe(new Date().getFullYear());
  });
});
