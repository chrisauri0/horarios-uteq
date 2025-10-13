import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrearHorario } from './crear-horario';

describe('CrearHorario', () => {
  let component: CrearHorario;
  let fixture: ComponentFixture<CrearHorario>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrearHorario]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CrearHorario);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
