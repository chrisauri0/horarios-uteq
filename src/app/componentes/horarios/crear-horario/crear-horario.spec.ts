import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CrearHorarioComponent } from './crear-horario';

describe('CrearHorario (vista en construcción)', () => {
  let component: CrearHorarioComponent;
  let fixture: ComponentFixture<CrearHorarioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrearHorarioComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CrearHorarioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('CRH-01: se crea el componente', () => {
    expect(component).toBeTruthy();
  });

  it('CRH-02: cargarProfesores() se resuelve sin errores', async () => {
    await expectAsync(component.cargarProfesores()).toBeResolved();
  });
});
