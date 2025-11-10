import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerHorarios } from './ver-horarios';

describe('VerHorarios', () => {
  let component: VerHorarios;
  let fixture: ComponentFixture<VerHorarios>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerHorarios]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VerHorarios);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
