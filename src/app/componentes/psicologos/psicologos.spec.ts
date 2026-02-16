import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Psicologos } from './psicologos';

describe('Psicologos', () => {
  let component: Psicologos;
  let fixture: ComponentFixture<Psicologos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Psicologos]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Psicologos);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
