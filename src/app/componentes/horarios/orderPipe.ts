import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'orderByStart', standalone: true })
export class OrderByStartPipe implements PipeTransform {
  private diaOrden: { [key: string]: number } = {
    Lun: 1, Mar: 2, Mie: 3, Jue: 4, Vie: 5, Sab: 6
  };

  transform(array: any[]): any[] {
    return array.slice().sort((a, b) => {
      const aMatch = a.start.match(/^([A-Za-z]+)(\d{1,2})$/);
      const bMatch = b.start.match(/^([A-Za-z]+)(\d{1,2})$/);
      if (!aMatch || !bMatch) return 0;
      const aDia = this.diaOrden[aMatch[1]] || 99;
      const bDia = this.diaOrden[bMatch[1]] || 99;
      const aHora = parseInt(aMatch[2], 10);
      const bHora = parseInt(bMatch[2], 10);
      if (aDia !== bDia) return aDia - bDia;
      return aHora - bHora;
    });
  }
}