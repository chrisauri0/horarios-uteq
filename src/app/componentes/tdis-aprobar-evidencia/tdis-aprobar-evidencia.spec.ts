import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TdisAprobarEvidencia } from './tdis-aprobar-evidencia';

describe('TdisAprobarEvidencia (vista en construcción)', () => {
  let component: TdisAprobarEvidencia;
  let fixture: ComponentFixture<TdisAprobarEvidencia>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TdisAprobarEvidencia],
    }).compileComponents();

    fixture = TestBed.createComponent(TdisAprobarEvidencia);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('TAE-01: se crea el componente', () => {
    expect(component).toBeTruthy();
  });
});
