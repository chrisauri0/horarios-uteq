import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class SchedulerService {
  private apiUrl = 'https://horarios-backend-58w8.onrender.com/scheduler'; // Ajusta según tu backend
  private cacheKey = 'horariosCache';


  async getHorarios(): Promise<any[]> {
    const cached = localStorage.getItem(this.cacheKey);
    if (cached) {
      console.log('🗃️ Cargando horarios desde cache');
      return JSON.parse(cached);
    }

    try {
      const res = await fetch(`${this.apiUrl}/allschedules`);
      if (!res.ok) throw new Error('Error al obtener horarios');
      const data = await res.json();
      localStorage.setItem(this.cacheKey, JSON.stringify(data));
      return data;
    } catch (err) {
      console.error('Error al obtener horarios:', err);
      return [];
    }
  }

  clearCache() {
    localStorage.removeItem(this.cacheKey);
  }
}
