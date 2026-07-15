import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Tdis } from './tdis';

describe('Tdis', () => {
  let component: Tdis;
  let fixture: ComponentFixture<Tdis>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Tdis]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Tdis);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
