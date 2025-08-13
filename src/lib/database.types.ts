export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      biomas: {
        Row: {
          clima: string | null
          created_at: string | null
          descripcion: string | null
          id: string
          imagen: string | null
          mobs: string | null
          nombre: string
          recursos: string | null
          updated_at: string | null
        }
        Insert: {
          clima?: string | null
          created_at?: string | null
          descripcion?: string | null
          id?: string
          imagen?: string | null
          mobs?: string | null
          nombre: string
          recursos?: string | null
          updated_at?: string | null
        }
        Update: {
          clima?: string | null
          created_at?: string | null
          descripcion?: string | null
          id?: string
          imagen?: string | null
          mobs?: string | null
          nombre?: string
          recursos?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "foro_categorias_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "foro_categorias"
            referencedColumns: ["id"]
          }
        ]
      }
      categorias: {
        Row: {
          created_at: string | null
          id: string
          nombre: string
          tipo: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          nombre: string
          tipo: string
        }
        Update: {
          created_at?: string | null
          id?: string
          nombre?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "foro_categorias_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "foro_categorias"
            referencedColumns: ["id"]
          }
        ]
      }
      comentario_likes: {
        Row: {
          comentario_id: string
          created_at: string
          id: string
          usuario_id: string
        }
        Insert: {
          comentario_id: string
          created_at?: string
          id?: string
          usuario_id: string
        }
        Update: {
          comentario_id?: string
          created_at?: string
          id?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comentario_likes_comentario_id_fkey"
            columns: ["comentario_id"]
            isOneToOne: false
            referencedRelation: "comentarios"
            referencedColumns: ["id"]
          },
        ]
      }
      comentarios: {
        Row: {
          comentario_padre_id: string | null
          contenido: string
          created_at: string | null
          entidad_id: string
          historial_ediciones: Json | null
          id: string
          juego_id: string | null
          tipo_entidad: string
          updated_at: string | null
          usuario_id: string | null
        }
        Insert: {
          comentario_padre_id?: string | null
          contenido: string
          created_at?: string | null
          entidad_id: string
          historial_ediciones?: Json | null
          id?: string
          juego_id?: string | null
          tipo_entidad: string
          updated_at?: string | null
          usuario_id?: string | null
        }
        Update: {
          comentario_padre_id?: string | null
          contenido?: string
          created_at?: string | null
          entidad_id?: string
          historial_ediciones?: Json | null
          id?: string
          juego_id?: string | null
          tipo_entidad?: string
          updated_at?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comentarios_juego_id_fkey"
            columns: ["juego_id"]
            isOneToOne: false
            referencedRelation: "juegos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comentarios_padre_fkey"
            columns: ["comentario_padre_id"]
            isOneToOne: false
            referencedRelation: "comentarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comentarios_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      crafteos: {
        Row: {
          created_at: string | null
          id: string
          item_resultado_id: string | null
          patron: string | null
          tipo: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          item_resultado_id?: string | null
          patron?: string | null
          tipo: string
        }
        Update: {
          created_at?: string | null
          id?: string
          item_resultado_id?: string | null
          patron?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "crafteos_item_resultado_id_fkey"
            columns: ["item_resultado_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      foro_categorias: {
        Row: {
          created_at: string | null
          descripcion: string | null
          es_activa: boolean | null
          id: string
          imagen_url: string | null
          nombre: string
          orden: number | null
          slug: string
          updated_at: string | null
          parent_id: string | null
          nivel: number
          color: string | null
        }
        Insert: {
          created_at?: string | null
          descripcion?: string | null
          es_activa?: boolean | null
          id?: string
          imagen_url?: string | null
          nombre: string
          orden?: number | null
          slug: string
          updated_at?: string | null
          parent_id?: string | null
          nivel?: number
          color?: string | null
        }
        Update: {
          created_at?: string | null
          descripcion?: string | null
          es_activa?: boolean | null
          id?: string
          imagen_url?: string | null
          nombre?: string
          orden?: number | null
          slug?: string
          updated_at?: string | null
          parent_id?: string | null
          nivel?: number
          color?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "foro_categorias_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "foro_categorias"
            referencedColumns: ["id"]
          }
        ]
      }
      foro_etiquetas: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          nombre: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          nombre: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          nombre?: string
        }
        Relationships: [
          {
            foreignKeyName: "foro_categorias_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "foro_categorias"
            referencedColumns: ["id"]
          }
        ]
      }
      foro_hilos: {
        Row: {
          autor_id: string
          categoria_id: string
          contenido: string
          created_at: string | null
          es_anuncio: boolean | null
          es_cerrado: boolean | null
          es_fijado: boolean | null
          id: string
          titulo: string
          ultimo_post_at: string | null
          updated_at: string | null
          vistas: number | null
        }
        Insert: {
          autor_id: string
          categoria_id: string
          contenido: string
          created_at?: string | null
          es_anuncio?: boolean | null
          es_cerrado?: boolean | null
          es_fijado?: boolean | null
          id?: string
          titulo: string
          ultimo_post_at?: string | null
          updated_at?: string | null
          vistas?: number | null
        }
        Update: {
          autor_id?: string
          categoria_id?: string
          contenido?: string
          created_at?: string | null
          es_anuncio?: boolean | null
          es_cerrado?: boolean | null
          es_fijado?: boolean | null
          id?: string
          titulo?: string
          ultimo_post_at?: string | null
          updated_at?: string | null
          vistas?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "foro_hilos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "foro_categorias"
            referencedColumns: ["id"]
          },
        ]
      }
      foro_hilos_etiquetas: {
        Row: {
          etiqueta_id: string
          hilo_id: string
        }
        Insert: {
          etiqueta_id: string
          hilo_id: string
        }
        Update: {
          etiqueta_id?: string
          hilo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "foro_hilos_etiquetas_etiqueta_id_fkey"
            columns: ["etiqueta_id"]
            isOneToOne: false
            referencedRelation: "foro_etiquetas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "foro_hilos_etiquetas_hilo_id_fkey"
            columns: ["hilo_id"]
            isOneToOne: false
            referencedRelation: "foro_hilos"
            referencedColumns: ["id"]
          },
        ]
      }
      foro_posts: {
        Row: {
          autor_id: string
          contenido: string
          created_at: string | null
          es_solucion: boolean | null
          hilo_id: string
          id: string
          updated_at: string | null
        }
        Insert: {
          autor_id: string
          contenido: string
          created_at?: string | null
          es_solucion?: boolean | null
          hilo_id: string
          id?: string
          updated_at?: string | null
        }
        Update: {
          autor_id?: string
          contenido?: string
          created_at?: string | null
          es_solucion?: boolean | null
          hilo_id?: string
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "foro_posts_hilo_id_fkey"
            columns: ["hilo_id"]
            isOneToOne: false
            referencedRelation: "foro_hilos"
            referencedColumns: ["id"]
          },
        ]
      }
      foro_reacciones: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          tipo: string
          usuario_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          tipo: string
          usuario_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          tipo?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "foro_reacciones_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "foro_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      foro_seguimiento: {
        Row: {
          created_at: string | null
          hilo_id: string
          id: string
          usuario_id: string
        }
        Insert: {
          created_at?: string | null
          hilo_id: string
          id?: string
          usuario_id: string
        }
        Update: {
          created_at?: string | null
          hilo_id?: string
          id?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "foro_seguimiento_hilo_id_fkey"
            columns: ["hilo_id"]
            isOneToOne: false
            referencedRelation: "foro_hilos"
            referencedColumns: ["id"]
          },
        ]
      }
      ingredientes_crafteo: {
        Row: {
          cantidad: number | null
          crafteo_id: string | null
          created_at: string | null
          id: string
          item_id: string | null
          posicion: string | null
        }
        Insert: {
          cantidad?: number | null
          crafteo_id?: string | null
          created_at?: string | null
          id?: string
          item_id?: string | null
          posicion?: string | null
        }
        Update: {
          cantidad?: number | null
          crafteo_id?: string | null
          created_at?: string | null
          id?: string
          item_id?: string | null
          posicion?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ingredientes_crafteo_crafteo_id_fkey"
            columns: ["crafteo_id"]
            isOneToOne: false
            referencedRelation: "crafteos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingredientes_crafteo_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      items: {
        Row: {
          categoria_id: string | null
          created_at: string | null
          descripcion: string | null
          durabilidad: string | null
          id: string
          imagen: string | null
          item_id: string
          nombre: string
          obtencion: string | null
          stackeable: boolean | null
          updated_at: string | null
        }
        Insert: {
          categoria_id?: string | null
          created_at?: string | null
          descripcion?: string | null
          durabilidad?: string | null
          id?: string
          imagen?: string | null
          item_id: string
          nombre: string
          obtencion?: string | null
          stackeable?: boolean | null
          updated_at?: string | null
        }
        Update: {
          categoria_id?: string | null
          created_at?: string | null
          descripcion?: string | null
          durabilidad?: string | null
          id?: string
          imagen?: string | null
          item_id?: string
          nombre?: string
          obtencion?: string | null
          stackeable?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "items_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
        ]
      }
      juegos: {
        Row: {
          created_at: string
          desarrollador: string | null
          descripcion: string | null
          fecha_lanzamiento: string | null
          icono_url: string | null
          id: string
          imagen_portada_url: string | null
          nombre: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          desarrollador?: string | null
          descripcion?: string | null
          fecha_lanzamiento?: string | null
          icono_url?: string | null
          id?: string
          imagen_portada_url?: string | null
          nombre: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          desarrollador?: string | null
          descripcion?: string | null
          fecha_lanzamiento?: string | null
          icono_url?: string | null
          id?: string
          imagen_portada_url?: string | null
          nombre?: string
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "foro_categorias_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "foro_categorias"
            referencedColumns: ["id"]
          }
        ]
      }
      mobs: {
        Row: {
          created_at: string | null
          descripcion: string | null
          drops: string | null
          habitat: string | null
          id: string
          imagen: string | null
          nombre: string
          tipo: string
          updated_at: string | null
          vida: number | null
        }
        Insert: {
          created_at?: string | null
          descripcion?: string | null
          drops?: string | null
          habitat?: string | null
          id?: string
          imagen?: string | null
          nombre: string
          tipo: string
          updated_at?: string | null
          vida?: number | null
        }
        Update: {
          created_at?: string | null
          descripcion?: string | null
          drops?: string | null
          habitat?: string | null
          id?: string
          imagen?: string | null
          nombre?: string
          tipo?: string
          updated_at?: string | null
          vida?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "foro_categorias_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "foro_categorias"
            referencedColumns: ["id"]
          }
        ]
      }
      mods: {
        Row: {
          author_name: string | null
          categories: string[] | null
          date_created_api: string | null
          date_modified_api: string | null
          description_html: string | null
          first_synced_at: string | null
          game_versions: string[] | null
          id: number
          last_synced_at: string | null
          logo_url: string | null
          mod_loader: string[] | null
          name: string
          slug: string | null
          source: string
          source_id: string
          summary: string | null
          total_downloads: number | null
          website_url: string
        }
        Insert: {
          author_name?: string | null
          categories?: string[] | null
          date_created_api?: string | null
          date_modified_api?: string | null
          description_html?: string | null
          first_synced_at?: string | null
          game_versions?: string[] | null
          id?: number
          last_synced_at?: string | null
          logo_url?: string | null
          mod_loader?: string[] | null
          name: string
          slug?: string | null
          source: string
          source_id: string
          summary?: string | null
          total_downloads?: number | null
          website_url: string
        }
        Update: {
          author_name?: string | null
          categories?: string[] | null
          date_created_api?: string | null
          date_modified_api?: string | null
          description_html?: string | null
          first_synced_at?: string | null
          game_versions?: string[] | null
          id?: number
          last_synced_at?: string | null
          logo_url?: string | null
          mod_loader?: string[] | null
          name?: string
          slug?: string | null
          source?: string
          source_id?: string
          summary?: string | null
          total_downloads?: number | null
          website_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "foro_categorias_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "foro_categorias"
            referencedColumns: ["id"]
          }
        ]
      }
      noticias: {
        Row: {
          autor: string | null
          autor_id: string | null
          contenido: string
          created_at: string | null
          destacada: boolean | null
          fecha_publicacion: string | null
          id: string
          imagen_portada: string | null
          juego_id: string | null
          titulo: string
          updated_at: string | null
        }
        Insert: {
          autor?: string | null
          autor_id?: string | null
          contenido: string
          created_at?: string | null
          destacada?: boolean | null
          fecha_publicacion?: string | null
          id?: string
          imagen_portada?: string | null
          juego_id?: string | null
          titulo: string
          updated_at?: string | null
        }
        Update: {
          autor?: string | null
          autor_id?: string | null
          contenido?: string
          created_at?: string | null
          destacada?: boolean | null
          fecha_publicacion?: string | null
          id?: string
          imagen_portada?: string | null
          juego_id?: string | null
          titulo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "noticias_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "noticias_juego_id_fkey"
            columns: ["juego_id"]
            isOneToOne: false
            referencedRelation: "juegos"
            referencedColumns: ["id"]
          },
        ]
      }
      noticias_categorias: {
        Row: {
          categoria_id: string | null
          id: number
          noticia_id: string | null
        }
        Insert: {
          categoria_id?: string | null
          id?: number
          noticia_id?: string | null
        }
        Update: {
          categoria_id?: string | null
          id?: number
          noticia_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "noticias_categorias_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "noticias_categorias_noticia_id_fkey"
            columns: ["noticia_id"]
            isOneToOne: false
            referencedRelation: "noticias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "noticias_categorias_noticia_id_fkey"
            columns: ["noticia_id"]
            isOneToOne: false
            referencedRelation: "noticias_con_autor"
            referencedColumns: ["id"]
          },
        ]
      }
      perfiles: {
        Row: {
          activo: boolean | null
          avatar_url: string | null
          bio: string | null
          color: string | null
          created_at: string | null
          fecha_ultimo_acceso: string | null
          id: string
          role: string | null
          sitio_web: string | null
          ubicacion: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          activo?: boolean | null
          avatar_url?: string | null
          bio?: string | null
          color?: string | null
          created_at?: string | null
          fecha_ultimo_acceso?: string | null
          id: string
          role?: string | null
          sitio_web?: string | null
          ubicacion?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          activo?: boolean | null
          avatar_url?: string | null
          bio?: string | null
          color?: string | null
          created_at?: string | null
          fecha_ultimo_acceso?: string | null
          id?: string
          role?: string | null
          sitio_web?: string | null
          ubicacion?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "foro_categorias_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "foro_categorias"
            referencedColumns: ["id"]
          }
        ]
      }
      servidores: {
        Row: {
          capacidad_jugadores: number | null
          created_at: string | null
          descripcion: string | null
          destacado: boolean | null
          id: string
          imagen: string | null
          ip: string
          jugadores_actuales: number | null
          nombre: string
          tipo: string
          updated_at: string | null
          version: string | null
        }
        Insert: {
          capacidad_jugadores?: number | null
          created_at?: string | null
          descripcion?: string | null
          destacado?: boolean | null
          id?: string
          imagen?: string | null
          ip: string
          jugadores_actuales?: number | null
          nombre: string
          tipo: string
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          capacidad_jugadores?: number | null
          created_at?: string | null
          descripcion?: string | null
          destacado?: boolean | null
          id?: string
          imagen?: string | null
          ip?: string
          jugadores_actuales?: number | null
          nombre?: string
          tipo?: string
          updated_at?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "foro_categorias_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "foro_categorias"
            referencedColumns: ["id"]
          }
        ]
      }
      solicitudes_servidores: {
        Row: {
          created_at: string | null
          descripcion_solicitud: string | null
          estado: string
          id: string
          ip_servidor: string
          motivo_rechazo: string | null
          nombre_servidor: string
          tipo_juego: string
          url_discord: string | null
          url_imagen_logo: string | null
          url_web: string | null
          usuario_id: string | null
          version_preferida: string | null
        }
        Insert: {
          created_at?: string | null
          descripcion_solicitud?: string | null
          estado?: string
          id?: string
          ip_servidor: string
          motivo_rechazo?: string | null
          nombre_servidor: string
          tipo_juego: string
          url_discord?: string | null
          url_imagen_logo?: string | null
          url_web?: string | null
          usuario_id?: string | null
          version_preferida?: string | null
        }
        Update: {
          created_at?: string | null
          descripcion_solicitud?: string | null
          estado?: string
          id?: string
          ip_servidor?: string
          motivo_rechazo?: string | null
          nombre_servidor?: string
          tipo_juego?: string
          url_discord?: string | null
          url_imagen_logo?: string | null
          url_web?: string | null
          usuario_id?: string | null
          version_preferida?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "foro_categorias_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "foro_categorias"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      noticias_con_autor: {
        Row: {
          autor: string | null
          autor_id: string | null
          autor_nombre: string | null
          autor_role: string | null
          contenido: string | null
          created_at: string | null
          destacada: boolean | null
          fecha_publicacion: string | null
          id: string | null
          imagen_portada: string | null
          titulo: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "noticias_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vista_solicitudes_servidores: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          descripcion_solicitud: string | null
          estado: string | null
          id: string | null
          ip_servidor: string | null
          motivo_rechazo: string | null
          nombre_servidor: string | null
          tipo_juego: string | null
          url_discord: string | null
          url_imagen_logo: string | null
          url_web: string | null
          username: string | null
          usuario_id: string | null
          version_preferida: string | null
        }
        Relationships: [
          {
            foreignKeyName: "foro_categorias_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "foro_categorias"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Functions: {
      actualizar_servidor: {
        Args: {
          servidor_id: string
          p_nombre: string
          p_descripcion: string
          p_ip: string
          p_version: string
          p_capacidad_jugadores: number
          p_tipo: string
          p_imagen: string
          p_destacado: boolean
        }
        Returns: Json
      }
      aprobar_solicitud_servidor: {
        Args: { solicitud_id: string }
        Returns: Json
      }
      crear_tabla_noticias_categorias: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_autor_username: {
        Args: { autor_id: string }
        Returns: string
      }
      get_categorias_con_hilos: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          nombre: string
          descripcion: string
          hilos: Json
        }[]
      }
      get_comments_with_details: {
        Args: {
          p_tipo_entidad: string
          p_entidad_id: string
          p_user_id: string
          p_limit: number
          p_offset: number
          p_sort: string
        }
        Returns: {
          id: string
          contenido: string
          created_at: string
          updated_at: string
          usuario_id: string
          comentario_padre_id: string
          tipo_entidad: string
          entidad_id: string
          historial_ediciones: Json
          username: string
          avatar_url: string
          role: string
          like_count: number
          user_has_liked: boolean
          respuestas: Json
        }[]
      }
      increment_mod_downloads: {
        Args: { mod_id: string }
        Returns: undefined
      }
      is_admin_request: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      obtener_usuarios_activos: {
        Args: { limite: number }
        Returns: Json[]
      }
      rechazar_solicitud_servidor: {
        Args: { solicitud_id: string }
        Returns: Json
      }
      register_admin: {
        Args: {
          admin_email: string
          admin_password: string
          admin_username: string
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
