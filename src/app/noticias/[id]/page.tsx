'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

// Función para procesar el contenido HTML y corregir URLs de imágenes
function procesarContenido(contenido: string): string {
  if (!contenido) return '';
  
  // Reemplazar URLs de blob o data por URLs de Supabase
  let contenidoProcesado = contenido;
  
  // Reemplazar atributos src que contengan blob: o data:
  contenidoProcesado = contenidoProcesado.replace(/(<img[^>]*src=["'])(?:blob:|data:)[^"']+(["'][^>]*>)/gi, 
    (match, prefix, suffix) => {
      // Reemplazar con una imagen de fallback
      return `${prefix}https://placehold.co/600x400/333333/FFFFFF?text=Imagen+no+disponible${suffix}`;
    });
  
  // Añadir atributo loading="lazy" a todas las imágenes para mejorar rendimiento
  contenidoProcesado = contenidoProcesado.replace(/(<img[^>]*)>/gi, 
    (match, prefix) => {
      if (match.includes('loading=')) {
        return match; // Ya tiene atributo loading
      }
      return `${prefix} loading="lazy">`;
    });
  
  // Eliminar atributos crossOrigin incorrectos
  contenidoProcesado = contenidoProcesado.replace(/(<img[^>]*)crossOrigin=["'][^"']*["']([^>]*>)/gi, 
    (match, prefix, suffix) => {
      return `${prefix}${suffix}`;
    });
  
  return contenidoProcesado;
}
import { CalendarIcon, ArrowLeftIcon, MessageSquareIcon, ThumbsUpIcon, Pencil, Trash } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Comentarios from '@/components/ComentariosNuevo'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Textarea } from "@/components/ui/textarea"
import { Noticia } from '@/types'
import { createClient } from '@/lib/supabase/client'

// Estilos para el scrollbar
const scrollbarStyles = `
  .comentarios-container::-webkit-scrollbar {
    width: 8px;
  }
  
  .comentarios-container::-webkit-scrollbar-track {
    background: hsl(var(--muted));
    border-radius: 4px;
  }
  
  .comentarios-container::-webkit-scrollbar-thumb {
    background-color: hsl(var(--primary) / 0.3);
    border-radius: 4px;
  }
  
  .comentarios-container::-webkit-scrollbar-thumb:hover {
    background-color: hsl(var(--primary) / 0.5);
  }
`;

