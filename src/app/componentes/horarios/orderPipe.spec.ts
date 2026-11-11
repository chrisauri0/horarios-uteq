import { OrderByStartPipe } from './orderPipe';

describe('Pipe orderByStart (OrderByStartPipe)', () => {
  let pipe: OrderByStartPipe;

  beforeEach(() => {
    pipe = new OrderByStartPipe();
  });

  it('ORD-01: ordena las clases por día de la semana y luego por hora', () => {
    const entrada = [{ start: 'Mie18' }, { start: 'Lun19' }, { start: 'Lun17' }, { start: 'Mar9' }];

    const resultado = pipe.transform(entrada).map((c) => c.start);

    expect(resultado).toEqual(['Lun17', 'Lun19', 'Mar9', 'Mie18']);
  });

  it('ORD-02: no modifica el arreglo original (regresa una copia)', () => {
    const entrada = [{ start: 'Vie20' }, { start: 'Lun17' }];

    const resultado = pipe.transform(entrada);

    expect(resultado).not.toBe(entrada);
    expect(entrada.map((c) => c.start)).toEqual(['Vie20', 'Lun17']);
  });

  it('ORD-03: los días desconocidos (p. ej. Dom) quedan al final', () => {
    const entrada = [{ start: 'Dom10' }, { start: 'Sab8' }, { start: 'Jue21' }];

    const resultado = pipe.transform(entrada).map((c) => c.start);

    expect(resultado).toEqual(['Jue21', 'Sab8', 'Dom10']);
  });

  it('ORD-04: si el formato no es válido conserva el orden relativo', () => {
    const entrada = [{ start: 'sin-formato' }, { start: 'Lun17' }];

    const resultado = pipe.transform(entrada).map((c) => c.start);

    expect(resultado).toEqual(['sin-formato', 'Lun17']);
  });

  it('ORD-05: regresa un arreglo vacío si recibe uno vacío', () => {
    expect(pipe.transform([])).toEqual([]);
  });
});
