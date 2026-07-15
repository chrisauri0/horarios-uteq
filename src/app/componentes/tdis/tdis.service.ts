import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TdiPrograma } from './tdis'; // ajusta el import

const API_URL = 'https://horarios-backend-58w8.onrender.com/api/tdis'; // ajusta a tu baseURL real

@Injectable({ providedIn: 'root' })
export class TdisService {
  constructor(private http: HttpClient) {}

  getAll(): Observable<TdiPrograma[]> {
    return this.http.get<TdiPrograma[]>(API_URL);
  }

  create(tdi: TdiPrograma): Observable<TdiPrograma> {
    return this.http.post<TdiPrograma>(API_URL, tdi);
  }

  update(id: string, tdi: TdiPrograma): Observable<TdiPrograma> {
    return this.http.patch<TdiPrograma>(`${API_URL}/${id}`, tdi);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${API_URL}/${id}`);
  }
}