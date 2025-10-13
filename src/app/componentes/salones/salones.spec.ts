import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Salones } from './salones';

describe('Salones', () => {
  let component: Salones;
  let fixture: ComponentFixture<Salones>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Salones]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Salones);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
