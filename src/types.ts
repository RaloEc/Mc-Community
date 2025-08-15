// Reexporta todos los tipos del módulo principal para que `@/types` funcione
export * from './types/index'
import type { Perfil } from './types/index'

// Tipos adicionales específicos del foro que no existen en `./types/index`
export interface HiloConAutor {
  id: string;
  created_at: string;
  titulo: string;
  contenido: string;
  autor_id: string;
  categoria_id: string;
  perfiles: Perfil | null;
  comentarios_count: number;
  updated_at: string;
}

export interface CategoriaConHilos {
  id: string;
  nombre: string;
  descripcion: string;
  hilos: HiloConAutor[];
}
