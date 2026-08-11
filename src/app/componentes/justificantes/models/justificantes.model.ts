export type EstadoJustificante = 'pendiente' | 'aceptado' | 'rechazado';

export interface Justificante {
  id: string;
  usuarioId: string;
  usuario: {
    id: string;
    full_name: string | null;
    email: string;
  };
  motivo: string;
  fecha: string;
  driveUrl: string;
  estado: EstadoJustificante;
  comentarioAdmin: string | null;
  createdAt: string;
  updatedAt: string;
}