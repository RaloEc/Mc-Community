// Tipos para el sistema de foro

export interface ForoAutor {
  id: string;
  username: string;
  avatar_url: string | null;
  role?: string;
  color?: string;
}

export interface ForoCategoria {
  id: string;
  nombre: string;
  slug: string;
  color: string | null;
  parent_id: string | null;
  descripcion?: string | null;
  orden?: number;
  icono?: string | null;
}

export interface ForoEtiqueta {
  id: string;
  nombre: string;
  color: string | null;
}

export interface ForoHiloEtiqueta {
  etiqueta: ForoEtiqueta;
}

export interface ForoHilo {
  id: string;
  titulo: string;
  slug: string | null;
  contenido: string;
  autor_id: string;
  categoria_id: string;
  vistas: number;
  es_fijado: boolean;
  es_cerrado: boolean;
  created_at: string;
  updated_at: string | null;
  autor?: ForoAutor;
  categoria?: ForoCategoria;
}

export interface ForoHiloCompleto extends ForoHilo {
  autor: ForoAutor;
  categoria: ForoCategoria;
  etiquetas?: ForoEtiqueta[];
}

export interface ForoPost {
  id: string;
  contenido: string;
  hilo_id: string;
  autor_id: string;
  es_solucion: boolean;
  created_at: string;
  updated_at: string | null;
  post_padre_id: string | null;
  editado: boolean;
  editado_en: string | null;
  historial_ediciones: HistorialEdicion[] | null;
  autor?: ForoAutor;
  respuestas?: ForoPost[];
}

export interface HistorialEdicion {
  contenido: string;
  editado_en: string;
  editado_por: string;
}

export interface ForoPostConAutor extends Omit<ForoPost, 'autor'> {
  autor: ForoAutor;
  username?: string;
  avatar_url?: string;
  role?: string;
  color?: string;
}

export interface CreatePostData {
  contenido: string;
  hilo_id: string;
  post_padre_id?: string | null;
}

export interface UpdatePostData {
  contenido: string;
}

export interface ForoHiloRelacionado {
  id: string;
  slug: string | null;
  titulo: string;
}

export interface ForoBreadcrumb {
  nombre: string;
  slug: string;
  href: string;
}
