// Definición de tipos para comentarios
export type HistorialEdicion = {
  original: string;
  versiones: {
    contenido: string;
    fecha: string;
    version: number;
  }[];
};

export type Comentario = {
  id: string;
  contenido: string;
  usuario_id: string;
  tipo_entidad: string;
  entidad_id: string;
  created_at: string;
  updated_at: string;
  historial_ediciones?: HistorialEdicion;
  comentario_padre_id?: string;
  respuestas?: Comentario[];
  perfiles?: {
    id: string;
    username: string;
    avatar_url?: string;
    role?: string;
  };
};
