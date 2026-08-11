// tdis.service.ts (Angular)
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TdiPrograma } from './tdis';

@Injectable({ providedIn: 'root' })
export class TdisService {
  private apiUrl = `${environment.apiUrl}/tdis`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<TdiPrograma[]> {
    return this.http.get<TdiPrograma[]>(this.apiUrl);
  }

  create(dto: TdiPrograma): Observable<TdiPrograma> {
    return this.http.post<TdiPrograma>(this.apiUrl, dto);
  }

  update(id: string, dto: TdiPrograma): Observable<TdiPrograma> {
    return this.http.patch<TdiPrograma>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}