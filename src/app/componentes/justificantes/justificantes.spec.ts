import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Justificantes } from './justificantes';

describe('Justificantes', () => {
  let component: Justificantes;
  let fixture: ComponentFixture<Justificantes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Justificantes]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Justificantes);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
