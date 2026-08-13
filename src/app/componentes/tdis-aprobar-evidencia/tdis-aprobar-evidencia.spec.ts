import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TdisAprobarEvidencia } from './tdis-aprobar-evidencia';

describe('TdisAprobarEvidencia', () => {
  let component: TdisAprobarEvidencia;
  let fixture: ComponentFixture<TdisAprobarEvidencia>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TdisAprobarEvidencia]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TdisAprobarEvidencia);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