export default function NoticiaDetalle({ params }: { params: { id: string } }) {
  const [noticia, setNoticia] = useState<Noticia | null>(null)
  const [cargando, setCargando] = useState(true)
  const [cargandoAuth, setCargandoAuth] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [usuario, setUsuario] = useState<any>(null)
  const [esAdmin, setEsAdmin] = useState(false)

  useEffect(() => {
    // Verificar si hay un usuario autenticado (una sola vez al cargar)
    const checkUsuario = async () => {
      try {
        setCargandoAuth(true);
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          setUsuario(session.user);
          
          // Verificar si el usuario es administrador
          try {
            const { data: perfil } = await supabase
              .from('perfiles')
              .select('role')
              .eq('id', session.user.id)
              .single();
            
            if (perfil?.role === 'admin') {
              setEsAdmin(true);
            }
          } catch (error) {
            console.error('Error al verificar usuario:', error);
          }
        }
      } catch (error) {
        console.error('Error al verificar usuario:', error);
      } finally {
        setCargandoAuth(false);
      }
    };
    
    checkUsuario();
  }, [])
  
  useEffect(() => {
    async function cargarNoticia() {
      try {
        console.log('=== INICIO CARGA DE NOTICIA INDIVIDUAL ===');
        console.log('Cargando noticia con ID:', params.id);
        setCargando(true)
        
        // Construir URL absoluta para evitar problemas con Next.js
        // Obtener la URL base de diferentes fuentes según el entorno
        let baseUrl;
        
        if (typeof window !== 'undefined') {
          // En el navegador, usar la URL actual
          baseUrl = window.location.origin;
        } else {
          // En el servidor, usar variables de entorno o valores por defecto
          baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                   (process.env.NETLIFY_URL ? `https://${process.env.NETLIFY_URL}` :
                   (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                   'http://localhost:3000'));
        }
        
        // Obtener la noticia desde nuestra API usando URL absoluta
        const response = await fetch(`${baseUrl}/api/noticias/${params.id}`, {
          cache: 'no-store',
          next: { revalidate: 0 } // No usar caché
        })
        
        console.log('Respuesta de API:', response.status, response.statusText);
        
        if (!response.ok) {
          console.error(`Error en la respuesta: ${response.status}`);
          throw new Error(`Error en la respuesta: ${response.status}`)
        }
        
        const resultado = await response.json()
        console.log('Datos recibidos de la API:', {
          success: resultado.success,
          error: resultado.error,
          tieneData: !!resultado.data
        });
        
        if (!resultado.success) {
          console.error('Error en resultado:', resultado.error);
          setError(resultado.error || 'Error al cargar la noticia')
          return
        }
        
        console.log('Noticia cargada correctamente:', {
          id: resultado.data.id,
          titulo: resultado.data.titulo,
          fecha: resultado.data.fecha_publicacion,
          autor: resultado.data.autor_nombre,
          tiene_imagen_portada: !!resultado.data.imagen_portada,
          categorias: resultado.data.categorias?.length || 0,
          longitud_contenido: resultado.data.contenido?.length || 0
        });
        
        // Analizar contenido para detectar imágenes
        if (resultado.data.contenido) {
          console.log('Analizando contenido para detectar imágenes...');
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = resultado.data.contenido;
          const images = tempDiv.querySelectorAll('img');
          console.log(`Se encontraron ${images.length} imágenes en el contenido`);
          
          // Mostrar las URLs de las imágenes encontradas
          images.forEach((img, index) => {
            const src = img.getAttribute('src');
            console.log(`Imagen ${index + 1}: ${src?.substring(0, 100)}${src && src.length > 100 ? '...' : ''}`);
            
            // Verificar si la imagen es una URL de Supabase
            if (src && src.includes('supabase')) {
              console.log(`Imagen ${index + 1} es una URL de Supabase`);
            } else if (src && src.startsWith('blob:')) {
              console.error(`Imagen ${index + 1} es una URL de blob temporal que NO debería estar presente`);
            } else if (src && src.startsWith('data:')) {
              console.error(`Imagen ${index + 1} es una URL de datos que NO debería estar presente`);
            }
          });
        }
        
        setNoticia(resultado.data)
      } catch (error) {
        console.error('Error al cargar la noticia:', error);
        setError('Error al cargar la noticia. Por favor, inténtalo de nuevo más tarde.')
      } finally {
        setCargando(false)
      }
    }
    
    cargarNoticia()
  }, [params.id])
  
  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          <p className="text-muted-foreground">Cargando noticia...</p>
        </div>
      </div>
    )
  }
  
  if (error || !noticia) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md mx-auto p-6 bg-card border border-border rounded-lg shadow-sm">
          <h2 className="text-2xl font-bold mb-4 text-destructive">Error</h2>
          <p className="mb-6">{error || 'No se pudo cargar la noticia'}</p>
          <Button asChild>
            <Link href="/noticias">Volver a noticias</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <style jsx global>{scrollbarStyles}</style>
      <main className="container py-12">
        {/* Botón de volver */}
        <div className="mb-8">
          <Button variant="outline" asChild>
            <Link href="/noticias">
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Volver a noticias
            </Link>
          </Button>
        </div>
        
        {/* Cabecera de la noticia */}
        <div className="mb-8 bg-background dark:bg-background">
          
          {/* Título grande */}
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
            {noticia.titulo}
          </h1>
          
          {/* Espacio entre título e información del autor */}
          <div className="mb-6"></div>
          
          {/* Información del autor y tiempo - versión móvil */}
          <div className="flex flex-col mb-4 border-b pb-6">
            {/* Autor con foto e info */}
            <div className="flex items-center gap-3 mb-4">
              {/* Imagen de perfil del autor */}
              <div className="flex-shrink-0">
                {noticia.autor?.avatar_url ? (
                  <div className="size-12 overflow-hidden rounded-full">
                    <img 
                      src={noticia.autor.avatar_url} 
                      alt={`Foto de ${noticia.autor?.username || 'Anónimo'}`}
                      className="w-full h-full object-cover"
                      crossOrigin="anonymous"
                      onError={(e) => {
                        // Si hay error al cargar la imagen, mostrar fallback
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement.classList.add('bg-gray-700');
                        e.currentTarget.parentElement.innerHTML = `<div class="flex items-center justify-center h-full w-full text-white font-semibold text-lg">${noticia.autor?.username ? noticia.autor.username.charAt(0).toUpperCase() : 'A'}</div>`;
                      }}
                    />
                  </div>
                ) : (
                  <div className="size-12 flex items-center justify-center rounded-full bg-gray-700 text-white font-semibold text-lg" style={{ backgroundColor: noticia.autor?.color || '#4B5563' }}>
                    {noticia.autor?.username ? noticia.autor.username.charAt(0).toUpperCase() : 'A'}
                  </div>
                )}
              </div>
              
              {/* Información del autor */}
              <div>
                <div className="font-medium">
                  {noticia.autor?.username || 'Anónimo'}
                </div>
                <div className="text-sm text-muted-foreground">
                  Redactor de Minecraft Community
                </div>
              </div>
              
              {/* Botón de edición (solo visible para administradores) */}
              {esAdmin && (
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex items-center gap-1 text-xs bg-blue-100 dark:bg-blue-900/30 ml-auto"
                  asChild
                >
                  <Link href={`/admin/noticias/editar/${params.id}`}>
                    <Pencil className="h-3 w-3" />
                    Editar
                  </Link>
                </Button>
              )}
            </div>
            
            {/* Fecha y tiempo de lectura - en líneas separadas para móvil */}
            <div className="text-sm text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
              <div className="flex items-center">
                {new Date(noticia.fecha_publicacion || Date.now()).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
          </div>
        </div>
        
        {/* Imagen de portada */}
        {(noticia.imagen_url || noticia.imagen_portada) && (
          <div className="relative w-full md:w-3/4 lg:w-2/3 aspect-video mb-8 rounded-lg overflow-hidden mx-auto">
            <Image
              src={noticia.imagen_url || noticia.imagen_portada || ''}
              alt={noticia.titulo}
              fill
              className="object-cover"
              onError={(e) => {
                console.error('Error al cargar la imagen de portada');
                // Ocultar el contenedor de imagen si hay error
                const container = e.currentTarget.parentElement;
                if (container) {
                  container.style.display = 'none';
                }
              }}
            />
          </div>
        )}
        
        {/* Contenido de la noticia */}
        <div 
          className="prose prose-lg dark:prose-invert max-w-4xl mx-auto [&_img]:w-full md:[&_img]:max-w-[85%] [&_img]:mx-auto mb-8 noticia-contenido dark:[&_*]:!text-green-400 [.amoled_&]:[&_*]:!text-white dark:prose-a:!text-white" 
          dangerouslySetInnerHTML={{ __html: procesarContenido(noticia.contenido) }} 
        />
        
        {/* Divisor después del contenido */}
        <div className="max-w-4xl mx-auto mb-8">
          <Separator className="my-4" />
        </div>
        
        {/* Temas relacionados */}
        {noticia?.categoria && (
          <div className="max-w-4xl mx-auto mb-10">
            <h2 className="text-xl font-semibold mb-4">Temas relacionados</h2>
            <div className="flex flex-wrap gap-2">
              <Link 
                href={`/noticias/categoria/${noticia.categoria.slug || noticia.categoria.id}`}
                key={noticia.categoria.id}
                className="block bg-primary/10 text-primary hover:bg-primary/20 px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ease-in-out"
              >
                {noticia.categoria.nombre}
              </Link>
            </div>
          </div>
        )}
        
        {/* Divisor antes de comentarios */}
        <div className="max-w-4xl mx-auto mb-8">
          <Separator className="my-4" />
        </div>
        
        {/* Sección de comentarios */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="mt-10">
            <Comentarios 
              tipoEntidad="noticia" 
              entidadId={params.id} 
              limite={10} 
            />
          </div>
        </div>
        
        {/* Divisor antes de información del autor */}
        <div className="max-w-4xl mx-auto mb-8">
          <Separator className="my-4" />
        </div>
        
        {/* Información del autor */}
        {noticia.autor?.username && (
          <div className="max-w-4xl mx-auto border border-border rounded-lg p-6 mb-12">
            <h2 className="text-xl font-semibold mb-4">Acerca del autor</h2>
            
            <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
              {/* Foto del autor */}
              <div className="flex-shrink-0">
                <Avatar className="h-24 w-24">
                  {noticia.autor?.avatar_url ? (
                    <AvatarImage 
                      src={noticia.autor.avatar_url} 
                      alt={noticia.autor.username} 
                      className="object-cover"
                      onError={() => {
                        // Si hay error al cargar la imagen, se mostrará automáticamente el AvatarFallback
                        console.log('Error al cargar avatar del autor');
                      }}
                    />
                  ) : (
                    <AvatarFallback 
                      className="text-2xl"
                      style={{ backgroundColor: noticia.autor?.color || '#3b82f6' }}
                    >
                      {noticia.autor?.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
              </div>
              
              {/* Información del autor */}
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-lg font-medium mb-1">{noticia.autor?.username}</h3>
                <p className="text-sm text-muted-foreground mb-3">Redactor de Minecraft Community</p>
                <p className="text-sm mb-4">Autor de contenido en Minecraft Community. Comparte noticias, tutoriales y recursos para la comunidad de Minecraft.</p>
                
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/noticias?autor=${encodeURIComponent(noticia.autor?.username || '')}`}>Ver todos los artículos</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
