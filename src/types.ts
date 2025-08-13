export interface Perfil {
  id: string;
  username: string;
  rol: 'admin' | 'moderador' | 'usuario';
  created_at: string;
  updated_at: string;
}

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
