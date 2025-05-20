// Definición de tipos para la aplicación
export * from './comentarios';

export interface Servidor {
  id: number;
  nombre: string;
  descripcion: string;
  ip: string;
  version: string;
  jugadores: string;
  tipo: string;
  imagen?: string;
  destacado: boolean;
}

export interface Noticia {
  id: string; // UUID en Supabase
  titulo: string;
  contenido: string;
  imagen_portada?: string;
  autor?: string;
  autor_id?: string; // ID del usuario que creó la noticia
  autor_nombre?: string; // Nombre de usuario del autor
  autor_color?: string; // Color personalizado del autor
  autor_avatar?: string; // URL de la imagen de perfil del autor
  fecha_publicacion?: string;
  destacada?: boolean;
  created_at?: string;
  updated_at?: string;
  resumen?: string; // Resumen limpio del contenido para mostrar en tarjetas
  // Campos para relaciones
  categoria_id?: string; // Para compatibilidad con código existente
  categoria?: string; // Campo virtual para mostrar el nombre de la categoría
  categorias?: Categoria[]; // Para múltiples categorías
  categoria_ids?: string[]; // IDs de las categorías seleccionadas
}

export interface Categoria {
  id: string;
  nombre: string;
}

export interface WikiArticulo {
  id: number;
  titulo: string;
  contenido: string;
  categoria: string;
  fecha_creacion: string;
  ultima_actualizacion: string;
  autor: string;
}

export interface Textura {
  id: number;
  nombre: string;
  descripcion: string;
  version: string;
  autor: string;
  url_descarga: string;
  imagen?: string;
  resolucion: string;
  categoria: string;
  fecha_publicacion: string;
  destacado: boolean;
}

export interface Shader {
  id: number;
  nombre: string;
  descripcion: string;
  version: string;
  autor: string;
  url_descarga: string;
  imagen?: string;
  requisitos: string;
  categoria: string;
  fecha_publicacion: string;
  destacado: boolean;
}

export interface Mod {
  id: number; // Ahora es bigint en la base de datos
  source: string; // Fuente del mod (curseforge, modrinth, etc)
  source_id: string; // ID del mod en la fuente original
  name: string; // Nombre del mod
  slug?: string; // Slug para URLs amigables
  summary?: string; // Resumen corto
  description_html?: string; // Descripción completa en HTML
  logo_url?: string; // URL del logo/imagen
  website_url: string; // URL del sitio web principal
  total_downloads?: number; // Total de descargas
  author_name?: string; // Nombre del autor
  categories?: string[]; // Categorías como array de strings
  game_versions?: string[]; // Versiones del juego como array de strings
  mod_loader?: string[]; // Cargadores de mods como array de strings (forge, fabric, etc)
  date_created_api?: string; // Fecha de creación según la API
  date_modified_api?: string; // Fecha de modificación según la API
  first_synced_at?: string; // Primera vez que se sincronizó
  last_synced_at?: string; // Última vez que se sincronizó
  
  // Campos adicionales para compatibilidad con el código existente
  nombre?: string; // Alias para name
  descripcion?: string; // Alias para summary o description_html
  version?: string; // Puede extraerse de game_versions
  version_minecraft?: string; // Puede extraerse de game_versions
  autor?: string; // Alias para author_name
  descargas?: number; // Alias para total_downloads
  imagen_url?: string; // Alias para logo_url
  
  // Enlaces específicos (pueden derivarse de website_url y source)
  enlace_curseforge?: string;
  enlace_modrinth?: string;
  enlace_github?: string;
  enlace_web_autor?: string;
  
  // Campos calculados
  enlace_principal?: string; // URL principal para descargas
  tipo_enlace_principal?: 'curseforge' | 'modrinth' | 'github';
}

export interface CategoriasMod {
  id: string;
  nombre: string;
  descripcion?: string;
}