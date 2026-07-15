export type EstadoJustificante = 'pendiente' | 'aprobado' | 'rechazado';

export interface Justificante {
  id: number;
  alumno: {
    nombre: string;
    matricula: string;
    grupo: string;
    avatarUrl?: string;
  };
  fechaFalta: string;       // fecha en que el alumno faltó
  fechaEnvio: string;       // fecha en que envió el justificante
  motivo: string;
  descripcion: string;
  archivoAdjunto: {
    nombre: string;
    tipo: 'pdf' | 'imagen';
    url: string;
  };
  estado: EstadoJustificante;
  materia: string;
  comentarioAdmin?: string;
}