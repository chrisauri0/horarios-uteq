// solicitudes-validacion.service.ts (Angular)
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface SolicitudValidacion {
  id: string;
  matricula: string;
  nombre_solicitud: string;
  correo_alumno: string;
  eje: string;
  persona_encargada: string;
  puesto: string;
  telefono: string;
  extension?: string;
  correo: string;
  tipo: string;
  horas_requeridas: number;
  nivel_de_impacto: string;
  tdis_por_ganar: number;
  competencias: string;
  evidencias: string;
  observaciones: string;
  estado: 'Pendiente' | 'Aprobada' | 'Rechazada';
  observacionesAdmin?: string;
  created_at: string;
  updated_at: string;
}

export interface AprobarSolicitudDto {
  estado: 'Aprobada';
  observacionesAdmin?: string;
  nivelDeImpacto: string;
  tdisPorGanar: number;
  cupoMaximo: number;
  fecha?: string;
  lugar: string;
  emoji?: string;
}

export interface RechazarSolicitudDto {
  estado: 'Rechazada';
  observacionesAdmin?: string;
}

@Injectable({ providedIn: 'root' })
export class SolicitudesValidacionService {
  private apiUrl = `${environment.apiUrl}/solicitudes-validacion`;

  constructor(private http: HttpClient) {}

  getAllAdmin(): Observable<SolicitudValidacion[]> {
    return this.http.get<SolicitudValidacion[]>(`${this.apiUrl}/admin`);
  }

  aprobar(id: string, dto: AprobarSolicitudDto): Observable<SolicitudValidacion> {
    return this.http.patch<SolicitudValidacion>(`${this.apiUrl}/admin/${id}/estado`, dto);
  }

  rechazar(id: string, dto: RechazarSolicitudDto): Observable<SolicitudValidacion> {
    return this.http.patch<SolicitudValidacion>(`${this.apiUrl}/admin/${id}/estado`, dto);
  }
}