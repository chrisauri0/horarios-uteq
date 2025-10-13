// models/horario.model.ts
export interface Profesor {
  id: number;
  nombre: string;
}

export interface Salon {
  id: number;
  nombre: string;
}

export interface Clase {
  horario_id: number;
  asignatura: string;
  profesor: Profesor;
  salon: Salon;
}

export interface Slot {
  timeslot_id: number;
  etiqueta: string;
  hora_inicio: string; // "08:00:00"
  hora_fin: string;    // "09:00:00"
  clase: Clase | null;
}

export interface Dia {
  dia_semana: number; // 1..7
  dia_nombre: string; // "Lunes"
  slots: Slot[];
}

export interface HorarioGrupoResponse {
  grupo_id: number;
  grupo_nombre: string;
  dias: Dia[]; // aquí vendrán Lunes..Viernes
}
