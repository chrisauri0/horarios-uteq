import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NotFound } from './not-found';

describe('NotFound (página 404)', () => {
  let component: NotFound;
  let fixture: ComponentFixture<NotFound>;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotFound],
    }).compileComponents();

    fixture = TestBed.createComponent(NotFound);
    component = fixture.componentInstance;
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  it('NF-01: se crea el componente', () => {
    expect(component).toBeTruthy();
  });

  it('NF-02: muestra el código 404 y el título "Página no encontrada"', () => {
    expect(el.querySelector('h1')?.textContent?.trim()).toBe('404');
    expect(el.querySelector('h2')?.textContent).toContain('Página no encontrada');
  });

  it('NF-03: muestra el botón "Volver al inicio"', () => {
    const boton = el.querySelector('a.back-home-btn');

    expect(boton).not.toBeNull();
    expect(boton?.textContent).toContain('Volver al inicio');
  });
});
